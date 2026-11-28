// Tagesbudget aufgebraucht → keine neuen Analysen; Kostenberechnung
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kostenUsd } from '../src/budget.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 19500 + Math.floor(Math.random() * 400);
let proc;

before(async () => {
  proc = spawn(process.execPath, [path.join(here, '../src/server.js')], { env: { ...process.env, PORT: String(PORT), ANTHROPIC_API_KEY: 'sk-ant-test', TAGESBUDGET_USD: '0' }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/api/status`); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
});
after(() => proc && proc.kill());

test('Budget 0 USD: Upload wird ohne KI-Aufruf abgelehnt', async () => {
  const fd = new FormData();
  fd.append('dateien', new Blob([fs.readFileSync(path.join(here, 'fixtures/KID_Testfonds.pdf'))], { type: 'application/pdf' }), 'kid.pdf');
  fd.append('einwilligung', 'ja');
  const r = await fetch(`http://127.0.0.1:${PORT}/api/analysen`, { method: 'POST', body: fd });
  assert.equal(r.status, 429);
  assert.match((await r.json()).fehler, /Tageskontingent/);
});

test('Kostenberechnung Haiku 5.5 inkl. höherem Tarif über 100.000 Tokens', () => {
  assert.equal(kostenUsd('claude-haiku-5-5', { input_tokens: 10000, output_tokens: 20000 }).toFixed(4), '0.0110');
  assert.equal(kostenUsd('claude-haiku-5-5', { input_tokens: 120000, output_tokens: 20000 }).toFixed(4), '0.1100');
  assert.ok(kostenUsd('unbekannt', { input_tokens: 10000, output_tokens: 20000 }) > 0.4, 'unbekannte Modelle werden vorsichtig teuer geschätzt');
});
