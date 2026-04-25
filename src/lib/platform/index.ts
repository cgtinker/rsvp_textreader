import type { Platform } from './types'
import { browserExtPlatform } from './browser-ext'
import { webPlatform } from './web'
import { tauriPlatform } from './tauri'

export type { Platform }

function detectPlatform(): Platform {
  if (typeof window !== 'undefined') {
    if ('__TAURI_INTERNALS__' in window) return tauriPlatform
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((globalThis as any).browser?.runtime?.id) return browserExtPlatform
  }
  return webPlatform
}

export const platform: Platform = detectPlatform()
