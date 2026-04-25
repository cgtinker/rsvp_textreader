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
};

const ACCENT_COLORS = [
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
};

function createSettings() {
  const { subscribe, update, set } = writable<SettingsState>(initial);

  // Guard: only persist after initial async hydration completes.
  let _loaded = false;

  // Apply theme + accent to <html> and persist whenever store changes.
  subscribe((s) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(
      "data-theme",
      s.darkMode ? "dark" : "light"
    );
    document.documentElement.style.setProperty("--accent", s.accentColor);
    if (_loaded) {
      platform.saveSettings(s);
    }
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
    ACCENT_COLORS,
  };
}

export const settings = createSettings();
