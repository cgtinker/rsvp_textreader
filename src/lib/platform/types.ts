import type { SettingsState } from '$lib/stores/settings'

export interface Platform {
  /** Get the currently selected text on the active tab. Returns '' when unavailable. */
  getSelectedText(): Promise<string>
  /** Load persisted settings. Returns {} when nothing is saved yet. */
  loadSettings(): Promise<Partial<SettingsState>>
  /** Persist the full settings state. */
  saveSettings(s: SettingsState): Promise<void>
}
