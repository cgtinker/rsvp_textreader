import type { Platform } from './types'
import type { SettingsState } from '$lib/stores/settings'

// Firefox WebExtensions API — available as a global inside extension context.
declare const browser: {
  tabs: {
    query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Array<{ id?: number }>>
  }
  scripting: {
    executeScript(injection: {
      target: { tabId: number }
      func: () => string
    }): Promise<Array<{ result: string }>>
  }
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
    }
  }
}

export const browserExtPlatform: Platform = {
  async getSelectedText(): Promise<string> {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (tab?.id == null) return ''
      const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() ?? '',
      })
      return result?.result ?? ''
    } catch {
      return ''
    }
  },

  async loadSettings(): Promise<Partial<SettingsState>> {
    try {
      const data = await browser.storage.local.get('settings')
      return (data.settings as Partial<SettingsState>) ?? {}
    } catch {
      return {}
    }
  },

  async saveSettings(s: SettingsState): Promise<void> {
    try {
      await browser.storage.local.set({ settings: s })
    } catch {
      // silently ignore storage errors
    }
  },
}
