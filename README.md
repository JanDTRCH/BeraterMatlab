# Fondslupe – Fondsunterlagen verständlich analysiert

Konzept und erster Website-Prototyp für eine Plattform, die Fondsunterlagen und Bankempfehlungen für Privatanleger verständlich zusammenfasst: Kosten, Risiken, Laufzeit und Rückgabe, Abgleich mit der Bankempfehlung, fehlende Informationen und konkrete Fragen an die Bank – jede Aussage mit Quelle, Seitenzahl und Erkennungssicherheit.

> „Fondslupe“ ist ein Arbeitstitel. Alle Namen und Zahlen im Prototyp sind fiktiv.

## Inhalt

| Pfad | Inhalt |
|---|---|
| [`docs/konzept.md`](docs/konzept.md) | Produktbeschreibung, Sitemap, Nutzerführung, Beispieltexte, Leitplanken, offene Annahmen, nächste Schritte |
| [`prototype/`](prototype) | Klickbarer Website-Prototyp (HTML/CSS/JavaScript, ohne Abhängigkeiten) |

## Prototyp öffnen

Keine Installation nötig: `prototype/index.html` im Browser öffnen. Alternativ mit lokalem Server:

```bash
python3 -m http.server 8000 --directory prototype
```

Danach <http://localhost:8000> aufrufen.

**Empfohlener Rundgang:** Startseite → „Unterlagen hochladen“ → „Mit Beispielunterlagen ausprobieren“ → Einwilligung bestätigen → „Analyse starten“ → „Bericht ansehen“ → im Bericht auf eine Quelle (z. B. „Basisinformationsblatt, S. 2“) klicken.

## Deployment (z. B. Railway)

Das Repository enthält ein `Dockerfile`, das den Ordner `prototype/` mit dem Webserver [Caddy](https://caddyserver.com) ausliefert. Caddy lauscht auf der Umgebungsvariable `PORT`, die Railway automatisch setzt (lokal Standard: 8080). Konfiguration in `Caddyfile`, mit Sicherheits-Headern und `noindex`, weil der Prototyp fiktive Daten zeigt.

**Railway:** Neues Projekt → „Deploy from GitHub repo“ → dieses Repository wählen. Railway erkennt das `Dockerfile` selbst; es sind keine Variablen nötig. Danach unter *Settings → Networking* „Generate Domain“ klicken.

**Lokal testen:**

```bash
docker build -t fondslupe .
docker run --rm -p 8080:8080 fondslupe
```

## Seiten

- `index.html` – Startseite
- `upload.html` – Unterlagen hochladen (Dateistatus, Typerkennung, Checkliste, Fehlermeldungen)
- `analyse.html` – Verarbeitungsstatus (simuliert)
- `bericht.html` – Analysebericht mit acht Abschnitten, Quellenansicht, Export (Druck/PDF, Textdatei)
- `sicherheit.html` – Datenschutz und Grenzen der Analyse

Der Bericht wird aus `prototype/assets/beispielbericht.js` erzeugt; die Datei dokumentiert zugleich das geplante Datenmodell (Dokumente → Belege → Befunde → Fragen).

## Grenzen des Prototyps

Upload und Analyse sind simuliert – es werden keine Dateien übertragen oder ausgewertet, und es wird immer derselbe Beispielbericht angezeigt. Die Analyse bietet eine Orientierung und ersetzt keine individuelle Anlageberatung.
