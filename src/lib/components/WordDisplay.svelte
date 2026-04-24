<script lang="ts">
  import { currentWord } from '$lib/stores/reader'
  import { getPivotIndex } from '$lib/utils/orp'
  import { onMount } from 'svelte'

  let charWidth = 0
  let charRef: HTMLSpanElement
  let stageEl: HTMLDivElement
  let wordRowEl: HTMLDivElement
  let baselineRef: HTMLSpanElement
  let capRef: HTMLSpanElement
  let descenderRef: HTMLSpanElement

  // measure a single character once the font is loaded
  onMount(() => {
    function measure() {
      charWidth = charRef.getBoundingClientRect().width
      if (!stageEl || !capRef) return

      const sr      = stageEl.getBoundingClientRect()
      const lineBox = capRef.getBoundingClientRect()

      // Use canvas metrics to get per-glyph ink bounds
      const style = getComputedStyle(capRef)
      const canvas = document.createElement('canvas')
      const ctx    = canvas.getContext('2d')!
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`

      const mH = ctx.measureText('H')
      const mx = ctx.measureText('x')
      const mp = ctx.measureText('p')

      // fontBoundingBoxAscent + Descent = canvas em square height, which may
      // not exactly equal the CSS line-box height. Normalize so baseline is
      // proportionally correct relative to the actual rendered line box.
      const emH       = mH.fontBoundingBoxAscent + mH.fontBoundingBoxDescent
      const baselineY = (lineBox.top - sr.top) + (mH.fontBoundingBoxAscent / emH) * lineBox.height
      const h         = sr.height
      const pct       = (y: number) => `${(y / h * 100).toFixed(2)}%`

      stageEl.style.setProperty('--text-cap-top',   pct(baselineY - mH.actualBoundingBoxAscent))
      stageEl.style.setProperty('--text-xheight',   pct(baselineY - mx.actualBoundingBoxAscent))
      stageEl.style.setProperty('--text-bottom',    pct(baselineY + mx.actualBoundingBoxDescent))
      stageEl.style.setProperty('--text-descender', pct(baselineY + mp.actualBoundingBoxDescent))
    }
    document.fonts.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  })

  $: pivot  = getPivotIndex($currentWord)
  $: before = $currentWord.slice(0, pivot)
  $: char   = $currentWord[pivot] ?? ''
  $: after  = $currentWord.slice(pivot + 1)

  // shift the word left by the width of the `before` chars
  // plus half a char so the pivot char's center sits at x=0
  $: offset = charWidth > 0
    ? -(before.length * charWidth) - (charWidth / 2)
    : 0
</script>

<!-- hidden single char used purely for measurement -->
<span bind:this={charRef} class="seg measure" aria-hidden="true">M</span>

<div class="stage" bind:this={stageEl}>
  <div class="guide guide-cap"></div>
  <div class="guide guide-xh"></div>
  <div class="guide guide-h"></div>
  <div class="guide guide-desc"></div>
  <div class="guide guide-v"></div>
  
  <div
    class="word-row"
    bind:this={wordRowEl}
    style="transform: translateX({offset}px)"
    aria-live="assertive"
    aria-atomic="true"
  >
    <span class="seg before">{before}</span>
    <span class="seg pivot">{char}</span>
    <span class="seg after">{after}</span>
    <!-- typographic reference glyphs share this baseline exactly -->
    <span bind:this={capRef}       class="seg typo-ref" aria-hidden="true">H</span>
    <span bind:this={baselineRef}  class="seg typo-ref" aria-hidden="true">x</span>
    <span bind:this={descenderRef} class="seg typo-ref" aria-hidden="true">p</span>
  </div>
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    overflow: hidden;
    --pivot-x: 37.3%;
  }

  .guide {
    position: absolute;
    pointer-events: none;
  }
  .guide-cap  { top: var(--text-cap-top);   left: 0; right: 0; height: 1px; background: var(--guide); }
  .guide-xh   { top: var(--text-xheight);   left: 0; right: 0; height: 1px; background: var(--guide); }
  .guide-h    { top: var(--text-bottom);     left: 0; right: 0; height: 1px; background: var(--guide); }
  .guide-desc { top: var(--text-descender);  left: 0; right: 0; height: 1px; background: var(--guide); }

  .guide-v {
    left: var(--pivot-x);
    top: 0%;
    bottom: var(--controls-height, 5rem);
    width: 30px;
    background: var(--guide);
    transform: translateX(-50%);}
/*
  .pip {
    position: absolute;
    left: var(--pivot-x);
    transform: translateX(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    pointer-events: none;
  }
  .pip-top { top: calc(50% - 2.6em); }
  .pip-bot { bottom: calc(50% - 2.6em); }
*/
  .word-row {
    position: absolute;
    display: flex;
    align-items: baseline;
    left: var(--pivot-x);
    /* offset applied via inline style above */
  }

  .seg {
    font-family: 'Courier New', Courier, monospace;
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 1;
    color: var(--word);
    white-space: pre;
  }

  /* hidden measurement element */
  .measure {
    position: fixed;
    visibility: hidden;
    top: -999px;
    left: -999px;
    pointer-events: none;
  }

  /* typographic reference glyphs — inside word-row, share its baseline */
  .typo-ref {
    visibility: hidden;
    width: 0;
    overflow: visible;
    pointer-events: none;
  }

  .pivot {
    color: var(--accent);
  }
</style>