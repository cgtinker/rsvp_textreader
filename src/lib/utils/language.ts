export type Script = "latin" | "japanese" | "chinese";

/**
 * Detect the dominant script of a piece of text.
 *
 * Decision rules (applied in order):
 *   1. Any Hiragana or Katakana present → "japanese"
 *      (Japanese text almost always contains kana, even when full of kanji)
 *   2. > 20% of all chars are CJK Unified Ideographs → "chinese"
 *   3. Otherwise → "latin" (covers Arabic, Cyrillic, Latin, etc. that split on spaces)
 */
export function detectScript(text: string): Script {
  if (!text) return "latin";

  let cjkCount = 0;
  let hasKana = false;

  for (const ch of text) {
    const cp = ch.codePointAt(0)!;

    // Hiragana: U+3040–309F  |  Katakana: U+30A0–30FF
    if ((cp >= 0x3040 && cp <= 0x309f) || (cp >= 0x30a0 && cp <= 0x30ff)) {
      hasKana = true;
    }

    // CJK Unified Ideographs: U+4E00–9FFF
    // CJK Extension A:        U+3400–4DBF
    // CJK Extension B–F and G are beyond BMP; codePointAt handles them correctly
    if (
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x20000 && cp <= 0x2a6df)
    ) {
      cjkCount++;
    }
  }

  if (hasKana) return "japanese";

  const ratio = cjkCount / text.length;
  if (ratio > 0.2) return "chinese";

  return "latin";
}

export function isCJK(script: Script): boolean {
  return script === "japanese" || script === "chinese";
}
