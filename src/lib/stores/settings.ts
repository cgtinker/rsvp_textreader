import { writable } from "svelte/store";

export type SettingsState = {
  defaultWpm: number;
  darkMode: boolean;
  accentColor: string;
  adaptiveMode: boolean;
};

const ACCENT_COLORS = [
  "#c0392b",
  "#e67e22",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#e91e8c",
];

const initial: SettingsState = {
  defaultWpm: 300,
  darkMode: false,
  accentColor: ACCENT_COLORS[0],
  adaptiveMode: false,
};

function createSettings() {
  const { subscribe, update, set } = writable<SettingsState>(initial);

  // Apply theme + accent to <html> whenever store changes
  subscribe((s) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(
      "data-theme",
      s.darkMode ? "dark" : "light"
    );
    document.documentElement.style.setProperty("--accent", s.accentColor);

    // dark accent is slightly lighter than light accent for the same hue
    // but we use the same value — the dark theme definition is overridden
    // by the inline style here, which is fine since we want per-color theming
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

  return {
    subscribe,
    set,
    setDefaultWpm,
    toggleDarkMode,
    setAccentColor,
    toggleAdaptiveMode,
    ACCENT_COLORS,
  };
}

export const settings = createSettings();
