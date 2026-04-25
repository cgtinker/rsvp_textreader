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
      get(key: string | string[]): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
      remove(key: string | string[]): Promise<void>
    }
  }
  windows: {
    create(createData: Record<string, unknown>): Promise<unknown>
  }
  runtime: {
    getURL(path: string): string
  }
}

export const browserExtPlatform: Platform = {
  async getSelectedText(): Promise<string> {
    try {
      const stored = await browser.storage.local.get('pendingText')
      if (stored.pendingText) {
        await browser.storage.local.remove('pendingText')
        return stored.pendingText as string
      }
      return ''
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
