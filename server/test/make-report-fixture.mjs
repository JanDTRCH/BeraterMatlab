// Erzeugt einen Bericht im echten Format aus Testdaten (nur für UI-Tests).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPdf } from '../src/pdf.js';
import { buildReport } from '../src/verify.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const kid = await readPdf(fs.readFileSync(path.join(here, 'fixtures/KID_Testfonds.pdf')));
const scan = await readPdf(fs.readFileSync(path.join(here, 'fixtures/Beratungsprotokoll_Scan.pdf')));
const docs = [
  { dateiname: 'KID_Testfonds.pdf', typ: 'kid', seiten: kid.seiten, scanSeiten: kid.scanSeiten, bild: false },
  { dateiname: 'Beratungsprotokoll_Scan.pdf', typ: 'protokoll', seiten: scan.seiten, scanSeiten: scan.scanSeiten, bild: false }
];
const b = (dok, seite, zitat, sicherheit = 'hoch') => ({ dok, seite, zitat, sicherheit });
const analyse = {
  dokumente: [
    { dok: 1, typ: 'kid', name: 'Basisinformationsblatt', stand: '01.03.2026', unvollstaendig: false, hinweis: '' },
    { dok: 2, typ: 'protokoll', name: 'Geeignetheitserklärung', stand: '12.11.2026', unvollstaendig: false, hinweis: 'Scan' }
  ],
  fonds: 'Testfonds Weltaktien Dynamik A',
  zusammenfassung: { kurz: ['Ein **Aktienfonds** <script>alert(1)</script> mit Schwerpunkt Schwellenländer.'], fakten: [
    { label: 'Risikoklasse (SRI)', wert: '5 von 7', fehlt: false, belege: [b(1, 1, 'in die Risikoklasse 5 eingestuft')] },
    { label: 'ISIN', wert: 'XX0009876543', fehlt: false, belege: [b(1, 1, 'ISIN: XX0009876543')] },
    { label: 'Fondsgröße', wert: 'Nicht in den Unterlagen', fehlt: true, belege: [] }
  ] },
  kosten: { tabelle: [
    { art: 'Ausgabeaufschlag', erklaerung: 'Einmalige Gebühr beim Kauf.', status: 'info', notiz: '', werte: [{ text: '5,50 %', beleg: b(1, 2, 'Einstiegskosten: 5,50 % des Betrags') }] },
    { art: 'Depotkosten', erklaerung: 'Verwahrung.', status: 'fehlt', notiz: '', werte: [] }
  ], beispiel: { vorhanden: true, text: 'Anlage 10.000 EUR', werte: [{ betrag: '812 EUR', label: 'nach 1 Jahr', beleg: b(1, 2, 'Kosten insgesamt: 812 EUR bei Ausstieg nach 1 Jahr') }], ki: '' },
    befunde: [] },
  risiken: { sri: { wert: 5, belege: [b(1, 1, 'Risikoklasse 5 eingestuft')] }, befunde: [
    { titel: 'Verlustrisiko', stufe: 'hoch', klartext: 'Hohe mögliche Verluste.', belege: [b(1, 2, 'Stressszenario: Was Sie am Ende nach Abzug der Kosten herausbekommen könnten')], ki: ['Deutlich über der Verlusttragfähigkeit von 10 %.'], sicherheit: 'hoch', sicherheitGrund: 'Zahlen eindeutig.', fragen: ['q1"><img src=x onerror=alert(1)>', 'q1'] }
  ] },
  laufzeit: { fakten: [], befunde: [] },
  abgleich: { moeglich: true, zeilen: [{ merkmal: 'Anlagedauer', fonds: { text: '6 Jahre', vorhanden: true, belege: [b(1, 1, 'Empfohlene Haltedauer: 6 Jahre.')] }, bank: { text: 'bis 3 Jahre', vorhanden: true, belege: [b(2, 1, 'Anlagehorizont: kurzfristig (bis 3 Jahre)')] }, ergebnis: 'abweichung', ki: 'Kürzer als empfohlen.', fragen: ['q1'] }] },
  vertrag: { befunde: [] },
  fehlend: { befunde: [{ titel: 'Kein Verkaufsprospekt', stufe: 'fehlt', klartext: 'Nicht hochgeladen.', belege: [], ki: [], sicherheit: 'hoch', sicherheitGrund: '', fragen: [] }] },
  fragen: [{ gruppe: 'Passt das zu mir?', items: [{ id: 'q1', text: 'Warum 6 Jahre bei meinem Horizont von 3 Jahren?', warum: 'Abweichung' }, { id: 'x"><b>', text: 'böse ID', warum: '' }] }]
};
process.stdout.write(JSON.stringify(buildReport(analyse, docs, { id: 'TEST1234', erstellt: '28.11.2026, 12:00 Uhr' })));
