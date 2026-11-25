# Fondslupe – Konzept

> **Arbeitstitel:** „Fondslupe“ (Name und Markenrecht noch zu prüfen)
> **Stand:** 25.11.2026 · Konzept und erster Prototyp
> **Prototyp:** [`/prototype`](../prototype) – statische, klickbare Website mit fiktiven Beispieldaten

---

## 1. Produktbeschreibung

**Fondslupe macht Fondsunterlagen und Bankempfehlungen für Privatanlegerinnen und Privatanleger verständlich.**

Nutzerinnen und Nutzer laden die Unterlagen zu einem Fondsangebot hoch – Basisinformationsblatt, Verkaufsprospekt, Kostenübersicht, Beratungsprotokoll und schriftliche Empfehlung. Fondslupe erkennt Dokumenttyp, Fondsname und die wichtigsten Produktdaten, liest Kosten, Risiken und Rückgabebedingungen aus und vergleicht die Fondsangaben mit dem, was die Bank im Beratungsprotokoll über die Person festgehalten hat.

Das Ergebnis ist ein Bericht in klarer Sprache:

- **Jede Aussage ist belegt** – mit Dokument, Seitenzahl und wörtlicher Textstelle.
- **Fakten und KI-Einschätzung sind sichtbar getrennt** – grauer Kasten „Aus den Unterlagen“, violetter Kasten „Einschätzung der KI“.
- **Erkennungssicherheit ist angegeben** – hoch / mittel / niedrig, jeweils mit Begründung.
- **Lücken werden benannt, nicht gefüllt** – fehlende oder unklare Angaben sind als solche markiert.
- **Konkrete Fragen an die Bank** – abgeleitet aus Abweichungen, Unklarheiten und Lücken, zum Mitnehmen ins Gespräch.

**Was Fondslupe nicht ist:** keine Anlageberatung, keine Kauf- oder Verkaufsempfehlung, keine Prognose. Fondslupe hilft, die richtigen Fragen zu stellen – die Entscheidung bleibt bei der Person.

**Nutzen auf einen Blick**

| Für wen | Problem | Lösung |
|---|---|---|
| Privatanleger ohne vertiefte Finanzkenntnisse | 100+ Seiten Fachsprache, verteilt auf mehrere Dokumente | Ein Bericht, acht klar benannte Abschnitte, Fachbegriffe direkt erklärt |
| Personen mit konkreter Bankempfehlung | Unklar, ob die Empfehlung zum eigenen Profil passt | Abgleich Beratungsprotokoll ↔ Fondsunterlagen, Abweichungen markiert |
| Personen vor einem Bankgespräch | Unsicherheit, was man fragen sollte | Fragenliste mit Anlass, kopier- und druckbar |

---

## 2. Sitemap

```
Fondslupe
├── Startseite (index.html)
│   ├── So funktioniert’s (#so-gehts)
│   ├── Was Fondslupe prüft
│   ├── Unterstützte Unterlagen
│   ├── Transparenz: Unterlagen vs. KI
│   └── Häufige Fragen (#faq)
│
├── Analyse-Ablauf
│   ├── 1. Unterlagen hochladen (upload.html)
│   ├── 2. Analyse / Verarbeitungsstatus (analyse.html)
│   └── 3. Analysebericht (bericht.html)
│       ├── 1 Kurze Zusammenfassung
│       ├── 2 Kosten
│       ├── 3 Risiken
│       ├── 4 Laufzeit und Rückgabe
│       ├── 5 Abgleich mit der Bankempfehlung
│       ├── 6 Auffällige oder unklare Vertragsstellen
│       ├── 7 Fehlende Informationen
│       ├── 8 Fragen an die Bank
│       └── Quellenansicht (Dialog mit markierter Fundstelle)
│
├── Beispielbericht (bericht.html – ohne Login erreichbar)
├── Datenschutz & Grenzen der Analyse (sicherheit.html)
│
└── Geplant, nicht im Prototyp
    ├── Anmelden / Registrieren (E-Mail-Link oder Passkey)
    ├── Meine Analysen (Liste, Status, Löschen)
    ├── Konto & Einstellungen (Benachrichtigungen, Daten exportieren/löschen)
    ├── Glossar (alle Fachbegriffe)
    ├── Impressum, Datenschutzerklärung, AGB
    └── Hilfe & Kontakt
```

---

## 3. Nutzerführung vom Upload bis zum Bericht

Ein linearer Ablauf in drei Schritten, immer sichtbar in der Fortschrittsleiste: **Unterlagen hochladen → Analyse → Bericht**.

### Schritt 0 – Einstieg
- Startseite erklärt in einem Satz, was passiert, und zeigt eine Berichtsvorschau.
- Zwei Wege: **„Unterlagen hochladen“** (Hauptaktion) oder **„Beispielbericht ansehen“** (ohne Risiko ausprobieren).
- Vertrauenssignale direkt beim Hauptbutton: verschlüsselt, Löschung nach 30 Tagen, keine Weitergabe.

### Schritt 1 – Unterlagen hochladen
1. Dateien per Ziehen-und-Ablegen oder Auswahl (PDF, JPG, PNG; bis 20 MB, bis 10 Dateien).
2. Jede Datei zeigt ihren Status: *Wird hochgeladen … → Bereit zur Analyse* bzw. *Typ unklar* oder *Nicht hochgeladen* (mit Grund und Lösung).
3. Der Dokumenttyp wird vorläufig erkannt und kann über eine Auswahlliste korrigiert werden.
4. Seitenleiste „Empfohlene Unterlagen“ hakt erkannte Dokumenttypen ab – so sieht man sofort, was fehlt.
5. Einwilligung (berechtigt, Zweckbindung, keine Anlageberatung) per Häkchen.
6. „Analyse starten“ ist immer klickbar. Fehlt etwas, erscheint direkt am betroffenen Feld ein Hinweis mit Lösungsweg.

### Schritt 2 – Analyse
1. Gesamtfortschritt (Balken + Prozent + „Schritt x von 7“) und sieben verständlich benannte Teilschritte:
   Dateien prüfen → Text erkennen → Dokumenttypen bestimmen → Produktdaten auslesen → Kosten & Risiken auswerten → Abgleich mit Bankempfehlung → Bericht erstellen.
2. Jeder Schritt hat Status mit Symbol **und** Text: *Wartet · Läuft · Erledigt · Erledigt mit Hinweis*.
3. Hinweise erscheinen sofort, z. B. „Verkaufsprospekt: nur 60 von 112 Seiten vorhanden“.
4. Seitenleiste: Status je Unterlage und „Bereits erkannt“ (erste Produktdaten).
5. Die Seite kann geschlossen werden; Benachrichtigung per E-Mail, wenn der Bericht fertig ist.
6. „Analyse abbrechen und Unterlagen löschen“ mit ausdrücklicher Bestätigung.
7. Abschluss: Kurzfazit (Anzahl Abweichungen, fehlende Informationen) und Button „Bericht ansehen“ (erhält Fokus).

### Schritt 3 – Bericht
1. Kopf: Fondsname, Anzahl ausgewerteter Unterlagen, Datum, Berichtsnummer; Aktionen **Als PDF speichern**, **Bericht herunterladen**, **In „Meine Analysen“ speichern**.
2. Fester Hinweis „Orientierung, keine Anlageberatung“ und Lesehilfe (Legende: Herkunft, Erkennungssicherheit, Einstufung).
3. Inhaltsverzeichnis (am Desktop mitlaufend, mobil als horizontale Leiste) mit Anzahl der Befunde je Abschnitt.
4. Acht Abschnitte in fester Reihenfolge. Jeder Befund folgt demselben Aufbau:
   **Titel + Einstufung → „Kurz erklärt“ → Aus den Unterlagen (Zitat, Quelle, Erkennung) → Einschätzung der KI (stützt sich auf …, Sicherheit + Begründung) → Link zur passenden Frage.**
5. Klick auf eine Quelle öffnet die Fundstelle (im Produkt: Originalseite mit Markierung).
6. Abschnitt „Fehlende Informationen“ bietet „Fehlende Unterlagen nachreichen“ – zurück zu Schritt 1, die Analyse wird ergänzt.
7. Fragen an die Bank: auswählbar, kopierbar, als Textdatei ladbar, druckbar.

---

## 4. Visueller Prototyp

Der Prototyp liegt in [`/prototype`](../prototype) und läuft ohne Server und ohne externe Abhängigkeiten (einfach `prototype/index.html` im Browser öffnen).

| Seite | Datei | Zeigt |
|---|---|---|
| Startseite | `index.html` | Nutzenversprechen, Ablauf, Prüfumfang, Transparenzprinzip, FAQ |
| Upload | `upload.html` | Dropzone, Dateiliste mit Status und Typkorrektur, Checkliste, Einwilligung, Fehlermeldungen |
| Analyse | `analyse.html` | Simulierter Verarbeitungsstatus mit Teilschritten, Hinweisen und Dokumentstatus |
| Bericht | `bericht.html` | Vollständiger Beispielbericht mit allen acht Abschnitten, Quellen-Dialog, Export |
| Datenschutz & Grenzen | `sicherheit.html` | Schutzmaßnahmen, was die Analyse leistet/nicht leistet, Erkennungssicherheit |

**Gestaltungsprinzipien**

- **Ruhig und seriös:** warmes Off-White, gedecktes Petrol als einzige Markenfarbe, keine Verläufe, keine dekorativen Illustrationen.
- **Gut lesbar:** Systemschrift (keine externen Schriften – auch aus Datenschutzgründen), Grundgröße 17 px, Zeilenhöhe 1,6, Textbreite max. ~70 Zeichen.
- **Status nie nur über Farbe:** Jede Einstufung kombiniert Farbe, **Symbol** (Dreieck, Kreis mit !, Haken, Fragezeichen, gestrichelter Kreis) und **Text** („Hohes Risiko“, „Abweichung“, „Fehlt“). Befundkarten haben zusätzlich eine farbige bzw. gestrichelte Randlinie.
- **Herkunft immer sichtbar:** grau = Dokument, violett = KI; beide mit Beschriftung und eigenem Symbol.
- **Barrierearm:** Tastaturbedienung, sichtbarer Fokusrahmen, „Zum Inhalt springen“, Live-Regionen für Statusmeldungen, `prefers-reduced-motion`, Druckansicht.
- **Responsiv:** 375 px bis Desktop ohne horizontales Scrollen; Tabellen werden mobil zu Karten.

**Technische Umsetzung im Prototyp:** Der Bericht wird aus einem strukturierten Datenobjekt gerendert (`prototype/assets/beispielbericht.js`). Es zeigt das geplante Datenmodell: Dokumente → Belege (Dokument, Seite, Zitat, Sicherheit) → Befunde (Einstufung, Klartext, Belege, KI-Einschätzung, Sicherheit + Begründung, verknüpfte Fragen).

---

## 5. Beispieltexte

### 5.1 Upload

| Element | Text |
|---|---|
| Überschrift | **Unterlagen hochladen** |
| Einleitung | Laden Sie die Unterlagen zu Ihrem Fondsangebot hoch. Wir erkennen automatisch, um welches Dokument es sich handelt – Sie können die Zuordnung jederzeit korrigieren. |
| Dropzone | **Dateien hierher ziehen** · oder vom Gerät auswählen · PDF, JPG oder PNG · bis 20 MB pro Datei · bis zu 10 Dateien |
| Buttons | Dateien auswählen · Mit Beispielunterlagen ausprobieren · Analyse starten |
| Typ erkannt | Vorläufig anhand des Dateinamens erkannt – wird bei der Analyse am Inhalt geprüft. |
| Typ unklar | Bitte wählen Sie aus, um welches Dokument es sich handelt. |
| Status | Wird hochgeladen … · Bereit zur Analyse · Typ unklar · Nicht hochgeladen |
| Fehler Format | Dieses Dateiformat können wir nicht lesen. Bitte laden Sie eine PDF-, JPG- oder PNG-Datei hoch. |
| Fehler Größe | Die Datei ist größer als 20 MB. Bitte teilen Sie sie auf oder speichern Sie sie mit geringerer Auflösung. |
| Fehler keine Datei | Bitte fügen Sie mindestens eine Unterlage hinzu – zum Beispiel das Basisinformationsblatt. |
| Fehler Typ fehlt | Bei mindestens einer Datei fehlt noch der Dokumenttyp. Bitte wählen Sie ihn in der Liste aus. |
| Einwilligung | Ich bin berechtigt, diese Unterlagen hochzuladen, und bin einverstanden, dass sie ausschließlich zur Erstellung meines Berichts verarbeitet werden. Ich habe verstanden, dass der Bericht eine Orientierung bietet und keine Anlageberatung ersetzt. |
| Fehler Einwilligung | Bitte bestätigen Sie die Einwilligung, damit wir Ihre Unterlagen analysieren können. |
| Datenschutz-Kasten | Verschlüsselte Übertragung und Speicherung · Verarbeitung nur in Rechenzentren in der EU · Löschung nach 30 Tagen oder sofort auf Wunsch · Keine Weitergabe, kein KI-Training mit Ihren Daten |
| Tipp | Sie können Name, Adresse und Kontonummer vor dem Hochladen schwärzen. Für die Analyse werden sie nicht benötigt. |

### 5.2 Analyse

| Element | Text |
|---|---|
| Überschrift | **Ihre Unterlagen werden analysiert** |
| Einleitung | Das dauert in der Regel 2 bis 4 Minuten. Sie können diese Seite schließen – wir benachrichtigen Sie per E-Mail, sobald Ihr Bericht fertig ist. |
| Schritt 1 | **Dateien sicher prüfen** – Wir prüfen, ob die Dateien lesbar und unbeschädigt sind, und scannen sie auf Schadsoftware. |
| Schritt 2 | **Text erkennen** – Aus PDF-Dateien und Scans wird der Text gelesen. Bei Scans nutzen wir Texterkennung. |
| Schritt 3 | **Dokumenttypen bestimmen** – Wir ordnen jede Unterlage einem Dokumenttyp zu und prüfen, ob sie vollständig ist. |
| Schritt 4 | **Produktdaten auslesen** – Fondsname, Wertpapierkennung, Laufzeit, Risikoklasse und empfohlene Haltedauer. |
| Schritt 5 | **Kosten und Risiken auswerten** – Wir lesen alle Kostenangaben aus und markieren genannte Risiken. |
| Schritt 6 | **Mit der Bankempfehlung abgleichen** – Wir vergleichen die Angaben aus dem Beratungsprotokoll mit den Fondsunterlagen. |
| Schritt 7 | **Bericht erstellen** – Wir fassen alles verständlich zusammen und formulieren Fragen an Ihre Bank. |
| Hinweis Scan | Geeignetheitserklärung ist ein Scan – Handschrift wird nicht zuverlässig erkannt. |
| Hinweis unvollständig | Verkaufsprospekt: nur 60 von 112 Seiten vorhanden. |
| Fertig | **Ihr Bericht ist fertig.** Wir haben 5 Unterlagen ausgewertet. Dabei sind uns 3 Abweichungen zur Bankempfehlung und 4 fehlende Informationen aufgefallen. Alle Aussagen im Bericht sind mit Quelle belegt. |
| Abbrechen (Bestätigung) | Analyse abbrechen und alle hochgeladenen Unterlagen löschen? Dies kann nicht rückgängig gemacht werden. |
| Fehler (Beispiel) | Eine Datei konnten wir nicht lesen. Das liegt meist an einem Kennwortschutz oder einer beschädigten Datei. Laden Sie die Datei bitte erneut hoch – die übrigen Unterlagen werten wir bereits aus. |

### 5.3 Ergebnisseite

| Element | Text |
|---|---|
| Pflichthinweis | **Orientierung, keine Anlageberatung.** Dieser Bericht erklärt Ihre Unterlagen und zeigt Auffälligkeiten. Er enthält keine Kauf- oder Verkaufsempfehlung und berücksichtigt nicht Ihre gesamte finanzielle Situation. Angaben, die nicht eindeutig in den Unterlagen stehen, haben wir als **unklar** oder **fehlend** markiert – nicht geschätzt. |
| Zusammenfassung (KI) | Es handelt sich um einen **Aktienfonds**, der weltweit in Unternehmen anlegt, überwiegend in den USA. Der Wert Ihrer Anlage kann deutlich schwanken. Der Fonds hat **keine feste Laufzeit**. Die Fondsgesellschaft empfiehlt, mindestens **7 Jahre** investiert zu bleiben. … |
| Kosten – Einleitung | Kosten mindern Ihren Ertrag – unabhängig davon, wie sich der Fonds entwickelt. Wir zeigen die Kosten so, wie sie in den Unterlagen stehen, und erklären jeden Begriff. |
| Begriff erklärt | **Ausgabeaufschlag:** Einmalige Gebühr beim Kauf. Sie wird vom Anlagebetrag abgezogen, bevor er investiert wird. |
| Begriff erklärt | **Laufende Kosten:** Jährliche Kosten für Verwaltung und Betrieb des Fonds. Sie werden direkt aus dem Fondsvermögen entnommen – Sie sehen sie nicht als eigene Abbuchung. |
| Begriff erklärt | **Erfolgsabhängige Gebühr:** Zusätzliche Gebühr, wenn der Fonds besser abschneidet als ein Vergleichsmaßstab. In guten Jahren steigen dadurch die Kosten. |
| Befund unklar | **Laufende Kosten: zwei unterschiedliche Angaben.** Das Basisinformationsblatt nennt 1,85 % pro Jahr, die Kostenübersicht der Bank 1,65 %. … Aus den Unterlagen lässt sich nicht sicher sagen, welcher Wert für Sie gilt. Wir haben deshalb keinen der beiden Werte als „richtig“ übernommen. |
| Risiken – Einleitung | Die Einstufung „hoch / mittel / gering“ ist eine Einschätzung der KI für dieses Angebot – sie beruht auf den genannten Textstellen. |
| Abgleich – Einleitung | Eine Abweichung bedeutet nicht automatisch, dass die Empfehlung falsch ist – sie ist aber ein guter Anlass für eine Rückfrage. |
| Fehlend – Einleitung | Diese Informationen konnten wir nicht finden oder nicht eindeutig lesen. Wir haben keine Werte ergänzt oder geschätzt. |
| Frage (Beispiel) | Die empfohlene Haltedauer beträgt 7 Jahre, mein Anlagehorizont laut Protokoll 3–5 Jahre. Warum halten Sie den Fonds trotzdem für geeignet? |
| Sicherheitsbegründung | Warum diese Sicherheit: Texterkennung auf gescannter Seite; Handschrift wird nicht zuverlässig erkannt. |
| Schlusshinweis | Fondslupe ist kein Anlageberater und keine Bank. Die Analyse wurde automatisch erstellt und kann Fehler enthalten. Maßgeblich sind allein die Originalunterlagen. |

**Schreibregeln für alle Texte:** Sie-Form · kurze Sätze · Fachbegriff beim ersten Auftreten direkt erklären · Zahlen immer mit Einheit und, wo sinnvoll, in Euro · keine wertenden Wörter wie „schlecht“, „teuer“, „unseriös“ · Abweichungen sachlich als Anlass für Rückfragen formulieren · Fehlermeldungen beschuldigen nie die Nutzerin oder den Nutzer und nennen immer einen Lösungsweg.

---

## 6. Regeln für die Analyse (Leitplanken)

1. **Keine Erfindung:** Jeder Wert im Bericht muss auf eine Textstelle (Dokument + Seite + Zitat) zurückführbar sein. Fehlt sie, wird der Wert als „fehlt“ angezeigt.
2. **Widersprüche nicht auflösen:** Nennen zwei Unterlagen unterschiedliche Werte, werden beide gezeigt und als „unklar“ markiert.
3. **Rechnungen kennzeichnen:** Eigene Berechnungen (z. B. Hochrechnung auf den Anlagebetrag) stehen nur in der KI-Einschätzung und nennen ihre Annahmen.
4. **Keine Empfehlung:** Keine Formulierungen wie „kaufen“, „verkaufen“, „gutes/schlechtes Produkt“. Prüfung durch Ausgabefilter.
5. **Erkennungssicherheit ehrlich:** Herabstufen bei Scan/OCR, Handschrift, Höchstgrenzen statt Ist-Werten, Verweisen auf fehlende Seiten, Fachsprache mit Interpretationsspielraum.
6. **Einstufung erklärbar:** Jede Risiko-Einstufung nennt, worauf sie sich bezieht (z. B. „im Verhältnis zu Ihrer Verlusttragfähigkeit laut Protokoll“).

---

## 7. Offene Annahmen

Diese Punkte waren nicht vorgegeben; wir haben sie für Konzept und Prototyp angenommen.

**Produkt & Zielgruppe**
- A1 Markt: Deutschland, deutschsprachige Unterlagen, Fonds nach deutschem/EU-Recht (OGAW, Basisinformationsblatt nach PRIIP-Verordnung).
- A2 Zielgruppe nutzt das Angebot einmalig vor oder nach einem Bankgespräch; Nutzung überwiegend am Desktop, aber vollständig mobil bedienbar.
- A3 Arbeitstitel „Fondslupe“; Name, Domain und Marke sind ungeprüft.
- A4 Geschäftsmodell offen (z. B. Einzelanalyse gegen Gebühr, Abo, Angebot über Verbraucherorganisationen). Der Prototyp enthält keine Bezahlung.

**Technik**
- A5 Verarbeitung: PDF-Textextraktion, Texterkennung (OCR) für Scans/Fotos, anschließend ein großes Sprachmodell mit strukturierter Ausgabe (Befunde mit Pflichtfeld „Beleg“), ergänzt um regelbasierte Prüfungen (z. B. Kostenfelder im Basisinformationsblatt haben ein festes Format).
- A6 Jede Fundstelle wird mit Seite und Koordinaten gespeichert, damit die Originalseite markiert angezeigt werden kann.
- A7 Dauer einer Analyse 2–4 Minuten; daher asynchrone Verarbeitung mit E-Mail-Benachrichtigung.
- A8 Limits: PDF/JPG/PNG, 20 MB pro Datei, 10 Dateien pro Analyse; kennwortgeschützte PDFs werden abgelehnt mit Hinweis.
- A9 Konto per E-Mail-Link oder Passkey; Beispielbericht ohne Konto.

**Datenschutz & Sicherheit**
- A10 Hosting und KI-Verarbeitung in der EU; Auftragsverarbeitungsverträge mit allen Dienstleistern; kein Training mit Kundendaten.
- A11 Verschlüsselung bei Übertragung (TLS) und Speicherung; Dokumente nach 30 Tagen, Berichte nach 12 Monaten gelöscht; Sofortlöschung jederzeit.
- A12 Finanzunterlagen enthalten personenbezogene Daten und Angaben zur finanziellen Situation; Datenschutz-Folgenabschätzung wird durchgeführt.

**Recht**
- A13 Fondslupe erbringt keine Anlageberatung oder -vermittlung im Sinne von WpHG/KWG, solange keine individuellen Empfehlungen zu bestimmten Finanzinstrumenten gegeben werden. **Diese Einordnung muss juristisch geprüft werden** – insbesondere der Abgleich mit dem persönlichen Beratungsprotokoll.
- A14 Die Risiko-Einstufung „hoch/mittel/gering“ ist eine erklärende Einordnung, keine Bewertung des Produkts.

**Prototyp**
- A15 Alle Namen, Zahlen und Textstellen im Beispielbericht sind fiktiv und dienen nur der Veranschaulichung.
- A16 Upload und Analyse sind simuliert; es werden keine Dateien übertragen oder ausgewertet. „Speichern“ wirkt nur im aktuellen Browser-Tab.

---

## 8. Mögliche nächste Schritte

**Kurzfristig (Validierung)**
1. **Nutzertests** mit 5–8 Privatanlegern: Ist der Bericht verständlich? Werden Fakten und KI-Einschätzung auseinandergehalten? Werden die Fragen tatsächlich im Bankgespräch genutzt?
2. **Rechtliche Prüfung** der Abgrenzung zur Anlageberatung (A13), der Pflichthinweise und der Einwilligungstexte.
3. **Textprüfung** auf Verständlichkeit (z. B. Lesbarkeitsindex, Test mit Personen ohne Finanzwissen); Glossar ausbauen.

**Technischer Machbarkeitsnachweis**
4. **Testkorpus** aus 30–50 echten, öffentlich verfügbaren Basisinformationsblättern und Prospekten aufbauen; Beratungsprotokolle als anonymisierte Muster.
5. **Extraktionsgenauigkeit messen** je Feld (Kosten, SRI, Haltedauer, Rückgabe) und die Erkennungssicherheit daran kalibrieren.
6. **Belegpflicht technisch erzwingen:** Ausgabe ohne gültigen Beleg (Dokument, Seite, Zitat im Text auffindbar) wird verworfen.
7. **Quellenansicht** mit PDF-Darstellung und Markierung der Fundstelle umsetzen.

**Produkt**
8. Konto, „Meine Analysen“, Löschfunktion und Datenexport.
9. Echte PDF-Ausgabe des Berichts (statt Druckansicht) mit Quellenverzeichnis.
10. Nachreichen von Unterlagen mit inkrementeller Aktualisierung des Berichts.
11. Vergleich mehrerer Angebote (z. B. Bankempfehlung vs. kostengünstigere Alternative), weiterhin ohne Empfehlung.
12. Barrierefreiheit nach WCAG 2.2 AA prüfen lassen (Pflicht nach Barrierefreiheitsstärkungsgesetz für viele digitale Angebote).
