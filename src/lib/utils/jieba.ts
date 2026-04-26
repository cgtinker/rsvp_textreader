/**
 * Lazy wrapper around jieba-wasm.
 *
 * jieba-wasm requires an async `init()` before any `cut()` call.
 * We kick off initialisation on first request and cache the promise so
 * subsequent calls to `ensureJieba()` are instant.
 */
import init, { cut } from "jieba-wasm";

let initPromise: Promise<void> | null = null;

export function ensureJieba(): Promise<void> {
  if (!initPromise) {
    // init() returns the WASM module; we only need the side-effect.
    initPromise = (init as () => Promise<unknown>)().then(() => undefined);
  }
  return initPromise;
}

/**
 * Segment Chinese text into words using jieba HMM mode.
 * MUST only be called after `await ensureJieba()`.
 * HMM=true gives better coverage of unknown words, names, and compound nouns.
 */
export function cutChinese(text: string): string[] {
  return cut(text, /* hmm */ true);
}
