export function getPivotIndex(word: string): number {
  return Math.min(
    Math.floor(word.length / 4) + 1,
    word.length - 1  // never out of bounds
  )
}