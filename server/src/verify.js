// Belegprüfung und Umwandlung der Claude-Ausgabe in das Berichtsformat,
// das die Website (prototype/assets/bericht.js) darstellt.
//
// Regeln:
// - Zitat auf der angegebenen Seite gefunden       → bestätigt
// - Zitat auf der Nachbarseite gefunden            → Seitenzahl korrigiert
// - Seite ohne Textebene (Scan/Foto)               → behalten, aber "nicht maschinell geprüft",
//                                                     Erkennungssicherheit höchstens "mittel"
// - Zitat nicht gefunden / ungültige Seite         → verworfen
// Befunde, deren Belege alle verworfen wurden, werden entfernt.

const DOC_LABELS = {
  kid: ['Basisinformationsblatt (KID)', 'Basisinformationsblatt'],
  prospekt: ['Verkaufsprospekt / Fondsvertrag', 'Verkaufsprospekt'],
  kosten: ['Kostenübersicht', 'Kostenübersicht'],
  protokoll: ['Beratungsprotokoll / Geeignetheitserklärung', 'Beratungsprotokoll'],
  pib: ['Produktinformationsblatt', 'Produktinformationsblatt'],
  empfehlung: ['Schriftliche Bankempfehlung', 'Bankempfehlung'],
  jahresbericht: ['Jahres-/Halbjahresbericht', 'Jahresbericht'],
  factsheet: ['Factsheet', 'Factsheet'],
  sonstiges: ['Sonstiges Dokument', 'Dokument']
};

export const EINLEITUNGEN = {
  kosten: 'Kosten mindern Ihren Ertrag – unabhängig davon, wie sich der Fonds entwickelt. Wir zeigen die Kosten so, wie sie in den Unterlagen stehen, und erklären jeden Begriff.',
  risiken: 'Hier sehen Sie, welche Risiken die Unterlagen nennen. Die Einstufung „hoch / mittel / gering“ ist eine Einschätzung der KI für dieses Angebot – sie beruht auf den genannten Textstellen.',
  abgleich: 'Wir vergleichen, was Ihre Bank im Beratungsprotokoll über Sie festgehalten hat, mit den Angaben der Fondsgesellschaft. Eine Abweichung bedeutet nicht automatisch, dass die Empfehlung falsch ist – sie ist aber ein guter Anlass für eine Rückfrage.',
  abgleichNichtMoeglich: 'Für den Abgleich benötigen wir das Beratungsprotokoll oder die Geeignetheitserklärung Ihrer Bank. Diese Unterlage lag nicht vor.',
  vertrag: 'Diese Stellen in den Vertragsbedingungen sind aus unserer Sicht erklärungsbedürftig. Sie sind nicht unbedingt nachteilig, aber gut zu wissen.',
  fehlend: 'Diese Informationen konnten wir nicht finden oder nicht eindeutig lesen. Wir haben keine Werte ergänzt oder geschätzt.'
};

const RANK = { niedrig: 1, mittel: 2, hoch: 3 };
const capAt = (s, max) => (RANK[s] > RANK[max] ? max : s);

// --- Textnormalisierung mit Rückverweis auf Originalpositionen ---------------
export function normalizeWithMap(text) {
  const src = String(text || '').normalize('NFKC');
  let out = '';
  const map = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    // Nur Buchstaben, Ziffern, % und € vergleichen. Leerzeichen, Zeilenumbrüche,
    // Satzzeichen und Trennstriche ("Verwal-" + Umbruch + "tung") fallen dadurch weg.
    if (/[\p{L}\p{N}%€]/u.test(c)) {
      out += c.toLowerCase();
      map.push(i);
    }
  }
  return { norm: out, map, src };
}

export function normalize(text) { return normalizeWithMap(text).norm; }

// Sucht das Zitat (auch mit Auslassungszeichen "…") im Seitentext.
// Liefert {start, end} im Originaltext oder null.
export function findQuote(pageText, quote) {
  const page = normalizeWithMap(pageText);
  const parts = String(quote || '')
    .split(/…|\.\.\.|\[\.\.\.\]/)
    .map(normalize)
    .filter((p) => p.length > 0);
  if (!parts.length) return null;
  const total = parts.reduce((s, p) => s + p.length, 0);
  if (total < 6) return null; // zu kurz, um aussagekräftig zu sein
  let pos = 0, first = -1, last = -1;
  for (const p of parts) {
    if (p.length < 4 && parts.length > 1) continue; // Fragmente ignorieren
    const idx = page.norm.indexOf(p, pos);
    if (idx === -1) return null;
    if (first === -1) first = idx;
    last = idx + p.length - 1;
    pos = idx + p.length;
  }
  if (first === -1) return null;
  return { start: page.map[first], end: page.map[last] + 1, src: page.src };
}

function context(src, start, end) {
  const before = src.slice(Math.max(0, start - 180), start).replace(/\s+/g, ' ').trim();
  const after = src.slice(end, end + 180).replace(/\s+/g, ' ').trim();
  return {
    vor: before ? (start > 180 ? '… ' : '') + before : '',
    nach: after ? after + (end + 180 < src.length ? ' …' : '') : ''
  };
}

// --- Hauptfunktion -----------------------------------------------------------
/**
 * @param {object} analyse  Ausgabe von Claude (AnalyseSchema)
 * @param {Array} docs      [{dateiname, typ, seiten: string[], scanSeiten: number[], bild: boolean}]
 * @param {object} meta     {id, erstellt}
 */
export function buildReport(analyse, docs, meta) {
  const stats = { gesamt: 0, bestaetigt: 0, korrigiert: 0, ungeprueft: 0, verworfen: 0, befundeEntfernt: 0 };
  const belege = {};
  let seq = 0;
  const cache = new Map(); // gleiche Belege nur einmal prüfen

  function checkBeleg(b) {
    stats.gesamt++;
    const key = `${b.dok}|${b.seite}|${b.zitat}`;
    if (cache.has(key)) { const id = cache.get(key); if (!id) stats.verworfen++; return id; }
    const doc = docs[b.dok - 1];
    let id = null;
    if (doc && Number.isInteger(b.seite) && b.seite >= 1 && b.seite <= doc.seiten.length && String(b.zitat || '').trim()) {
      const scan = doc.bild || doc.scanSeiten.includes(b.seite);
      let seite = b.seite, hit = null, status;
      if (!scan) {
        hit = findQuote(doc.seiten[seite - 1], b.zitat);
        if (hit) status = 'bestaetigt';
        else {
          for (const alt of [seite - 1, seite + 1]) {
            if (alt >= 1 && alt <= doc.seiten.length && !doc.scanSeiten.includes(alt)) {
              const h = findQuote(doc.seiten[alt - 1], b.zitat);
              if (h) { hit = h; seite = alt; status = 'korrigiert'; break; }
            }
          }
        }
      } else {
        status = 'ungeprueft';
      }
      if (status) {
        id = 'b' + (++seq);
        const ctx = hit ? context(hit.src, hit.start, hit.end) : { vor: '', nach: '' };
        belege[id] = {
          dok: 'D' + b.dok,
          seite,
          zitat: hit ? hit.src.slice(hit.start, hit.end).replace(/\s+/g, ' ').trim() : String(b.zitat).trim(),
          vor: ctx.vor,
          nach: ctx.nach,
          sicherheit: status === 'ungeprueft' ? capAt(b.sicherheit, 'mittel') : b.sicherheit,
          pruefung: status
        };
        stats[status]++;
      }
    }
    if (!id) stats.verworfen++;
    cache.set(key, id);
    return id;
  }

  const ref = (id) => (id ? { dok: belege[id].dok, seite: belege[id].seite } : null);

  function befunde(list) {
    const out = [];
    let n = 0;
    for (const f of list || []) {
      const ids = (f.belege || []).map(checkBeleg).filter(Boolean);
      if ((f.belege || []).length > 0 && ids.length === 0) { stats.befundeEntfernt++; continue; }
      let sicherheit = f.sicherheit;
      if (ids.length && ids.every((id) => belege[id].pruefung === 'ungeprueft')) sicherheit = capAt(sicherheit, 'mittel');
      out.push({
        id: 'f' + (++n) + Math.random().toString(36).slice(2, 6),
        titel: f.titel, stufe: f.stufe, klartext: f.klartext,
        belege: [...new Set(ids)], ki: f.ki || [],
        sicherheit: ids.length || f.stufe === 'fehlt' ? sicherheit : null,
        sicherheitGrund: f.sicherheitGrund, fragen: f.fragen || []
      });
    }
    return out;
  }

  function fakten(list) {
    return (list || []).map((f) => {
      if (f.fehlt) return { label: f.label, wert: f.wert || 'Nicht in den Unterlagen', fehlt: true };
      const ids = (f.belege || []).map(checkBeleg).filter(Boolean);
      if (!ids.length) return { label: f.label, wert: 'Nicht eindeutig belegt', fehlt: true };
      return { label: f.label, wert: f.wert, beleg: ref(ids[0]), belegId: ids[0], sicherheit: belege[ids[0]].sicherheit };
    });
  }

  // Dokumente
  const dokumente = {};
  docs.forEach((d, i) => {
    const info = (analyse.dokumente || []).find((x) => x.dok === i + 1) || {};
    const typ = info.typ || d.typ || 'sonstiges';
    const [name, kurz] = DOC_LABELS[typ] || DOC_LABELS.sonstiges;
    const hinweise = [];
    if (d.bild) hinweise.push('Foto/Bild – Text per Bilderkennung gelesen');
    else if (d.scanSeiten.length) hinweise.push(d.scanSeiten.length === d.seiten.length ? 'Scan – Text per Bilderkennung gelesen' : `${d.scanSeiten.length} Seite(n) ohne Textebene`);
    if (info.hinweis) hinweise.push(info.hinweis);
    dokumente['D' + (i + 1)] = {
      name,
      kurz,
      typ,
      datei: d.dateiname,
      seiten: d.seiten.length,
      stand: info.stand || '–',
      unvollstaendig: !!info.unvollstaendig,
      sicherheit: d.bild || d.scanSeiten.length ? 'mittel' : 'hoch',
      hinweis: hinweise.join(' · ')
    };
  });

  const z = analyse.zusammenfassung || {};
  const k = analyse.kosten || {};
  const r = analyse.risiken || {};
  const l = analyse.laufzeit || {};
  const a = analyse.abgleich || {};

  const tabelle = (k.tabelle || []).map((row) => {
    const werte = (row.werte || []).map((w) => {
      const id = checkBeleg(w.beleg);
      return id ? { text: w.text, beleg: ref(id), belegId: id } : null;
    }).filter(Boolean);
    if (!werte.length && row.status !== 'fehlt') return { art: row.art, erklaerung: row.erklaerung, werte: [{ text: 'Nicht eindeutig belegt', fehlt: true }], status: 'unklar', sicherheit: null, notiz: row.notiz };
    if (!werte.length) return { art: row.art, erklaerung: row.erklaerung, werte: [{ text: 'Keine Angabe gefunden', fehlt: true }], status: 'fehlt', sicherheit: null, notiz: row.notiz };
    return { art: row.art, erklaerung: row.erklaerung, werte, status: row.status, sicherheit: belege[werte[0].belegId].sicherheit, notiz: row.notiz };
  });

  let beispiel = null;
  if (k.beispiel && k.beispiel.vorhanden) {
    const werte = (k.beispiel.werte || []).map((w) => {
      const id = checkBeleg(w.beleg);
      return id ? { betrag: w.betrag, label: w.label, beleg: ref(id), belegId: id } : null;
    }).filter(Boolean);
    if (werte.length) beispiel = { titel: 'Kostenbeispiel aus den Unterlagen', text: k.beispiel.text, werte, ki: k.beispiel.ki };
  }

  const sriIds = ((r.sri && r.sri.belege) || []).map(checkBeleg).filter(Boolean);
  const sri = r.sri && r.sri.wert >= 1 && r.sri.wert <= 7 && sriIds.length
    ? { wert: r.sri.wert, beleg: ref(sriIds[0]), belegId: sriIds[0] }
    : { wert: 0 };

  function seite(s) {
    if (!s || !s.vorhanden) return null;
    const ids = (s.belege || []).map(checkBeleg).filter(Boolean);
    if (!ids.length) return { text: 'Nicht eindeutig belegt', unbelegt: true };
    return { text: s.text, beleg: ref(ids[0]), belegId: ids[0] };
  }
  const zeilen = (a.zeilen || []).map((row) => {
    const fonds = seite(row.fonds), bank = seite(row.bank);
    let ergebnis = row.ergebnis;
    if ((fonds && fonds.unbelegt) || (bank && bank.unbelegt)) ergebnis = 'unklar';
    return { merkmal: row.merkmal, fonds: fonds && !fonds.unbelegt ? fonds : (fonds ? { text: fonds.text } : null), bank: bank && !bank.unbelegt ? bank : (bank ? { text: bank.text } : null), ergebnis, ki: row.ki, fragen: row.fragen || [] };
  });

  const report = {
    id: meta.id,
    erstellt: meta.erstellt,
    echt: true,
    fonds: analyse.fonds || 'Unbekannter Fonds',
    dokumente,
    zusammenfassung: {
      kurz: z.kurz || [],
      kiHinweis: 'Diese Zusammenfassung wurde von der KI aus den unten belegten Textstellen erstellt. Sie enthält keine Kauf- oder Verkaufsempfehlung.',
      fakten: fakten(z.fakten)
    },
    kosten: { einleitung: EINLEITUNGEN.kosten, tabelle, beispiel, befunde: befunde(k.befunde) },
    risiken: { einleitung: EINLEITUNGEN.risiken, sri, befunde: befunde(r.befunde) },
    laufzeit: { fakten: fakten(l.fakten), befunde: befunde(l.befunde) },
    abgleich: { einleitung: a.moeglich === false ? EINLEITUNGEN.abgleichNichtMoeglich : EINLEITUNGEN.abgleich, zeilen },
    vertrag: { einleitung: EINLEITUNGEN.vertrag, befunde: befunde((analyse.vertrag || {}).befunde) },
    fehlend: { einleitung: EINLEITUNGEN.fehlend, befunde: befunde((analyse.fehlend || {}).befunde) },
    fragen: [],
    belege,
    pruefung: stats
  };

  // Fragen: eindeutige IDs, nur gültige Verweise behalten
  const seen = new Set();
  report.fragen = (analyse.fragen || []).map((g) => ({
    gruppe: g.gruppe,
    items: (g.items || []).filter((q) => q.id && /^[A-Za-z0-9_-]{1,20}$/.test(q.id) && !seen.has(q.id) && seen.add(q.id))
  })).filter((g) => g.items.length);
  const valid = (ids) => (ids || []).filter((id) => seen.has(id));
  for (const sec of [report.kosten, report.risiken, report.laufzeit, report.vertrag, report.fehlend]) {
    sec.befunde.forEach((f) => { f.fragen = valid(f.fragen); });
  }
  report.abgleich.zeilen.forEach((zl) => { zl.fragen = valid(zl.fragen); });

  return report;
}
