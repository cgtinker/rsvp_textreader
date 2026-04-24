import { writable, derived } from "svelte/store";

export type ReaderState = {
  words: string[];
  index: number;
  wpm: number;
  playing: boolean;
};

const initial: ReaderState = {
  words: [],
  index: 0,
  wpm: 300,
  playing: false,
};

function createReader() {
  const { subscribe, set, update } = writable<ReaderState>(initial);

  let timeout: ReturnType<typeof setTimeout> | null = null;

  function tick() {
    update((s) => {
      if (!s.playing || s.index >= s.words.length - 1)
        return { ...s, playing: false };
      const next = { ...s, index: s.index + 1 };
      scheduleNext(next.wpm);
      return next;
    });
  }

  function start() {
    update((state) => {
      if (state.words.length === 0) return state;
      if (state.words.length - 1 === state.index) {
        state = { ...state, index: 0 };
      }
      scheduleNext(state.wpm);
      return { ...state, playing: true };
    });
  }

  function scheduleNext(wpm: number) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(tick, 60000 / wpm);
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

  function loadText(text: string) {
    stop();
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    set({ ...initial, words });
  }

  function scrubTo(ratio: number) {
    // update((s) => {
    //   const index = Math.floor(ratio * (s.words.length - 1));
    //   return { ...s, index: Math.max(0, Math.min(index, s.words.length - 1)) };
    // });
  }

  return {
    subscribe,
    start,
    stop,
    toggle,
    setWpm,
    jumpBack,
    loadText,
    scrubTo,
  };
}

export const reader = createReader();

export const currentWord = derived(reader, ($r) => $r.words[$r.index] ?? "");
export const progress = derived(reader, ($r) =>
  $r.words.length === 0 ? 0 : $r.index / ($r.words.length - 1),
);
export const wordCount = derived(reader, ($r) => $r.words.length);
export const currentIndex = derived(reader, ($r) => $r.index);
