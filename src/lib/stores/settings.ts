import { writable } from "svelte/store";
import { platform } from "$lib/platform";

let _resolveSettingsLoaded!: () => void;
export const settingsLoaded: Promise<void> = new Promise((r) => { _resolveSettingsLoaded = r; });

export type SettingsState = {
  defaultWpm: number;
  darkMode: boolean;
  accentColor: string;
  adaptiveMode: boolean;
  punctuationPauses: boolean;
  wordLengthScaling: boolean;
  adaptiveAggressiveness: number;
  focusPoint: number;    // 0–100: which character to align to the guide (0=first, 100=last)
  fontSize: number;      // rem units for the display font
};

export const ACCENT_COLORS = [
  "#2980b9",
  "#8e44ad",
  "#e91e8c",
  "#c0392b",
  "#e67e22",
  "#27ae60",
];

const initial: SettingsState = {
  defaultWpm: 300,
  darkMode: false,
  accentColor: ACCENT_COLORS[0],
  adaptiveMode: true,
  punctuationPauses: true,
  wordLengthScaling: true,
  adaptiveAggressiveness: 0.5,
  focusPoint: 50,
  fontSize: 3.5,
};

function createSettings() {
  const { subscribe, update, set } = writable<SettingsState>(initial);

  // Guard: only persist after initial async hydration completes.
  let _loaded = false;

  // Persist whenever store changes (after initial hydration).
  // DOM side-effects (data-theme, --accent) are handled in +layout.svelte.
  subscribe((s) => {
    if (_loaded) platform.saveSettings(s);
  });

  // Hydrate from persistent storage, then enable saving.
  platform.loadSettings().then((saved) => {
    if (Object.keys(saved).length > 0) {
      update((s) => ({ ...s, ...saved }));
    }
    _loaded = true;
    _resolveSettingsLoaded();
  });

  function setDefaultWpm(wpm: number) {
    update((s) => ({ ...s, defaultWpm: wpm }));
  }

  function toggleDarkMode() {
    update((s) => ({ ...s, darkMode: !s.darkMode }));
  }

  function setAccentColor(color: string) {
    update((s) => ({ ...s, accentColor: color }));
  }

  function toggleAdaptiveMode() {
    update((s) => ({ ...s, adaptiveMode: !s.adaptiveMode }));
  }

  function togglePunctuationPauses() {
    update((s) => ({ ...s, punctuationPauses: !s.punctuationPauses }));
  }

  function toggleWordLengthScaling() {
    update((s) => ({ ...s, wordLengthScaling: !s.wordLengthScaling }));
  }

  function setAdaptiveAggressiveness(value: number) {
    update((s) => ({ ...s, adaptiveAggressiveness: Math.min(Math.max(value, 0), 1) }));
  }

  function setFocusPoint(value: number) {
    update((s) => ({ ...s, focusPoint: Math.min(Math.max(Math.round(value), 0), 100) }));
  }

  function setFontSize(value: number) {
    update((s) => ({ ...s, fontSize: Math.min(Math.max(value, 1), 10) }));
  }

  return {
    subscribe,
    set,
    setDefaultWpm,
    toggleDarkMode,
    setAccentColor,
    toggleAdaptiveMode,
    togglePunctuationPauses,
    toggleWordLengthScaling,
    setAdaptiveAggressiveness,
    setFocusPoint,
    setFontSize,
  };
}

export const settings = createSettings();
