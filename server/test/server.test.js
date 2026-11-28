// API-Tests gegen einen echten Serverprozess (ohne gültigen API-Schlüssel).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 18080 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
let proc;

async function startServer(env) {
  proc = spawn(process.execPath, [path.join(here, '../src/server.js')], { env: { ...process.env, PORT: String(PORT), ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (let i = 0; i < 50; i++) {
    try { await fetch(BASE + '/api/status'); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error('Server startet nicht');
}

function form(files, fields = {}) {
  const fd = new FormData();
  for (const [name, buf, type] of files) fd.append('dateien', new Blob([buf], { type }), name);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

before(() => startServer({ ANTHROPIC_API_KEY: 'sk-ant-test-ungueltig', ZUGANGSCODE: 'geheim123' }));
after(() => proc && proc.kill());

test('Website und Sicherheits-Header', async () => {
  const res = await fetch(BASE + '/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal((await fetch(BASE + '/gibtsnicht')).status, 404);
});

test('Status meldet KI und Zugangscode', async () => {
  const s = await (await fetch(BASE + '/api/status')).json();
  assert.equal(s.ki, true);
  assert.equal(s.zugangscode, true);
});

test('Upload: falscher Zugangscode, fehlende Einwilligung, falscher Dateityp', async () => {
  const pdf = fs.readFileSync(path.join(here, 'fixtures/KID_Testfonds.pdf'));
  let r = await fetch(BASE + '/api/analysen', { method: 'POST', body: form([['a.pdf', pdf, 'application/pdf']], { einwilligung: 'ja', zugangscode: 'falsch' }) });
  assert.equal(r.status, 403);
  r = await fetch(BASE + '/api/analysen', { method: 'POST', body: form([['a.pdf', pdf, 'application/pdf']], { zugangscode: 'geheim123' }) });
  assert.equal(r.status, 400);
  assert.match((await r.json()).fehler, /Einwilligung/);
  r = await fetch(BASE + '/api/analysen', { method: 'POST', body: form([['trick.pdf', Buffer.from('<html>kein pdf</html>'), 'application/pdf']], { einwilligung: 'ja', zugangscode: 'geheim123' }) });
  assert.equal(r.status, 400);
  assert.match((await r.json()).fehler, /keine PDF/);
  r = await fetch(BASE + '/api/analysen', { method: 'POST', body: form([], { einwilligung: 'ja', zugangscode: 'geheim123' }) });
  assert.equal(r.status, 400);
});

test('Upload: Auftrag läuft durch Textauslese und meldet API-Fehler verständlich', async () => {
  const files = [
    ['KID_Testfonds.pdf', fs.readFileSync(path.join(here, 'fixtures/KID_Testfonds.pdf')), 'application/pdf'],
    ['Beratungsprotokoll_Scan.pdf', fs.readFileSync(path.join(here, 'fixtures/Beratungsprotokoll_Scan.pdf')), 'application/pdf']
  ];
  const r = await fetch(BASE + '/api/analysen', { method: 'POST', body: form(files, { einwilligung: 'ja', zugangscode: 'geheim123', typen: JSON.stringify(['kid', 'protokoll']) }) });
  assert.equal(r.status, 202);
  const { id } = await r.json();
  let s;
  for (let i = 0; i < 100; i++) {
    s = await (await fetch(`${BASE}/api/analysen/${id}`)).json();
    if (s.status !== 'laeuft') break;
    await new Promise((res) => setTimeout(res, 200));
  }
  // Mit ungültigem Schlüssel muss die Analyse mit einer verständlichen Meldung scheitern
  assert.equal(s.status, 'fehler');
  assert.ok(s.fehler && !/sk-ant|401|authentication/i.test(s.fehler), 'keine technischen Details an Nutzer');
  assert.equal(s.schritte.find((x) => x.id === 'text').status, 'hinweis', 'Scan wird als Hinweis gemeldet');
  assert.equal(s.dokumente[1].seiten, 2);
  assert.equal((await fetch(`${BASE}/api/analysen/${id}/bericht`)).status, 409);
  assert.equal((await fetch(`${BASE}/api/analysen/${id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${BASE}/api/analysen/${id}`)).status, 404);
});
