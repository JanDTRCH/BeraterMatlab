/* Fondslupe – gemeinsame Funktionen für alle Seiten des Prototyps.
   Hinweis: Im Prototyp verlassen keine Dateien den Browser. Es werden nur
   Dateiname, Größe und Typ gelesen und im sessionStorage gehalten. */

(function () {
  'use strict';

  // ---------- Symbole (SVG-Sprite) ----------
  const ICONS = {
    logo: '<path d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" fill="currentColor"/><path d="M8 12.5h1.4V9.8H8v2.7Zm2-1.9V12.5h1.4v-1.9H10Zm2-1.8v3.7h1.4V8.8H12Z" fill="currentColor"/>',
    hoch: '<path d="M12 3 2 20h20L12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.2" fill="currentColor"/>',
    mittel: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5v5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.3" r="1.2" fill="currentColor"/>',
    niedrig: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 12.3 2.7 2.7L16.2 9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    unklar: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.8" r="1.2" fill="currentColor"/>',
    fehlt: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2.6"/><path d="M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.2" fill="currentColor"/>',
    doc: '<path d="M6 3h8l4 4v14H6V3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v4h4M9 12h6M9 16h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    ki: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17h0A1.5 1.5 0 0 1 4 15.5v-9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 9.5h7M8.5 13h4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    upload: '<path d="M12 16V5m0 0-4.5 4.5M12 5l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m9 12 2.2 2.2L15.5 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    download: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    print: '<path d="M7 9V3h10v6M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    save: '<path d="M6 3h10l4 4v12.5A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H6Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 3v5h7V3M8 21v-6h8v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" fill="none" stroke="currentColor" stroke-width="2"/>',
    arrow: '<path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    spinner: '<path d="M12 3a9 9 0 1 1-9 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    compare: '<path d="M7 4v16M17 4v16M3 9h8M13 15h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10.5h9M4 13.5h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    question: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A1.5 1.5 0 0 1 4 15.5v-9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10.3 8.9a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.9.7-.9 1.2v.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="14.3" r="1" fill="currentColor"/>'
  };

  function icon(name, extraClass) {
    if (!ICONS[name]) return '';
    return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>';
  }

  // Platzhalter <i data-icon="name"></i> durch SVG ersetzen
  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      const name = el.getAttribute('data-icon');
      const cls = el.getAttribute('data-icon-class') || '';
      el.outerHTML = icon(name, cls);
    });
  }

  // ---------- Statusbezeichnungen (immer Text + Symbol) ----------
  const LEVELS = {
    hoch:    { label: 'Hohes Risiko', short: 'Hoch',    icon: 'hoch' },
    mittel:  { label: 'Mittleres Risiko', short: 'Mittel', icon: 'mittel' },
    niedrig: { label: 'Geringes Risiko', short: 'Gering', icon: 'niedrig' },
    unklar:  { label: 'Unklar', short: 'Unklar', icon: 'unklar' },
    fehlt:   { label: 'Fehlt', short: 'Fehlt', icon: 'fehlt' },
    info:    { label: 'Information', short: 'Info', icon: 'info' }
  };
  const MATCH = {
    passt:      { label: 'Stimmt überein', cls: 'niedrig', icon: 'niedrig' },
    abweichung: { label: 'Abweichung', cls: 'hoch', icon: 'hoch' },
    pruefen:    { label: 'Bitte prüfen', cls: 'mittel', icon: 'mittel' },
    unklar:     { label: 'Nicht eindeutig', cls: 'unklar', icon: 'unklar' },
    fehlt:      { label: 'Angabe fehlt', cls: 'fehlt', icon: 'fehlt' }
  };

  function chip(level, text) {
    const l = LEVELS[level] || LEVELS.info;
    return '<span class="chip chip-' + level + '">' + icon(l.icon) + (text || l.label) + '</span>';
  }

  function confidence(level) {
    const map = { hoch: 3, mittel: 2, niedrig: 1 };
    const n = map[level] || 0;
    let bars = '';
    for (let i = 1; i <= 3; i++) bars += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
    return '<span class="conf" title="Wie sicher die Angabe aus dem Dokument erkannt wurde">' +
      '<span class="bars" aria-hidden="true">' + bars + '</span>' +
      'Erkennung: ' + (level ? level.charAt(0).toUpperCase() + level.slice(1) : '–') +
      '<span class="sr-only"> (' + n + ' von 3)</span></span>';
  }

  // ---------- Navigation ----------
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('hauptnavigation');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(message) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = icon('check') + '<span>' + message + '</span>';
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  // ---------- Sitzungsspeicher ----------
  const store = {
    get: function (key, fallback) {
      try { const v = sessionStorage.getItem('fondslupe:' + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { sessionStorage.setItem('fondslupe:' + key, JSON.stringify(value)); } catch (e) { /* Speicher nicht verfügbar */ }
    }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB';
    return (b / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  window.FL = { icon: icon, chip: chip, confidence: confidence, LEVELS: LEVELS, MATCH: MATCH, toast: toast, store: store, escapeHtml: escapeHtml, formatBytes: formatBytes, hydrateIcons: hydrateIcons };

  document.addEventListener('DOMContentLoaded', function () {
    hydrateIcons();
    initNav();
  });
})();
