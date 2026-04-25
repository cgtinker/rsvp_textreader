export type WordEntry = {
  word: string;
  multiplier: number;
};

export function getPivotIndex(word: string): number {
  return Math.min(
    Math.floor(word.length / 4) + 1,
    word.length - 1 // never out of bounds
  );
}

function getPunctuationMultiplier(word: string): number {
  if (word.endsWith("...")) return 2.5;
  const last = word.at(-1);
  if (last === "." || last === "!" || last === "?") return 2.0;
  if (last === ";" || last === ":") return 1.75;
  if (last === ",") return 1.5;
  if (last === "-" || last === "–") return 1.3;
  return 1.0;
}

function getLengthMultiplier(word: string, aggressiveness: number): number {
  // strip leading/trailing non-alpha to measure the "true" word length
  const clean = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
  const len = clean.length || word.length;
  const m = 1 + (len - 5) * 0.04 * aggressiveness;
  return Math.min(Math.max(m, 0.75), 1.75);
}

export type TokenizeOptions = {
  aggressiveness?: number;
  punctuationPauses?: boolean;
  wordLengthScaling?: boolean;
};

export function tokenize(text: string, options: TokenizeOptions = {}): WordEntry[] {
  const {
    aggressiveness = 0.5,
    punctuationPauses = true,
    wordLengthScaling = true,
  } = options;
  // split into paragraphs first to detect paragraph breaks
  const paragraphs = text.split(/\n{2,}/);
  const entries: WordEntry[] = [];

  let sentenceStart = true; // first word of entire text is also a sentence start

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const tokens = paragraphs[pi].trim().split(/\s+/).filter((w) => w.length > 0);

    for (let ti = 0; ti < tokens.length; ti++) {
      const word = tokens[ti];
      const isLastInParagraph = ti === tokens.length - 1 && pi < paragraphs.length - 1;
      const isNumber = /^\d[\d,._]*$/.test(word);
      const isAllCaps = word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);

      const punc = punctuationPauses ? getPunctuationMultiplier(word) : 1.0;
      // numbers take longer to parse — boost aggressiveness for length scaling
      const len = wordLengthScaling
        ? getLengthMultiplier(word, isNumber ? Math.min(aggressiveness * 1.5, 1) : aggressiveness)
        : 1.0;

      let bonus = 1.0;
      if (sentenceStart) bonus += 0.25;
      if (isAllCaps) bonus += 0.1;

      // paragraph break overrides everything — long pause on the last word before a blank line
      let multiplier: number;
      if (isLastInParagraph) {
        multiplier = 3.0;
      } else {
        multiplier = Math.min(punc * len * bonus, 2.5);
      }

      entries.push({ word, multiplier });

      // next word is a sentence start if this word ends a sentence
      const last = word.at(-1);
      sentenceStart = last === "." || last === "!" || last === "?";
    }

    // paragraph boundary resets sentence tracking
    sentenceStart = true;
  }

  return entries;
}