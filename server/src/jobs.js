// Analyseaufträge im Arbeitsspeicher. Es wird nichts auf die Festplatte geschrieben.
// - Dateiinhalte werden nach der Analyse sofort verworfen.
// - Berichte werden nach BERICHT_TTL_STUNDEN (Standard 24) gelöscht.
// - Ein Neustart des Servers löscht alle Aufträge.
import { randomUUID } from 'node:crypto';
import { readPdf, UnlesbaresDokument } from './pdf.js';
import { analysiere, AnalyseFehler, MODEL } from './claude.js';
import { buildReport } from './verify.js';

const TTL_MS = Number(process.env.BERICHT_TTL_STUNDEN || 24) * 3600 * 1000;
const jobs = new Map();

export const SCHRITTE = [
  { id: 'pruefen', titel: 'Dateien sicher prüfen', text: 'Wir prüfen, ob die Dateien lesbar und unbeschädigt sind.' },
  { id: 'text', titel: 'Text erkennen', text: 'Der Text wird Seite für Seite aus den Dokumenten gelesen.' },
  { id: 'ki', titel: 'Unterlagen auswerten', text: 'Die KI bestimmt die Dokumenttypen, liest Kosten, Risiken und Bedingungen aus und gleicht sie mit der Bankempfehlung ab. Das dauert meist 2 bis 5 Minuten.' },
  { id: 'belege', titel: 'Fundstellen prüfen', text: 'Jedes Zitat wird automatisch auf der angegebenen Seite im Dokument gesucht. Nicht auffindbare Aussagen werden verworfen.' },
  { id: 'bericht', titel: 'Bericht erstellen', text: 'Die Ergebnisse werden zu Ihrem Bericht zusammengestellt.' }
];

function now() { return Date.now(); }
function fmtDate(d) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(d) + ' Uhr';
}

export function getJob(id) { return jobs.get(id) || null; }
export function laufendeJobs() { let n = 0; for (const j of jobs.values()) if (j.status === 'laeuft') n++; return n; }

export function publicStatus(job) {
  return {
    id: job.id,
    status: job.status,
    fehler: job.fehler || null,
    gestartet: job.gestartet,
    schritte: job.schritte,
    dokumente: job.dokumente.map((d) => ({ name: d.dateiname, typ: d.typLabel, seiten: d.seitenzahl ?? (d.seiten ? d.seiten.length : null), status: d.status, hinweis: d.hinweis || '' })),
    fortschritt: job.fortschritt,
    ergebnis: job.status === 'fertig' ? job.kurzErgebnis : null
  };
}

export function loescheJob(id) {
  const job = jobs.get(id);
  if (!job) return false;
  if (job.status === 'laeuft') { job.abort.abort(); job.status = 'abgebrochen'; }
  job.dokumente.forEach((d) => { d.buffer = null; });
  jobs.delete(id);
  return true;
}

/** files: [{dateiname, mime, buffer, typ, typLabel, bild}] */
export function starteJob(files) {
  const id = randomUUID();
  const job = {
    id,
    status: 'laeuft',
    gestartet: now(),
    schritte: SCHRITTE.map((s) => ({ ...s, status: 'wartet', hinweis: '' })),
    dokumente: files.map((f) => ({ ...f, status: 'wartet', seiten: null, scanSeiten: [] })),
    fortschritt: null,
    bericht: null,
    abort: new AbortController()
  };
  jobs.set(id, job);
  run(job).catch((err) => {
    console.error(`[job ${id}] Unerwarteter Fehler:`, err && err.message);
    fail(job, 'Bei der Analyse ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.');
  });
  return job;
}

function step(job, id, status, hinweis) {
  const s = job.schritte.find((x) => x.id === id);
  s.status = status;
  if (hinweis !== undefined) s.hinweis = hinweis;
}

function fail(job, text) {
  if (job.status !== 'laeuft') return;
  job.status = 'fehler';
  job.fehler = text;
  const active = job.schritte.find((s) => s.status === 'aktiv');
  if (active) active.status = 'fehler';
  job.dokumente.forEach((d) => { d.buffer = null; });
}

async function run(job) {
  const t0 = now();
  // 1. Dateien prüfen + 2. Text auslesen
  step(job, 'pruefen', 'aktiv');
  step(job, 'text', 'aktiv');
  const warnungen = [];
  for (const d of job.dokumente) {
    d.status = 'liest';
    if (d.bild) {
      d.seiten = [''];
      d.scanSeiten = [1];
      d.status = 'hinweis';
      d.hinweis = 'Foto: Text wird per Bilderkennung gelesen';
      continue;
    }
    try {
      const pdf = await readPdf(d.buffer);
      d.seiten = pdf.seiten;
      d.scanSeiten = pdf.scanSeiten;
      if (pdf.scanSeiten.length) {
        d.status = 'hinweis';
        d.hinweis = pdf.scanSeiten.length === pdf.seitenzahl ? 'Scan: Text wird per Bilderkennung gelesen' : `${pdf.scanSeiten.length} Seite(n) ohne Textebene`;
        warnungen.push(`${d.dateiname}: ${d.hinweis}.`);
      } else {
        d.status = 'gelesen';
      }
    } catch (err) {
      if (err instanceof UnlesbaresDokument) {
        d.status = 'fehler';
        d.hinweis = err.message;
        step(job, 'pruefen', 'fehler', `„${d.dateiname}“: ${err.message}`);
        return fail(job, `„${d.dateiname}“ konnte nicht gelesen werden. ${err.message}`);
      }
      throw err;
    }
  }
  if (job.status !== 'laeuft') return;
  const seiten = job.dokumente.reduce((s, d) => s + d.seiten.length, 0);
  if (seiten > Number(process.env.MAX_SEITEN || 500)) {
    step(job, 'pruefen', 'fehler');
    return fail(job, `Die Unterlagen haben zusammen ${seiten} Seiten. Möglich sind höchstens ${process.env.MAX_SEITEN || 500} Seiten pro Analyse. Bitte laden Sie weniger Dokumente hoch.`);
  }
  step(job, 'pruefen', 'fertig', `${job.dokumente.length} Datei(en) lesbar.`);
  step(job, 'text', warnungen.length ? 'hinweis' : 'fertig', `${seiten} Seite(n) gelesen.` + (warnungen.length ? ' ' + warnungen.join(' ') : ''));

  // 3. Claude
  step(job, 'ki', 'aktiv');
  let result;
  try {
    result = await analysiere(job.dokumente, ({ zeichen }) => { job.fortschritt = { zeichen }; }, job.abort.signal);
  } catch (err) {
    if (job.status !== 'laeuft') return;
    if (err instanceof AnalyseFehler) {
      console.error(`[job ${job.id}] Analyse fehlgeschlagen: ${err.message}`);
      return fail(job, err.nutzerText);
    }
    throw err;
  }
  if (job.status !== 'laeuft') return;
  const u = result.usage || {};
  console.log(`[job ${job.id}] Claude fertig (${result.model}) in ${Math.round((now() - t0) / 1000)} s, input ${u.input_tokens}, output ${u.output_tokens}`);
  step(job, 'ki', 'fertig', 'Auswertung abgeschlossen.');

  // 4. Belege prüfen + 5. Bericht
  step(job, 'belege', 'aktiv');
  const docs = job.dokumente.map((d) => ({ dateiname: d.dateiname, typ: d.typ, seiten: d.seiten, scanSeiten: d.scanSeiten, bild: d.bild }));
  const bericht = buildReport(result.data, docs, { id: job.id.slice(0, 8).toUpperCase(), erstellt: fmtDate(new Date()) });
  const p = bericht.pruefung;
  step(job, 'belege', p.verworfen ? 'hinweis' : 'fertig',
    `${p.bestaetigt + p.korrigiert} von ${p.gesamt} Fundstellen im Dokument bestätigt` +
    (p.ungeprueft ? `, ${p.ungeprueft} auf Scans (nicht maschinell prüfbar)` : '') +
    (p.verworfen ? `, ${p.verworfen} nicht auffindbar und verworfen` : '') + '.');
  step(job, 'bericht', 'aktiv');

  const alle = [].concat(bericht.kosten.befunde, bericht.risiken.befunde, bericht.laufzeit.befunde, bericht.vertrag.befunde, bericht.fehlend.befunde);
  job.kurzErgebnis = {
    dokumente: job.dokumente.length,
    abweichungen: bericht.abgleich.zeilen.filter((z) => z.ergebnis === 'abweichung').length,
    fehlend: alle.filter((f) => f.stufe === 'fehlt').length,
    unklar: alle.filter((f) => f.stufe === 'unklar').length,
    fragen: bericht.fragen.reduce((s, g) => s + g.items.length, 0)
  };
  bericht.modell = MODEL;
  job.bericht = bericht;
  // Dateiinhalte und ausgelesenen Text sofort verwerfen – der Bericht enthält nur die Zitate.
  job.dokumente.forEach((d) => { d.buffer = null; d.seitenzahl = d.seiten.length; d.seiten = null; });
  step(job, 'bericht', 'fertig', 'Bericht ist fertig.');
  job.status = 'fertig';
  job.fertig = now();
}

// Aufräumen: alte Berichte löschen
setInterval(() => {
  const limit = now() - TTL_MS;
  for (const [id, job] of jobs) if (job.gestartet < limit) loescheJob(id);
}, 10 * 60 * 1000).unref();
