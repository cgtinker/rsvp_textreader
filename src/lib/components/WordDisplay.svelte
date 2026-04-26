<script lang="ts">
  import { currentWord, reader } from "$lib/stores/reader";
  import { settings } from "$lib/stores/settings";
  import { getPivotIndex } from "$lib/utils/orp";
  import { isCJK } from "$lib/utils/language";
  import { measureTypography } from "$lib/utils/typography";
  import { onMount } from "svelte";

  let charWidth = 0;
  let charRef: HTMLSpanElement;   // Latin reference: 'M'
  let cjkRef: HTMLSpanElement;    // CJK reference: '字'
  let stageEl: HTMLDivElement;
  let wordRowEl: HTMLDivElement;
  let capRef: HTMLSpanElement;

  $: isCJKMode = isCJK($reader.language);

  onMount(() => {
    function measure() {
      // Pick reference width based on the detected script.
      // CJK glyphs are typically full-width (≈2× a Latin em), so we
      // measure from a real CJK character when in CJK mode.
      charWidth = isCJKMode
        ? cjkRef.getBoundingClientRect().width
        : charRef.getBoundingClientRect().width;

      if (!stageEl || !capRef) return;
      // Typography guides use Latin metrics — skip in CJK mode to avoid
      // guide lines being positioned for Latin ink bounds.
      if (!isCJKMode) {
        const vars = measureTypography(stageEl, capRef);
        Object.entries(vars).forEach(([k, v]) => stageEl.style.setProperty(k, v));
      }
    }
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  // Re-measure when language changes (reactive to reader.language).
  $: if (isCJKMode !== undefined && charRef && cjkRef) {
    charWidth = isCJKMode
      ? cjkRef.getBoundingClientRect().width
      : charRef.getBoundingClientRect().width;
  }

  $: pivot = getPivotIndex($currentWord, $settings.focusPoint);
  $: pivotChar = $currentWord[pivot] ?? "";

  // Position of the vertical guide line as a % of stage width.
  // Mirror the same formula used in getPivotIndex so the guide always
  // sits under the focused character regardless of focusPoint setting.
  $: pivotX = $settings.focusPoint;

  // shift the word left by the width of the `before` chars
  // plus half a char so the pivot char's center sits at x=0
  $: offset = charWidth > 0 ? -(pivot * charWidth) - charWidth / 2 : 0;

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 10 : -10;
    const next = Math.min(1000, Math.max(60, $reader.wpm + delta));
    reader.setWpm(next);
  }
</script>

<!-- hidden single chars used purely for width measurement -->
<span bind:this={charRef} class="seg measure" aria-hidden="true">M</span>
<span bind:this={cjkRef} class="seg measure" aria-hidden="true">字</span>

<div
  class="stage"
  bind:this={stageEl}
  role="button"
  tabindex="0"
  aria-label={$reader.playing ? 'Pause' : 'Play'}
  style="--pivot-x: {pivotX}%"
  on:click={() => reader.toggle()}
  on:keydown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reader.toggle(); } }}
  on:wheel|preventDefault={handleWheel}
>
  <div class="guide guide-cap"></div>
  <div class="guide guide-xh"></div>
  <div class="guide guide-h"></div>
  <div class="guide guide-v"></div>

  <div
    class="word-row"
    bind:this={wordRowEl}
    style="transform: translateX({offset}px)"
    aria-live="assertive"
    aria-atomic="true"
  >
    <span class="seg word-text">{$currentWord}</span>
    {#if charWidth > 0}
      <span class="seg pivot-char" style="left: {pivot * charWidth}px" aria-hidden="true">{pivotChar}</span>
    {/if}
    <span bind:this={capRef} class="seg typo-ref" aria-hidden="true">H</span>
  </div>
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    height: calc(100vh - var(--controls-height, 5rem));
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 5%;
    background: var(--bg);
    overflow: hidden;
    cursor: pointer;
  }

  .guide {
    position: absolute;
    pointer-events: none;
  }
  .guide-cap {
    top: var(--text-cap-top);
    left: 0;
    right: 0;
    height: 1px;
    background: var(--guide);
  }
  .guide-xh {
    top: var(--text-xheight);
    left: 0;
    right: 0;
    height: 1px;
    background: var(--guide);
  }
  .guide-h {
    top: var(--text-bottom);
    left: 0;
    right: 0;
    height: 1px;
    background: var(--guide);
  }

  .guide-v {
    left: var(--pivot-x);
    top: 0;
    bottom: 95%;
    width: 1px;
    background: var(--guide);
    padding-top: 5%;
    transform: translateX(-50%);
  }

  .word-row {
    position: absolute;
    display: flex;
    align-items: baseline;
    left: var(--pivot-x);
    /* offset applied via inline style above */
  }

  .seg {
    font-family: "Courier New", Courier, monospace;
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

  .word-text {
    position: relative;
  }

  .pivot-char {
    position: absolute;
    top: 0;
    color: var(--accent);
    pointer-events: none;
  }
</style>
