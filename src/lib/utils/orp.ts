import type { Script } from "$lib/utils/language";
import { cutChinese } from "$lib/utils/jieba";

export type WordEntry = {
  word: string;
  multiplier: number;
};

export function getPivotIndex(word: string, focusPoint = 50): number {
  if (word.length <= 1) return 0;
  return Math.floor((focusPoint / 100) * (word.length - 1));
}

function isSentenceEnd(ch: string): boolean {
  return ch === "." || ch === "!" || ch === "?" || ch === "。" || ch === "！" || ch === "？";
}

function getPunctuationMultiplier(word: string): number {
  // CJK ellipsis variants
  if (word.endsWith("……") || word.endsWith("...")) return 2.5;
  const last = word.at(-1);
  // CJK full-stop, exclamation, question
  if (last === "。" || last === "！" || last === "？" || last === "." || last === "!" || last === "?") return 2.0;
  // CJK ideographic comma / enumeration comma / western semicolon/colon
  if (last === "、" || last === "，" || last === ";" || last === ":") return 1.5;
  // CJK closing quotes / brackets
  if (last === "」" || last === "』" || last === "）" || last === "》" || last === "】") return 1.3;
  if (last === "；" || last === "：") return 1.75;
  if (last === ",") return 1.5;
  if (last === "-" || last === "–") return 1.3;
  return 1.0;
}

function getLengthMultiplier(word: string, aggressiveness: number): number {
  // strip leading/trailing non-alpha to measure the "true" word length
  const clean = word.replace(/^[^a-zA-Z0-9\u3040-\u9fff]+|[^a-zA-Z0-9\u3040-\u9fff]+$/g, "");
  const len = clean.length || word.length;
  const m = 1 + (len - 5) * 0.04 * aggressiveness;
  return Math.min(Math.max(m, 0.75), 1.75);
}

export type TokenizeOptions = {
  aggressiveness?: number;
  punctuationPauses?: boolean;
  wordLengthScaling?: boolean;
  language?: Script;
};

// ---------------------------------------------------------------------------
// CJK tokenisation via Intl.Segmenter
// ---------------------------------------------------------------------------

function tokenizeCJK(text: string, options: TokenizeOptions): WordEntry[] {
  const {
    aggressiveness = 0.5,
    punctuationPauses = true,
    wordLengthScaling = true,
    language = "chinese",
  } = options;

  const entries: WordEntry[] = [];
  const paragraphs = text.split(/\n{2,}/);

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const para = paragraphs[pi].trim();
    if (!para) continue;

    let segments: string[];

    if (language === "chinese") {
      // jieba-wasm: proper NLP word segmentation — handles names, compounds, etc.
      // cutChinese() is sync; caller must have awaited ensureJieba() first.
      segments = cutChinese(para).filter((s) => s.trim().length > 0);
    } else if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      // Japanese: word granularity via Intl.Segmenter
      const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
      const allSegs = [...segmenter.segment(para)];
      segments = [];
      for (let i = 0; i < allSegs.length; i++) {
        const seg = allSegs[i];
        if (seg.isWordLike) {
          let token = seg.segment;
          // Peek ahead: attach trailing punctuation so getPunctuationMultiplier fires.
          const next = allSegs[i + 1];
          if (next && !next.isWordLike && next.segment.trim().length > 0) {
            token += next.segment;
            i++;
          }
          segments.push(token);
        }
      }
    } else {
      // Fallback: one grapheme cluster per token (safe for all CJK).
      segments = [...para].filter((ch) => ch.trim().length > 0);
    }

    let sentenceStart = true;

    for (let ti = 0; ti < segments.length; ti++) {
      const word = segments[ti];
      const isLastInParagraph = ti === segments.length - 1 && pi < paragraphs.length - 1;

      const punc = punctuationPauses ? getPunctuationMultiplier(word) : 1.0;
      // Length scaling for CJK: single chars are the norm (len=1), so the
      // base multiplier is lower — use aggressiveness at 50% weight.
      const len = wordLengthScaling ? getLengthMultiplier(word, aggressiveness * 0.5) : 1.0;

      let bonus = 1.0;
      if (sentenceStart) bonus += 0.15; // smaller bonus for CJK (no ALL-CAPS concept)

      let multiplier: number;
      if (isLastInParagraph) {
        multiplier = 3.0;
      } else {
        multiplier = Math.min(punc * len * bonus, 2.5);
      }

      entries.push({ word, multiplier });

      const last = word.at(-1) ?? "";
      sentenceStart = isSentenceEnd(last);
    }

    sentenceStart = true; // reset for next paragraph (unused but kept for clarity)
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Latin tokenisation (original logic)
// ---------------------------------------------------------------------------

export function tokenize(text: string, options: TokenizeOptions = {}): WordEntry[] {
  const {
    aggressiveness = 0.5,
    punctuationPauses = true,
    wordLengthScaling = true,
    language = "latin",
  } = options;

  if (language === "japanese" || language === "chinese") {
    return tokenizeCJK(text, options);
  }

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
      sentenceStart = isSentenceEnd(last ?? "");
    }

    // paragraph boundary resets sentence tracking
    sentenceStart = true;
  }

  return entries;
}