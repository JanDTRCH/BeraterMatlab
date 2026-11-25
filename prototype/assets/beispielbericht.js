/* Beispielbericht – FIKTIVE Daten zur Veranschaulichung.
   Fonds, Gesellschaft, Bank und alle Werte sind erfunden.

   Datenmodell (vereinfacht):
   - dokumente: erkannte Unterlagen mit Typ, Seitenzahl, Stand
   - belege:    Textstellen {dok, seite, zitat, kontextVor, kontextNach, sicherheit}
   - befunde:   {titel, stufe, klartext, belege[], ki, sicherheit, sicherheitGrund, fragen[]}
                "belege" = Information aus den Dokumenten (wörtlich)
                "ki"     = Einschätzung der KI (klar getrennt)
*/
window.BERICHT = {
  id: 'BSP-2026-11-0042',
  erstellt: '25.11.2026, 14:32 Uhr',
  fonds: 'Musterfonds Global Wachstum (fiktiv)',
  anteilklasse: 'Anteilklasse R (ausschüttend)',
  bank: 'Musterbank (fiktiv)',

  dokumente: {
    D1: { name: 'Basisinformationsblatt (KID)', datei: 'KID_Musterfonds_Global_Wachstum.pdf', seiten: 3, stand: '15.02.2026', sicherheit: 'hoch' },
    D2: { name: 'Verkaufsprospekt mit Anlagebedingungen', datei: 'Verkaufsprospekt_Musterfonds.pdf', seiten: 60, seitenErwartet: 112, stand: '01.01.2026', sicherheit: 'hoch' },
    D3: { name: 'Kostenübersicht (Ex-ante-Kosteninformation)', datei: 'Kosteninformation_Musterbank.pdf', seiten: 2, stand: '03.11.2026', sicherheit: 'hoch' },
    D4: { name: 'Beratungsprotokoll / Geeignetheitserklärung', datei: 'Geeignetheitserklaerung_Scan.pdf', seiten: 4, stand: '03.11.2026', sicherheit: 'mittel', hinweis: 'Scan – Text per Texterkennung gelesen' },
    D5: { name: 'Schriftliche Bankempfehlung', datei: 'Anschreiben_Empfehlung.pdf', seiten: 1, stand: '04.11.2026', sicherheit: 'hoch' }
  },

  zusammenfassung: {
    kurz: [
      'Es handelt sich um einen <strong>Aktienfonds</strong>, der weltweit in Unternehmen anlegt, überwiegend in den USA. Der Wert Ihrer Anlage kann deutlich schwanken.',
      'Der Fonds hat <strong>keine feste Laufzeit</strong>. Die Fondsgesellschaft empfiehlt, mindestens <strong>7 Jahre</strong> investiert zu bleiben.',
      'Beim Kauf fällt ein <strong>Ausgabeaufschlag</strong> an (laut Bank 3 %), dazu kommen jedes Jahr <strong>laufende Kosten</strong> von rund 1,7 – 1,9 %. Die beiden Unterlagen nennen hier unterschiedliche Werte.',
      'Im Abgleich mit Ihrem Beratungsprotokoll fallen <strong>drei Abweichungen</strong> auf: Anlagedauer, Verlusttragfähigkeit und Nachhaltigkeitswunsch.',
      'Einige Unterlagen sind <strong>unvollständig</strong> (Verkaufsprospekt nur bis Seite 60, kein Jahresbericht).'
    ],
    kiHinweis: 'Diese Zusammenfassung wurde von der KI aus den unten belegten Textstellen erstellt. Sie enthält keine Kauf- oder Verkaufsempfehlung.',
    fakten: [
      { label: 'Fondsname', wert: 'Musterfonds Global Wachstum R', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'ISIN (Wertpapierkennung)', wert: 'XX0001234567 (fiktiv)', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Fondsart', wert: 'Aktienfonds, global (OGAW)', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Fondsgesellschaft', wert: 'Beispiel Invest GmbH (fiktiv)', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Fondswährung', wert: 'Euro (Anlagen überwiegend in US-Dollar)', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Risikoklasse (SRI)', wert: '4 von 7', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Empfohlene Haltedauer', wert: '7 Jahre', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Laufzeit', wert: 'Unbefristet', beleg: { dok: 'D2', seite: 6 }, sicherheit: 'hoch' },
      { label: 'Empfohlener Anlagebetrag', wert: '25.000 €', beleg: { dok: 'D5', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Ertragsverwendung', wert: 'Ausschüttend (jährlich)', beleg: { dok: 'D2', seite: 9 }, sicherheit: 'mittel' },
      { label: 'Nachhaltigkeitseinstufung', wert: 'Artikel 6 Offenlegungsverordnung (keine Nachhaltigkeitsziele)', beleg: { dok: 'D2', seite: 18 }, sicherheit: 'hoch' },
      { label: 'Aktuelle Zusammensetzung (Top-Positionen)', wert: 'Nicht in den Unterlagen', fehlt: true }
    ]
  },

  kosten: {
    einleitung: 'Kosten mindern Ihren Ertrag – unabhängig davon, wie sich der Fonds entwickelt. Wir zeigen die Kosten so, wie sie in den Unterlagen stehen, und erklären jeden Begriff.',
    tabelle: [
      { art: 'Ausgabeaufschlag', erklaerung: 'Einmalige Gebühr beim Kauf. Sie wird vom Anlagebetrag abgezogen, bevor er investiert wird.',
        werte: [ { text: 'bis zu 5,00 %', beleg: { dok: 'D1', seite: 2 } }, { text: '3,00 % (750 €)', beleg: { dok: 'D3', seite: 1 } } ], status: 'info', sicherheit: 'hoch',
        notiz: 'Die Bank nennt einen niedrigeren Wert als den Höchstwert. Das ist üblich (Rabatt), sollte aber schriftlich bestätigt sein.' },
      { art: 'Laufende Kosten', erklaerung: 'Jährliche Kosten für Verwaltung und Betrieb des Fonds. Sie werden direkt aus dem Fondsvermögen entnommen – Sie sehen sie nicht als eigene Abbuchung.',
        werte: [ { text: '1,85 % pro Jahr', beleg: { dok: 'D1', seite: 2 } }, { text: '1,65 % pro Jahr', beleg: { dok: 'D3', seite: 1 } } ], status: 'unklar', sicherheit: 'hoch',
        notiz: 'Die beiden Unterlagen nennen unterschiedliche Werte. Siehe Befund unten.' },
      { art: 'Transaktionskosten', erklaerung: 'Kosten, die entstehen, wenn der Fonds selbst Wertpapiere kauft und verkauft.',
        werte: [ { text: '0,22 % pro Jahr', beleg: { dok: 'D1', seite: 2 } } ], status: 'info', sicherheit: 'hoch' },
      { art: 'Erfolgsabhängige Gebühr', erklaerung: 'Zusätzliche Gebühr, wenn der Fonds besser abschneidet als ein Vergleichsmaßstab. In guten Jahren steigen dadurch die Kosten.',
        werte: [ { text: '15 % der Mehrrendite gegenüber Vergleichsindex; Ø 0,31 % pro Jahr (letzte 5 Jahre)', beleg: { dok: 'D1', seite: 2 } } ], status: 'unklar', sicherheit: 'mittel',
        notiz: 'Ob eine „High-Water-Mark“ gilt, geht aus den vorliegenden Seiten nicht hervor.' },
      { art: 'Rücknahmeabschlag', erklaerung: 'Gebühr beim Verkauf der Fondsanteile.',
        werte: [ { text: 'Keiner (0 %)', beleg: { dok: 'D1', seite: 2 } } ], status: 'niedrig', sicherheit: 'hoch' },
      { art: 'Zuwendungen an die Bank', erklaerung: 'Teil der laufenden Kosten, den die Fondsgesellschaft an die Bank zahlt (auch „Bestandsprovision“). Er ist in den laufenden Kosten enthalten, also keine zusätzliche Gebühr – kann aber einen Interessenkonflikt bedeuten.',
        werte: [ { text: 'bis zu 0,90 % pro Jahr', beleg: { dok: 'D3', seite: 2 } } ], status: 'info', sicherheit: 'hoch' },
      { art: 'Depotgebühren der Bank', erklaerung: 'Kosten für die Verwahrung der Fondsanteile in Ihrem Depot.',
        werte: [ { text: 'Keine Angabe gefunden', fehlt: true } ], status: 'fehlt', sicherheit: null }
    ],
    beispiel: {
      titel: 'Kostenbeispiel aus dem Basisinformationsblatt',
      text: 'Das Basisinformationsblatt rechnet mit einer Anlage von 10.000 €. Diese Zahlen stammen direkt aus dem Dokument:',
      werte: [
        { betrag: '741 €', label: 'Gesamtkosten bei Ausstieg nach 1 Jahr (7,4 % Auswirkung)', beleg: { dok: 'D1', seite: 2 } },
        { betrag: '2.276 €', label: 'Gesamtkosten bei Ausstieg nach 7 Jahren (3,1 % pro Jahr)', beleg: { dok: 'D1', seite: 2 } }
      ],
      ki: 'Auf Ihren empfohlenen Betrag von 25.000 € übertragen entspräche das ungefähr 1.850 € nach einem Jahr. Diese Hochrechnung ist eine vereinfachte KI-Berechnung (lineare Übertragung, ohne Rabatt beim Ausgabeaufschlag). Sie ersetzt nicht die verbindliche Kostenaufstellung der Bank.'
    },
    befunde: [
      {
        id: 'k1', titel: 'Laufende Kosten: zwei unterschiedliche Angaben', stufe: 'unklar',
        klartext: 'Das Basisinformationsblatt der Fondsgesellschaft nennt 1,85 % laufende Kosten pro Jahr, die Kostenübersicht der Bank 1,65 %. Bei 25.000 € entspricht der Unterschied etwa 50 € pro Jahr.',
        belege: ['b-kid-kosten', 'b-kost-lfd'],
        ki: [
          'Eine mögliche Erklärung: Die Unterlagen haben einen unterschiedlichen Stand (Februar bzw. November 2026), oder die Bank rechnet die Transaktionskosten getrennt.',
          'Aus den Unterlagen lässt sich nicht sicher sagen, welcher Wert für Sie gilt. Wir haben deshalb keinen der beiden Werte als „richtig“ übernommen.'
        ],
        sicherheit: 'hoch', sicherheitGrund: 'Beide Werte sind klar lesbar. Unsicher ist nur die Ursache der Abweichung.',
        fragen: ['q1']
      },
      {
        id: 'k2', titel: 'Erfolgsabhängige Gebühr: Berechnung nicht vollständig beschrieben', stufe: 'unklar',
        klartext: 'Die Gebühr fällt an, wenn der Fonds besser läuft als sein Vergleichsindex. Nicht ersichtlich ist, ob frühere Verluste erst aufgeholt werden müssen, bevor die Gebühr erneut anfällt (sogenannte „High-Water-Mark“).',
        belege: ['b-kid-perf', 'b-vp-perf'],
        ki: [
          'Ohne High-Water-Mark kann die Gebühr auch dann anfallen, wenn der Fonds insgesamt noch unter seinem früheren Höchststand liegt.',
          'Der Prospekt verweist für Details auf Seite 87 – diese Seite fehlt in der hochgeladenen Datei.'
        ],
        sicherheit: 'mittel', sicherheitGrund: 'Die Textstelle verweist auf eine fehlende Seite.',
        fragen: ['q4']
      }
    ]
  },

  risiken: {
    einleitung: 'Hier sehen Sie, welche Risiken die Unterlagen nennen. Die Einstufung „hoch / mittel / gering“ ist eine Einschätzung der KI für dieses Angebot – sie beruht auf den genannten Textstellen.',
    sri: { wert: 4, beleg: { dok: 'D1', seite: 1 } },
    befunde: [
      {
        id: 'r1', titel: 'Verlustrisiko', stufe: 'hoch',
        klartext: 'Sie können einen Teil oder im Extremfall einen großen Teil Ihres Geldes verlieren. Es gibt keine Garantie und keinen Kapitalschutz.',
        belege: ['b-kid-sri', 'b-kid-stress'],
        ki: [
          'Im Stressszenario des Basisinformationsblatts würden aus 10.000 € nach einem Jahr 4.120 € (−58,8 %). Ihr Beratungsprotokoll nennt eine Verlusttragfähigkeit von höchstens 20 %.',
          'Die Einstufung „hoch“ bezieht sich auf diese mögliche Verlusthöhe im Verhältnis zu Ihren Angaben – nicht auf den Fonds allgemein.'
        ],
        sicherheit: 'hoch', sicherheitGrund: 'Zahlen stehen eindeutig in der Szenario-Tabelle.',
        fragen: ['q6']
      },
      {
        id: 'r2', titel: 'Wertschwankungen', stufe: 'mittel',
        klartext: 'Der Anteilspreis kann innerhalb kurzer Zeit stark steigen und fallen. Wer in einer schwachen Phase verkaufen muss, realisiert unter Umständen Verluste.',
        belege: ['b-kid-sri', 'b-vp-markt'],
        ki: ['Risikoklasse 4 von 7 bedeutet laut Basisinformationsblatt ein „mittleres“ Risiko. Für einen reinen Aktienfonds ist das eine übliche Einstufung.'],
        sicherheit: 'hoch', sicherheitGrund: 'Standardangabe im Basisinformationsblatt.',
        fragen: []
      },
      {
        id: 'r3', titel: 'Währungsrisiko', stufe: 'mittel',
        klartext: 'Der Fonds legt überwiegend in US-Dollar an. Fällt der Dollar gegenüber dem Euro, sinkt der Wert Ihrer Anlage in Euro – auch wenn die Aktien selbst nicht fallen.',
        belege: ['b-kid-usd', 'b-vp-waehrung'],
        ki: ['Laut Prospekt wird das Währungsrisiko nicht systematisch abgesichert. Wie hoch der Dollar-Anteil aktuell ist, steht nicht in den Unterlagen.'],
        sicherheit: 'hoch', sicherheitGrund: 'Eindeutige Formulierung im Prospekt.',
        fragen: ['q12']
      },
      {
        id: 'r4', titel: 'Konzentrationsrisiko', stufe: 'unklar',
        klartext: 'Wenn ein Fonds viel Geld in wenige Unternehmen oder eine Branche steckt, wirken sich Probleme dort stärker aus.',
        belege: ['b-vp-grenzen'],
        ki: ['Der Prospekt nennt nur die gesetzlichen Höchstgrenzen. Wie konzentriert der Fonds tatsächlich investiert ist, lässt sich ohne Factsheet oder Jahresbericht nicht beurteilen. Wir stufen das Risiko daher nicht ein.'],
        sicherheit: 'niedrig', sicherheitGrund: 'Für eine Einschätzung fehlen Daten zur tatsächlichen Zusammensetzung.',
        fragen: ['q10']
      },
      {
        id: 'r5', titel: 'Liquiditätsrisiko', stufe: 'niedrig',
        klartext: 'Gemeint ist, ob der Fonds seine Anlagen schnell verkaufen kann, um Anteile zurückzunehmen. Der Fonds investiert überwiegend in börsengehandelte Aktien.',
        belege: ['b-vp-liquid'],
        ki: ['Bis zu 10 % dürfen in schwerer handelbare Wertpapiere fließen. Bei üblichen Marktbedingungen ist das Risiko daher gering; in Krisen kann es steigen (siehe Rückgabe).'],
        sicherheit: 'mittel', sicherheitGrund: 'Angabe ist eine Höchstgrenze, nicht der tatsächliche Anteil.',
        fragen: []
      },
      {
        id: 'r6', titel: 'Einsatz von Derivaten', stufe: 'mittel',
        klartext: 'Derivate sind Finanzinstrumente, deren Wert von anderen Werten abhängt. Sie können zur Absicherung dienen, aber auch Gewinne und Verluste verstärken.',
        belege: ['b-vp-derivate'],
        ki: ['Der Prospekt erlaubt Derivate ausdrücklich auch „zu Investitionszwecken“ und ein Marktrisiko bis zum Doppelten eines vergleichbaren Fonds ohne Derivate. Wie stark der Fonds das tatsächlich nutzt, steht nicht in den Unterlagen.'],
        sicherheit: 'mittel', sicherheitGrund: 'Rechtlicher Rahmen ist klar, die tatsächliche Nutzung nicht.',
        fragen: []
      }
    ]
  },

  laufzeit: {
    fakten: [
      { label: 'Laufzeit des Fonds', wert: 'Unbefristet', beleg: { dok: 'D2', seite: 6 }, sicherheit: 'hoch' },
      { label: 'Empfohlene Haltedauer', wert: '7 Jahre', beleg: { dok: 'D1', seite: 1 }, sicherheit: 'hoch' },
      { label: 'Rückgabe möglich', wert: 'An jedem Bewertungstag', beleg: { dok: 'D1', seite: 2 }, sicherheit: 'hoch' },
      { label: 'Kosten bei Rückgabe', wert: 'Kein Rücknahmeabschlag', beleg: { dok: 'D1', seite: 2 }, sicherheit: 'hoch' },
      { label: 'Mindestanlagedauer', wert: 'Keine', beleg: { dok: 'D1', seite: 2 }, sicherheit: 'hoch' },
      { label: 'Kündigungsfrist für Sie', wert: 'Keine Angabe – Rückgabe statt Kündigung', beleg: { dok: 'D2', seite: 38 }, sicherheit: 'mittel' }
    ],
    befunde: [
      {
        id: 'l1', titel: 'Rückgabe kann vorübergehend beschränkt werden', stufe: 'mittel',
        klartext: 'Wenn sehr viele Anleger gleichzeitig verkaufen wollen (mehr als 10 % des Fondsvermögens an einem Tag), darf die Fondsgesellschaft Rückgaben bis zu 15 Arbeitstage lang nur anteilig ausführen.',
        belege: ['b-vp-gate'],
        ki: ['Das ist eine gesetzlich erlaubte Schutzregel. Für Sie bedeutet sie: In Krisenzeiten erhalten Sie Ihr Geld möglicherweise später und zu einem anderen Preis als erwartet.'],
        sicherheit: 'hoch', sicherheitGrund: 'Eindeutige Regelung im Prospekt.',
        fragen: ['q9']
      },
      {
        id: 'l2', titel: 'Rücknahme kann ausgesetzt werden', stufe: 'mittel',
        klartext: 'Bei „außergewöhnlichen Umständen“ darf die Rücknahme von Anteilen vollständig ausgesetzt werden.',
        belege: ['b-vp-aussetzung'],
        ki: ['Welche Umstände das sind, beschreibt der Prospekt nur allgemein. Diese Regel ist bei offenen Fonds üblich.'],
        sicherheit: 'hoch', sicherheitGrund: 'Eindeutige Regelung im Prospekt.',
        fragen: ['q9']
      },
      {
        id: 'l3', titel: 'Fondsgesellschaft kann die Verwaltung kündigen', stufe: 'info',
        klartext: 'Die Fondsgesellschaft kann die Verwaltung des Fonds mit einer Frist von mindestens 6 Monaten kündigen. Der Fonds würde dann abgewickelt oder an eine andere Gesellschaft übertragen.',
        belege: ['b-vp-kuendigung'],
        ki: ['Für Sie bedeutet das, dass Sie den Zeitpunkt des Ausstiegs in diesem Fall nicht selbst bestimmen. Dies ist eine Standardregel.'],
        sicherheit: 'hoch', sicherheitGrund: 'Eindeutige Regelung im Prospekt.',
        fragen: []
      }
    ]
  },

  abgleich: {
    einleitung: 'Wir vergleichen, was Ihre Bank im Beratungsprotokoll über Sie festgehalten hat, mit den Angaben der Fondsgesellschaft. Eine Abweichung bedeutet nicht automatisch, dass die Empfehlung falsch ist – sie ist aber ein guter Anlass für eine Rückfrage.',
    zeilen: [
      { merkmal: 'Anlagedauer', fonds: { text: 'Empfohlene Haltedauer 7 Jahre', beleg: { dok: 'D1', seite: 1 } }, bank: { text: 'Anlagehorizont „mittelfristig (3–5 Jahre)“', beleg: { dok: 'D4', seite: 2 } }, ergebnis: 'abweichung',
        ki: 'Ihr geplanter Zeitraum ist kürzer als die empfohlene Haltedauer. Bei einem früheren Ausstieg ist das Risiko eines Verlusts höher.', fragen: ['q5'] },
      { merkmal: 'Verlusttragfähigkeit', fonds: { text: 'Stressszenario: −58,8 % nach 1 Jahr', beleg: { dok: 'D1', seite: 2 } }, bank: { text: 'Verluste „bis 20 % des Anlagebetrags tragbar“', beleg: { dok: 'D4', seite: 2 } }, ergebnis: 'abweichung',
        ki: 'Ein Verlust in der Höhe des Stressszenarios läge deutlich über dem, was laut Protokoll für Sie tragbar ist.', fragen: ['q6'] },
      { merkmal: 'Risikobereitschaft', fonds: { text: 'Risikoklasse 4 von 7 (SRI)', beleg: { dok: 'D1', seite: 1 } }, bank: { text: 'Risikoklasse 3 von 5 („ausgewogen“)', beleg: { dok: 'D4', seite: 2 } }, ergebnis: 'unklar',
        ki: 'Die Bank verwendet eine eigene Skala von 1 bis 5. Wie diese zur gesetzlichen Skala 1 bis 7 passt, steht nicht in den Unterlagen.', fragen: ['q7b'] },
      { merkmal: 'Nachhaltigkeitspräferenz', fonds: { text: 'Artikel 6: keine Nachhaltigkeitsziele', beleg: { dok: 'D2', seite: 18 } }, bank: { text: 'Präferenz „Ja – Mindestanteil nachhaltiger Investitionen 20 %“', beleg: { dok: 'D4', seite: 3 } }, ergebnis: 'abweichung',
        ki: 'Der Fonds verfolgt laut Prospekt keine Nachhaltigkeitsziele. Das passt nicht zu der im Protokoll vermerkten Präferenz.', fragen: ['q7'] },
      { merkmal: 'Anlageziel', fonds: { text: 'Langfristiger Kapitalzuwachs', beleg: { dok: 'D1', seite: 1 } }, bank: { text: 'Anlageziel „Vermögensaufbau“', beleg: { dok: 'D4', seite: 2 } }, ergebnis: 'passt',
        ki: 'Die Ziele sind inhaltlich vergleichbar.', fragen: [] },
      { merkmal: 'Laufende Kosten', fonds: { text: '1,85 % pro Jahr', beleg: { dok: 'D1', seite: 2 } }, bank: { text: '1,65 % pro Jahr', beleg: { dok: 'D3', seite: 1 } }, ergebnis: 'pruefen',
        ki: 'Siehe Abschnitt Kosten.', fragen: ['q1'] },
      { merkmal: 'Kenntnisse & Erfahrungen', fonds: { text: 'Zielgruppe: Anleger mit Grundkenntnissen', beleg: { dok: 'D1', seite: 1 } }, bank: { text: 'Kenntnisse in Investmentfonds „vorhanden“', beleg: { dok: 'D4', seite: 1 } }, ergebnis: 'passt',
        ki: 'Die Angaben sind vereinbar.', fragen: [] },
      { merkmal: 'Begründung der Empfehlung', fonds: null, bank: { text: '„Der Fonds entspricht Ihren Anlagezielen und Ihrer Risikobereitschaft.“', beleg: { dok: 'D5', seite: 1 } }, ergebnis: 'pruefen',
        ki: 'Die Begründung ist sehr allgemein und geht nicht auf die oben genannten Abweichungen ein.', fragen: ['q5', 'q8'] }
    ]
  },

  vertrag: {
    einleitung: 'Diese Stellen in den Vertragsbedingungen sind aus unserer Sicht erklärungsbedürftig. Sie sind nicht unbedingt nachteilig, aber gut zu wissen.',
    befunde: [
      {
        id: 'v1', titel: 'Verwaltungsvergütung darf erhöht werden', stufe: 'mittel',
        klartext: 'Derzeit erhält die Fondsgesellschaft 1,50 % pro Jahr für die Verwaltung. Laut Anlagebedingungen darf sie bis zu 2,10 % berechnen.',
        belege: ['b-vp-verguetung'],
        ki: ['Eine Erhöhung bis zur Obergrenze wäre ohne Ihre Zustimmung möglich. Die Kosten könnten dadurch künftig höher sein als heute angegeben.'],
        sicherheit: 'hoch', sicherheitGrund: 'Beide Zahlen stehen im selben Absatz.', fragen: ['q3b']
      },
      {
        id: 'v2', titel: 'Anlagebedingungen können geändert werden', stufe: 'info',
        klartext: 'Die Fondsgesellschaft kann die Anlagebedingungen mit Genehmigung der Aufsicht ändern. Bei wesentlichen Änderungen werden Sie informiert und können Ihre Anteile vorher kostenlos zurückgeben.',
        belege: ['b-vp-aenderung'],
        ki: ['Das ist eine übliche Regel. Wichtig ist: Achten Sie auf Post Ihrer Bank zu solchen Änderungen.'],
        sicherheit: 'hoch', sicherheitGrund: 'Eindeutige Regelung.', fragen: []
      },
      {
        id: 'v3', titel: '„Swing Pricing“ kann den Rücknahmepreis verändern', stufe: 'info',
        klartext: 'Bei großen Zu- oder Abflüssen kann der Anteilspreis angepasst werden, damit die Handelskosten von denen getragen werden, die sie verursachen. Ihr Verkaufspreis kann dadurch leicht niedriger ausfallen.',
        belege: ['b-vp-swing'],
        ki: ['Die maximale Anpassung von 2 % ist im Prospekt genannt. Im Normalfall ist der Effekt gering.'],
        sicherheit: 'mittel', sicherheitGrund: 'Fachsprache; Auslegung durch die KI.', fragen: []
      },
      {
        id: 'v4', titel: 'Geeignetheitserklärung ohne erkennbare Unterschrift', stufe: 'unklar',
        klartext: 'Im Feld „Ort, Datum, Unterschrift Berater/in“ wurde kein Eintrag erkannt.',
        belege: ['b-ge-unterschrift'],
        ki: ['Das Dokument ist ein Scan. Möglicherweise ist eine Unterschrift vorhanden, aber nicht lesbar. Bitte prüfen Sie Ihr Original.'],
        sicherheit: 'niedrig', sicherheitGrund: 'Texterkennung auf gescannter Seite; Handschrift wird nicht zuverlässig erkannt.', fragen: ['q11']
      }
    ]
  },

  fehlend: {
    einleitung: 'Diese Informationen konnten wir nicht finden oder nicht eindeutig lesen. Wir haben keine Werte ergänzt oder geschätzt.',
    befunde: [
      { id: 'f1', titel: 'Verkaufsprospekt unvollständig', stufe: 'fehlt',
        klartext: 'Das Inhaltsverzeichnis nennt 112 Seiten, die Datei enthält nur die Seiten 1–60. Es fehlen u. a. „Berechnung der erfolgsabhängigen Vergütung“ (S. 87) und „Steuerliche Hinweise“ (S. 95).',
        belege: ['b-vp-inhalt'], ki: ['Bitte laden Sie die vollständige Datei hoch oder fordern Sie sie bei der Bank an.'], sicherheit: 'hoch', sicherheitGrund: 'Seitenzahlen eindeutig.', fragen: ['q10'] },
      { id: 'f2', titel: 'Kein Jahres- oder Halbjahresbericht', stufe: 'fehlt',
        klartext: 'Ohne Jahresbericht lassen sich die tatsächliche Zusammensetzung, die Fondsgröße und die Wertentwicklung der Vergangenheit nicht prüfen.',
        belege: [], ki: ['Der Bericht ist für Anleger kostenlos erhältlich (bei der Bank oder auf der Website der Fondsgesellschaft).'], sicherheit: null, fragen: ['q10'] },
      { id: 'f3', titel: 'Depotkosten nicht angegeben', stufe: 'fehlt',
        klartext: 'In der Kostenübersicht fehlen Angaben zu laufenden Depot- oder Servicegebühren der Bank.',
        belege: ['b-kost-dienst'], ki: ['Möglicherweise fallen keine an – das sollte die Bank aber ausdrücklich bestätigen.'], sicherheit: 'mittel', sicherheitGrund: 'Abschnitt ist vorhanden, aber leer.', fragen: ['q2'] },
      { id: 'f4', titel: 'Zuwendungen nicht in Euro beziffert', stufe: 'unklar',
        klartext: 'Die Kostenübersicht nennt „bis zu 0,90 %“, aber keinen Betrag in Euro für Ihren Anlagebetrag.',
        belege: ['b-kost-zuw'], ki: ['Bei 25.000 € wären „bis zu 0,90 %“ höchstens 225 € pro Jahr (einfache KI-Berechnung).'], sicherheit: 'hoch', sicherheitGrund: 'Wert eindeutig, Betrag fehlt.', fragen: ['q2'] }
    ]
  },

  fragen: [
    { gruppe: 'Kosten', items: [
      { id: 'q1', text: 'Im Basisinformationsblatt stehen 1,85 % laufende Kosten, in Ihrer Kostenübersicht 1,65 %. Welcher Wert gilt für mich, und warum unterscheiden sie sich?', warum: 'Abweichung zwischen KID (S. 2) und Kostenübersicht (S. 1).' },
      { id: 'q2', text: 'Wie viel erhält die Bank pro Jahr in Euro an Zuwendungen für meine Anlage, und fallen zusätzlich Depot- oder Servicegebühren an?', warum: 'Zuwendungen nur in Prozent angegeben, Depotkosten fehlen.' },
      { id: 'q3', text: 'Können Sie mir den Ausgabeaufschlag von 3 % (750 €) schriftlich bestätigen?', warum: 'KID nennt bis zu 5 %.' },
      { id: 'q3b', text: 'Plant die Fondsgesellschaft, die Verwaltungsvergütung in Richtung der erlaubten 2,10 % zu erhöhen?', warum: 'Anlagebedingungen erlauben eine höhere Vergütung als derzeit berechnet.' },
      { id: 'q4', text: 'Gibt es bei der erfolgsabhängigen Gebühr eine „High-Water-Mark“? Bitte senden Sie mir die Berechnungsregel.', warum: 'Berechnung steht auf einer fehlenden Prospektseite.' }
    ]},
    { gruppe: 'Passt das Angebot zu mir?', items: [
      { id: 'q5', text: 'Die empfohlene Haltedauer beträgt 7 Jahre, mein Anlagehorizont laut Protokoll 3–5 Jahre. Warum halten Sie den Fonds trotzdem für geeignet?', warum: 'Abweichung im Abgleich: Anlagedauer.' },
      { id: 'q6', text: 'Im Stressszenario könnte der Fonds nach einem Jahr fast 59 % verlieren. Wie passt das zu meiner angegebenen Verlusttragfähigkeit von 20 %?', warum: 'Abweichung im Abgleich: Verlusttragfähigkeit.' },
      { id: 'q7', text: 'Ich habe Nachhaltigkeitspräferenzen angegeben. Wie werden diese bei diesem Fonds berücksichtigt?', warum: 'Fonds ist nach Artikel 6 eingestuft (keine Nachhaltigkeitsziele).' },
      { id: 'q7b', text: 'Wie entspricht Ihre Risikoklasse 3 von 5 der Risikoklasse 4 von 7 im Basisinformationsblatt?', warum: 'Unterschiedliche Skalen, keine Zuordnung in den Unterlagen.' },
      { id: 'q8', text: 'Welche anderen Produkte haben Sie für mich geprüft, und warum haben Sie sich für diesen Fonds entschieden?', warum: 'Begründung der Empfehlung ist sehr allgemein.' }
    ]},
    { gruppe: 'Rückgabe und Risiko', items: [
      { id: 'q9', text: 'Wurde die Rücknahme bei diesem Fonds schon einmal beschränkt oder ausgesetzt? Wie schnell bekäme ich mein Geld im Normalfall?', warum: 'Prospekt erlaubt Rücknahmebeschränkung und Aussetzung.' },
      { id: 'q12', text: 'Wie hoch ist der Anteil in Fremdwährungen derzeit, und wird er gegen Wechselkursschwankungen abgesichert?', warum: 'Währungsrisiko ohne systematische Absicherung.' }
    ]},
    { gruppe: 'Unterlagen', items: [
      { id: 'q10', text: 'Bitte senden Sie mir den vollständigen Verkaufsprospekt sowie den aktuellen Jahresbericht und das aktuelle Factsheet.', warum: 'Prospekt unvollständig; Zusammensetzung nicht prüfbar.' },
      { id: 'q11', text: 'Ist meine Geeignetheitserklärung vollständig und unterschrieben? Ich konnte keine Unterschrift erkennen.', warum: 'Unterschriftsfeld in der Geeignetheitserklärung (S. 4) leer erkannt.' }
    ]}
  ],

  /* Textstellen: im Produkt Verweis auf Koordinaten in der Original-PDF */
  belege: {
    'b-kid-kosten': { dok: 'D1', seite: 2, vor: 'Zusammensetzung der Kosten …', zitat: 'Verwaltungsgebühren und sonstige Verwaltungs- oder Betriebskosten: 1,85 % des Werts Ihrer Anlage pro Jahr.', nach: 'Hierbei handelt es sich um eine Schätzung auf der Grundlage der tatsächlichen Kosten des letzten Jahres.', sicherheit: 'hoch' },
    'b-kost-lfd': { dok: 'D3', seite: 1, vor: 'Produktkosten (laufend)', zitat: 'Laufende Kosten des Finanzinstruments: 1,65 % p. a. (412,50 EUR)', nach: 'Berechnungsgrundlage: Anlagebetrag 25.000,00 EUR', sicherheit: 'hoch' },
    'b-kid-perf': { dok: 'D1', seite: 2, vor: 'Zusätzliche Kosten unter bestimmten Bedingungen', zitat: 'Erfolgsgebühren: 15 % der Wertentwicklung, die über dem Vergleichsindex liegt. Der tatsächliche Betrag hängt davon ab, wie gut sich Ihre Anlage entwickelt. Die obige Schätzung (0,31 %) beruht auf dem Durchschnitt der letzten 5 Jahre.', nach: '', sicherheit: 'hoch' },
    'b-vp-perf': { dok: 'D2', seite: 44, vor: '§ 7 Abs. 4 Erfolgsabhängige Vergütung', zitat: 'Die Einzelheiten der Berechnung, einschließlich der Abrechnungsperiode, sind in Abschnitt 14.3 (Seite 87) beschrieben.', nach: '', sicherheit: 'hoch' },
    'b-kid-sri': { dok: 'D1', seite: 1, vor: 'Risikoindikator', zitat: 'Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 4 eingestuft, wobei 4 einer mittleren Risikoklasse entspricht.', nach: 'Dieses Produkt beinhaltet keinen Schutz vor künftiger Marktentwicklung, so dass Sie Ihre Anlage ganz oder teilweise verlieren könnten.', sicherheit: 'hoch' },
    'b-kid-stress': { dok: 'D1', seite: 2, vor: 'Performance-Szenarien – Anlage 10.000 EUR', zitat: 'Stressszenario – Was Sie am Ende nach Abzug der Kosten herausbekommen könnten: 4.120 EUR nach 1 Jahr; Jährliche Durchschnittsrendite: −58,8 %', nach: 'Pessimistisches Szenario: 7.650 EUR nach 1 Jahr …', sicherheit: 'hoch' },
    'b-vp-markt': { dok: 'D2', seite: 20, vor: '5.1 Marktrisiko', zitat: 'Die Kursentwicklung von Aktien hängt insbesondere von der Entwicklung der Kapitalmärkte ab, die von der allgemeinen Lage der Weltwirtschaft beeinflusst wird.', nach: '', sicherheit: 'hoch' },
    'b-kid-usd': { dok: 'D1', seite: 1, vor: 'Ziele', zitat: 'Der Fonds investiert weltweit, überwiegend in Aktien von Unternehmen mit Sitz in den USA, die in US-Dollar notiert sind.', nach: '', sicherheit: 'hoch' },
    'b-vp-waehrung': { dok: 'D2', seite: 23, vor: '5.6 Währungsrisiko', zitat: 'Der Fonds kann bis zu 100 % seines Vermögens in Vermögensgegenstände anlegen, die auf Fremdwährung lauten. Eine Absicherung von Währungsrisiken erfolgt nicht systematisch.', nach: '', sicherheit: 'hoch' },
    'b-vp-grenzen': { dok: 'D2', seite: 21, vor: '4.2 Anlagegrenzen', zitat: 'Wertpapiere eines Emittenten dürfen bis zu 10 % des Fondsvermögens erworben werden; dabei darf der Gesamtwert der Wertpapiere dieser Emittenten 40 % des Fondsvermögens nicht übersteigen.', nach: '', sicherheit: 'hoch' },
    'b-vp-liquid': { dok: 'D2', seite: 21, vor: '4.3 Sonstige Anlageinstrumente', zitat: 'Bis zu 10 % des Fondsvermögens dürfen in Wertpapiere angelegt werden, die nicht zum Handel an einer Börse zugelassen sind.', nach: '', sicherheit: 'mittel' },
    'b-vp-derivate': { dok: 'D2', seite: 26, vor: '4.7 Derivate', zitat: 'Die Gesellschaft darf Derivate zu Absicherungs- und Investitionszwecken einsetzen. Das Marktrisikopotenzial des Fonds darf zu keinem Zeitpunkt das Zweifache des Marktrisikopotenzials des zugehörigen Vergleichsvermögens übersteigen.', nach: '', sicherheit: 'hoch' },
    'b-vp-gate': { dok: 'D2', seite: 38, vor: '9.4 Rücknahmebeschränkung', zitat: 'Die Gesellschaft kann die Rücknahme beschränken, wenn die Rückgabeverlangen der Anleger einen Schwellenwert von 10 % des Nettoinventarwertes erreichen. Die Beschränkung kann für höchstens 15 aufeinanderfolgende Arbeitstage erfolgen.', nach: '', sicherheit: 'hoch' },
    'b-vp-aussetzung': { dok: 'D2', seite: 39, vor: '9.5 Aussetzung der Rücknahme', zitat: 'Die Gesellschaft kann die Rücknahme der Anteile aussetzen, wenn außergewöhnliche Umstände vorliegen, die eine Aussetzung unter Berücksichtigung der Interessen der Anleger erforderlich erscheinen lassen.', nach: '', sicherheit: 'hoch' },
    'b-vp-kuendigung': { dok: 'D2', seite: 41, vor: '10.1 Kündigung und Auflösung', zitat: 'Die Gesellschaft kann die Verwaltung des Fonds unter Einhaltung einer Kündigungsfrist von mindestens sechs Monaten durch Bekanntmachung im Bundesanzeiger kündigen.', nach: '', sicherheit: 'hoch' },
    'b-vp-verguetung': { dok: 'D2', seite: 43, vor: '§ 7 Abs. 1 Verwaltungsvergütung', zitat: 'Die Gesellschaft erhält für die Verwaltung des Fonds eine jährliche Vergütung von bis zu 2,10 % des durchschnittlichen Nettoinventarwertes. Derzeit berechnet sie 1,50 % p. a.', nach: '', sicherheit: 'hoch' },
    'b-vp-aenderung': { dok: 'D2', seite: 50, vor: '§ 22 Änderungen der Anlagebedingungen', zitat: 'Die Gesellschaft kann die Anlagebedingungen ändern. Änderungen bedürfen der vorherigen Genehmigung durch die Aufsichtsbehörde.', nach: 'Die Anleger können ihre Anteile vor Inkrafttreten wesentlicher Änderungen ohne weitere Kosten zurückgeben.', sicherheit: 'hoch' },
    'b-vp-swing': { dok: 'D2', seite: 40, vor: '9.6 Swing Pricing', zitat: 'Übersteigen die Nettomittelbewegungen einen festgelegten Schwellenwert, wird der Nettoinventarwert um einen Swing-Faktor von bis zu 2 % angepasst.', nach: '', sicherheit: 'mittel' },
    'b-ge-unterschrift': { dok: 'D4', seite: 4, vor: 'Erklärung der Beraterin / des Beraters', zitat: 'Ort, Datum, Unterschrift Berater/in: [kein Text erkannt]', nach: '', sicherheit: 'niedrig' },
    'b-vp-inhalt': { dok: 'D2', seite: 3, vor: 'Inhaltsverzeichnis', zitat: '14.3 Berechnung der erfolgsabhängigen Vergütung ……… 87 / 16 Kurzangaben über steuerliche Vorschriften ……… 95 / Anhang: Anlagebedingungen ……… 104', nach: '', sicherheit: 'hoch' },
    'b-kost-dienst': { dok: 'D3', seite: 1, vor: 'Dienstleistungskosten (laufend)', zitat: 'Laufende Dienstleistungskosten: —', nach: '', sicherheit: 'mittel' },
    'b-kost-zuw': { dok: 'D3', seite: 2, vor: 'Zuwendungen', zitat: 'Die Bank erhält von der Fondsgesellschaft eine laufende Vertriebsvergütung von bis zu 0,90 % p. a. des Bestands, die in den laufenden Produktkosten enthalten ist.', nach: '', sicherheit: 'hoch' }
  }
};
