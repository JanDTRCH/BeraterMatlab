"""Erzeugt FIKTIVE Testunterlagen für Fondslupe.

Alle Namen, Zahlen und Inhalte sind erfunden. Die Dateien dienen nur zum Testen
der Analyse (Textauslese, Bilderkennung, Belegprüfung).

    python3 server/test/fixtures/erzeuge_testunterlagen.py

Erzeugt im selben Ordner:
- KID_Testfonds.pdf             3 Seiten mit Textebene
- Kosteninformation_Test.pdf    2 Seiten mit Textebene
- Beratungsprotokoll_Scan.pdf   2 Seiten, nur Bild (wie ein Scan, keine Textebene)
- Beratungsprotokoll_Text.pdf   wie oben, aber mit Textebene (für die lokale KI)
- Kochrezept_Test.pdf           kein Fondsdokument (muss abgelehnt werden)
"""
import io
import os

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
pdfmetrics.registerFont(TTFont("DV", FONT))
pdfmetrics.registerFont(TTFont("DVB", FONT_BOLD))

W, H = A4
HINWEIS = "FIKTIVES TESTDOKUMENT – alle Angaben erfunden"


def write_pages(filename, pages):
    c = canvas.Canvas(os.path.join(HERE, filename), pagesize=A4)
    c.setTitle(filename)
    for nr, (title, lines) in enumerate(pages, 1):
        c.setFont("DV", 7)
        c.drawString(20 * mm, H - 12 * mm, HINWEIS)
        c.drawRightString(W - 20 * mm, 12 * mm, f"Seite {nr} von {len(pages)}")
        y = H - 25 * mm
        c.setFont("DVB", 13)
        c.drawString(20 * mm, y, title)
        y -= 10 * mm
        for line in lines:
            if line.startswith("## "):
                y -= 2 * mm
                c.setFont("DVB", 10.5)
                c.drawString(20 * mm, y, line[3:])
                y -= 6 * mm
                continue
            c.setFont("DV", 9.5)
            c.drawString(20 * mm, y, line)
            y -= 5 * mm
        c.showPage()
    c.save()


KID = [
    ("Basisinformationsblatt", [
        "Zweck: Dieses Informationsblatt stellt Ihnen wesentliche Informationen über dieses",
        "Anlageprodukt zur Verfügung. Es handelt sich nicht um Werbematerial.",
        "## Produkt",
        "Testfonds Weltaktien Dynamik A (ausschüttend)",
        "ISIN: XX0009876543 · Hersteller: Beispiel Fondsgesellschaft mbH (fiktiv)",
        "Stand: 01.03.2026",
        "## Um welche Art von Produkt handelt es sich?",
        "Art: Investmentfonds (OGAW) in Form eines Sondervermögens. Laufzeit: Der Fonds hat",
        "keine feste Laufzeit. Ziele: Der Fonds strebt einen langfristigen Kapitalzuwachs an.",
        "Er investiert weltweit überwiegend in Aktien, zu einem großen Teil von Unternehmen",
        "aus Schwellenländern, die nicht in Euro notiert sind. Währungsrisiken werden nicht",
        "abgesichert. Die Erträge werden jährlich ausgeschüttet.",
        "Kleinanleger-Zielgruppe: Anleger mit Grundkenntnissen, die Verluste tragen können",
        "und einen Anlagehorizont von mindestens 6 Jahren haben.",
        "## Welche Risiken bestehen und was könnte ich im Gegenzug dafür bekommen?",
        "Risikoindikator: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die",
        "Risikoklasse 5 eingestuft, wobei 5 einer mittelhohen Risikoklasse entspricht.",
        "Empfohlene Haltedauer: 6 Jahre.",
        "Dieses Produkt beinhaltet keinen Schutz vor künftiger Marktentwicklung, so dass Sie",
        "Ihre Anlage ganz oder teilweise verlieren könnten.",
    ]),
    ("Basisinformationsblatt – Szenarien und Kosten", [
        "## Performance-Szenarien (Anlage 10.000 EUR)",
        "Stressszenario: Was Sie am Ende nach Abzug der Kosten herausbekommen könnten:",
        "3.580 EUR nach 1 Jahr; Jährliche Durchschnittsrendite: -64,2 %",
        "Pessimistisches Szenario: 7.210 EUR nach 1 Jahr; 6.980 EUR nach 6 Jahren",
        "Mittleres Szenario: 10.460 EUR nach 1 Jahr; 13.900 EUR nach 6 Jahren",
        "Optimistisches Szenario: 14.800 EUR nach 1 Jahr; 21.300 EUR nach 6 Jahren",
        "## Welche Kosten entstehen?",
        "Kosten im Zeitverlauf (Anlage 10.000 EUR):",
        "Kosten insgesamt: 812 EUR bei Ausstieg nach 1 Jahr; 2.140 EUR bei Ausstieg nach 6 Jahren",
        "Jährliche Auswirkung der Kosten: 8,1 % nach 1 Jahr; 3,4 % pro Jahr nach 6 Jahren",
        "## Zusammensetzung der Kosten",
        "Einstiegskosten: 5,50 % des Betrags, den Sie beim Einstieg zahlen (Ausgabeaufschlag).",
        "Ausstiegskosten: Wir berechnen keine Ausstiegsgebühr.",
        "Verwaltungsgebühren und sonstige Verwaltungs- oder Betriebskosten: 2,05 % des Werts",
        "Ihrer Anlage pro Jahr.",
        "Transaktionskosten: 0,35 % des Werts Ihrer Anlage pro Jahr.",
        "Erfolgsgebühren: Für dieses Produkt wird keine Erfolgsgebühr berechnet.",
    ]),
    ("Basisinformationsblatt – Rückgabe", [
        "## Wie lange sollte ich die Anlage halten, und kann ich vorzeitig Geld entnehmen?",
        "Empfohlene Haltedauer: 6 Jahre. Sie können Ihre Anteile grundsätzlich an jedem",
        "Bewertungstag zurückgeben. Die Gesellschaft kann die Rücknahme aussetzen, wenn",
        "außergewöhnliche Umstände vorliegen.",
        "## Sonstige zweckdienliche Angaben",
        "Der Verkaufsprospekt, die Anlagebedingungen sowie die Jahres- und Halbjahresberichte",
        "sind kostenlos bei der Gesellschaft erhältlich.",
        "Nachhaltigkeit: Der Fonds bewirbt keine ökologischen oder sozialen Merkmale",
        "(Artikel 6 der Offenlegungsverordnung).",
    ]),
]

KOSTEN = [
    ("Ex-ante-Kosteninformation – Testbank (fiktiv)", [
        "Kunde: Max Mustermann (fiktiv) · Datum: 12.11.2026",
        "Wertpapier: Testfonds Weltaktien Dynamik A · Anlagebetrag: 20.000,00 EUR",
        "## Dienstleistungskosten",
        "Einmalige Dienstleistungskosten (Ausgabeaufschlag): 4,00 % (800,00 EUR)",
        "Laufende Dienstleistungskosten (Depotentgelt): 0,25 % p. a. (50,00 EUR)",
        "## Produktkosten",
        "Laufende Kosten des Finanzinstruments: 1,85 % p. a. (370,00 EUR)",
        "Transaktionskosten des Finanzinstruments: 0,35 % p. a. (70,00 EUR)",
        "## Gesamtkosten im ersten Jahr",
        "Summe: 6,45 % (1.290,00 EUR)",
    ]),
    ("Ex-ante-Kosteninformation – Zuwendungen", [
        "## Zuwendungen",
        "Die Bank erhält von der Fondsgesellschaft eine laufende Vertriebsvergütung von",
        "bis zu 1,00 % p. a. des Bestands. Diese ist in den laufenden Produktkosten enthalten.",
        "## Auswirkung auf die Rendite",
        "Die Kosten mindern die Rendite im ersten Jahr um 6,45 %, in den Folgejahren",
        "um ca. 2,45 % pro Jahr.",
    ]),
]

PROTOKOLL = [
    ["Geeignetheitserklärung / Beratungsprotokoll",
     "Testbank (fiktiv) – Kunde: Max Mustermann (fiktiv)",
     "Datum der Beratung: 12.11.2026",
     "",
     "Anlageziel: Vermögensaufbau",
     "Anlagehorizont: kurzfristig (bis 3 Jahre)",
     "Risikobereitschaft: Risikoklasse 2 von 5 (konservativ)",
     "Verlusttragfähigkeit: Verluste bis 10 % des Anlagebetrags tragbar",
     "Kenntnisse Investmentfonds: vorhanden",
     "Nachhaltigkeitspräferenzen: keine"],
    ["Empfehlung",
     "Wir empfehlen Ihnen: Testfonds Weltaktien Dynamik A",
     "Anlagebetrag: 20.000 EUR",
     "",
     "Begründung: Der Fonds entspricht Ihren Anlagezielen",
     "und Ihrer Risikobereitschaft.",
     "",
     "Ort, Datum, Unterschrift Berater/in:",
     "",
     "________________________________"],
]


def write_scan(filename, pages):
    font = ImageFont.truetype(FONT, 34)
    bold = ImageFont.truetype(FONT_BOLD, 40)
    small = ImageFont.truetype(FONT, 22)
    c = canvas.Canvas(os.path.join(HERE, filename), pagesize=A4)
    for lines in pages:
        img = Image.new("L", (1240, 1754), 250)
        d = ImageDraw.Draw(img)
        d.text((90, 50), HINWEIS, font=small, fill=60)
        y = 150
        for i, line in enumerate(lines):
            d.text((100, y), line, font=bold if i == 0 else font, fill=25)
            y += 70 if i == 0 else 58
        img = img.rotate(0.6, fillcolor=250)  # leicht schief wie ein echter Scan
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=70)
        buf.seek(0)
        c.drawImage(ImageReader(buf), 0, 0, width=W, height=H)
        c.showPage()
    c.save()


if __name__ == "__main__":
    write_pages("KID_Testfonds.pdf", KID)
    write_pages("Kosteninformation_Test.pdf", KOSTEN)
    write_scan("Beratungsprotokoll_Scan.pdf", PROTOKOLL)
    # Gleicher Inhalt mit Textebene – für die lokale KI, die keine Scans lesen kann
    write_pages("Beratungsprotokoll_Text.pdf", [(p[0], [l for l in p[1:] if l]) for p in PROTOKOLL])
    # Kein Fondsdokument – muss vom Server abgelehnt werden
    write_pages("Kochrezept_Test.pdf", [("Apfelkuchen nach Omas Art", [
        "Zutaten: 500 g Mehl, 250 g Butter, 200 g Zucker, 3 Eier, 1 kg Äpfel.",
        "Den Teig kneten und eine Stunde kühlen. Die Äpfel schälen und in Spalten schneiden.",
        "Bei 180 Grad etwa 45 Minuten backen. Mit Puderzucker bestreuen und servieren.",
    ])])
    print("Testunterlagen erzeugt in", HERE)
