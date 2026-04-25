import { writable, derived } from "svelte/store";
import { tokenize, type WordEntry, type TokenizeOptions } from "$lib/utils/orp";
import { settings } from "$lib/stores/settings";

export type ReaderState = {
  words: WordEntry[];
  rawText: string;
  index: number;
  wpm: number;
  playing: boolean;
};

const initial: ReaderState = {
  words: [],
  rawText: "",
  index: 0,
  wpm: 300,
  playing: false,
};

function createReader() {
  const { subscribe, set, update } = writable<ReaderState>(initial);

  let timeout: ReturnType<typeof setTimeout> | null = null;

  let adaptiveMode = false;
  let tokenizeOptions: TokenizeOptions = { aggressiveness: 0.5, punctuationPauses: true, wordLengthScaling: true };
  settings.subscribe((s) => {
    adaptiveMode = s.adaptiveMode;
    const next: TokenizeOptions = {
      aggressiveness: s.adaptiveAggressiveness,
      punctuationPauses: s.punctuationPauses,
      wordLengthScaling: s.wordLengthScaling,
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
        return { ...s, playing: false };
      const next = { ...s, index: s.index + 1 };
      const nextMultiplier = s.words[next.index]?.multiplier ?? 1.0;
      scheduleNext(next.wpm, nextMultiplier);
      return next;
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
      return { ...s, index: Math.max(0, s.index - steps) };
    });
  }

  function jumpForward() {
    update((s) => {
      const steps = Math.floor((s.wpm / 60) * 5);
      return { ...s, index: Math.min(s.words.length - 1, s.index + steps) };
    });
  }

  function loadText(text: string) {
    stop();
    let opts: TokenizeOptions = { aggressiveness: 0.5, punctuationPauses: true, wordLengthScaling: true };
    settings.subscribe((s) => {
      opts = { aggressiveness: s.adaptiveAggressiveness, punctuationPauses: s.punctuationPauses, wordLengthScaling: s.wordLengthScaling };
    })();
    const words = tokenize(text, opts);
    update((s) => ({ ...initial, wpm: s.wpm, words, rawText: text }));
  }

  function retokenize(opts: TokenizeOptions) {
    update((s) => {
      if (!s.rawText) return s;
      return { ...s, words: tokenize(s.rawText, opts) };
    });
  }

  function scrubTo(ratio: number) {
    update((s) => {
      const index = Math.floor(ratio * (s.words.length - 1));
      return { ...s, index: Math.max(0, Math.min(index, s.words.length - 1)) };
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
