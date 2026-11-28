// Tagesbudget für API-Kosten (im Arbeitsspeicher, wird um Mitternacht UTC zurückgesetzt).
// Zusätzliche Sicherung zur Ausgabengrenze in der Claude Console: Ist das Budget
// eines Tages verbraucht, nimmt der Server keine neuen Analysen mehr an.
// Ein Neustart setzt den Zähler zurück – deshalb gehört die harte Grenze in die Console.

// Listenpreise in US-Dollar pro 1 Mio. Tokens (Stand 11/2026). [Eingabe, Ausgabe]
const PREISE = {
  'claude-haiku-5-5': { bis100k: [0.10, 0.50], darueber: [0.50, 2.50] },
  'claude-sonnet-5-5': { bis100k: [2, 10] },
  'claude-opus-5-5': { bis100k: [4, 20] }
};

export function kostenUsd(model, usage) {
  const p = PREISE[model] || PREISE['claude-opus-5-5']; // unbekanntes Modell: vorsichtig hoch schätzen
  const eingabe = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  const [pin, pout] = eingabe > 100000 && p.darueber ? p.darueber : p.bis100k;
  return (eingabe * pin + (usage.output_tokens || 0) * pout) / 1e6;
}

const LIMIT_USD = Number(process.env.TAGESBUDGET_USD ?? 3);
const stand = { tag: '', usd: 0 };

function heute() { return new Date().toISOString().slice(0, 10); }
function reset() { if (stand.tag !== heute()) { stand.tag = heute(); stand.usd = 0; } }

export function budgetFrei() { reset(); return stand.usd < LIMIT_USD; }
export function budgetBuchen(usd) { reset(); stand.usd += usd; }
export function budgetStand() { reset(); return { verbraucht: Math.round(stand.usd * 1000) / 1000, limit: LIMIT_USD }; }
