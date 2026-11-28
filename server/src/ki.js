// Auswahl des KI-Anbieters über die Umgebungsvariable KI_ANBIETER:
//   claude (Standard) – Claude API, benötigt ANTHROPIC_API_KEY, kostet pro Analyse
//   lokal             – lokale KI über LM Studio/Ollama (LOKAL_URL), kostenlos, Daten bleiben auf dem Rechner
import * as claude from './claude.js';
import * as lokal from './lokal.js';

export { AnalyseFehler } from './claude.js';

export const ANBIETER = String(process.env.KI_ANBIETER || 'claude').toLowerCase() === 'lokal' ? 'lokal' : 'claude';
export const IST_LOKAL = ANBIETER === 'lokal';
export const MODELL_ANZEIGE = IST_LOKAL ? (process.env.LOKAL_MODELL || 'lokales Modell') : claude.MODEL;

export function kiVerfuegbar() { return IST_LOKAL ? true : claude.kiVerfuegbar(); }

export function analysiere(docs, onProgress, signal) {
  return (IST_LOKAL ? lokal : claude).analysiere(docs, onProgress, signal);
}

/** Grobe Prüfung, ob die Eingabe in den Kontext der lokalen KI passt (null = passt). */
export function lokalZuGross(eingabeTokens) {
  if (!IST_LOKAL) return null;
  const benoetigt = eingabeTokens + lokal.geschaetzteSystemTokens() + Number(process.env.LOKAL_MAX_AUSGABE || 16000);
  return benoetigt > lokal.KONTEXT ? benoetigt : null;
}
