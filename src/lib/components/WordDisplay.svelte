<script lang="ts">
  import { currentWord } from '$lib/stores/reader'
  import { getPivotIndex } from '$lib/utils/orp'
  import { onMount } from 'svelte'

  let charWidth = 0
  let charRef: HTMLSpanElement

  // measure a single character once the font is loaded
  onMount(() => {
    document.fonts.ready.then(() => {
      charWidth = charRef.getBoundingClientRect().width
    })
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
<span
  bind:this={charRef}
  class="seg measure"
  aria-hidden="true"
>M</span>

<div class="stage">
  <div class="guide guide-h"/>
  <div class="guide guide-v"/>
  <div class="pip pip-top"/>
  <div class="pip pip-bot"/>

  <div
    class="word-row"
    style="transform: translateX({offset}px)"
    aria-live="assertive"
    aria-atomic="true"
  >
    <span class="seg before">{before}</span>
    <span class="seg pivot">{char}</span>
    <span class="seg after">{after}</span>
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
  }

  .guide {
    position: absolute;
    pointer-events: none;
  }
  .guide-h {
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--guide);
  }
  .guide-v {
    left: 50%;
    top: 10%;
    bottom: 10%;
    width: 1px;
    background: var(--guide);
  }

  .pip {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    pointer-events: none;
  }
  .pip-top { top: calc(50% - 2.6em); }
  .pip-bot { bottom: calc(50% - 2.6em); }

  .word-row {
    position: absolute;
    display: flex;
    align-items: baseline;
    left: 50%;
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

  .pivot {
    color: var(--accent);
  }
</style>