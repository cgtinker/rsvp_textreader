<script lang="ts">
  import { reader, currentIndex, wordCount } from '$lib/stores/reader'

  // local bound value for the slider so it feels instant
  let wpm = 300

  function handleWpm(e: Event) {
    wpm = Number((e.target as HTMLInputElement).value)
    reader.setWpm(wpm)
  }

  function handleScrub(e: MouseEvent) {
    const bar = e.currentTarget as HTMLElement
    const ratio = e.offsetX / bar.offsetWidth
    reader.scrubTo(ratio)
  }

  $: progressPct = $wordCount === 0 ? 0 : ($currentIndex / ($wordCount - 1)) * 100
</script>

<div class="controls">

  <!-- progress / scrub bar -->
  <div class="progress-track" on:click={handleScrub} role="progressbar"
    aria-valuenow={$currentIndex} aria-valuemin={0} aria-valuemax={$wordCount}>
    <div class="progress-fill" style="width: {progressPct}%"/>
  </div>

  <div class="bar">

    <!-- 5s back -->
    <button class="btn" on:click={() => reader.jumpBack()} title="5 seconds back">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
        <text x="12" y="14" text-anchor="middle" font-size="7" stroke="none" fill="currentColor" font-family="monospace">5</text>
      </svg>
    </button>

    <!-- play / pause -->
    <button class="btn btn-play" on:click={() => reader.toggle()}>
      {#if $reader.playing}
        <!-- pause icon -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="4" width="4" height="16" rx="1"/>
          <rect x="15" y="4" width="4" height="16" rx="1"/>
        </svg>
      {:else}
        <!-- play icon -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      {/if}
    </button>

    <!-- wpm slider -->
    <div class="wpm-row">
      <input
        type="range"
        min="60"
        max="1000"
        step="10"
        value={wpm}
        on:input={handleWpm}
        class="slider"
      />
      <span class="wpm-label">{wpm} <span class="wpm-unit">wpm</span></span>
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
    opacity: 0.25;
    transition: opacity 200ms ease;
  }

  .controls:hover {
    opacity: 1;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 0 2rem;
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

  /* wpm slider */
  .wpm-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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