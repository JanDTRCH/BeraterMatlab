/* Upload-Seite: Dateien auswählen, Dokumenttyp zuordnen, an den Server übertragen. */
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
    [/kid|basisinfo|wesentliche.?anleger|priip/i, 'kid'],
    [/prospekt|anlagebeding|vertrag|satzung/i, 'prospekt'],
    [/kosten|ex.?ante|preis/i, 'kosten'],
    [/protokoll|geeignet|beratung/i, 'protokoll'],
    [/produktinfo|\bpib\b/i, 'pib'],
    [/empfehlung|anschreiben|angebot/i, 'empfehlung']
  ];
  const MB = 1024 * 1024;
  const MAX = 20 * MB;
  let maxGesamt = 25 * MB;
  const MAX_FILES = 10;

  let files = [];
  let seq = 0;
  let status = { ki: false, zugangscode: false, geladen: false };
  let busy = false;
  let FL;

  function detect(name) {
    for (let i = 0; i < RULES.length; i++) if (RULES[i][0].test(name)) return RULES[i][1];
    return '';
  }

  function validate(f) {
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return 'Dieses Dateiformat können wir nicht lesen. Bitte laden Sie eine PDF-, JPG- oder PNG-Datei hoch.';
    if (f.size > MAX) return 'Die Datei ist größer als 20 MB. Bitte teilen Sie sie auf oder speichern Sie sie mit geringerer Auflösung.';
    if (f.size === 0) return 'Die Datei ist leer. Bitte wählen Sie die Datei erneut aus.';
    return '';
  }

  function add(list) {
    const errs = [];
    Array.prototype.forEach.call(list, function (f) {
      if (files.length >= MAX_FILES) { errs.push('Maximal 10 Dateien pro Analyse. „' + f.name + '“ wurde nicht hinzugefügt.'); return; }
      if (files.some(function (x) { return x.name === f.name && x.size === f.size; })) return;
      const err = validate(f);
      const type = detect(f.name);
      files.push({ id: 'f' + (++seq), file: f, name: f.name, size: f.size, type: type, auto: !!type, error: err });
    });
    hideError('files-error');
    render();
    if (errs.length) showError('files-error', errs.join(' '));
  }

  function statusChip(f) {
    if (f.error) return '<span class="chip chip-hoch">' + FL.icon('hoch') + 'Nicht möglich</span>';
    if (!f.type) return '<span class="chip chip-unklar">' + FL.icon('unklar') + 'Typ unklar</span>';
    return '<span class="chip chip-niedrig">' + FL.icon('niedrig') + 'Bereit</span>';
  }

  function render() {
    const ul = document.getElementById('file-list');
    ul.innerHTML = files.map(function (f) {
      const opts = TYPES.map(function (t) { return '<option value="' + t.id + '"' + (t.id === f.type ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
      const typeRow = f.error
        ? '<p class="field-error" style="margin:0">' + FL.icon('mittel') + '<span>' + FL.escapeHtml(f.error) + '</span></p>'
        : '<label for="t-' + f.id + '">Dokumenttyp</label><select id="t-' + f.id + '" data-type-for="' + f.id + '"' + (busy ? ' disabled' : '') + '>' + opts + '</select>' +
          '<span class="xs muted">' + (f.type ? (f.auto ? 'Vorläufig anhand des Dateinamens erkannt – die KI prüft den Inhalt.' : 'Von Ihnen ausgewählt.') : 'Bitte wählen Sie aus, um welches Dokument es sich handelt.') + '</span>';
      return '<li class="file-item" data-id="' + f.id + '">' +
        '<span class="f-icon">' + FL.icon('doc') + '</span>' +
        '<div><div class="f-name">' + FL.escapeHtml(f.name) + '</div><div class="f-meta">' + FL.formatBytes(f.size) + '</div></div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + statusChip(f) +
          '<button type="button" class="btn btn-ghost btn-icon btn-sm" data-remove="' + f.id + '" aria-label="Datei entfernen: ' + FL.escapeHtml(f.name) + '" title="Datei entfernen"' + (busy ? ' disabled' : '') + '>' + FL.icon('trash') + '</button></div>' +
        '<div class="f-type">' + typeRow + '</div></li>';
    }).join('');
    updateChecklist();
  }

  function updateChecklist() {
    const present = {};
    files.forEach(function (f) { if (!f.error && f.type) present[f.type] = true; });
    document.querySelectorAll('#checklist li').forEach(function (li) {
      const on = !!present[li.getAttribute('data-type')];
      li.classList.toggle('is-present', on);
      li.querySelector('.ck').innerHTML = FL.icon(on ? 'niedrig' : 'fehlt') + '<span class="sr-only">' + (on ? 'vorhanden' : 'noch nicht hinzugefügt') + '</span>';
    });
  }

  function showError(id, text) {
    const el = document.getElementById(id);
    if (text) el.querySelector('span').textContent = text;
    el.hidden = false;
  }
  function hideError(id) { const el = document.getElementById(id); if (el) el.hidden = true; }

  function setBusy(on) {
    busy = on;
    const btn = document.getElementById('start-btn');
    btn.setAttribute('aria-disabled', on ? 'true' : 'false');
    btn.innerHTML = on ? FL.icon('spinner', 'spin') + 'Wird übertragen …' : 'Analyse starten' + FL.icon('arrow');
    document.getElementById('upload-progress').hidden = !on;
    render();
  }

  function progress(pct) {
    document.getElementById('upload-pct').textContent = pct + ' %';
    document.getElementById('upload-bar').style.width = pct + '%';
    document.querySelector('#upload-progress .progress').setAttribute('aria-valuenow', pct);
  }

  function start() {
    if (busy) return;
    hideError('submit-error');
    let ok = true;
    const usable = files.filter(function (f) { return !f.error; });
    if (!status.ki && status.geladen) {
      showError('submit-error', 'Die Analyse ist auf diesem Server noch nicht eingerichtet. Sie können sich die Beispielanalyse ansehen.');
      return;
    }
    if (!usable.length) {
      showError('files-error', 'Bitte fügen Sie mindestens eine Unterlage hinzu – zum Beispiel das Basisinformationsblatt.');
      ok = false;
    } else if (usable.some(function (f) { return !f.type; })) {
      showError('files-error', 'Bei mindestens einer Datei fehlt noch der Dokumenttyp. Bitte wählen Sie ihn in der Liste aus.');
      ok = false;
    } else if (usable.reduce(function (s, f) { return s + f.size; }, 0) > maxGesamt) {
      showError('files-error', 'Die Dateien sind zusammen größer als ' + Math.round(maxGesamt / MB) + ' MB. Bitte entfernen Sie einzelne Dateien oder verkleinern Sie sie.');
      ok = false;
    }
    const code = document.getElementById('zugangscode');
    if (status.zugangscode && !code.value.trim()) { showError('code-error'); ok = false; }
    if (!document.getElementById('consent').checked) { showError('consent-error'); ok = false; }
    if (!ok) {
      const first = document.querySelector('.field-error:not([hidden])');
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const fd = new FormData();
    usable.forEach(function (f) { fd.append('dateien', f.file, f.name); });
    fd.append('typen', JSON.stringify(usable.map(function (f) { return f.type; })));
    fd.append('einwilligung', 'ja');
    if (status.zugangscode) fd.append('zugangscode', code.value.trim());

    setBusy(true);
    progress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/analysen');
    xhr.responseType = 'json';
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) progress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = function () {
      const body = xhr.response || {};
      if (xhr.status === 202 && body.id) {
        FL.store.set('files', usable.map(function (f) { return { name: f.name, size: f.size, type: f.type }; }));
        window.location.href = 'analyse.html?id=' + encodeURIComponent(body.id);
        return;
      }
      setBusy(false);
      if (xhr.status === 403) { showError('code-error', body.fehler); code.focus(); return; }
      showError('submit-error', body.fehler || 'Die Unterlagen konnten nicht übertragen werden. Bitte versuchen Sie es erneut.');
    };
    xhr.onerror = function () {
      setBusy(false);
      showError('submit-error', 'Die Verbindung zum Server ist unterbrochen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    };
    xhr.send(fd);
  }

  function loadStatus() {
    fetch('/api/status').then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (s) {
      status = { ki: !!s.ki, zugangscode: !!s.zugangscode, geladen: true };
      if (s.maxGesamtMB) maxGesamt = s.maxGesamtMB * MB;
      document.getElementById('code-field').hidden = !status.zugangscode;
      if (!status.ki) {
        const box = document.getElementById('ki-status');
        box.querySelector('p').innerHTML = '<strong>Die echte Analyse ist auf diesem Server noch nicht eingerichtet.</strong> Sie können sich die <a href="analyse.html?demo=1">Beispielanalyse</a> mit fiktiven Unterlagen ansehen.';
        box.hidden = false;
      }
    }).catch(function () {
      // Ohne Server (z. B. Datei lokal geöffnet): nur Beispielanalyse möglich
      status = { ki: false, zugangscode: false, geladen: true };
      const box = document.getElementById('ki-status');
      box.querySelector('p').innerHTML = '<strong>Kein Analyse-Server erreichbar.</strong> Diese Seite wurde ohne Server geöffnet. Sie können sich die <a href="analyse.html?demo=1">Beispielanalyse</a> ansehen.';
      box.hidden = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    FL = window.FL;
    const input = document.getElementById('file-input');
    const dz = document.getElementById('dropzone');
    loadStatus();

    input.addEventListener('change', function () { if (!busy) add(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('is-over'); }); });
    dz.addEventListener('drop', function (e) { if (!busy && e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });

    document.getElementById('file-list').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-remove]');
      if (!btn || busy) return;
      const id = btn.getAttribute('data-remove');
      const f = files.find(function (x) { return x.id === id; });
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
      const again = f && document.getElementById('t-' + f.id);
      if (again) again.focus();
    });
    document.getElementById('consent').addEventListener('change', function () { if (this.checked) hideError('consent-error'); });
    document.getElementById('zugangscode').addEventListener('input', function () { hideError('code-error'); });
    document.getElementById('start-btn').addEventListener('click', start);
  });
})();
