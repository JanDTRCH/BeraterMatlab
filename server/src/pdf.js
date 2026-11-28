// Text aus PDFs seitenweise auslesen (ohne KI).
// Seiten ohne Textebene (Scans, Fotos) werden markiert – sie werden Claude
// zusätzlich als Bild/PDF übergeben und können nicht maschinell gegengeprüft werden.
import { extractText, getDocumentProxy } from 'unpdf';

const MIN_TEXT_CHARS = 40; // weniger Text → Seite gilt als Scan

export class UnlesbaresDokument extends Error {}

export async function readPdf(buffer) {
  let pdf;
  try {
    pdf = await getDocumentProxy(new Uint8Array(buffer));
  } catch (err) {
    if (err && err.name === 'PasswordException') {
      throw new UnlesbaresDokument('Die PDF-Datei ist kennwortgeschützt. Bitte laden Sie eine Version ohne Kennwort hoch.');
    }
    throw new UnlesbaresDokument('Die PDF-Datei konnte nicht geöffnet werden. Sie ist möglicherweise beschädigt.');
  }
  try {
    const { totalPages, text } = await extractText(pdf, { mergePages: false });
    const seiten = text.map((t) => cleanText(t));
    const scanSeiten = [];
    seiten.forEach((t, i) => { if (t.replace(/\s/g, '').length < MIN_TEXT_CHARS) scanSeiten.push(i + 1); });
    return { seitenzahl: totalPages, seiten, scanSeiten };
  } finally {
    await pdf.destroy?.();
  }
}

export function cleanText(t) {
  return String(t || '')
    .replace(/­/g, '')          // weiche Trennstriche
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
