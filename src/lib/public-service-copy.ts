import { formatCurrency } from "@/lib/utils";

const SMALL_WORDS = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "e",
  "el",
  "en",
  "la",
  "las",
  "los",
  "o",
  "por",
  "u",
  "y"
]);

const TYPO_PAIRS: [RegExp, string][] = [
  [/\bcoloracion\b/gi, "Coloración"],
  [/\bhidratacion\b/gi, "Hidratación"],
  [/\bevaluacion\b/gi, "evaluación"]
];

function applyTypoFixes(text: string): string {
  let t = text;
  for (const [re, rep] of TYPO_PAIRS) t = t.replace(re, rep);
  return t;
}

/**
 * Título legible: mayúscula en cada palabra relevante (estilo título en español).
 */
export function toTitleCaseEs(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return input;

  return trimmed
    .split(/\s+/)
    .map((token, index) => titleCaseSingleToken(token, index))
    .join(" ");
}

function titleCaseSingleToken(token: string, wordIndex: number): string {
  const match = token.match(/^([^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)([A-Za-zÁÉÍÓÚÜÑáéíóúüñ']+)(.*)$/);
  if (!match) return token;
  const [, prefix, letters, suffix] = match;
  const lower = letters.toLocaleLowerCase("es-PE");
  const isSmall = wordIndex > 0 && SMALL_WORDS.has(lower);
  const body = isSmall ? lower : lower.charAt(0).toLocaleUpperCase("es-PE") + lower.slice(1);
  return `${prefix}${body}${suffix}`;
}

/**
 * Nombre de servicio para la web: acentos habituales + título.
 */
export function polishServiceTitle(name: string): string {
  return toTitleCaseEs(applyTypoFixes(name.trim()));
}

/**
 * Corrige acentos habituales y mayúscula tras punto en descripciones públicas.
 */
export function polishServiceDescription(text: string | null): string | null {
  if (!text?.trim()) return text;

  let t = applyTypoFixes(text.trim());

  t = t.charAt(0).toLocaleUpperCase("es-PE") + t.slice(1);
  t = t.replace(/(\.\s+)([a-záéíóúñ])/g, (_, punct: string, letter: string) => punct + letter.toLocaleUpperCase("es-PE"));

  return t;
}

/** Precio público referencial: siempre con "Desde". */
export function formatDesdeCurrency(amount: number, currency: string): string {
  return `Desde ${formatCurrency(amount, currency)}`;
}
