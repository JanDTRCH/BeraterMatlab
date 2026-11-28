// Ausgabeformat, das Claude per Structured Outputs einhalten muss.
// Grundregel: Jede Angabe aus den Unterlagen trägt einen Beleg mit
// Dokumentnummer, Seite und wörtlichem Zitat. Der Server prüft jedes Zitat
// gegen den Text der Seite (siehe verify.js).
import { z } from 'zod';

const Sicherheit = z.enum(['hoch', 'mittel', 'niedrig']);
const Stufe = z.enum(['hoch', 'mittel', 'niedrig', 'unklar', 'fehlt', 'info']);

export const Beleg = z.object({
  dok: z.number().describe('Nummer der Unterlage wie im Eingabetext angegeben (1, 2, …).'),
  seite: z.number().describe('Seitennummer innerhalb der Datei (1 = erste Seite der Datei), nicht die gedruckte Seitenzahl.'),
  zitat: z.string().describe('Wörtlicher, zusammenhängender Ausschnitt aus genau dieser Seite (max. ca. 300 Zeichen), Schreibweise unverändert.'),
  sicherheit: Sicherheit.describe('Wie eindeutig der Wert aus der Textstelle hervorgeht.')
});

const Befund = z.object({
  titel: z.string(),
  stufe: Stufe,
  klartext: z.string().describe('Sachliche Erklärung in einfacher Sprache, nur was die Belege hergeben.'),
  belege: z.array(Beleg),
  ki: z.array(z.string()).describe('Einschätzung/Einordnung der KI, jeweils ein Absatz. Eigene Rechnungen mit Annahmen nennen.'),
  sicherheit: Sicherheit,
  sicherheitGrund: z.string(),
  fragen: z.array(z.string()).describe('IDs der passenden Fragen aus "fragen".')
});

const Fakt = z.object({
  label: z.string(),
  wert: z.string().describe('Bei fehlender Angabe: "Nicht in den Unterlagen".'),
  fehlt: z.boolean(),
  belege: z.array(Beleg).describe('Leer, wenn fehlt = true.')
});

const Seite = z.object({
  text: z.string(),
  vorhanden: z.boolean(),
  belege: z.array(Beleg)
});

export const AnalyseSchema = z.object({
  dokumente: z.array(z.object({
    dok: z.number(),
    typ: z.enum(['kid', 'prospekt', 'kosten', 'protokoll', 'pib', 'empfehlung', 'jahresbericht', 'factsheet', 'sonstiges']),
    name: z.string().describe('Bezeichnung des Dokuments, z. B. "Basisinformationsblatt".'),
    stand: z.string().describe('Datum/Stand laut Dokument oder leer.'),
    unvollstaendig: z.boolean(),
    hinweis: z.string().describe('Z. B. fehlende Seiten, schlecht lesbarer Scan; sonst leer.')
  })),
  fonds: z.string().describe('Fondsname laut Unterlagen oder "Unbekannter Fonds".'),
  zusammenfassung: z.object({
    kurz: z.array(z.string()).describe('3–6 kurze Sätze in einfacher Sprache. Keine Empfehlung.'),
    fakten: z.array(Fakt)
  }),
  kosten: z.object({
    tabelle: z.array(z.object({
      art: z.string(),
      erklaerung: z.string(),
      werte: z.array(z.object({ text: z.string(), beleg: Beleg })),
      status: Stufe,
      notiz: z.string()
    })),
    beispiel: z.object({
      vorhanden: z.boolean(),
      text: z.string(),
      werte: z.array(z.object({ betrag: z.string(), label: z.string(), beleg: Beleg })),
      ki: z.string()
    }),
    befunde: z.array(Befund)
  }),
  risiken: z.object({
    sri: z.object({ wert: z.number().describe('1–7, 0 wenn nicht gefunden.'), belege: z.array(Beleg) }),
    befunde: z.array(Befund)
  }),
  laufzeit: z.object({ fakten: z.array(Fakt), befunde: z.array(Befund) }),
  abgleich: z.object({
    moeglich: z.boolean().describe('false, wenn kein Beratungsprotokoll / keine Geeignetheitserklärung vorliegt.'),
    zeilen: z.array(z.object({
      merkmal: z.string(),
      fonds: Seite,
      bank: Seite,
      ergebnis: z.enum(['passt', 'abweichung', 'pruefen', 'unklar', 'fehlt']),
      ki: z.string(),
      fragen: z.array(z.string())
    }))
  }),
  vertrag: z.object({ befunde: z.array(Befund) }),
  fehlend: z.object({ befunde: z.array(Befund) }),
  fragen: z.array(z.object({
    gruppe: z.string(),
    items: z.array(z.object({ id: z.string(), text: z.string(), warum: z.string() }))
  }))
});
