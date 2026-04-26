import type { WordEntry } from "./orp";

// ---------------------------------------------------------------------------
// Unambiguous bracket pairs (opener → expected closer)
// ---------------------------------------------------------------------------

export const OPEN_TO_CLOSE: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  // Guillemets — unambiguous directional
  "\u00AB": "\u00BB", // « → »
  "\u2039": "\u203A", // ‹ → ›
  // CJK
  "\u3010": "\u3011", // 【 → 】
  "\u300C": "\u300D", // 「 → 」
  "\uFF08": "\uFF09", // （ → ）
  "\u3014": "\u3015", // 〔 → 〕
};

export const CLOSE_TO_OPEN: Record<string, string> = Object.fromEntries(
  Object.entries(OPEN_TO_CLOSE).map(([o, c]) => [c, o]),
);

export const OPENING_CHARS = new Set(Object.keys(OPEN_TO_CLOSE));
export const CLOSING_CHARS = new Set(Object.values(OPEN_TO_CLOSE));

// ---------------------------------------------------------------------------
// Quote groups — toggle semantics
//
// All members of a group are equivalent. When any member is encountered at a
// word edge and the group is NOT already on the stack → push (opening).
// When the group IS already on the stack → pop (closing).
// This handles straight quotes ("/'), German „/", English “/”, etc.
// ---------------------------------------------------------------------------

const QUOTE_GROUPS: string[][] = [
  // double: straight, „ (U+201E), “ (U+201C), ” (U+201D)
  ['"', '\u201E', '\u201C', '\u201D'],
  // single: straight, \u2018 ('), \u2019 (')
  ["'", '\u2018', '\u2019'],
];

// What to show on the right as the expected closer for each group
const QUOTE_GROUP_DISPLAY_CLOSER: string[] = [
  '\u201D', // ” — right double quotation mark
  '\u2019', // ’ — right single quotation mark
];

// Map every quote char to its group index
const CHAR_TO_QUOTE_GROUP = new Map<string, number>();
for (let i = 0; i < QUOTE_GROUPS.length; i++) {
  for (const ch of QUOTE_GROUPS[i]) {
    CHAR_TO_QUOTE_GROUP.set(ch, i);
  }
}

// All characters recognized at word edges
const EDGE_CHARS = new Set([
  ...OPENING_CHARS,
  ...CLOSING_CHARS,
  ...CHAR_TO_QUOTE_GROUP.keys(),
]);

// ---------------------------------------------------------------------------
// Expected closer lookup — used by the display layer
// ---------------------------------------------------------------------------

export function getExpectedCloser(openChar: string): string {
  if (openChar in OPEN_TO_CLOSE) return OPEN_TO_CLOSE[openChar];
  const groupIdx = CHAR_TO_QUOTE_GROUP.get(openChar);
  if (groupIdx !== undefined) return QUOTE_GROUP_DISPLAY_CLOSER[groupIdx];
  return openChar;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Scan `word` and return bracket events at its edges.
 * Mid-word characters are ignored entirely.
 */
export function extractWordBrackets(word: string): {
  leading: string[];
  trailing: string[];
} {
  const leading: string[] = [];
  const trailing: string[] = [];

  let i = 0;
  while (i < word.length && EDGE_CHARS.has(word[i])) {
    leading.push(word[i++]);
  }

  let j = word.length - 1;
  while (j >= i && EDGE_CHARS.has(word[j])) {
    trailing.push(word[j--]);
  }
  trailing.reverse(); // innermost-first

  return { leading, trailing };
}

// Apply a single char to the stack (shared logic for leading and trailing).
function applyChar(next: string[], ch: string): string[] {
  const groupIdx = CHAR_TO_QUOTE_GROUP.get(ch);
  if (groupIdx !== undefined) {
    // Find last occurrence of any group member
    const groupChars = QUOTE_GROUPS[groupIdx];
    let lastIdx = -1;
    for (let i = next.length - 1; i >= 0; i--) {
      if (groupChars.includes(next[i])) { lastIdx = i; break; }
    }
    if (lastIdx !== -1) {
      // Group already open — close it
      return [...next.slice(0, lastIdx), ...next.slice(lastIdx + 1)];
    } else {
      // Not open — push the actual char seen
      return [...next, ch];
    }
  }
  return [...next, ch];
}

export function updateStack(
  stack: string[],
  leading: string[],
  trailing: string[],
): string[] {
  let next = [...stack];

  for (const ch of leading) {
    next = applyChar(next, ch);
  }

  for (const ch of trailing) {
    const groupIdx = CHAR_TO_QUOTE_GROUP.get(ch);
    if (groupIdx !== undefined) {
      next = applyChar(next, ch);
    } else {
      // Regular closer: pop matching opener from top
      const expectedOpener = CLOSE_TO_OPEN[ch];
      if (expectedOpener !== undefined && next.length > 0 && next[next.length - 1] === expectedOpener) {
        next = next.slice(0, -1);
      }
      // Unmatched closer: discard silently
    }
  }

  return next;
}

/**
 * Recompute the bracket stack from scratch by replaying words[0..toIndex]
 * (inclusive). Used after seek / jump operations.
 */
export function computeStackFromWords(words: WordEntry[], toIndex: number): string[] {
  let stack: string[] = [];
  const end = Math.min(toIndex, words.length - 1);
  for (let i = 0; i <= end; i++) {
    const { leading, trailing } = extractWordBrackets(words[i].word);
    stack = updateStack(stack, leading, trailing);
  }
  return stack;
}
