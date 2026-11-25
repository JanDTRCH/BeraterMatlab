/* Analyse-Seite: simulierte Verarbeitung mit verständlichen Statusmeldungen. */
(function () {
  'use strict';

  const STEPS = [
    { title: 'Dateien sicher prüfen', text: 'Wir prüfen, ob die Dateien lesbar und unbeschädigt sind, und scannen sie auf Schadsoftware.', done: 'Alle Dateien sind lesbar.' },
    { title: 'Text erkennen', text: 'Aus PDF-Dateien und Scans wird der Text gelesen. Bei Scans nutzen wir Texterkennung.', done: '172 Seiten gelesen. 1 Scan per Texterkennung verarbeitet.', warn: 'Geeignetheitserklärung ist ein Scan – Handschrift wird nicht zuverlässig erkannt.' },
    { title: 'Dokumenttypen bestimmen', text: 'Wir ordnen jede Unterlage einem Dokumenttyp zu und prüfen, ob sie vollständig ist.', done: '5 Dokumenttypen erkannt.', warn: 'Verkaufsprospekt: nur 60 von 112 Seiten vorhanden.' },
    { title: 'Produktdaten auslesen', text: 'Fondsname, Wertpapierkennung, Laufzeit, Risikoklasse und empfohlene Haltedauer.', done: '11 von 12 Produktdaten gefunden.' },
    { title: 'Kosten und Risiken auswerten', text: 'Wir lesen alle Kostenangaben aus und markieren genannte Risiken.', done: '7 Kostenpositionen, 6 Risiken.' },
    { title: 'Mit der Bankempfehlung abgleichen', text: 'Wir vergleichen die Angaben aus dem Beratungsprotokoll mit den Fondsunterlagen.', done: '8 Merkmale verglichen, 3 Abweichungen.' },
    { title: 'Bericht erstellen', text: 'Wir fassen alles verständlich zusammen und formulieren Fragen an Ihre Bank.', done: 'Bericht mit 14 Fragen erstellt.' }
  ];
  const EARLY = [
    [3, 'Fonds', 'Musterfonds Global Wachstum R'],
    [3, 'Fondsart', 'Aktienfonds, global'],
    [3, 'Risikoklasse', '4 von 7'],
    [4, 'Laufende Kosten', '1,85 % bzw. 1,65 % (unklar)'],
    [5, 'Empfohlene Haltedauer', '7 Jahre']
  ];
  const DEFAULT_FILES = [
    { name: 'KID_Musterfonds_Global_Wachstum.pdf', label: 'Basisinformationsblatt (KID)' },
    { name: 'Verkaufsprospekt_Musterfonds.pdf', label: 'Verkaufsprospekt / Fondsvertrag', warn: 'Unvollständig: 60 von 112 Seiten' },
    { name: 'Kosteninformation_Musterbank.pdf', label: 'Kostenübersicht' },
    { name: 'Geeignetheitserklaerung_Scan.pdf', label: 'Beratungsprotokoll / Geeignetheitserklärung', warn: 'Scan: Erkennung mittel' },
    { name: 'Anschreiben_Empfehlung.pdf', label: 'Schriftliche Bankempfehlung' }
  ];

  let FL, current = -1, timer, cancelled = false;

  function stepHtml(s, i, state) {
    const icons = { done: FL.icon('check'), active: FL.icon('spinner', 'spin'), waiting: '<span class="xs">' + (i + 1) + '</span>', warn: FL.icon('mittel') };
    const labels = { done: 'Erledigt', active: 'Läuft', waiting: 'Wartet', warn: 'Erledigt mit Hinweis' };
    const chipCls = { done: 'niedrig', active: 'info', waiting: 'fehlt', warn: 'mittel' };
    let body = s.text;
    if (state === 'done') body = s.done;
    if (state === 'warn') body = s.done + ' <strong>Hinweis:</strong> ' + s.warn;
    return '<li class="status-step" data-state="' + state + '"><span class="st-icon">' + icons[state] + '</span>' +
      '<div><h3>' + s.title + '</h3><p>' + body + '</p></div>' +
      '<span class="chip chip-' + chipCls[state] + '">' + labels[state] + '</span></li>';
  }

  function render() {
    document.getElementById('steps').innerHTML = STEPS.map(function (s, i) {
      let st = 'waiting';
      if (i < current) st = s.warn ? 'warn' : 'done';
      else if (i === current) st = 'active';
      return stepHtml(s, i, st);
    }).join('');
    const pct = Math.round(Math.max(0, current) / STEPS.length * 100);
    document.getElementById('overall-pct').textContent = pct + ' %';
    const bar = document.getElementById('overall-bar');
    bar.setAttribute('aria-valuenow', pct);
    bar.querySelector('span').style.width = pct + '%';
    document.getElementById('overall-text').textContent = current < STEPS.length
      ? 'Schritt ' + (current + 1) + ' von ' + STEPS.length + ': ' + STEPS[Math.max(0, current)].title
      : 'Analyse abgeschlossen';

    const early = EARLY.filter(function (e) { return e[0] < current; });
    if (early.length) {
      document.getElementById('early').innerHTML = early.map(function (e) {
        return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid var(--line)"><dt class="muted">' + e[1] + '</dt><dd style="margin:0;font-weight:600;text-align:right">' + e[2] + '</dd></div>';
      }).join('');
    }
    renderDocs();
  }

  function renderDocs() {
    const stored = FL.store.get('files', []);
    const list = stored.length ? stored.map(function (f) {
      const def = DEFAULT_FILES.find(function (d) { return d.name === f.name; });
      return { name: f.name, label: f.label || 'Dokument', warn: def && def.warn };
    }) : DEFAULT_FILES;
    document.getElementById('doc-status').innerHTML = list.map(function (d) {
      let chip;
      if (current <= 0) chip = '<span class="chip chip-fehlt">' + FL.icon('clock') + 'Wartet</span>';
      else if (current < 3) chip = '<span class="chip chip-info">' + FL.icon('spinner', 'spin') + 'Wird gelesen</span>';
      else if (d.warn) chip = '<span class="chip chip-mittel">' + FL.icon('mittel') + 'Gelesen, mit Hinweis</span>';
      else chip = '<span class="chip chip-niedrig">' + FL.icon('niedrig') + 'Gelesen</span>';
      return '<li><span class="d-name">' + FL.escapeHtml(d.name) + '</span>' + chip +
        '<span class="d-meta">' + FL.escapeHtml(d.label) + (current >= 3 && d.warn ? ' · ' + d.warn : '') + '</span></li>';
    }).join('');
  }

  function next() {
    if (cancelled) return;
    current++;
    render();
    if (current < STEPS.length) {
      if (current > 0) announce('Erledigt: ' + STEPS[current - 1].title + '. Jetzt: ' + STEPS[current].title + '.');
      timer = setTimeout(next, 1100 + Math.random() * 600);
    } else {
      finish();
    }
  }

  function announce(t) { document.getElementById('live').textContent = t; }

  function finish() {
    announce('Analyse abgeschlossen. Ihr Bericht ist fertig.');
    document.getElementById('analyse-titel').textContent = 'Analyse abgeschlossen';
    document.getElementById('analyse-lead').textContent = 'Ihr Bericht ist fertig. Bitte beachten Sie die Hinweise zu unvollständigen Unterlagen.';
    document.getElementById('done-box').hidden = false;
    document.getElementById('cancel-row').hidden = true;
    document.querySelectorAll('.flow li')[1].classList.add('done');
    document.getElementById('to-report').focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    FL = window.FL;
    render();
    timer = setTimeout(next, 500);
    document.getElementById('cancel-btn').addEventListener('click', function () {
      if (window.confirm('Analyse abbrechen und alle hochgeladenen Unterlagen löschen? Dies kann nicht rückgängig gemacht werden.')) {
        cancelled = true; clearTimeout(timer);
        FL.store.set('files', []);
        window.location.href = 'upload.html';
      }
    });
  });
})();
