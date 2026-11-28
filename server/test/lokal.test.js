// Lokale KI: Test gegen einen Testserver, der die OpenAI-kompatible Schnittstelle
// von LM Studio nachbildet (Modelliste + gestreamte Chat-Antwort). Prüft Anfrageformat,
// Auswertung des Streams, Belegprüfung und Fehlermeldungen – nicht die Qualität eines Modells.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 20100 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
let mock, mockPort, proc, letzteAnfrage;

const b = (dok, seite, zitat) => ({ dok, seite, zitat, sicherheit: 'hoch' });
const ANTWORT = {
  dokumente: [
    { dok: 1, typ: 'kid', name: 'Basisinformationsblatt', stand: '01.03.2026', unvollstaendig: false, hinweis: '' },
    { dok: 2, typ: 'protokoll', name: 'Geeignetheitserklärung', stand: '12.11.2026', unvollstaendig: false, hinweis: '' }
  ],
  fonds: 'Testfonds Weltaktien Dynamik A',
  zusammenfassung: { kurz: ['Ein **Aktienfonds**.'], fakten: [{ label: 'Risikoklasse (SRI)', wert: '5 von 7', fehlt: false, belege: [b(1, 1, 'Risikoklasse 5 eingestuft')] }] },
  kosten: { tabelle: [{ art: 'Ausgabeaufschlag', erklaerung: 'Einmalige Gebühr.', status: 'info', notiz: '', werte: [{ text: '5,50 %', beleg: b(1, 2, 'Einstiegskosten: 5,50 % des Betrags') }] }],
    beispiel: { vorhanden: false, text: '', werte: [], ki: '' }, befunde: [] },
  risiken: { sri: { wert: 5, belege: [b(1, 1, 'Risikoklasse 5 eingestuft')] }, befunde: [
    { titel: 'Erfundenes Risiko', stufe: 'hoch', klartext: 'x', belege: [b(1, 1, 'Totalverlust ist garantiert')], ki: [], sicherheit: 'hoch', sicherheitGrund: '', fragen: [] }
  ] },
  laufzeit: { fakten: [], befunde: [] },
  abgleich: { moeglich: true, zeilen: [{ merkmal: 'Anlagedauer', fonds: { text: '6 Jahre', vorhanden: true, belege: [b(1, 1, 'Empfohlene Haltedauer: 6 Jahre.')] },
    bank: { text: 'bis 3 Jahre', vorhanden: true, belege: [b(2, 1, 'Anlagehorizont: kurzfristig (bis 3 Jahre)')] }, ergebnis: 'abweichung', ki: 'Kürzer als empfohlen.', fragen: ['q1'] }] },
  vertrag: { befunde: [] },
  fehlend: { befunde: [] },
  fragen: [{ gruppe: 'Passt das zu mir?', items: [{ id: 'q1', text: 'Warum 6 Jahre?', warum: 'Abweichung' }] }]
};

function startMock() {
  return new Promise((resolve) => {
    mock = http.createServer((req, res) => {
      if (req.url === '/v1/models') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ data: [{ id: 'text-embedding-nomic-embed-text-v1.5' }, { id: 'test-modell-14b' }] })); }
      if (req.url === '/v1/chat/completions') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          letzteAnfrage = JSON.parse(body);
          res.writeHead(200, { 'Content-Type': 'text/event-stream' });
          const text = '<think>kurz nachdenken</think>' + JSON.stringify(ANTWORT);
          for (let i = 0; i < text.length; i += 400) {
            res.write('data: ' + JSON.stringify({ choices: [{ delta: { content: text.slice(i, i + 400) }, finish_reason: null }] }) + '\n\n');
          }
          res.write('data: ' + JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 9000, completion_tokens: 2500 } }) + '\n\n');
          res.end('data: [DONE]\n\n');
        });
        return;
      }
      res.statusCode = 404; res.end();
    }).listen(0, '127.0.0.1', () => { mockPort = mock.address().port; resolve(); });
  });
}

before(async () => {
  await startMock();
  proc = spawn(process.execPath, [path.join(here, '../src/server.js')], {
    env: { ...process.env, PORT: String(PORT), KI_ANBIETER: 'lokal', LOKAL_URL: `http://127.0.0.1:${mockPort}/v1`, ANTHROPIC_API_KEY: '', ANALYSEN_PRO_IP_PRO_STUNDE: '10' },
    stdio: 'ignore'
  });
  for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/api/status'); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
});
after(() => { proc && proc.kill(); mock && mock.close(); });

function upload(files, typen) {
  const fd = new FormData();
  for (const f of files) fd.append('dateien', new Blob([fs.readFileSync(path.join(here, 'fixtures', f))], { type: 'application/pdf' }), f);
  fd.append('typen', JSON.stringify(typen));
  fd.append('einwilligung', 'ja');
  return fetch(BASE + '/api/analysen', { method: 'POST', body: fd });
}
async function warte(id) {
  for (let i = 0; i < 150; i++) {
    const s = await (await fetch(`${BASE}/api/analysen/${id}`)).json();
    if (s.status !== 'laeuft') return s;
    await new Promise((r) => setTimeout(r, 200));
  }
}

test('Status: lokaler Anbieter ohne API-Schlüssel verfügbar', async () => {
  const s = await (await fetch(BASE + '/api/status')).json();
  assert.equal(s.ki, true);
  assert.equal(s.anbieter, 'lokal');
});

test('Analyse mit lokaler KI: Anfrageformat, Stream, Belegprüfung', async () => {
  const r = await upload(['KID_Testfonds.pdf', 'Beratungsprotokoll_Text.pdf'], ['kid', 'protokoll']);
  assert.equal(r.status, 202);
  const { id } = await r.json();
  const s = await warte(id);
  assert.equal(s.status, 'fertig', s.fehler || '');
  assert.equal(s.anbieter, 'lokal');

  // Anfrage an die lokale KI
  assert.equal(letzteAnfrage.model, 'test-modell-14b', 'Modell aus /models gewählt, Embedding-Modell übersprungen');
  assert.equal(letzteAnfrage.stream, true);
  assert.equal(letzteAnfrage.response_format.type, 'json_schema');
  assert.ok(letzteAnfrage.response_format.json_schema.schema.properties.kosten);
  assert.match(letzteAnfrage.messages[0].content, /JSON-Schema/);
  assert.match(letzteAnfrage.messages[1].content, /--- Unterlage 2, Seite 1 ---\n.*Anlagehorizont/s);

  const bericht = await (await fetch(`${BASE}/api/analysen/${id}/bericht`)).json();
  assert.equal(bericht.fonds, 'Testfonds Weltaktien Dynamik A');
  assert.equal(bericht.risiken.befunde.length, 0, 'erfundenes Zitat wurde verworfen');
  assert.equal(bericht.pruefung.verworfen, 1);
  const bank = bericht.abgleich.zeilen[0].bank;
  assert.equal(bericht.belege[bank.belegId].pruefung, 'bestaetigt', 'Text-Protokoll ist maschinell geprüft');
});

test('Nur Scans: lokal mit verständlicher Meldung abgelehnt', async () => {
  const r = await upload(['Beratungsprotokoll_Scan.pdf'], ['protokoll']);
  const s = await warte((await r.json()).id);
  assert.equal(s.status, 'fehler');
  assert.match(s.fehler, /nur Scans oder Fotos/);
});

test('Lokale KI nicht erreichbar: verständliche Meldung', async () => {
  mock.close();
  await new Promise((r) => setTimeout(r, 100));
  const r = await upload(['KID_Testfonds.pdf'], ['kid']);
  const s = await warte((await r.json()).id);
  assert.equal(s.status, 'fehler');
  assert.match(s.fehler, /lokale KI ist nicht erreichbar|Verbindung zur lokalen KI/);
});
