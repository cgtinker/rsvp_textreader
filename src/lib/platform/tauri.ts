import type { Platform } from './types'
import type { SettingsState } from '$lib/stores/settings'

// Lazy singleton — the Store is only constructed when Tauri IPC is actually available.
let _storePromise: Promise<import('@tauri-apps/plugin-store').Store> | null = null

function getStore() {
  if (!_storePromise) {
    _storePromise = import('@tauri-apps/plugin-store').then(({ Store }) =>
      Store.load('settings.json'),
    )
  }
  return _storePromise
}

export const tauriPlatform: Platform = {
  async getSelectedText(): Promise<string> {
    // No equivalent in Tauri desktop context.
    return ''
  },

  async loadSettings(): Promise<Partial<SettingsState>> {
    try {
      const store = await getStore()
      const data = await store.get<SettingsState>('settings')
      return data ?? {}
    } catch {
      return {}
    }
  },

  async saveSettings(s: SettingsState): Promise<void> {
    try {
      const store = await getStore()
      await store.set('settings', s)
      await store.save()
    } catch {
      // not in a Tauri context or IPC unavailable
    }
  },
}
