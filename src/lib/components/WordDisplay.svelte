<script lang="ts">
  import { currentWord, reader } from "$lib/stores/reader";
  import { settings } from "$lib/stores/settings";
  import { getPivotIndex } from "$lib/utils/orp";
  import { isCJK } from "$lib/utils/language";
  import { measureTypography } from "$lib/utils/typography";
  import { getExpectedCloser } from "$lib/utils/brackets";
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

  // ---------------------------------------------------------------------------
  // Bracket stack overlay — animated display state
  // ---------------------------------------------------------------------------

  // The expected next closing sign = the close for the topmost opening
  $: expectedClosing = $reader.bracketStack.length > 0
    ? getExpectedCloser($reader.bracketStack.at(-1)!)
    : "";

  // Position of the vertical guide line as a % of stage width.
  // Mirror the same formula used in getPivotIndex so the guide always
  // sits under the focused character regardless of focusPoint setting.
  // Map focusPoint 0–100 → 10–90% of stage width to avoid edge clipping.
  $: pivotX = 10 + ($settings.focusPoint / 100) * 80;

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
  <div class="guide-top"></div>
  <div class="guide-bottom"></div>
  <div class="guide-descender"></div>
  {#if $reader.bracketStack.length > 0}
    <span class="bracket-stack" aria-hidden="true"
    >{#each $reader.bracketStack as ch}{ch}{/each}</span>
  {/if}
  {#if expectedClosing}
    <span class="bracket-expected" aria-hidden="true">{expectedClosing}</span>
  {/if}
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
    font-size: clamp(2.5rem, 7vw, 5rem);
  }

  .guide-top,
  .guide-bottom,
  .guide-descender {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--guide);
    pointer-events: none;
  }
  /* cap-height line: roughly 0.55em above the text box center */
  .guide-top {
    top: calc(50% + 2.5% - 0.55em);
  }
  /* baseline line: roughly 0.45em below the text box center */
  .guide-bottom {
    top: calc(50% + 2.5% + 0.45em);
    top: var(--text-bottom, calc(50% + 2.5% + 0.45em));
  }
  /* descender line: where g/p/y touch */
  .guide-descender {
    top: calc(50% + 2.5% + 0.75em);
    top: var(--text-descender, calc(50% + 2.5% + 0.75em));
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

  /* --- Bracket overlay --- */

  .bracket-expected,
  .bracket-stack {
    position: absolute;
    font-family: "Courier New", Courier, monospace;
    font-size: 0.55em;
    line-height: 1;
    white-space: pre;
    pointer-events: none;
    color: var(--word);
    top: calc(50% + 2.5%);
    transform: translateY(-50%);
  }

  /* Expected closing sign: right side of stage */
  .bracket-expected {
    right: 5%;
    opacity: 0.4;
  }

  /* Stack of openings: left side of stage */
  .bracket-stack {
    left: 5%;
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 0;
    opacity: 0.4;
  }
</style>
