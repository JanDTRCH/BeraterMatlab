/* Analyse-Seite
   - analyse.html?id=…   echter Auftrag: Status wird beim Server abgefragt
   - analyse.html?demo=1 Beispielanalyse mit fiktiven Unterlagen (simuliert) */
(function () {
  'use strict';

  let FL;
  const params = new URLSearchParams(window.location.search);
  const JOB_ID = params.get('id');

  // ---------- gemeinsame Darstellung ----------
  const ICON_STATE = { done: 'check', warn: 'mittel', error: 'hoch' };
  const LABELS = { done: 'Erledigt', active: 'Läuft', waiting: 'Wartet', warn: 'Erledigt mit Hinweis', error: 'Fehler' };
  const CHIP = { done: 'niedrig', active: 'info', waiting: 'fehlt', warn: 'mittel', error: 'hoch' };

  function stepHtml(title, body, i, state, hint) {
    const icon = state === 'active' ? FL.icon('spinner', 'spin') : state === 'waiting' ? '<span class="xs">' + (i + 1) + '</span>' : FL.icon(ICON_STATE[state]);
    return '<li class="status-step" data-state="' + state + '"><span class="st-icon">' + icon + '</span>' +
      '<div><h3>' + FL.escapeHtml(title) + '</h3><p>' + body + '</p>' + (hint ? '<p class="st-hint"><strong>Hinweis:</strong> ' + FL.escapeHtml(hint) + '</p>' : '') + '</div>' +
      '<span class="chip chip-' + CHIP[state] + '">' + LABELS[state] + '</span></li>';
  }

  function setOverall(pct, text) {
    document.getElementById('overall-pct').textContent = pct + ' %';
    const bar = document.getElementById('overall-bar');
    bar.setAttribute('aria-valuenow', pct);
    bar.querySelector('span').style.width = pct + '%';
    document.getElementById('overall-text').textContent = text;
  }

  function announce(t) { document.getElementById('live').textContent = t; }

  function docChip(state) {
    const m = {
      wartet: ['fehlt', 'clock', 'Wartet'], liest: ['info', 'spinner', 'Wird gelesen'], gelesen: ['niedrig', 'niedrig', 'Gelesen'],
      hinweis: ['mittel', 'mittel', 'Gelesen, mit Hinweis'], fehler: ['hoch', 'hoch', 'Nicht lesbar']
    }[state] || ['fehlt', 'clock', 'Wartet'];
    return '<span class="chip chip-' + m[0] + '">' + FL.icon(m[1], m[1] === 'spinner' ? 'spin' : '') + m[2] + '</span>';
  }

  function renderDocs(list) {
    document.getElementById('doc-status').innerHTML = list.map(function (d) {
      return '<li><span class="d-name">' + FL.escapeHtml(d.name) + '</span>' + docChip(d.status) +
        '<span class="d-meta">' + FL.escapeHtml(d.typ || '') + (d.seiten ? ' · ' + d.seiten + ' Seite(n)' : '') + (d.hinweis ? ' · ' + FL.escapeHtml(d.hinweis) : '') + '</span></li>';
    }).join('');
  }

  function showDone(text, href) {
    document.getElementById('analyse-titel').textContent = 'Analyse abgeschlossen';
    document.getElementById('analyse-lead').textContent = 'Ihr Bericht ist fertig. Bitte beachten Sie die Hinweise zu unklaren oder fehlenden Angaben.';
    document.getElementById('done-text').innerHTML = text;
    document.getElementById('to-report').setAttribute('href', href);
    document.getElementById('done-box').hidden = false;
    document.getElementById('cancel-row').hidden = true;
    document.querySelectorAll('.flow li')[1].classList.add('done');
    announce('Analyse abgeschlossen. Ihr Bericht ist fertig.');
    document.getElementById('to-report').focus();
  }

  function showError(text) {
    document.getElementById('analyse-titel').textContent = 'Analyse nicht abgeschlossen';
    document.getElementById('analyse-lead').textContent = 'Ihre Unterlagen wurden nicht dauerhaft gespeichert.';
    document.getElementById('error-text').textContent = text;
    document.getElementById('error-box').hidden = false;
    document.getElementById('cancel-row').hidden = true;
    announce('Fehler: ' + text);
  }

  // ---------- echter Auftrag ----------
  const STATE_MAP = { wartet: 'waiting', aktiv: 'active', fertig: 'done', hinweis: 'warn', fehler: 'error' };
  let pollTimer, lastActive = '';

  function fmtDauer(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' min';
  }

  function renderJob(job) {
    const steps = job.schritte;
    document.getElementById('steps').innerHTML = steps.map(function (s, i) {
      const st = STATE_MAP[s.status] || 'waiting';
      const body = (st === 'done' || st === 'warn') && s.hinweis ? FL.escapeHtml(s.hinweis) : FL.escapeHtml(s.text);
      const hint = st === 'error' && s.hinweis ? s.hinweis : '';
      return stepHtml(s.titel, body, i, st, hint);
    }).join('');
    const done = steps.filter(function (s) { return s.status === 'fertig' || s.status === 'hinweis'; }).length;
    const active = steps.find(function (s) { return s.status === 'aktiv'; });
    // Auswertung durch die KI ist der längste Schritt – Fortschritt grob gewichten
    const weights = { pruefen: 5, text: 10, ki: 75, belege: 5, bericht: 5 };
    let pct = 0;
    steps.forEach(function (s) { if (s.status === 'fertig' || s.status === 'hinweis') pct += weights[s.id] || 0; });
    if (active && active.id === 'ki') {
      const elapsed = Date.now() - job.gestartet;
      pct += Math.min(70, Math.round(elapsed / (4 * 60 * 1000) * 70)); // Schätzung, max. 70 von 75
    }
    pct = Math.min(job.status === 'fertig' ? 100 : 99, pct);
    setOverall(pct, job.status === 'fertig' ? 'Analyse abgeschlossen'
      : active ? 'Schritt ' + (steps.indexOf(active) + 1) + ' von ' + steps.length + ': ' + active.titel
      : 'Schritt ' + Math.min(done + 1, steps.length) + ' von ' + steps.length);
    if (active && active.id !== lastActive) { lastActive = active.id; announce('Jetzt: ' + active.titel + '.'); }

    renderDocs(job.dokumente);

    const early = document.getElementById('early');
    let html = '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0"><dt class="muted">Laufzeit</dt><dd style="margin:0;font-weight:600">' + fmtDauer(Date.now() - job.gestartet) + '</dd></div>';
    if (job.fortschritt && job.fortschritt.zeichen) {
      html += '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid var(--line)"><dt class="muted">Bericht geschrieben</dt><dd style="margin:0;font-weight:600">' + Math.round(job.fortschritt.zeichen / 1000) + ' Tsd. Zeichen</dd></div>';
    }
    early.innerHTML = html;
  }

  function poll() {
    fetch('/api/analysen/' + encodeURIComponent(JOB_ID), { cache: 'no-store' }).then(function (r) {
      return r.json().then(function (body) { return { ok: r.ok, status: r.status, body: body }; });
    }).then(function (res) {
      if (!res.ok) { showError(res.body.fehler || 'Diese Analyse wurde nicht gefunden.'); return; }
      const job = res.body;
      renderJob(job);
      if (job.status === 'fertig') {
        const e = job.ergebnis || {};
        showDone('Wir haben ' + e.dokumente + ' Unterlage(n) ausgewertet. Dabei sind uns <strong>' + e.abweichungen + ' Abweichung(en)</strong> zur Bankempfehlung, <strong>' + e.unklar + ' unklare</strong> und <strong>' + e.fehlend + ' fehlende</strong> Angaben aufgefallen. Der Bericht enthält ' + e.fragen + ' Fragen an Ihre Bank. Er ist 24 Stunden unter diesem Link abrufbar.',
          'bericht.html?id=' + encodeURIComponent(JOB_ID));
        return;
      }
      if (job.status === 'fehler' || job.status === 'abgebrochen') { showError(job.fehler || 'Die Analyse wurde abgebrochen.'); return; }
      pollTimer = setTimeout(poll, 2000);
    }).catch(function () {
      announce('Verbindung unterbrochen, neuer Versuch …');
      pollTimer = setTimeout(poll, 4000);
    });
  }

  function initReal() {
    document.getElementById('early-title').textContent = 'Zwischenstand';
    document.getElementById('early-note').textContent = 'Den Link zu dieser Seite können Sie sich merken: Der Bericht bleibt 24 Stunden abrufbar.';
    poll();
    document.getElementById('cancel-btn').addEventListener('click', function () {
      if (!window.confirm('Analyse abbrechen und alle hochgeladenen Unterlagen löschen? Dies kann nicht rückgängig gemacht werden.')) return;
      clearTimeout(pollTimer);
      fetch('/api/analysen/' + encodeURIComponent(JOB_ID), { method: 'DELETE' }).finally(function () {
        FL.store.set('files', []);
        window.location.href = 'upload.html';
      });
    });
  }

  // ---------- Beispielanalyse (simuliert) ----------
  const DEMO_STEPS = [
    { title: 'Dateien sicher prüfen', text: 'Wir prüfen, ob die Dateien lesbar und unbeschädigt sind.', done: 'Alle Dateien sind lesbar.' },
    { title: 'Text erkennen', text: 'Der Text wird Seite für Seite aus den Dokumenten gelesen.', done: '172 Seiten gelesen. 1 Scan per Bilderkennung verarbeitet.', warn: 'Geeignetheitserklärung ist ein Scan – Handschrift wird nicht zuverlässig erkannt.' },
    { title: 'Unterlagen auswerten', text: 'Die KI bestimmt die Dokumenttypen, liest Kosten, Risiken und Bedingungen aus und gleicht sie mit der Bankempfehlung ab.', done: '5 Dokumenttypen erkannt, 7 Kostenpositionen, 6 Risiken, 3 Abweichungen.', warn: 'Verkaufsprospekt: nur 60 von 112 Seiten vorhanden.' },
    { title: 'Fundstellen prüfen', text: 'Jedes Zitat wird automatisch auf der angegebenen Seite im Dokument gesucht.', done: 'Alle Fundstellen im Dokument bestätigt.' },
    { title: 'Bericht erstellen', text: 'Wir fassen alles verständlich zusammen und formulieren Fragen an Ihre Bank.', done: 'Bericht mit 14 Fragen erstellt.' }
  ];
  const DEMO_EARLY = [
    [3, 'Fonds', 'Musterfonds Global Wachstum R'],
    [3, 'Fondsart', 'Aktienfonds, global'],
    [3, 'Risikoklasse', '4 von 7'],
    [3, 'Laufende Kosten', '1,85 % bzw. 1,65 % (unklar)'],
    [4, 'Empfohlene Haltedauer', '7 Jahre']
  ];
  const DEMO_FILES = [
    { name: 'KID_Musterfonds_Global_Wachstum.pdf', typ: 'Basisinformationsblatt (KID)', seiten: 3 },
    { name: 'Verkaufsprospekt_Musterfonds.pdf', typ: 'Verkaufsprospekt / Fondsvertrag', seiten: 60, warn: 'Unvollständig: 60 von 112 Seiten' },
    { name: 'Kosteninformation_Musterbank.pdf', typ: 'Kostenübersicht', seiten: 2 },
    { name: 'Geeignetheitserklaerung_Scan.pdf', typ: 'Beratungsprotokoll / Geeignetheitserklärung', seiten: 4, warn: 'Scan: Erkennung mittel' },
    { name: 'Anschreiben_Empfehlung.pdf', typ: 'Schriftliche Bankempfehlung', seiten: 1 }
  ];
  let current = -1, timer, cancelled = false;

  function renderDemo() {
    document.getElementById('steps').innerHTML = DEMO_STEPS.map(function (s, i) {
      let st = 'waiting', body = FL.escapeHtml(s.text), hint = '';
      if (i < current) { st = s.warn ? 'warn' : 'done'; body = FL.escapeHtml(s.done); hint = s.warn || ''; }
      else if (i === current) st = 'active';
      return stepHtml(s.title, body, i, st, hint);
    }).join('');
    const pct = Math.round(Math.max(0, current) / DEMO_STEPS.length * 100);
    setOverall(pct, current < DEMO_STEPS.length ? 'Schritt ' + (current + 1) + ' von ' + DEMO_STEPS.length + ': ' + DEMO_STEPS[Math.max(0, current)].title : 'Analyse abgeschlossen');
    const early = DEMO_EARLY.filter(function (e) { return e[0] <= current; });
    if (early.length) {
      document.getElementById('early').innerHTML = early.map(function (e) {
        return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid var(--line)"><dt class="muted">' + e[1] + '</dt><dd style="margin:0;font-weight:600;text-align:right">' + e[2] + '</dd></div>';
      }).join('');
    }
    renderDocs(DEMO_FILES.map(function (d) {
      const status = current <= 0 ? 'wartet' : current < 2 ? 'liest' : d.warn ? 'hinweis' : 'gelesen';
      return { name: d.name, typ: d.typ, seiten: current >= 2 ? d.seiten : null, status: status, hinweis: current >= 2 ? d.warn : '' };
    }));
  }

  function nextDemo() {
    if (cancelled) return;
    current++;
    renderDemo();
    if (current < DEMO_STEPS.length) {
      if (current > 0) announce('Erledigt: ' + DEMO_STEPS[current - 1].title + '. Jetzt: ' + DEMO_STEPS[current].title + '.');
      timer = setTimeout(nextDemo, 1300 + Math.random() * 600);
    } else {
      showDone('Beispielanalyse mit fiktiven Unterlagen: Wir haben 5 Unterlagen ausgewertet. Dabei sind <strong>3 Abweichungen</strong> zur Bankempfehlung und <strong>4 fehlende Informationen</strong> aufgefallen. Alle Aussagen im Bericht sind mit Quelle belegt.', 'bericht.html');
    }
  }

  function initDemo() {
    document.getElementById('analyse-titel').textContent = 'Beispielanalyse';
    document.getElementById('analyse-lead').textContent = 'So läuft eine Analyse ab – hier mit fiktiven Beispielunterlagen. Es werden keine Dateien übertragen.';
    renderDemo();
    timer = setTimeout(nextDemo, 500);
    document.getElementById('cancel-btn').innerHTML = FL.icon('x') + 'Beispiel beenden';
    document.getElementById('cancel-btn').addEventListener('click', function () {
      cancelled = true; clearTimeout(timer);
      window.location.href = 'upload.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    FL = window.FL;
    if (JOB_ID) initReal(); else initDemo();
  });
})();
