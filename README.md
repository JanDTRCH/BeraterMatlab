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
- Modell: `claude-opus-5-5` mit adaptivem Denken, Effort `high`, serverseitigem Fallback bei Ablehnung.
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

**Variablen** (Railway → Service → *Variables*):

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `ANTHROPIC_API_KEY` | ja | API-Schlüssel aus der Claude Console |
| `ZUGANGSCODE` | dringend empfohlen | Ohne Code kann jede Person mit dem Link Analysen auf Ihre Kosten starten |
| `PORT` | – | setzt Railway selbst (Domain auf diesen Port zeigen lassen, z. B. 8080) |
| `ANALYSEN_PRO_TAG` | – | Obergrenze für alle Nutzer zusammen (Standard 50) |
| `ANALYSEN_PRO_IP_PRO_TAG` | – | Obergrenze je IP-Adresse (Standard 5) |
| `MAX_PARALLEL` | – | gleichzeitig laufende Analysen (Standard 2) |
| `MAX_UPLOAD_MB` | – | Gesamtgröße pro Analyse (Standard 25) |
| `MAX_SEITEN` | – | Seiten pro Analyse (Standard 500) |
| `BERICHT_TTL_STUNDEN` | – | Aufbewahrung der Berichte (Standard 24) |
| `CLAUDE_MODEL`, `CLAUDE_EFFORT` | – | Modell und Effort (Standard `claude-opus-5-5`, `high`) |

**Kosten:** Abgerechnet wird pro Token (Claude Opus 5.5: 4 $ je Mio. Eingabe-, 20 $ je Mio. Ausgabe-Token). Den größten Teil macht der ausführliche Bericht samt Denkprozess aus. Grobe, noch nicht gemessene Schätzung pro Analyse: wenige Seiten (KID + Kosteninformation) etwa 0,30–0,80 €, mit vollständigem Verkaufsprospekt (100+ Seiten) etwa 1–2 €. Setzen Sie in der Claude Console ein Ausgabenlimit; die Server-Logs zeigen die verbrauchten Token je Analyse.

## Grenzen der Testversion

- Berichte liegen nur im Arbeitsspeicher – nach einem Neustart oder Deployment sind sie weg.
- Kein Konto, keine dauerhafte Speicherung, keine E-Mail-Benachrichtigung.
- Vor einem Einsatz mit echten Kundendaten fehlen u. a. Datenschutzerklärung, Auftragsverarbeitungsvertrag, Impressum und eine rechtliche Prüfung der Abgrenzung zur Anlageberatung (siehe Konzept, Annahme A13).
