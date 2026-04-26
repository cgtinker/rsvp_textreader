<script lang="ts">
  import { reader, progress, currentIndex, wordCount } from '$lib/stores/reader'
  import { onMount } from 'svelte'
  import IconJumpBack from '$lib/components/ui/icons/IconJumpBack.svelte'
  import IconJumpForward from '$lib/components/ui/icons/IconJumpForward.svelte'
  import IconPlay from '$lib/components/ui/icons/IconPlay.svelte'
  import IconPause from '$lib/components/ui/icons/IconPause.svelte'

  let controlsEl: HTMLDivElement

  onMount(() => {
    function measureControls() {
      if (controlsEl) {
        const h = controlsEl.getBoundingClientRect().height
        document.documentElement.style.setProperty('--controls-height', `${h}px`)
      }
    }
    measureControls()
    window.addEventListener('resize', measureControls)
    return () => window.removeEventListener('resize', measureControls)
  })

  function handleWpm(e: Event) {
    reader.setWpm(Number((e.target as HTMLInputElement).value))
  }

  function handleScrub(e: MouseEvent) {
    const bar = e.currentTarget as HTMLElement
    const ratio = e.offsetX / bar.offsetWidth
    reader.scrubTo(ratio)
  }

  function handleScrubKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); reader.jumpBack(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); reader.jumpForward(); }
  }

  $: progressPct = $progress * 100
</script>

<div class="controls" bind:this={controlsEl}>

  <!-- progress / scrub bar -->
  <div
    class="progress-track"
    role="slider"
    tabindex="0"
    aria-label="Reading position"
    aria-valuenow={$currentIndex}
    aria-valuemin={0}
    aria-valuemax={$wordCount - 1}
    on:click={handleScrub}
    on:keydown={handleScrubKey}
  >
    <div class="progress-fill" style="width: {progressPct}%"></div>
  </div>

  <div class="bar">

    <!-- play group: absolutely centered on the vertical guide -->
    <div class="play-group">
      <button class="btn" on:click={() => reader.jumpBack()} title="5 seconds back" aria-label="Jump back 5 seconds">
        <IconJumpBack />
      </button>

      <button class="btn btn-play" on:click={() => reader.toggle()} aria-label={$reader.playing ? 'Pause' : 'Play'}>
        {#if $reader.playing}
          <IconPause />
        {:else}
          <IconPlay />
        {/if}
      </button>

      <button class="btn" on:click={() => reader.jumpForward()} title="5 seconds forward" aria-label="Jump forward 5 seconds">
        <IconJumpForward />
      </button>
    </div>

    <!-- wpm: pinned to right -->
    <div class="wpm-row">
      <input
        type="range"
        min="60"
        max="1000"
        step="10"
        value={$reader.wpm}
        on:input={handleWpm}
        class="slider"
      />
      <span class="wpm-label"><strong>{$reader.wpm}</strong> <span class="wpm-unit">wpm</span></span>
    </div>

  </div>
</div>

<style>
  .controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    padding: 0 0 1.5rem;
  }

  /* progress bar */
  .progress-track {
    width: 100%;
    height: 2px;
    background: var(--guide);
    cursor: pointer;
    margin-bottom: 1rem;
    position: relative;
  }
  .progress-track:hover {
    height: 4px;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    pointer-events: none;
    transition: width 100ms linear;
  }

  /* button row */
  .bar {
    position: relative;
    display: flex;
    align-items: center;
    height: 2.5rem;
    padding: 0 1.25rem;
  }

  /* back · play · forward — centered in the controls bar */
  .play-group {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* wpm — pinned to right edge, matching gear icon */
  .wpm-row {
    position: absolute;
    right: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--word);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border-radius: 4px;
    transition: color 120ms, background 120ms;
  }
  .btn:hover {
    color: var(--accent);
  }

  .btn-play {
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--guide);
    border-radius: 50%;
  }
  .btn-play:hover {
    border-color: var(--accent);
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 140px;
    height: 2px;
    background: var(--guide);
    outline: none;
    cursor: pointer;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    transition: transform 120ms;
  }
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.3);
  }

  .wpm-label {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: var(--word);
    min-width: 5ch;
  }
  .wpm-unit {
    color: var(--muted);
    font-size: 0.75rem;
  }
</style>