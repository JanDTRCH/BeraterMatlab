/* Rendert den Analysebericht aus window.BERICHT. */
(function () {
  'use strict';

  // Unterlagen, deren Angaben in der Spalte „Laut Bank“ stehen
  const BANK_TYPEN = ['kosten', 'protokoll', 'empfehlung'];
  function docKurz(dok) { const d = B.dokumente[dok]; return d ? (d.kurz || d.name) : dok; }
  function istBank(beleg) { const d = beleg && B.dokumente[beleg.dok]; return !!d && BANK_TYPEN.indexOf(d.typ) !== -1; }
  // Text der KI sicher ausgeben; **fett** ist erlaubt
  function richText(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function safeId(id) { return String(id).replace(/[^A-Za-z0-9_-]/g, ''); }
  const LEVEL_LABEL_RISK = { hoch: 'Hohes Risiko', mittel: 'Mittleres Risiko', niedrig: 'Geringes Risiko', unklar: 'Nicht einstufbar', fehlt: 'Fehlt', info: 'Zur Information' };
  const LEVEL_LABEL_GENERIC = { hoch: 'Wichtig', mittel: 'Beachten', niedrig: 'Unauffällig', unklar: 'Unklar', fehlt: 'Fehlt', info: 'Zur Information' };

  let B, FL, esc;
  const sources = []; // Registry für Quellen-Dialog

  function srcBtn(ref) {
    // ref: string (Beleg-ID) oder {dok, seite, wert?}
    let entry;
    if (typeof ref === 'string') {
      const b = B.belege[ref];
      if (!b) return '';
      entry = Object.assign({ id: ref }, b);
    } else {
      entry = Object.assign({}, ref);
    }
    sources.push(entry);
    const idx = sources.length - 1;
    if (!B.dokumente[entry.dok]) return '';
    const label = docKurz(entry.dok) + ', S. ' + entry.seite;
    return '<button type="button" class="src-btn" data-src="' + idx + '" aria-label="Quelle anzeigen: ' + esc(B.dokumente[entry.dok].name) + ', Seite ' + entry.seite + '">' +
      FL.icon('doc') + esc(label) + '</button>';
  }

  function questionLinks(ids) {
    if (!ids || !ids.length) return '';
    return ids.map(function (id) {
      return '<a href="#q-' + safeId(id) + '" class="xs">Frage an die Bank ansehen</a>';
    }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' · ');
  }

  function finding(f, labels) {
    const quotes = (f.belege || []).map(function (id) {
      const b = B.belege[id];
      if (!b) return '';
      return '<div class="quote"><blockquote>„' + esc(b.zitat) + '“</blockquote>' +
        '<div class="src-row">' + srcBtn(id) + FL.confidence(b.sicherheit) + '</div></div>';
    }).join('');

    const docBlock = quotes
      ? '<div class="from-doc"><div class="block-label">' + FL.icon('doc') + 'Aus den Unterlagen</div>' + quotes + '</div>'
      : '<div class="from-doc"><div class="block-label">' + FL.icon('doc') + 'Aus den Unterlagen</div><p class="small muted" style="margin:0">Keine passende Textstelle in den hochgeladenen Unterlagen gefunden.</p></div>';

    const kiRefs = (f.belege || []).map(function (id) { return srcBtn(id); }).join('');
    const kiBlock = (f.ki && f.ki.length)
      ? '<div class="ki"><div class="block-label">' + FL.icon('ki') + 'Einschätzung der KI</div>' +
        f.ki.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
        '<div class="ki-foot">' +
          (kiRefs ? '<span>Stützt sich auf:</span>' + kiRefs : '<span>Stützt sich auf: keine Textstelle (fehlende Unterlage)</span>') +
          (f.sicherheit ? FL.confidence(f.sicherheit) : '') +
        '</div>' +
        (f.sicherheitGrund ? '<div class="ki-foot"><span>Warum diese Sicherheit: ' + esc(f.sicherheitGrund) + '</span></div>' : '') +
        '</div>'
      : '';

    const q = questionLinks(f.fragen);

    return '<article class="finding" data-level="' + f.stufe + '" id="befund-' + f.id + '">' +
      '<div class="finding-head"><h3>' + esc(f.titel) + '</h3>' + FL.chip(f.stufe, labels[f.stufe]) + '</div>' +
      '<p class="finding-plain">' + esc(f.klartext) + '</p>' +
      '<div class="evidence">' + docBlock + kiBlock + '</div>' +
      (q ? '<p class="xs" style="margin:12px 0 0">' + FL.icon('question') + ' ' + q + '</p>' : '') +
      '</article>';
  }

  function facts(list) {
    return '<dl class="facts">' + list.map(function (f) {
      if (f.fehlt) {
        return '<div class="fact is-missing"><dt>' + esc(f.label) + '</dt><dd>' + esc(f.wert) + '</dd>' +
          '<div class="fact-foot">' + FL.chip('fehlt', 'Nicht gefunden') + '</div></div>';
      }
      return '<div class="fact"><dt>' + esc(f.label) + '</dt><dd>' + esc(f.wert) + '</dd>' +
        '<div class="fact-foot">' + srcBtn(f.belegId || { dok: f.beleg.dok, seite: f.beleg.seite, wert: f.wert, label: f.label, sicherheit: f.sicherheit }) + FL.confidence(f.sicherheit) + '</div></div>';
    }).join('') + '</dl>';
  }

  function sectionHead(num, id, title, intro, extra) {
    return '<header><div class="sec-num">Abschnitt ' + num + ' von 8</div><h2 id="' + id + '-titel">' + title + (extra || '') + '</h2>' + (intro ? '<p>' + intro + '</p>' : '') + '</header>';
  }

  // ---------- Abschnitte ----------
  function renderZusammenfassung() {
    const z = B.zusammenfassung;
    const counts = countAll();
    const docsRows = Object.keys(B.dokumente).map(function (k) {
      const d = B.dokumente[k];
      const pages = d.seitenErwartet ? d.seiten + ' von ' + d.seitenErwartet + ' Seiten' : d.seiten + ' Seite' + (d.seiten === 1 ? '' : 'n');
      const status = d.seitenErwartet || d.unvollstaendig ? FL.chip('unklar', 'Unvollständig') : FL.chip('niedrig', 'Gelesen');
      return '<tr><td data-label="Unterlage"><strong>' + esc(d.name) + '</strong><span class="explain">' + esc(d.datei) + (d.hinweis ? ' · ' + esc(d.hinweis) : '') + '</span></td>' +
        '<td data-label="Stand">' + esc(d.stand) + '</td><td data-label="Umfang">' + pages + '</td>' +
        '<td data-label="Status">' + status + '<div class="src-row">' + FL.confidence(d.sicherheit) + '</div></td></tr>';
    }).join('');

    return sectionHead(1, 'zusammenfassung', 'Kurze Zusammenfassung des Angebots', 'Das Wichtigste auf einen Blick. Details und Belege finden Sie in den folgenden Abschnitten.') +
      '<div class="kpis">' +
        kpi(counts.abweichung, 'Abweichungen zur Bankempfehlung', 'hoch') +
        kpi(counts.hoch, 'Hohes Risiko markiert', 'hoch') +
        kpi(counts.unklar, 'Unklare Angaben', 'unklar') +
        kpi(counts.fehlt, 'Fehlende Informationen', 'fehlt') +
      '</div>' +
      '<div class="summary-box"><div class="block-label" style="color:var(--ki-ink)">' + FL.icon('ki') + 'Einschätzung der KI – in einfachen Worten</div><ul>' +
        z.kurz.map(function (t) { return '<li>' + richText(t) + '</li>'; }).join('') +
      '</ul><p class="xs muted" style="margin:12px 0 0">' + esc(z.kiHinweis) + '</p></div>' +
      '<h3>Erkannte Produktdaten</h3><p class="small muted">Diese Angaben wurden direkt aus den Unterlagen gelesen. Klicken Sie auf eine Quelle, um die Textstelle zu sehen.</p>' +
      facts(z.fakten) +
      '<h3>Ausgewertete Unterlagen</h3>' +
      '<div class="table-wrap"><table class="data stack"><thead><tr><th>Unterlage</th><th>Stand</th><th>Umfang</th><th>Status</th></tr></thead><tbody>' + docsRows + '</tbody></table></div>';
  }

  function kpi(n, label, level) {
    return '<div class="kpi"><div class="k-num">' + n + '</div><div class="k-label">' + FL.icon(FL.LEVELS[level].icon) + esc(label) + '</div></div>';
  }

  function renderKosten() {
    const k = B.kosten;
    const rows = k.tabelle.map(function (r) {
      const fonds = r.werte.filter(function (w) { return w.beleg && !istBank(w.beleg); });
      const bank = r.werte.filter(function (w) { return w.beleg && istBank(w.beleg); });
      const missing = r.werte.some(function (w) { return w.fehlt; });
      function cell(list) {
        if (!list.length) return '<span class="muted">' + (missing ? 'Keine Angabe gefunden' : '—') + '</span>';
        return list.map(function (w) {
          return '<span class="num-val"><strong>' + esc(w.text) + '</strong></span><div class="src-row">' + srcBtn(w.belegId || { dok: w.beleg.dok, seite: w.beleg.seite, wert: w.text, label: r.art, sicherheit: r.sicherheit }) + '</div>';
        }).join('');
      }
      const statusLabel = { info: 'Zur Information', unklar: 'Unklar', niedrig: 'Unauffällig', fehlt: 'Fehlt', mittel: 'Beachten', hoch: 'Wichtig' }[r.status] || 'Zur Information';
      return '<tr><th scope="row" data-label="Kostenart"><strong>' + esc(r.art) + '</strong><span class="explain">' + esc(r.erklaerung) + '</span></th>' +
        '<td data-label="Laut Fondsgesellschaft">' + cell(fonds) + '</td>' +
        '<td data-label="Laut Bank">' + cell(bank) + '</td>' +
        '<td data-label="Status">' + FL.chip(r.status, statusLabel) + (r.notiz ? '<span class="explain xs" style="margin-top:8px">' + esc(r.notiz) + '</span>' : '') + '</td></tr>';
    }).join('');

    const ex = k.beispiel;
    return sectionHead(2, 'kosten', 'Kosten', k.einleitung) +
      '<div class="table-wrap"><table class="data stack costs"><caption class="sr-only">Kostenübersicht aus Fondsunterlagen und Bankunterlagen</caption>' +
      '<thead><tr><th scope="col">Kostenart</th><th scope="col">Laut Fondsgesellschaft</th><th scope="col">Laut Bank</th><th scope="col">Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (ex ? '<div class="card" style="margin-bottom:24px"><h3>' + esc(ex.titel) + '</h3>' +
        '<div class="from-doc"><div class="block-label">' + FL.icon('doc') + 'Aus den Unterlagen</div><p class="small" style="margin:0 0 8px">' + esc(ex.text) + '</p>' +
        '<div class="cost-example">' + ex.werte.map(function (w) {
          const sich = w.belegId && B.belege[w.belegId] ? B.belege[w.belegId].sicherheit : 'hoch';
          return '<div class="ce"><b>' + esc(w.betrag) + '</b><span>' + esc(w.label) + '</span><div class="src-row" style="margin-top:8px">' + srcBtn(w.belegId || { dok: w.beleg.dok, seite: w.beleg.seite, wert: w.betrag + ' – ' + w.label, label: 'Kosten im Zeitverlauf', sicherheit: 'hoch' }) + FL.confidence(sich) + '</div></div>';
        }).join('') + '</div></div>' +
        (ex.ki ? '<div class="ki" style="margin-top:12px"><div class="block-label">' + FL.icon('ki') + 'Einschätzung der KI</div><p>' + esc(ex.ki) + '</p></div>' : '') +
      '</div>' : '') +
      (k.befunde.length ? '<h3>Auffälligkeiten bei den Kosten</h3>' + k.befunde.map(function (f) { return finding(f, LEVEL_LABEL_GENERIC); }).join('') : '');
  }

  function renderRisiken() {
    const r = B.risiken;
    let sri = '';
    for (let i = 1; i <= 7; i++) sri += '<span class="' + (i === r.sri.wert ? 'on' : '') + '">' + i + (i === r.sri.wert ? '<span class="sr-only"> (eingestuft)</span>' : '') + '</span>';
    return sectionHead(3, 'risiken', 'Risiken', r.einleitung) +
      '<div class="card" style="margin-bottom:24px"><h3>Gesetzlicher Risikoindikator (SRI)</h3>' +
        '<p class="small muted">Jedes Basisinformationsblatt ordnet ein Produkt auf einer Skala von 1 (geringeres Risiko) bis 7 (höheres Risiko) ein. Die Skala berücksichtigt Schwankungen und die Gefahr, dass der Anbieter nicht zahlen kann.</p>' +
        '<div class="sri" role="img" aria-label="' + (r.sri.wert ? 'Risikoklasse ' + r.sri.wert + ' von 7' : 'Risikoklasse nicht gefunden') + '">' + sri + '</div>' +
        '<div class="sri-legend"><span>1 · geringeres Risiko</span><span>7 · höheres Risiko</span></div>' +
        (r.sri.wert && r.sri.belegId
          ? '<div class="src-row" style="margin-top:12px"><span class="chip chip-doc">' + FL.icon('doc') + 'Aus den Unterlagen</span>' + srcBtn(r.sri.belegId) + FL.confidence((B.belege[r.sri.belegId] || {}).sicherheit || 'hoch') + '</div>'
          : '<div class="src-row" style="margin-top:12px">' + FL.chip('fehlt', 'Risikoklasse nicht in den Unterlagen gefunden') + '</div>') +
      '</div>' +
      r.befunde.map(function (f) { return finding(f, LEVEL_LABEL_RISK); }).join('');
  }

  function renderLaufzeit() {
    const l = B.laufzeit;
    return sectionHead(4, 'laufzeit', 'Laufzeit und Rückgabe', 'Wie lange ist Ihr Geld gebunden, und wie kommen Sie wieder heran?') +
      (l.fakten.length ? facts(l.fakten) : '') +
      l.befunde.map(function (f) { return finding(f, LEVEL_LABEL_GENERIC); }).join('') +
      (!l.fakten.length && !l.befunde.length ? '<p class="muted">Zu Laufzeit und Rückgabe wurden in den Unterlagen keine Angaben gefunden.</p>' : '');
  }

  function renderAbgleich() {
    const a = B.abgleich;
    const rows = a.zeilen.map(function (z) {
      const m = FL.MATCH[z.ergebnis] || FL.MATCH.unklar;
      function side(s) {
        if (!s) return '<span class="muted">Keine Angabe</span>';
        if (!s.beleg) return '<span class="muted">' + esc(s.text) + '</span>';
        return esc(s.text) + '<div class="src-row">' + srcBtn(s.belegId || { dok: s.beleg.dok, seite: s.beleg.seite, wert: s.text, label: z.merkmal, sicherheit: s.beleg.dok === 'D4' ? 'mittel' : 'hoch' }) + '</div>';
      }
      return '<tr><th scope="row" data-label="Merkmal"><strong>' + esc(z.merkmal) + '</strong></th>' +
        '<td data-label="Laut Fondsunterlagen">' + side(z.fonds) + '</td>' +
        '<td data-label="Laut Bank / Protokoll">' + side(z.bank) + '</td>' +
        '<td data-label="Ergebnis"><span class="chip chip-' + m.cls + '">' + FL.icon(m.icon) + m.label + '</span></td></tr>' +
        '<tr class="ki-row"><td colspan="4"><div class="ki"><p><span class="block-label" style="display:inline-flex;margin:0 8px 0 0">' + FL.icon('ki') + 'Einschätzung der KI</span>' + esc(z.ki) +
          (z.fragen.length ? ' <a class="xs" href="#q-' + safeId(z.fragen[0]) + '">Passende Frage ansehen</a>' : '') + '</p></div></td></tr>';
    }).join('');
    if (!a.zeilen.length) {
      return sectionHead(5, 'abgleich', 'Abgleich mit der Bankempfehlung', a.einleitung) +
        '<p><a class="btn btn-secondary" href="upload.html">' + FL.icon('upload') + 'Beratungsprotokoll hochladen</a></p>';
    }
    return sectionHead(5, 'abgleich', 'Abgleich mit der Bankempfehlung', a.einleitung) +
      '<div class="table-wrap"><table class="data stack compare"><caption class="sr-only">Abgleich zwischen Fondsunterlagen und Bankempfehlung</caption>' +
      '<thead><tr><th scope="col">Merkmal</th><th scope="col">Laut Fondsunterlagen</th><th scope="col">Laut Bank / Protokoll</th><th scope="col">Ergebnis</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="notice">' + FL.icon('info') + '<p>Die Spalte „Ergebnis“ ist ein automatischer Vergleich der KI.' + (Object.keys(B.dokumente).some(function (k) { return BANK_TYPEN.indexOf(B.dokumente[k].typ) !== -1 && B.dokumente[k].sicherheit !== 'hoch'; }) ? ' Ein Teil der Bankunterlagen ist ein Scan; diese Angaben wurden per Bilderkennung gelesen.' : '') + '</p></div>';
  }

  function renderVertrag() {
    const v = B.vertrag;
    return sectionHead(6, 'vertrag', 'Auffällige oder unklare Vertragsstellen', v.einleitung) +
      (v.befunde.length ? v.befunde.map(function (f) { return finding(f, LEVEL_LABEL_GENERIC); }).join('') : '<p class="muted">Keine auffälligen Vertragsstellen gefunden.</p>');
  }

  function renderFehlend() {
    const f = B.fehlend;
    return sectionHead(7, 'fehlend', 'Fehlende Informationen', f.einleitung) +
      f.befunde.map(function (x) { return finding(x, LEVEL_LABEL_GENERIC); }).join('') +
      '<p><a class="btn btn-secondary" href="upload.html">' + FL.icon('upload') + 'Fehlende Unterlagen nachreichen</a></p>';
  }

  function renderFragen() {
    const total = B.fragen.reduce(function (s, g) { return s + g.items.length; }, 0);
    return sectionHead(8, 'fragen', 'Fragen an die Bank', 'Diese Fragen ergeben sich aus den Abweichungen, Unklarheiten und Lücken oben. Wählen Sie aus, was Sie fragen möchten, und nehmen Sie die Liste mit ins Gespräch.') +
      '<div class="q-toolbar no-print"><span class="q-count" id="q-count" aria-live="polite">' + total + ' von ' + total + ' Fragen ausgewählt</span>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="q-copy">' + FL.icon('copy') + 'Ausgewählte kopieren</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="q-dl">' + FL.icon('download') + 'Als Textdatei laden</button>' +
      '</div>' +
      B.fragen.map(function (g) {
        return '<div class="q-group"><h3>' + esc(g.gruppe) + '</h3>' + g.items.map(function (q) {
          const qid = safeId(q.id);
          return '<div class="q-item" id="q-' + qid + '"><input type="checkbox" id="qc-' + qid + '" checked data-q="' + qid + '">' +
            '<div><label for="qc-' + qid + '">' + esc(q.text) + '</label><div class="q-why">Anlass: ' + esc(q.warum) + '</div></div></div>';
        }).join('') + '</div>';
      }).join('');
  }

  // ---------- Zählung ----------
  function allFindings() {
    return [].concat(B.kosten.befunde, B.risiken.befunde, B.laufzeit.befunde, B.vertrag.befunde, B.fehlend.befunde);
  }
  function countAll() {
    const fs = allFindings();
    const kostenUnklar = B.kosten.tabelle.filter(function (r) { return r.status === 'unklar'; }).length;
    return {
      abweichung: B.abgleich.zeilen.filter(function (z) { return z.ergebnis === 'abweichung'; }).length,
      hoch: fs.filter(function (f) { return f.stufe === 'hoch'; }).length,
      unklar: fs.filter(function (f) { return f.stufe === 'unklar'; }).length + B.abgleich.zeilen.filter(function (z) { return z.ergebnis === 'unklar'; }).length,
      fehlt: fs.filter(function (f) { return f.stufe === 'fehlt'; }).length + B.zusammenfassung.fakten.filter(function (f) { return f.fehlt; }).length,
      kostenUnklar: kostenUnklar
    };
  }

  // ---------- Quellen-Dialog ----------
  function openSource(idx, trigger) {
    const s = sources[idx];
    const dlg = document.getElementById('quelle');
    const d = B.dokumente[s.dok];
    dlg.querySelector('#quelle-titel').textContent = d.name + ' – Seite ' + s.seite;
    const PRUEF = {
      bestaetigt: ['niedrig', 'Zitat automatisch auf dieser Seite gefunden'],
      korrigiert: ['niedrig', 'Zitat automatisch gefunden, Seitenzahl korrigiert'],
      ungeprueft: ['mittel', 'Seite ist ein Scan – Zitat nicht maschinell prüfbar, bitte im Original prüfen']
    };
    let body = '<p class="small muted" style="margin-bottom:12px">Datei: ' + esc(d.datei) + ' · Stand ' + esc(d.stand) + '</p>' +
      '<div class="page-sheet"><div class="ps-head"><span>' + esc(d.name) + '</span><span>Seite ' + s.seite + ' von ' + (d.seitenErwartet || d.seiten) + '</span></div>';
    if (s.zitat) {
      body += (s.vor ? '<p class="ctx">' + esc(s.vor) + '</p>' : '') + '<p><mark>' + esc(s.zitat) + '</mark></p>' + (s.nach ? '<p class="ctx">' + esc(s.nach) + '</p>' : '');
    } else {
      body += '<p class="ctx">… ' + esc(s.label || '') + ' …</p><p><mark>' + esc(s.wert || '') + '</mark></p>';
    }
    body += '</div>' +
      '<div class="src-row" style="margin-top:16px">' + FL.confidence(s.sicherheit || 'hoch') + (s.pruefung && PRUEF[s.pruefung] ? FL.chip(PRUEF[s.pruefung][0], PRUEF[s.pruefung][1]) : '') + '</div>' +
      '<div class="notice" style="margin-top:16px">' + FL.icon('info') + '<p>' + (B.echt
        ? 'Hier sehen Sie den Textausschnitt aus Ihrer Datei mit etwas Umgebung. Maßgeblich ist immer Ihr Originaldokument.'
        : 'Beispiel: Hier wird ein Textausschnitt gezeigt. Geplant ist, die Originalseite des Dokuments mit markierter Fundstelle anzuzeigen.') + '</p></div>';
    dlg.querySelector('.dlg-body').innerHTML = body;
    dlg._trigger = trigger;
    dlg.showModal();
  }

  // ---------- Export ----------
  function questionsText(onlySelected) {
    const lines = ['Fragen an die Bank – ' + B.fonds, ''];
    B.fragen.forEach(function (g) {
      const items = g.items.filter(function (q) {
        if (!onlySelected) return true;
        const cb = document.getElementById('qc-' + safeId(q.id));
        return cb && cb.checked;
      });
      if (!items.length) return;
      lines.push(g.gruppe.toUpperCase());
      items.forEach(function (q) { lines.push('[ ] ' + q.text); });
      lines.push('');
    });
    return lines.join('\n');
  }

  function srcText(b) { return b && B.dokumente[b.dok] ? '[' + B.dokumente[b.dok].name + ', S. ' + b.seite + ']' : ''; }

  function reportText() {
    const L = [];
    const hr = '------------------------------------------------------------';
    L.push('ANALYSEBERICHT – ' + B.fonds, 'Bericht-Nr. ' + B.id + ' · erstellt am ' + B.erstellt, '');
    L.push('WICHTIGER HINWEIS: Dieser Bericht bietet eine Orientierung und ersetzt keine individuelle Anlageberatung. Er enthält keine Kauf- oder Verkaufsempfehlung. Angaben ohne Quelle sind Einschätzungen der KI.', '');
    L.push(hr, '1. KURZE ZUSAMMENFASSUNG (Einschätzung der KI)', hr);
    B.zusammenfassung.kurz.forEach(function (t) { L.push('- ' + t.replace(/<[^>]+>/g, '').replace(/\*\*/g, '')); });
    L.push('', 'Erkannte Produktdaten (aus den Unterlagen):');
    B.zusammenfassung.fakten.forEach(function (f) { L.push('- ' + f.label + ': ' + f.wert + (f.beleg ? ' ' + srcText(f.beleg) + ' (Erkennung: ' + f.sicherheit + ')' : ' (FEHLT)')); });
    L.push('', hr, '2. KOSTEN', hr);
    B.kosten.tabelle.forEach(function (r) {
      L.push('- ' + r.art + ': ' + r.werte.map(function (w) { return w.fehlt ? w.text : w.text + ' ' + srcText(w.beleg); }).join(' | '));
      L.push('  Erklärung: ' + r.erklaerung);
    });
    function fx(f) {
      L.push('', '* ' + f.titel + ' [' + (FL.LEVELS[f.stufe] || {}).label + ']', '  ' + f.klartext);
      (f.belege || []).forEach(function (id) { const b = B.belege[id]; L.push('  Aus den Unterlagen: „' + b.zitat + '“ ' + srcText(b)); });
      (f.ki || []).forEach(function (t) { L.push('  Einschätzung der KI: ' + t); });
      if (f.sicherheit) L.push('  Erkennungssicherheit: ' + f.sicherheit);
    }
    B.kosten.befunde.forEach(fx);
    L.push('', hr, '3. RISIKEN', hr, B.risiken.sri.wert ? 'Risikoklasse (SRI): ' + B.risiken.sri.wert + ' von 7 ' + srcText(B.risiken.sri.beleg) : 'Risikoklasse (SRI): nicht gefunden');
    B.risiken.befunde.forEach(fx);
    L.push('', hr, '4. LAUFZEIT UND RÜCKGABE', hr);
    B.laufzeit.fakten.forEach(function (f) { L.push('- ' + f.label + ': ' + f.wert + (f.beleg ? ' ' + srcText(f.beleg) : ' (FEHLT)')); });
    B.laufzeit.befunde.forEach(fx);
    L.push('', hr, '5. ABGLEICH MIT DER BANKEMPFEHLUNG', hr);
    B.abgleich.zeilen.forEach(function (z) {
      L.push('- ' + z.merkmal + ' → ' + FL.MATCH[z.ergebnis].label);
      L.push('  Fonds: ' + (z.fonds ? z.fonds.text + ' ' + srcText(z.fonds.beleg) : 'keine Angabe'));
      L.push('  Bank:  ' + (z.bank ? z.bank.text + ' ' + srcText(z.bank.beleg) : 'keine Angabe'));
      L.push('  Einschätzung der KI: ' + z.ki);
    });
    L.push('', hr, '6. AUFFÄLLIGE ODER UNKLARE VERTRAGSSTELLEN', hr);
    B.vertrag.befunde.forEach(fx);
    L.push('', hr, '7. FEHLENDE INFORMATIONEN', hr);
    B.fehlend.befunde.forEach(fx);
    L.push('', hr, '8. FRAGEN AN DIE BANK', hr, questionsText(true));
    return L.join('\n');
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { FL.toast('Fragen in die Zwischenablage kopiert.'); }, fallback);
    } else { fallback(); }
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); FL.toast('Fragen in die Zwischenablage kopiert.'); } catch (e) { FL.toast('Kopieren nicht möglich – bitte „Als Textdatei laden“ nutzen.'); }
      ta.remove();
    }
  }

  // ---------- Inhaltsverzeichnis ----------
  function initToc() {
    const links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
    const map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          const a = map[e.target.id];
          if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-90px 0px -65% 0px' });
    document.querySelectorAll('.r-section').forEach(function (s) { obs.observe(s); });
  }

  function initCounts() {
    const c = countAll();
    const set = function (id, n, word) {
      const el = document.querySelector('[data-count="' + id + '"]');
      if (!el) return;
      el.textContent = n;
      el.title = n + ' ' + word;
      el.insertAdjacentHTML('beforeend', '<span class="sr-only"> ' + word + '</span>');
    };
    set('kosten', B.kosten.befunde.length, 'Hinweise');
    set('risiken', B.risiken.befunde.length, 'Risiken');
    set('abgleich', c.abweichung, 'Abweichungen');
    set('vertrag', B.vertrag.befunde.length, 'Vertragsstellen');
    set('fehlend', B.fehlend.befunde.length, 'Lücken');
    set('fragen', B.fragen.reduce(function (s, g) { return s + g.items.length; }, 0), 'Fragen');
  }

  function render() {
    document.querySelector('[data-r="titel"]').textContent = B.fonds;
    document.querySelector('[data-r="meta-id"]').textContent = 'Bericht-Nr. ' + B.id;
    document.querySelector('[data-r="meta-datum"]').textContent = 'Erstellt am ' + B.erstellt;
    const nDocs = Object.keys(B.dokumente).length;
    document.querySelector('[data-r="meta-docs"]').textContent = nDocs + (nDocs === 1 ? ' Unterlage' : ' Unterlagen') + ' ausgewertet';
    document.querySelector('[data-r="eyebrow"]').textContent = B.echt ? 'Analysebericht' : 'Analysebericht · Beispiel mit fiktiven Daten';
    document.title = (B.echt ? 'Analysebericht: ' : 'Beispielbericht: ') + B.fonds + ' – Fondslupe';

    const R = {
      zusammenfassung: renderZusammenfassung, kosten: renderKosten, risiken: renderRisiken, laufzeit: renderLaufzeit,
      abgleich: renderAbgleich, vertrag: renderVertrag, fehlend: renderFehlend, fragen: renderFragen
    };
    Object.keys(R).forEach(function (id) {
      const el = document.getElementById(id);
      el.setAttribute('aria-labelledby', id + '-titel');
      el.innerHTML = R[id]();
    });
    initCounts();
    initToc();

    // Fragen
    const total = B.fragen.reduce(function (s, g) { return s + g.items.length; }, 0);
    document.getElementById('fragen').addEventListener('change', function () {
      const n = document.querySelectorAll('[data-q]:checked').length;
      document.getElementById('q-count').textContent = n + ' von ' + total + ' Fragen ausgewählt';
    });
    document.getElementById('q-copy').addEventListener('click', function () { copy(questionsText(true)); });
    document.getElementById('q-dl').addEventListener('click', function () { download('Fragen-an-die-Bank.txt', questionsText(true)); FL.toast('Fragenliste heruntergeladen.'); });

    const note = document.getElementById('report-note');
    if (B.echt) {
      const navLink = document.querySelector('.nav a[aria-current="page"]');
      if (navLink) navLink.removeAttribute('aria-current');
      const p = B.pruefung || {};
      note.querySelector('div').innerHTML =
        '<p><strong>Automatische Belegprüfung:</strong> ' + ((p.bestaetigt || 0) + (p.korrigiert || 0)) + ' von ' + (p.gesamt || 0) + ' Fundstellen wurden wörtlich im Dokument wiedergefunden' +
        (p.ungeprueft ? ', ' + p.ungeprueft + ' stammen von Scans und konnten nicht maschinell geprüft werden' : '') + '.' +
        (p.verworfen ? ' ' + p.verworfen + ' Aussage(n) der KI ließen sich nicht im Dokument finden und wurden verworfen.' : '') + '</p>' +
        '<p>Dieser Bericht wird 24 Stunden nach der Analyse automatisch gelöscht. Speichern Sie ihn als PDF oder Textdatei, wenn Sie ihn behalten möchten.</p>';
      note.hidden = false;
      const del = document.getElementById('act-save');
      del.innerHTML = FL.icon('trash') + 'Bericht jetzt löschen';
      del.addEventListener('click', function () {
        if (!window.confirm('Bericht „' + B.fonds + '“ jetzt endgültig löschen? Der Link funktioniert danach nicht mehr.')) return;
        fetch('/api/analysen/' + encodeURIComponent(JOB_ID), { method: 'DELETE' }).then(function () {
          window.location.href = 'upload.html';
        }, function () { FL.toast('Löschen ist gerade nicht möglich. Bitte versuchen Sie es erneut.'); });
      });
    } else {
      document.getElementById('act-save').addEventListener('click', function () {
        FL.toast('Beispielbericht: Speichern ist hier nur angedeutet. Nutzen Sie „Als PDF speichern“.');
      });
    }
  }

  const JOB_ID = new URLSearchParams(window.location.search).get('id');

  function showLoadError(text) {
    const main = document.querySelector('.report-layout');
    main.innerHTML = '<div></div><div><div class="card" role="alert"><h2 style="font-size:var(--fs-lg);display:flex;gap:8px;align-items:center">' + FL.icon('unklar') + 'Bericht nicht verfügbar</h2>' +
      '<p>' + esc(text) + '</p><div class="form-actions" style="margin-top:0"><a class="btn btn-primary" href="upload.html">Neue Analyse starten</a><a class="btn btn-secondary" href="bericht.html">Beispielbericht ansehen</a></div></div></div>';
    document.querySelector('[data-r="titel"]').textContent = 'Bericht nicht verfügbar';
    document.querySelector('.report-actions').hidden = true;
    document.querySelector('.report-meta').hidden = true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    FL = window.FL; esc = FL.escapeHtml;

    // Quellen-Dialog
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.src-btn');
      if (btn) openSource(Number(btn.getAttribute('data-src')), btn);
    });
    const dlg = document.getElementById('quelle');
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (dlg._trigger) dlg._trigger.focus(); });

    // Bericht-Aktionen
    document.getElementById('act-print').addEventListener('click', function () { window.print(); });
    document.getElementById('act-download').addEventListener('click', function () {
      download('Analysebericht-' + B.id + '.txt', reportText());
      FL.toast('Bericht als Textdatei heruntergeladen.');
    });

    if (!JOB_ID) { B = window.BERICHT; render(); return; }
    document.querySelector('[data-r="titel"]').textContent = 'Bericht wird geladen …';
    fetch('/api/analysen/' + encodeURIComponent(JOB_ID) + '/bericht', { cache: 'no-store' }).then(function (r) {
      return r.json().then(function (body) { return { ok: r.ok, body: body }; });
    }).then(function (res) {
      if (!res.ok) { showLoadError(res.body.fehler || 'Der Bericht konnte nicht geladen werden.'); return; }
      B = res.body; render();
    }).catch(function () {
      showLoadError('Der Bericht konnte nicht geladen werden. Bitte prüfen Sie Ihre Internetverbindung und laden Sie die Seite neu.');
    });
  });
})();
