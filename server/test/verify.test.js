import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findQuote, buildReport } from '../src/verify.js';
import { readPdf } from '../src/pdf.js';
import { AnalyseSchema } from '../src/schema.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (f) => fs.readFileSync(path.join(here, 'fixtures', f));

test('findQuote: findet Zitat trotz Zeilenumbruch, Trennstrich und anderer Leerzeichen', () => {
  const page = 'Die Verwal-\ntungsvergütung beträgt\n  1,50 %  p. a.\nWeiterer Text.';
  assert.ok(findQuote(page, 'Die Verwaltungsvergütung beträgt 1,50 % p.a.'));
  assert.ok(findQuote(page, '„Die Verwaltungsvergütung beträgt 1,50 %“'));
});

test('findQuote: Auslassungen mit … müssen in Reihenfolge vorkommen', () => {
  const page = 'Erster Teil des Satzes. Mittelteil, der weggelassen wird. Letzter Teil des Satzes.';
  assert.ok(findQuote(page, 'Erster Teil des Satzes … Letzter Teil des Satzes'));
  assert.equal(findQuote(page, 'Letzter Teil des Satzes … Erster Teil des Satzes'), null);
});

test('findQuote: erfundene oder veränderte Zahlen werden nicht gefunden', () => {
  const page = 'Laufende Kosten: 1,85 % pro Jahr.';
  assert.equal(findQuote(page, 'Laufende Kosten: 1,65 % pro Jahr.'), null);
  assert.equal(findQuote(page, 'abc'), null); // zu kurz
});

test('readPdf: liest Textseiten und erkennt Scans', async () => {
  const kid = await readPdf(fixture('KID_Testfonds.pdf'));
  assert.equal(kid.seitenzahl, 3);
  assert.deepEqual(kid.scanSeiten, []);
  assert.match(kid.seiten[1], /2,05 %/);
  const scan = await readPdf(fixture('Beratungsprotokoll_Scan.pdf'));
  assert.deepEqual(scan.scanSeiten, [1, 2]);
});

test('readPdf: beschädigte Datei liefert verständliche Fehlermeldung', async () => {
  await assert.rejects(readPdf(Buffer.from('%PDF-1.4 kaputt')), /beschädigt|geöffnet/);
});

function beleg(dok, seite, zitat, sicherheit = 'hoch') { return { dok, seite, zitat, sicherheit }; }
function befund(titel, belege, extra = {}) {
  return { titel, stufe: 'mittel', klartext: 'Text', belege, ki: ['KI'], sicherheit: 'hoch', sicherheitGrund: 'Grund', fragen: ['q1', 'q99'], ...extra };
}

test('buildReport: bestätigt, korrigiert, verwirft und kennzeichnet Scan-Belege', async () => {
  const kid = await readPdf(fixture('KID_Testfonds.pdf'));
  const scan = await readPdf(fixture('Beratungsprotokoll_Scan.pdf'));
  const docs = [
    { dateiname: 'KID.pdf', typ: 'kid', seiten: kid.seiten, scanSeiten: kid.scanSeiten, bild: false },
    { dateiname: 'Protokoll.pdf', typ: 'protokoll', seiten: scan.seiten, scanSeiten: scan.scanSeiten, bild: false }
  ];
  const analyse = {
    dokumente: [{ dok: 1, typ: 'kid', name: 'Basisinformationsblatt', stand: '01.03.2026', unvollstaendig: false, hinweis: '' }],
    fonds: 'Testfonds',
    zusammenfassung: {
      kurz: ['Satz'],
      fakten: [
        { label: 'Risikoklasse', wert: '5 von 7', fehlt: false, belege: [beleg(1, 1, 'in die Risikoklasse 5 eingestuft')] },
        { label: 'ISIN', wert: 'XX123', fehlt: false, belege: [beleg(1, 1, 'ISIN: DE0001234567')] }, // erfunden
        { label: 'Fondsgröße', wert: 'Nicht in den Unterlagen', fehlt: true, belege: [] }
      ]
    },
    kosten: {
      tabelle: [{ art: 'Laufende Kosten', erklaerung: 'E', status: 'info', notiz: '', werte: [
        { text: '2,05 %', beleg: beleg(1, 3, 'Verwaltungs- oder Betriebskosten: 2,05 % des Werts') } // falsche Seite (richtig: 2)
      ] }],
      beispiel: { vorhanden: false, text: '', werte: [], ki: '' },
      befunde: [
        befund('Echt', [beleg(1, 2, 'Transaktionskosten: 0,35 % des Werts Ihrer Anlage pro Jahr.')]),
        befund('Erfunden', [beleg(1, 2, 'Erfolgsgebühr von 20 % der Mehrrendite')])
      ]
    },
    risiken: { sri: { wert: 5, belege: [beleg(1, 1, 'Risikoklasse 5 eingestuft')] }, befunde: [] },
    laufzeit: { fakten: [], befunde: [] },
    abgleich: { moeglich: true, zeilen: [{
      merkmal: 'Anlagedauer',
      fonds: { text: '6 Jahre', vorhanden: true, belege: [beleg(1, 1, 'Empfohlene Haltedauer: 6 Jahre.')] },
      bank: { text: 'bis 3 Jahre', vorhanden: true, belege: [beleg(2, 1, 'Anlagehorizont: kurzfristig (bis 3 Jahre)', 'hoch')] },
      ergebnis: 'abweichung', ki: 'KI', fragen: ['q1']
    }] },
    vertrag: { befunde: [] },
    fehlend: { befunde: [befund('Jahresbericht fehlt', [], { stufe: 'fehlt' })] },
    fragen: [{ gruppe: 'Kosten', items: [{ id: 'q1', text: 'Frage?', warum: 'Anlass' }, { id: 'q1', text: 'Doppelt', warum: '' }] }]
  };

  assert.ok(AnalyseSchema.safeParse(analyse).success, 'Testdaten passen zum Schema');
  const r = buildReport(analyse, docs, { id: 'T1', erstellt: 'heute' });

  // Fakten
  assert.equal(r.zusammenfassung.fakten[0].wert, '5 von 7');
  assert.equal(r.zusammenfassung.fakten[1].fehlt, true, 'erfundene ISIN wird nicht übernommen');
  assert.equal(r.zusammenfassung.fakten[1].wert, 'Nicht eindeutig belegt');
  // Seitenkorrektur
  const w = r.kosten.tabelle[0].werte[0];
  assert.equal(r.belege[w.belegId].seite, 2);
  assert.equal(r.belege[w.belegId].pruefung, 'korrigiert');
  assert.ok(r.belege[w.belegId].vor.length > 0, 'Kontext wird mitgeliefert');
  // Befunde
  assert.deepEqual(r.kosten.befunde.map((f) => f.titel), ['Echt']);
  assert.equal(r.fehlend.befunde.length, 1, 'Fehlt-Befund ohne Beleg bleibt');
  // Scan-Beleg: behalten, aber höchstens mittel
  const bank = r.abgleich.zeilen[0].bank;
  assert.equal(r.belege[bank.belegId].pruefung, 'ungeprueft');
  assert.equal(r.belege[bank.belegId].sicherheit, 'mittel');
  assert.equal(r.abgleich.zeilen[0].ergebnis, 'abweichung');
  // SRI
  assert.equal(r.risiken.sri.wert, 5);
  // Fragen: Duplikate entfernt, ungültige Verweise entfernt
  assert.equal(r.fragen[0].items.length, 1);
  assert.deepEqual(r.kosten.befunde[0].fragen, ['q1']);
  // Statistik
  assert.equal(r.pruefung.verworfen, 2);
  // Jede Fundstelle zählt einmal (SRI-Zitat kommt zweimal vor): gesamt = bestätigt + korrigiert + ungeprüft + verworfen
  const p = r.pruefung;
  assert.equal(p.gesamt, p.bestaetigt + p.korrigiert + p.ungeprueft + p.verworfen);
  assert.equal(r.pruefung.befundeEntfernt, 1);
  assert.equal(r.dokumente.D2.sicherheit, 'mittel');
});
