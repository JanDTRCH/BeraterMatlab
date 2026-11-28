// Fondslupe – Webserver
// Liefert die Website aus (prototype/) und stellt die Analyse-API bereit.
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { starteJob, getJob, publicStatus, loescheJob, laufendeJobs } from './jobs.js';
import { kiVerfuegbar, MODEL } from './claude.js';
import { budgetFrei, budgetStand } from './budget.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = process.env.WEB_ROOT || path.resolve(here, '../../prototype');
const PORT = Number(process.env.PORT || 8080);

const MB = 1024 * 1024;
const MAX_DATEI = 20 * MB;
const MAX_GESAMT = Number(process.env.MAX_UPLOAD_MB || 25) * MB;
const MAX_DATEIEN = 10;
const MAX_PARALLEL = Number(process.env.MAX_PARALLEL || 2);
const PRO_IP_PRO_TAG = Number(process.env.ANALYSEN_PRO_IP_PRO_TAG || 5);
const PRO_IP_PRO_STUNDE = Number(process.env.ANALYSEN_PRO_IP_PRO_STUNDE || 2);
const PRO_TAG = Number(process.env.ANALYSEN_PRO_TAG || 50);
const ZUGANGSCODE = process.env.ZUGANGSCODE || '';
// Optional: Cloudflare Turnstile (kostenlose Bot-Prüfung). Beide Werte aus dem Cloudflare-Dashboard.
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || '';
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || '';
const TURNSTILE = Boolean(TURNSTILE_SITE_KEY && TURNSTILE_SECRET);
const CF = 'https://challenges.cloudflare.com';

const TYPEN = {
  kid: 'Basisinformationsblatt (KID)',
  prospekt: 'Verkaufsprospekt / Fondsvertrag',
  kosten: 'Kostenübersicht',
  protokoll: 'Beratungsprotokoll / Geeignetheitserklärung',
  pib: 'Produktinformationsblatt',
  empfehlung: 'Schriftliche Bankempfehlung',
  sonstiges: 'Sonstiges Dokument'
};

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Railway sitzt vor dem Server

// Sicherheits-Header für alle Antworten
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `default-src 'self'; script-src 'self'${TURNSTILE ? ' ' + CF : ''}; frame-src ${TURNSTILE ? CF : "'none'"}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'${TURNSTILE ? ' ' + CF : ''}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
    'X-Robots-Tag': 'noindex, nofollow'
  });
  next();
});

// ---------- Missbrauchsschutz (im Speicher) ----------
// Schichten: Zugangscode → Honeypot → Turnstile (optional) → Grenzen je IP/Stunde/Tag
// → gleichzeitige Analysen → Tagesbudget in USD → Ausgabengrenze in der Claude Console.
const zaehler = { tag: '', gesamt: 0, ip: new Map() };
const ipZeiten = new Map(); // IP → Zeitstempel der letzten Analysen (für die Stundengrenze)
function heute() { return new Date().toISOString().slice(0, 10); }
function kontingentPruefen(ip) {
  if (zaehler.tag !== heute()) { zaehler.tag = heute(); zaehler.gesamt = 0; zaehler.ip.clear(); }
  if (!budgetFrei()) return 'Das Tageskontingent für Analysen ist ausgeschöpft. Bitte versuchen Sie es morgen erneut.';
  if (zaehler.gesamt >= PRO_TAG) return 'Heute wurden bereits sehr viele Analysen durchgeführt. Bitte versuchen Sie es morgen erneut.';
  if ((zaehler.ip.get(ip) || 0) >= PRO_IP_PRO_TAG) return `Pro Tag sind höchstens ${PRO_IP_PRO_TAG} Analysen möglich. Bitte versuchen Sie es morgen erneut.`;
  const stunde = (ipZeiten.get(ip) || []).filter((t) => t > Date.now() - 3600 * 1000);
  ipZeiten.set(ip, stunde);
  if (stunde.length >= PRO_IP_PRO_STUNDE) return 'Bitte warten Sie etwas, bevor Sie die nächste Analyse starten.';
  if (laufendeJobs() >= MAX_PARALLEL) return 'Gerade laufen bereits mehrere Analysen. Bitte versuchen Sie es in wenigen Minuten erneut.';
  return null;
}
function kontingentZaehlen(ip) {
  zaehler.gesamt++;
  zaehler.ip.set(ip, (zaehler.ip.get(ip) || 0) + 1);
  ipZeiten.get(ip).push(Date.now());
}
setInterval(() => { const g = Date.now() - 3600 * 1000; for (const [ip, z] of ipZeiten) if (!z.some((t) => t > g)) ipZeiten.delete(ip); }, 15 * 60 * 1000).unref();

// Fehlversuche beim Zugangscode begrenzen (gegen Durchprobieren)
const codeFehler = new Map(); // IP → {anzahl, bis}
function codeGesperrt(ip) { const e = codeFehler.get(ip); return e && e.anzahl >= 5 && e.bis > Date.now(); }
function codeFehlversuch(ip) {
  const e = codeFehler.get(ip) || { anzahl: 0, bis: 0 };
  if (e.bis < Date.now()) e.anzahl = 0;
  e.anzahl++; e.bis = Date.now() + 15 * 60 * 1000;
  codeFehler.set(ip, e);
}

async function turnstileOk(token, ip) {
  if (!TURNSTILE) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: String(token), remoteip: ip });
    const r = await fetch(CF + '/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile-Prüfung fehlgeschlagen:', err.message);
    return false;
  }
}

function codeOk(eingabe) {
  if (!ZUGANGSCODE) return true;
  const a = Buffer.from(String(eingabe || ''));
  const b = Buffer.from(ZUGANGSCODE);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Dateityp am Inhalt erkennen, nicht an der Endung
function sniff(buf) {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DATEI, files: MAX_DATEIEN, fields: 10, fieldSize: 10 * 1024 }
});

function fehler(res, status, text) { return res.status(status).json({ fehler: text }); }

// ---------- API ----------
app.get('/api/status', (req, res) => {
  res.json({ ki: kiVerfuegbar(), zugangscode: Boolean(ZUGANGSCODE), turnstileSiteKey: TURNSTILE ? TURNSTILE_SITE_KEY : null, maxDateien: MAX_DATEIEN, maxGesamtMB: MAX_GESAMT / MB });
});

app.post('/api/analysen', (req, res) => {
  if (!kiVerfuegbar()) return fehler(res, 503, 'Die Analyse ist auf diesem Server noch nicht eingerichtet. Sie können sich den Beispielbericht ansehen.');
  if (codeGesperrt(req.ip)) return fehler(res, 429, 'Zu viele falsche Zugangscodes. Bitte versuchen Sie es in 15 Minuten erneut.');
  upload.array('dateien', MAX_DATEIEN)(req, res, async (err) => {
    if (err) {
      const text = err.code === 'LIMIT_FILE_SIZE' ? 'Eine Datei ist größer als 20 MB. Bitte teilen Sie sie auf oder speichern Sie sie mit geringerer Auflösung.'
        : err.code === 'LIMIT_FILE_COUNT' ? 'Bitte laden Sie höchstens 10 Dateien pro Analyse hoch.'
        : 'Die Dateien konnten nicht empfangen werden. Bitte versuchen Sie es erneut.';
      return fehler(res, 400, text);
    }
    // Honeypot: für Menschen unsichtbares Feld, das nur Bots ausfüllen
    if (req.body.website) { console.warn(`Honeypot ausgelöst von ${req.ip}`); return fehler(res, 400, 'Die Anfrage konnte nicht verarbeitet werden.'); }
    if (!codeOk(req.body.zugangscode)) { codeFehlversuch(req.ip); return fehler(res, 403, 'Der Zugangscode ist nicht richtig. Bitte prüfen Sie ihn und versuchen Sie es erneut.'); }
    if (!(await turnstileOk(req.body['cf-turnstile-response'], req.ip))) return fehler(res, 403, 'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
    if (req.body.einwilligung !== 'ja') return fehler(res, 400, 'Bitte bestätigen Sie die Einwilligung, damit wir Ihre Unterlagen analysieren können.');
    const files = req.files || [];
    if (!files.length) return fehler(res, 400, 'Bitte fügen Sie mindestens eine Unterlage hinzu – zum Beispiel das Basisinformationsblatt.');
    const gesamt = files.reduce((s, f) => s + f.size, 0);
    if (gesamt > MAX_GESAMT) return fehler(res, 400, `Die Dateien sind zusammen größer als ${MAX_GESAMT / MB} MB. Bitte laden Sie weniger oder kleinere Dateien hoch.`);

    let typen = [];
    try { typen = JSON.parse(req.body.typen || '[]'); } catch { typen = []; }
    const dateien = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const mime = sniff(f.buffer);
      const name = String(f.originalname || `Datei ${i + 1}`).slice(0, 120);
      if (!mime) return fehler(res, 400, `„${name}“ ist keine PDF-, JPG- oder PNG-Datei. Bitte laden Sie die Unterlage in einem dieser Formate hoch.`);
      const typ = TYPEN[typen[i]] ? typen[i] : 'sonstiges';
      dateien.push({ dateiname: name, mime, buffer: f.buffer, typ, typLabel: TYPEN[typ], bild: mime !== 'application/pdf' });
    }

    const grenze = kontingentPruefen(req.ip);
    if (grenze) return fehler(res, 429, grenze);
    kontingentZaehlen(req.ip);
    const job = starteJob(dateien);
    console.log(`[job ${job.id}] gestartet: ${dateien.length} Datei(en), ${(gesamt / MB).toFixed(1)} MB`);
    res.status(202).json({ id: job.id });
  });
});

app.get('/api/analysen/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return fehler(res, 404, 'Diese Analyse wurde nicht gefunden. Berichte werden nach 24 Stunden automatisch gelöscht.');
  res.set('Cache-Control', 'no-store').json(publicStatus(job));
});

app.get('/api/analysen/:id/bericht', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return fehler(res, 404, 'Dieser Bericht wurde nicht gefunden. Berichte werden nach 24 Stunden automatisch gelöscht.');
  if (job.status !== 'fertig') return fehler(res, 409, 'Der Bericht ist noch nicht fertig.');
  res.set('Cache-Control', 'no-store').json(job.bericht);
});

app.delete('/api/analysen/:id', (req, res) => {
  const ok = loescheJob(req.params.id);
  if (!ok) return fehler(res, 404, 'Diese Analyse wurde nicht gefunden.');
  res.status(204).end();
});

app.use('/api', (req, res) => fehler(res, 404, 'Nicht gefunden.'));

// ---------- Website ----------
app.use(express.static(WEB_ROOT, {
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-cache');
  }
}));
app.use((req, res) => res.status(404).type('text/plain; charset=utf-8').send('Seite nicht gefunden.'));

const server = app.listen(PORT, () => {
  const b = budgetStand();
  console.log(`Fondslupe läuft auf Port ${PORT} · KI ${kiVerfuegbar() ? 'aktiv (' + MODEL + ')' : 'nicht eingerichtet (ANTHROPIC_API_KEY fehlt)'} · Zugangscode ${ZUGANGSCODE ? 'aktiv' : 'AUS – jeder mit dem Link kann Analysen starten'} · Turnstile ${TURNSTILE ? 'aktiv' : 'aus'} · Tagesbudget ${b.limit} USD`);
});
server.requestTimeout = 5 * 60 * 1000;
