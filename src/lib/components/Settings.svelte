<script lang="ts">
  import { settings } from '$lib/stores/settings'

  export let onClose: () => void

  let wpm = $settings.defaultWpm

  function handleWpm(e: Event) {
    wpm = Number((e.target as HTMLInputElement).value)
    settings.setDefaultWpm(wpm)
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Settings">
  <!-- close button top-left -->
  <button class="corner-btn" on:click={onClose} title="Close settings" aria-label="Close settings">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>

  <div class="panel">
    <h2 class="title">Settings</h2>

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

    <!-- Dark mode -->
    <section class="row">
      <span class="label">Dark mode</span>
      <button
        class="toggle"
        class:on={$settings.darkMode}
        on:click={() => settings.toggleDarkMode()}
        role="switch"
        aria-checked={$settings.darkMode}
        aria-label="Toggle dark mode"
      >
        <span class="thumb"></span>
      </button>
    </section>

    <div class="divider"></div>

    <!-- Accent color -->
    <section class="row">
      <span class="label">Accent color</span>
      <div class="swatches">
        {#each settings.ACCENT_COLORS as color}
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
      <span class="label">Adaptive mode</span>
      <button
        class="toggle"
        class:on={$settings.adaptiveMode}
        on:click={() => settings.toggleAdaptiveMode()}
        role="switch"
        aria-checked={$settings.adaptiveMode}
        aria-label="Toggle adaptive mode"
      >
        <span class="thumb"></span>
      </button>
    </section>
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
    left: 1.25rem;
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

  /* Toggle switch */
  .toggle {
    position: relative;
    width: 40px;
    height: 22px;
    border-radius: 11px;
    border: 1px solid var(--guide);
    background: transparent;
    cursor: pointer;
    transition: border-color 200ms, background 200ms;
    padding: 0;
    flex-shrink: 0;
  }
  .toggle.on {
    background: var(--accent);
    border-color: var(--accent);
  }
  .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--muted);
    transition: transform 200ms, background 200ms;
    display: block;
  }
  .toggle.on .thumb {
    transform: translateX(18px);
    background: #fff;
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
