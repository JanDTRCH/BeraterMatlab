# Fondslupe – Fondsunterlagen verständlich analysiert

Plattform, die Fondsunterlagen und Bankempfehlungen für Privatanleger verständlich zusammenfasst: Kosten, Risiken, Laufzeit und Rückgabe, Abgleich mit der Bankempfehlung, unklare Vertragsstellen, fehlende Informationen und konkrete Fragen an die Bank – jede Aussage mit Quelle, Seitenzahl und Erkennungssicherheit.

> „Fondslupe“ ist ein Arbeitstitel. Testversion – die Analyse bietet eine Orientierung und ersetzt keine Anlageberatung.

## Inhalt

| Pfad | Inhalt |
|---|---|
| [`docs/konzept.md`](docs/konzept.md) | Produktbeschreibung, Sitemap, Nutzerführung, Beispieltexte, Leitplanken, Annahmen, nächste Schritte |
| [`prototype/`](prototype) | Website (HTML/CSS/JavaScript, ohne Build-Schritt) |
| [`server/`](server) | Node-Server: Upload, PDF-Textauslese, Analyse mit Claude, Belegprüfung |

## So funktioniert die Analyse

```
Upload (PDF/JPG/PNG)
  → 1. Dateien prüfen        Dateityp am Inhalt erkennen, Größe, Kennwortschutz
  → 2. Text auslesen         seitenweise mit PDF.js (unpdf); Seiten ohne Textebene = Scan
  → 3. Auswertung (Claude)   ein Aufruf, strukturierte Ausgabe (JSON-Schema), jede Aussage mit Zitat + Seite
  → 4. Belegprüfung          jedes Zitat wird auf der angegebenen Seite gesucht;
                              nicht auffindbar → verworfen; Nachbarseite → Seitenzahl korrigiert;
                              Scan-Seite → behalten, aber als „nicht maschinell geprüft“ markiert
  → 5. Bericht               Darstellung in bericht.html, 24 Stunden abrufbar
```

- **Kein Agent**, sondern eine feste Abfolge: Auslesen und Prüfen übernimmt normaler Code, das Verstehen und Erklären Claude.
- Textseiten werden Claude als Text mit Seitenmarkierungen übergeben, Scans und Fotos zusätzlich als PDF bzw. Bild (Claude liest sie per Bilderkennung).
- Modell: standardmäßig **`claude-haiku-5-5`** (Cent-Beträge pro Analyse) mit adaptivem Denken und Effort `high`; per `CLAUDE_MODEL` auf `claude-sonnet-5-5` oder `claude-opus-5-5` umstellbar (dann mit serverseitigem Fallback bei Ablehnung).
- **Datenschutz:** Dateien werden nicht auf Festplatte gespeichert, sondern nur im Arbeitsspeicher verarbeitet und nach der Analyse verworfen. Berichte werden nach 24 Stunden gelöscht (oder sofort per Button). Ein Neustart des Servers löscht alle Berichte. Der Inhalt der Unterlagen wird zur Auswertung an Anthropic übermittelt.

Code: [`server/src/claude.js`](server/src/claude.js) (Anweisungen und Aufruf), [`server/src/schema.js`](server/src/schema.js) (Ausgabeformat), [`server/src/verify.js`](server/src/verify.js) (Belegprüfung), [`server/src/jobs.js`](server/src/jobs.js) (Ablauf), [`server/src/server.js`](server/src/server.js) (API, Website, Missbrauchsschutz).

## Lokal starten

```bash
cd server
npm install
ANTHROPIC_API_KEY=… ZUGANGSCODE=test npm start
```

Danach <http://localhost:8080> öffnen. Ohne `ANTHROPIC_API_KEY` läuft die Website trotzdem; die Upload-Seite weist dann darauf hin, dass nur die Beispielanalyse verfügbar ist.

Fiktive Testunterlagen (Basisinformationsblatt, Kosteninformation, gescanntes Beratungsprotokoll) liegen in [`server/test/fixtures/`](server/test/fixtures) und lassen sich mit `python3 server/test/fixtures/erzeuge_testunterlagen.py` neu erzeugen.

**Tests:** `cd server && npm test` (Belegprüfung, PDF-Auslese, API inkl. Fehlerfällen; ohne gültigen API-Schlüssel).

## Deployment auf Railway

Das `Dockerfile` baut den Node-Server; Railway erkennt es automatisch.

### Schritt für Schritt

1. **Eigenen API-Schlüssel nur für dieses Projekt anlegen** – in der [Claude Console](https://platform.claude.com) am besten in einem eigenen Workspace, damit Kosten getrennt sichtbar sind.
2. **Ausgabengrenze setzen** – in der Console für diesen Workspace ein monatliches Limit, z. B. 10 USD. Das ist die harte Grenze, die auch bei einem Fehler im Server greift.
3. **Variablen in Railway setzen** (Service → *Variables*): `ANTHROPIC_API_KEY`, `ZUGANGSCODE` und für die Testphase z. B. `TAGESBUDGET_USD=1`.
4. **Deployen** und die Startmeldung im Railway-Log prüfen: Sie zeigt Modell, Zugangscode, Turnstile und Tagesbudget.
5. **Mit den fiktiven Test-PDFs testen** (`server/test/fixtures/`) und im Log die Kosten je Analyse ablesen.
6. **Optional: Cloudflare Turnstile** einrichten (kostenlos): im Cloudflare-Dashboard ein Turnstile-Widget für die Railway-Domain anlegen und `TURNSTILE_SITE_KEY` und `TURNSTILE_SECRET_KEY` setzen. Sinnvoll, sobald die Seite ohne Zugangscode öffentlich werden soll.
7. **Nach einer Woche** Kosten und Logs ansehen und die Grenzen anpassen.

### Schutz vor Missbrauch und Kosten

Jede Schicht greift, bevor die nächste etwas kostet:

| Schicht | Wirkung | Einstellung |
|---|---|---|
| Zugangscode | Nur Personen mit Code können Analysen starten; nach 5 Fehlversuchen 15 Min. Sperre je IP | `ZUGANGSCODE` |
| Honeypot-Feld | Unsichtbares Formularfeld, das nur Bots ausfüllen | immer aktiv |
| Cloudflare Turnstile | Bot-Prüfung, meist ohne Rätsel | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (optional) |
| Dateiprüfung | Nur echte PDF/JPG/PNG, max. 20 MB je Datei, 25 MB gesamt, 10 Dateien, 200 Seiten | `MAX_UPLOAD_MB`, `MAX_SEITEN` |
| Inhaltsprüfung | Unterlagen ohne Bezug zu Geldanlage werden vor dem KI-Aufruf abgelehnt (kostenlos) | immer aktiv |
| Größenbremse | Max. ca. 150.000 Eingabe- und 48.000 Ausgabe-Tokens je Analyse | `MAX_EINGABE_TOKENS`, `MAX_AUSGABE_TOKENS` |
| Grenzen je IP | Standard 2 Analysen pro Stunde, 5 pro Tag | `ANALYSEN_PRO_IP_PRO_STUNDE`, `ANALYSEN_PRO_IP_PRO_TAG` |
| Grenzen gesamt | Standard 50 Analysen pro Tag, 2 gleichzeitig | `ANALYSEN_PRO_TAG`, `MAX_PARALLEL` |
| Tagesbudget | Server zählt die Kosten mit und nimmt nach Erreichen keine Analysen mehr an (Standard 3 USD/Tag) | `TAGESBUDGET_USD` |
| Ausgabengrenze in der Claude Console | Harte Obergrenze beim Anbieter | in der Console |

Die Zähler liegen im Arbeitsspeicher und werden bei einem Neustart zurückgesetzt – deshalb ist die Ausgabengrenze in der Console die letzte, verlässliche Sicherung.

### Weitere Variablen

| Variable | Bedeutung |
|---|---|
| `PORT` | setzt Railway selbst (Domain auf diesen Port zeigen lassen, z. B. 8080) |
| `BERICHT_TTL_STUNDEN` | Aufbewahrung der Berichte (Standard 24) |
| `CLAUDE_MODEL`, `CLAUDE_EFFORT` | Modell und Effort (Standard `claude-haiku-5-5`, `high`) |

### Kosten

Abgerechnet wird pro Token. Claude Haiku 5.5: 0,10 $ je Mio. Eingabe- und 0,50 $ je Mio. Ausgabe-Tokens; liegt die Eingabe über 100.000 Tokens, gilt der höhere Tarif von 0,50 $ / 2,50 $. Grobe Schätzung: **etwa 1–3 Cent** für Basisinformationsblatt, Kostenübersicht und Beratungsprotokoll; mit großem Verkaufsprospekt bis etwa 15 Cent. Durch die Größenbremsen höchstens etwa 0,20 $ pro Analyse. Die tatsächlichen Kosten stehen je Analyse im Server-Log.

## Grenzen der Testversion

- Berichte liegen nur im Arbeitsspeicher – nach einem Neustart oder Deployment sind sie weg.
- Kein Konto, keine dauerhafte Speicherung, keine E-Mail-Benachrichtigung.
- Vor einem Einsatz mit echten Kundendaten fehlen u. a. Datenschutzerklärung, Auftragsverarbeitungsvertrag, Impressum und eine rechtliche Prüfung der Abgrenzung zur Anlageberatung (siehe Konzept, Annahme A13).
