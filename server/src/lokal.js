// Analyse mit einer lokalen KI über eine OpenAI-kompatible Schnittstelle
// (LM Studio, Standard http://localhost:1234/v1 – oder Ollama, http://localhost:11434/v1).
// Kostenlos, die Unterlagen verlassen den Rechner nicht.
//
// Einschränkung: Lokale Textmodelle können keine Scans oder Fotos lesen. Solche
// Seiten werden als "nicht lesbar" markiert.
import { z } from 'zod';
import { AnalyseSchema } from './schema.js';
import { SYSTEM, AnalyseFehler } from './claude.js';

const BASIS = (process.env.LOKAL_URL || 'http://localhost:1234/v1').replace(/\/$/, '');
const MODELL = process.env.LOKAL_MODELL || '';           // leer = erstes geladenes Modell
export const KONTEXT = Number(process.env.LOKAL_KONTEXT || 32768); // in LM Studio beim Laden einstellen
const MAX_AUSGABE = Number(process.env.LOKAL_MAX_AUSGABE || 16000);

// Vollständiges Schema für die erzwungene Ausgabe; kompakte Fassung (mit $ref) für die Anweisung
const SCHEMA_VOLL = z.toJSONSchema(AnalyseSchema);
delete SCHEMA_VOLL.$schema;
const SCHEMA_KURZ = JSON.stringify(z.toJSONSchema(AnalyseSchema, { reused: 'ref' }));

const SYSTEM_LOKAL = SYSTEM + `

Zusätzlich für diese Umgebung:
- Antworte ausschließlich mit einem einzigen JSON-Objekt nach dem unten stehenden JSON-Schema, ohne Text davor oder danach.
- Halte die Texte kurz und sachlich. Lieber weniger Befunde, dafür jeder mit wörtlichem Zitat.
- Seiten mit dem Vermerk "[nicht lesbar]" konntest du nicht lesen; triff dazu keine Aussagen, sondern nenne sie bei "fehlend".

JSON-Schema:
${SCHEMA_KURZ}`;

export function geschaetzteSystemTokens() { return Math.round(SYSTEM_LOKAL.length / 3.5); }

export function baueText(docs) {
  const teile = [];
  docs.forEach((d, i) => {
    const nr = i + 1;
    teile.push(`=== Unterlage ${nr}: Datei „${d.dateiname}“, vom Nutzer angegeben als „${d.typLabel}“, ${d.seiten.length} Seite(n) ===`);
    d.seiten.forEach((t, p) => {
      const scan = d.bild || d.scanSeiten.includes(p + 1);
      teile.push(`--- Unterlage ${nr}, Seite ${p + 1} ---\n${scan ? '[nicht lesbar: Scan/Foto ohne Textebene]' : t}`);
    });
  });
  teile.push('Analysiere diese Unterlagen nach den Regeln und gib das Ergebnis im vorgegebenen JSON-Format zurück.');
  return teile.join('\n\n');
}

let modellCache = '';
async function modellWaehlen(signal) {
  if (MODELL) return MODELL;
  if (modellCache) return modellCache;
  const r = await fetch(BASIS + '/models', { signal });
  if (!r.ok) throw new Error('models ' + r.status);
  const data = await r.json();
  // Hilfsmodelle für Embeddings (Textvektoren) können keine Berichte schreiben – überspringen
  const ids = ((data && data.data) || []).map((m) => m.id).filter(Boolean);
  const id = ids.find((x) => !/embed|rerank/i.test(x));
  console.log(`Lokale KI: verfügbare Modelle ${ids.join(', ') || '–'} → verwende ${id || '–'}`);
  if (!id) throw new AnalyseFehler('In der lokalen KI ist kein Modell geladen. Bitte laden Sie in LM Studio ein Modell und starten Sie den Server.', 'kein Modell');
  modellCache = id;
  return id;
}

function ersteJsonObjekt(text) {
  // Manche Modelle schreiben Denkschritte (<think>…</think>) oder Code-Zäune um das JSON.
  const ohneDenken = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = ohneDenken.indexOf('{');
  const ende = ohneDenken.lastIndexOf('}');
  if (start === -1 || ende <= start) return null;
  return ohneDenken.slice(start, ende + 1);
}

/**
 * Gleiche Schnittstelle wie claude.js: analysiere(docs, onProgress, signal)
 */
export async function analysiere(docs, onProgress, signal) {
  const text = baueText(docs);
  let modell, res;
  try {
    modell = await modellWaehlen(signal);
    res = await fetch(BASIS + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: modell,
        messages: [{ role: 'system', content: SYSTEM_LOKAL }, { role: 'user', content: text }],
        response_format: { type: 'json_schema', json_schema: { name: 'fondsanalyse', strict: true, schema: SCHEMA_VOLL } },
        max_tokens: MAX_AUSGABE,
        temperature: 0.2,
        stream: true
      })
    });
  } catch (err) {
    if (signal?.aborted) throw new AnalyseFehler('Die Analyse wurde abgebrochen.');
    if (err instanceof AnalyseFehler) throw err;
    throw new AnalyseFehler('Die lokale KI ist nicht erreichbar. Bitte prüfen Sie, ob LM Studio läuft und der lokale Server gestartet ist.', 'lokal nicht erreichbar: ' + err.message);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const kontext = /context|n_ctx|too long|exceed/i.test(body);
    throw new AnalyseFehler(kontext
      ? 'Die Unterlagen sind zu lang für die eingestellte Kontextlänge der lokalen KI. Bitte laden Sie das Modell in LM Studio mit größerer Kontextlänge (z. B. 32768) oder laden Sie weniger Unterlagen hoch.'
      : 'Die lokale KI hat die Anfrage abgelehnt. Bitte prüfen Sie in LM Studio, ob ein Modell geladen ist.',
      `lokal HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  // Server-Sent Events lesen
  let ausgabe = '', rest = '', grund = null, usage = null;
  const decoder = new TextDecoder();
  try {
    for await (const chunk of res.body) {
      rest += decoder.decode(chunk, { stream: true });
      const zeilen = rest.split('\n');
      rest = zeilen.pop();
      for (const zeile of zeilen) {
        const z2 = zeile.trim();
        if (!z2.startsWith('data:')) continue;
        const daten = z2.slice(5).trim();
        if (daten === '[DONE]') continue;
        let ev;
        try { ev = JSON.parse(daten); } catch { continue; }
        const wahl = ev.choices && ev.choices[0];
        if (wahl && wahl.delta && typeof wahl.delta.content === 'string') {
          ausgabe += wahl.delta.content;
          onProgress?.({ zeichen: ausgabe.length });
        }
        if (wahl && wahl.finish_reason) grund = wahl.finish_reason;
        if (ev.usage) usage = ev.usage;
      }
    }
  } catch (err) {
    if (signal?.aborted) throw new AnalyseFehler('Die Analyse wurde abgebrochen.');
    throw new AnalyseFehler('Die Verbindung zur lokalen KI wurde unterbrochen. Bitte versuchen Sie es erneut.', 'stream: ' + err.message);
  }

  if (grund === 'length') {
    throw new AnalyseFehler('Die lokale KI hat ihre maximale Antwortlänge erreicht, bevor der Bericht fertig war. Bitte laden Sie weniger Unterlagen hoch oder erhöhen Sie LOKAL_MAX_AUSGABE.', 'finish_reason length');
  }
  const json = ersteJsonObjekt(ausgabe);
  let data;
  try {
    data = AnalyseSchema.parse(JSON.parse(json));
  } catch (err) {
    throw new AnalyseFehler('Die Antwort der lokalen KI hatte nicht das erwartete Format. Bitte starten Sie die Analyse erneut oder verwenden Sie ein größeres Modell.', 'parse: ' + (err && err.message ? err.message.slice(0, 300) : err));
  }
  return {
    data,
    usage: usage ? { input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens } : {},
    model: modell
  };
}
