import { writable, derived } from "svelte/store";
import { tokenize, type WordEntry, type TokenizeOptions } from "$lib/utils/orp";
import { detectScript, isCJK, type Script } from "$lib/utils/language";
import { ensureJieba } from "$lib/utils/jieba";
import { settings } from "$lib/stores/settings";
import {
  extractWordBrackets,
  updateStack,
  computeStackFromWords,
} from "$lib/utils/brackets";

export type ReaderState = {
  words: WordEntry[];
  rawText: string;
  index: number;
  wpm: number;
  playing: boolean;
  language: Script;
  bracketStack: string[];
};

const initial: ReaderState = {
  words: [],
  rawText: "",
  index: 0,
  wpm: 300,
  playing: false,
  language: "latin",
  bracketStack: [],
};

function createReader() {
  const { subscribe, set, update } = writable<ReaderState>(initial);

  let timeout: ReturnType<typeof setTimeout> | null = null;

  let adaptiveMode = false;
  let detectedLanguage: Script = "latin";
  let tokenizeOptions: TokenizeOptions = { aggressiveness: 0.5, punctuationPauses: true, wordLengthScaling: true, language: "latin" };
  settings.subscribe((s) => {
    adaptiveMode = s.adaptiveMode;
    const next: TokenizeOptions = {
      aggressiveness: s.adaptiveAggressiveness,
      punctuationPauses: s.punctuationPauses,
      wordLengthScaling: s.wordLengthScaling,
      language: detectedLanguage,
    };
    if (
      next.aggressiveness !== tokenizeOptions.aggressiveness ||
      next.punctuationPauses !== tokenizeOptions.punctuationPauses ||
      next.wordLengthScaling !== tokenizeOptions.wordLengthScaling
    ) {
      tokenizeOptions = next;
      retokenize(next);
    } else {
      tokenizeOptions = next;
    }
  });

  function tick() {
    update((s) => {
      if (!s.playing || s.index >= s.words.length - 1)
        return { ...s, playing: false, bracketStack: [] };
      const nextIndex = s.index + 1;
      const nextWord = s.words[nextIndex]?.word ?? "";
      const { leading, trailing } = extractWordBrackets(nextWord);
      const bracketStack = updateStack(s.bracketStack, leading, trailing);
      const nextMultiplier = s.words[nextIndex]?.multiplier ?? 1.0;
      scheduleNext(s.wpm, nextMultiplier);
      return { ...s, index: nextIndex, bracketStack };
    });
  }

  function start() {
    update((state) => {
      if (state.words.length === 0) return state;
      if (state.words.length - 1 === state.index) {
        state = { ...state, index: 0 };
      }
      const multiplier = state.words[state.index]?.multiplier ?? 1.0;
      scheduleNext(state.wpm, multiplier);
      return { ...state, playing: true };
    });
  }

  function scheduleNext(wpm: number, multiplier = 1.0) {
    if (timeout) clearTimeout(timeout);
    const delay = (60000 / wpm) * (adaptiveMode ? multiplier : 1.0);
    timeout = setTimeout(tick, delay);
  }

  function stop() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    update((s) => ({ ...s, playing: false }));
  }

  function toggle() {
    let isPlaying = false;
    update((s) => {
      isPlaying = s.playing;
      return s;
    });
    isPlaying ? stop() : start();
  }

  function setWpm(wpm: number) {
    update((state) => ({ ...state, wpm }));
  }

  function jumpBack() {
    update((s) => {
      const steps = Math.floor((s.wpm / 60) * 5);
      const index = Math.max(0, s.index - steps);
      const bracketStack = computeStackFromWords(s.words, index);
      return { ...s, index, bracketStack };
    });
  }

  function jumpForward() {
    update((s) => {
      const steps = Math.floor((s.wpm / 60) * 5);
      const index = Math.min(s.words.length - 1, s.index + steps);
      const bracketStack = computeStackFromWords(s.words, index);
      return { ...s, index, bracketStack };
    });
  }

  async function loadText(text: string) {
    stop();
    detectedLanguage = detectScript(text);
    // jieba-wasm requires async initialisation before any cut() call.
    // For non-Chinese scripts this resolves immediately (promise is never created).
    if (detectedLanguage === "chinese") {
      await ensureJieba();
    }
    let opts: TokenizeOptions = { aggressiveness: 0.5, punctuationPauses: true, wordLengthScaling: true, language: detectedLanguage };
    settings.subscribe((s) => {
      opts = { aggressiveness: s.adaptiveAggressiveness, punctuationPauses: s.punctuationPauses, wordLengthScaling: s.wordLengthScaling, language: detectedLanguage };
    })();
    const words = tokenize(text, opts);
    update((s) => ({ ...initial, wpm: s.wpm, words, rawText: text, language: detectedLanguage }));
  }

  function retokenize(opts: TokenizeOptions) {
    update((s) => {
      if (!s.rawText) return s;
      const words = tokenize(s.rawText, { ...opts, language: detectedLanguage });
      const bracketStack = computeStackFromWords(words, s.index);
      return { ...s, words, bracketStack };
    });
  }

  function scrubTo(ratio: number) {
    update((s) => {
      const index = Math.max(0, Math.min(Math.floor(ratio * (s.words.length - 1)), s.words.length - 1));
      const bracketStack = computeStackFromWords(s.words, index);
      return { ...s, index, bracketStack };
    });
  }

  return {
    subscribe,
    start,
    stop,
    toggle,
    setWpm,
    jumpBack,
    jumpForward,
    loadText,
    retokenize,
    scrubTo,
  };
}

export const reader = createReader();

export const currentWord = derived(reader, ($r) => $r.words[$r.index]?.word ?? "");
export const progress = derived(reader, ($r) =>
  $r.words.length === 0 ? 0 : $r.index / ($r.words.length - 1),
);
export const wordCount = derived(reader, ($r) => $r.words.length);
export const currentIndex = derived(reader, ($r) => $r.index);
