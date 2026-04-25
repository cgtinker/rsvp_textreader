import type { Platform } from './types'
import type { SettingsState } from '$lib/stores/settings'

const STORAGE_KEY = 'textplayer_settings'

export const webPlatform: Platform = {
  async getSelectedText(): Promise<string> {
    return ''
  },

  async loadSettings(): Promise<Partial<SettingsState>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Partial<SettingsState>) : {}
    } catch {
      return {}
    }
  },

  async saveSettings(s: SettingsState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      // private browsing or storage quota exceeded
    }
  },
}
