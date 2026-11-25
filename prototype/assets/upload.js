/* Upload-Seite: Dateien auswählen, Upload simulieren, Dokumenttyp vorläufig erkennen. */
(function () {
  'use strict';

  const TYPES = [
    { id: '', label: 'Bitte auswählen' },
    { id: 'kid', label: 'Basisinformationsblatt (KID)' },
    { id: 'prospekt', label: 'Verkaufsprospekt / Fondsvertrag' },
    { id: 'kosten', label: 'Kostenübersicht' },
    { id: 'protokoll', label: 'Beratungsprotokoll / Geeignetheitserklärung' },
    { id: 'pib', label: 'Produktinformationsblatt' },
    { id: 'empfehlung', label: 'Schriftliche Bankempfehlung' },
    { id: 'sonstiges', label: 'Sonstiges Dokument' }
  ];
  const RULES = [
    [/kid|basisinfo|wesentliche.?anleger/i, 'kid'],
    [/prospekt|anlagebeding|vertrag|satzung/i, 'prospekt'],
    [/kosten|ex.?ante|preis/i, 'kosten'],
    [/protokoll|geeignet|beratung/i, 'protokoll'],
    [/produktinfo|\bpib\b/i, 'pib'],
    [/empfehlung|anschreiben|angebot/i, 'empfehlung']
  ];
  const SAMPLE = [
    { name: 'KID_Musterfonds_Global_Wachstum.pdf', size: 312000 },
    { name: 'Verkaufsprospekt_Musterfonds.pdf', size: 2480000 },
    { name: 'Kosteninformation_Musterbank.pdf', size: 158000 },
    { name: 'Geeignetheitserklaerung_Scan.pdf', size: 3920000 },
    { name: 'Anschreiben_Empfehlung.pdf', size: 96000 }
  ];
  const MAX = 20 * 1024 * 1024;
  const MAX_FILES = 10;

  let files = [];
  let seq = 0;
  let FL;

  function detect(name) {
    for (let i = 0; i < RULES.length; i++) if (RULES[i][0].test(name)) return RULES[i][1];
    return '';
  }

  function validate(f) {
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return 'Dieses Dateiformat können wir nicht lesen. Bitte laden Sie eine PDF-, JPG- oder PNG-Datei hoch.';
    if (f.size > MAX) return 'Die Datei ist größer als 20 MB. Bitte teilen Sie sie auf oder speichern Sie sie mit geringerer Auflösung.';
    return '';
  }

  function add(list) {
    const errs = [];
    Array.prototype.forEach.call(list, function (f) {
      if (files.length >= MAX_FILES) { errs.push('Maximal 10 Dateien pro Analyse. „' + f.name + '“ wurde nicht hinzugefügt.'); return; }
      if (files.some(function (x) { return x.name === f.name && x.size === f.size; })) return;
      const err = validate(f);
      const type = detect(f.name);
      files.push({ id: 'f' + (++seq), name: f.name, size: f.size, type: type, auto: !!type, error: err, progress: err ? 0 : 0, state: err ? 'error' : 'uploading' });
    });
    hideError('files-error');
    render();
    simulate();
    if (errs.length) showError('files-error', errs.join(' '));
  }

  function simulate() {
    files.forEach(function (f) {
      if (f.state !== 'uploading' || f._timer) return;
      f._timer = setInterval(function () {
        f.progress = Math.min(100, f.progress + 18 + Math.random() * 20);
        if (f.progress >= 100) {
          clearInterval(f._timer); f._timer = null;
          f.state = 'done';
          render();
        } else {
          const bar = document.querySelector('[data-bar="' + f.id + '"]');
          if (bar) bar.style.width = f.progress + '%';
        }
      }, 220);
    });
  }

  function statusChip(f) {
    if (f.state === 'error') return '<span class="chip chip-hoch">' + FL.icon('hoch') + 'Nicht hochgeladen</span>';
    if (f.state === 'uploading') return '<span class="chip chip-info">' + FL.icon('spinner', 'spin') + 'Wird hochgeladen …</span>';
    if (!f.type) return '<span class="chip chip-unklar">' + FL.icon('unklar') + 'Typ unklar</span>';
    return '<span class="chip chip-niedrig">' + FL.icon('niedrig') + 'Bereit zur Analyse</span>';
  }

  function render() {
    const ul = document.getElementById('file-list');
    ul.innerHTML = files.map(function (f) {
      const opts = TYPES.map(function (t) { return '<option value="' + t.id + '"' + (t.id === f.type ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
      let typeRow;
      if (f.state === 'error') {
        typeRow = '<p class="field-error" style="margin:0">' + FL.icon('mittel') + '<span>' + FL.escapeHtml(f.error) + '</span></p>';
      } else if (f.state === 'uploading') {
        typeRow = '<div class="progress" aria-hidden="true"><span data-bar="' + f.id + '" style="width:' + f.progress + '%"></span></div>';
      } else {
        typeRow = '<label for="t-' + f.id + '">Dokumenttyp</label><select id="t-' + f.id + '" data-type-for="' + f.id + '">' + opts + '</select>' +
          '<span class="xs muted">' + (f.type ? (f.auto ? 'Vorläufig anhand des Dateinamens erkannt – wird bei der Analyse am Inhalt geprüft.' : 'Von Ihnen ausgewählt.') : 'Bitte wählen Sie aus, um welches Dokument es sich handelt.') + '</span>';
      }
      return '<li class="file-item" data-id="' + f.id + '">' +
        '<span class="f-icon">' + FL.icon('doc') + '</span>' +
        '<div><div class="f-name">' + FL.escapeHtml(f.name) + '</div><div class="f-meta">' + FL.formatBytes(f.size) + '</div></div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + statusChip(f) +
          '<button type="button" class="btn btn-ghost btn-icon btn-sm" data-remove="' + f.id + '" aria-label="Datei entfernen: ' + FL.escapeHtml(f.name) + '" title="Datei entfernen">' + FL.icon('trash') + '</button></div>' +
        '<div class="f-type">' + typeRow + '</div></li>';
    }).join('');
    updateChecklist();
  }

  function updateChecklist() {
    const present = {};
    files.forEach(function (f) { if (f.state === 'done' && f.type) present[f.type] = true; });
    document.querySelectorAll('#checklist li').forEach(function (li) {
      const t = li.getAttribute('data-type');
      const on = !!present[t];
      li.classList.toggle('is-present', on);
      li.querySelector('.ck').innerHTML = FL.icon(on ? 'niedrig' : 'fehlt') + '<span class="sr-only">' + (on ? 'vorhanden' : 'noch nicht hochgeladen') + '</span>';
    });
  }

  function showError(id, text) {
    const el = document.getElementById(id);
    if (text) el.querySelector('span').textContent = text;
    el.hidden = false;
  }
  function hideError(id) { document.getElementById(id).hidden = true; }

  function start() {
    let ok = true;
    const usable = files.filter(function (f) { return f.state !== 'error'; });
    if (!usable.length) {
      showError('files-error', 'Bitte fügen Sie mindestens eine Unterlage hinzu – zum Beispiel das Basisinformationsblatt.');
      ok = false;
    } else if (usable.some(function (f) { return f.state === 'uploading'; })) {
      showError('files-error', 'Einen Moment bitte – es werden noch Dateien hochgeladen.');
      ok = false;
    } else if (usable.some(function (f) { return !f.type; })) {
      showError('files-error', 'Bei mindestens einer Datei fehlt noch der Dokumenttyp. Bitte wählen Sie ihn in der Liste aus.');
      ok = false;
    }
    if (!document.getElementById('consent').checked) { showError('consent-error'); ok = false; }
    if (!ok) {
      const first = document.querySelector('.field-error:not([hidden])');
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    FL.store.set('files', usable.map(function (f) { return { name: f.name, size: f.size, type: f.type, label: (TYPES.find(function (t) { return t.id === f.type; }) || {}).label }; }));
    window.location.href = 'analyse.html';
  }

  document.addEventListener('DOMContentLoaded', function () {
    FL = window.FL;
    const input = document.getElementById('file-input');
    const dz = document.getElementById('dropzone');

    input.addEventListener('change', function () { add(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('is-over'); }); });
    dz.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });

    document.getElementById('sample-btn').addEventListener('click', function () {
      add(SAMPLE);
      FL.toast('5 Beispielunterlagen hinzugefügt.');
    });

    document.getElementById('file-list').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      const id = btn.getAttribute('data-remove');
      const f = files.find(function (x) { return x.id === id; });
      if (f && f._timer) clearInterval(f._timer);
      files = files.filter(function (x) { return x.id !== id; });
      render();
      FL.toast('„' + (f ? f.name : 'Datei') + '“ entfernt.');
      document.getElementById('file-input').focus();
    });
    document.getElementById('file-list').addEventListener('change', function (e) {
      const sel = e.target.closest('[data-type-for]');
      if (!sel) return;
      const f = files.find(function (x) { return x.id === sel.getAttribute('data-type-for'); });
      if (f) { f.type = sel.value; f.auto = false; }
      hideError('files-error');
      render();
      const again = document.getElementById('t-' + f.id);
      if (again) again.focus();
    });
    document.getElementById('consent').addEventListener('change', function () { if (this.checked) hideError('consent-error'); });
    document.getElementById('start-btn').addEventListener('click', start);
  });
})();
