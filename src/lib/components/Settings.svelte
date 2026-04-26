<script lang="ts">
  import { settings, ACCENT_COLORS } from '$lib/stores/settings'
  import { reader } from '$lib/stores/reader'
  import Toggle from '$lib/components/ui/Toggle.svelte'
  import IconClose from '$lib/components/ui/icons/IconClose.svelte'

  export let onClose: () => void

  let wpm = $settings.defaultWpm

  function handleWpm(e: Event) {
    wpm = Number((e.target as HTMLInputElement).value)
    settings.setDefaultWpm(wpm)
  }

  let adaptiveExpanded = $settings.adaptiveMode
  let scalingExpanded = $settings.wordLengthScaling

  const SCRIPT_LABELS: Record<string, string> = {
    latin: 'Latin',
    japanese: 'Japanese',
    chinese: 'Chinese',
  }

  function toggleAdaptive() {
    settings.toggleAdaptiveMode()
    if ($settings.adaptiveMode) adaptiveExpanded = true
  }

  function toggleScaling() {
    settings.toggleWordLengthScaling()
    if ($settings.wordLengthScaling) scalingExpanded = true
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Settings">
  <!-- close button top-left -->
  <button class="corner-btn" on:click={onClose} title="Close settings" aria-label="Close settings">
    <IconClose />
  </button>

  <div class="panel">
    <h2 class="title">Settings</h2>

    <!-- Detected script -->
    {#if $reader.rawText}
      <section class="row">
        <span class="label">Detected script</span>
        <span class="script-badge">{SCRIPT_LABELS[$reader.language] ?? $reader.language}</span>
      </section>
      <div class="divider"></div>
    {/if}

    <!-- Default WPM -->
    <section class="row">
      <label class="label" for="default-wpm">Default WPM</label>
      <div class="wpm-row">
        <input
          id="default-wpm"
          type="range"
          min="60"
          max="1000"
          step="10"
          bind:value={wpm}
          on:input={handleWpm}
          class="slider"
        />
        <span class="wpm-val">{wpm}</span>
      </div>
    </section>

    <div class="divider"></div>

    <!-- Focus point -->
    <section class="row">
      <label class="label" for="focus-point">Focus point</label>
      <div class="wpm-row">
        <input
          id="focus-point"
          type="range"
          min="0"
          max="100"
          step="1"
          value={$settings.focusPoint}
          on:input={(e) => settings.setFocusPoint(Number(e.currentTarget.value))}
          class="slider"
        />
        <span class="wpm-val">{$settings.focusPoint}%</span>
      </div>
    </section>

    <div class="divider"></div>

    <!-- Font size -->
    <section class="row">
      <label class="label" for="font-size">Font size</label>
      <div class="wpm-row">
        <input
          id="font-size"
          type="range"
          min="1.5"
          max="8"
          step="0.25"
          value={$settings.fontSize}
          on:input={(e) => settings.setFontSize(Number(e.currentTarget.value))}
          class="slider"
        />
        <span class="wpm-val">{$settings.fontSize}rem</span>
      </div>
    </section>

    <div class="divider"></div>

    <!-- Dark mode -->
    <section class="row">
      <span class="label">Dark mode</span>
      <Toggle checked={$settings.darkMode} label="Toggle dark mode" on:change={() => settings.toggleDarkMode()} />
    </section>

    <div class="divider"></div>

    <!-- Accent color -->
    <section class="row">
      <span class="label">Accent color</span>
      <div class="swatches">
        {#each ACCENT_COLORS as color}
          <button
            class="swatch"
            class:active={$settings.accentColor === color}
            style="background: {color}"
            on:click={() => settings.setAccentColor(color)}
            aria-label="Accent color {color}"
          ></button>
        {/each}
      </div>
    </section>

    <div class="divider"></div>

    <!-- Adaptive mode -->
    <section class="row">
      <button class="label with-chevron label-btn" on:click={() => { if ($settings.adaptiveMode) adaptiveExpanded = !adaptiveExpanded }}>
        <svg class="chevron" class:open={$settings.adaptiveMode && adaptiveExpanded} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        Adaptive mode
      </button>
      <Toggle checked={$settings.adaptiveMode} label="Toggle adaptive mode" on:change={toggleAdaptive} />
    </section>

    {#if $settings.adaptiveMode && adaptiveExpanded}
      <div class="divider"></div>

      <!-- Punctuation pauses -->
      <section class="row">
        <span class="label">Punctuation pauses</span>
        <Toggle checked={$settings.punctuationPauses} label="Toggle punctuation pauses" on:change={() => settings.togglePunctuationPauses()} />
      </section>

      <div class="divider"></div>

      <!-- Word length scaling -->
      <section class="row">
        <button class="label with-chevron label-btn" on:click={() => { if ($settings.wordLengthScaling) scalingExpanded = !scalingExpanded }}>
          <svg class="chevron" class:open={$settings.wordLengthScaling && scalingExpanded} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          Word length scaling
        </button>
        <Toggle checked={$settings.wordLengthScaling} label="Toggle word length scaling" on:change={toggleScaling} />
      </section>

      {#if $settings.wordLengthScaling && scalingExpanded}
        <div class="divider"></div>

        <section class="row">
          <label class="label" for="aggressiveness">Scaling aggressiveness</label>
          <div class="wpm-row">
            <input
              id="aggressiveness"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={$settings.adaptiveAggressiveness}
              on:input={(e) => settings.setAdaptiveAggressiveness(Number(e.currentTarget.value))}
              class="slider"
            />
            <span class="wpm-val">{($settings.adaptiveAggressiveness * 100).toFixed(0)}%</span>
          </div>
        </section>
      {/if}
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .corner-btn {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--word);
    padding: 0.4rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 120ms;
  }
  .corner-btn:hover {
    color: var(--accent);
  }

  .panel {
    width: min(420px, 90vw);
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .title {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    font-weight: normal;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 1.5rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 0;
  }

  .divider {
    height: 1px;
    background: var(--guide);
  }

  .label {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: var(--word);
  }

  .script-badge {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .label.with-chevron {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .label-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: var(--word);
    text-align: left;
  }

  .chevron {
    color: var(--muted);
    flex-shrink: 0;
    transition: transform 200ms ease;
    transform: rotate(0deg);
  }
  .chevron.open {
    transform: rotate(90deg);
  }

  /* WPM slider */
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

  .wpm-val {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: var(--word);
    min-width: 4ch;
    text-align: right;
  }

  /* Swatches */
  .swatches {
    display: flex;
    gap: 0.5rem;
  }

  .swatch {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 120ms, border-color 120ms;
  }
  .swatch:hover {
    transform: scale(1.15);
  }
  .swatch.active {
    border-color: var(--word);
  }
</style>
