<script lang="ts">
  import WordDisplay from "$lib/components/WordDisplay.svelte";
  import Controls from "$lib/components/Controls.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import { reader } from "$lib/stores/reader";
  import "../app.css";

  let settingsOpen = false;

  reader.loadText(`
    The quick brown fox jumps over the lazy dog near the riverbank
    while beautiful swallows glide effortlessly through extraordinary circumstances
    and mysterious strangers contemplated their complicated philosophical predicaments
  The quick brown fox jumps over the lazy dog near the riverbank
    while beautiful swallows glide effortlessly through extraordinary circumstances
    and mysterious strangers contemplated their complicated philosophical predicaments
  The quick brown fox jumps over the lazy dog near the riverbank
    while beautiful swallows glide effortlessly through extraordinary circumstances
    and mysterious strangers contemplated their complicated philosophical predicaments
  The quick brown fox jumps over the lazy dog near the riverbank
    while beautiful swallows glide effortlessly through extraordinary circumstances
    and mysterious strangers contemplated their complicated philosophical predicaments
  `);
</script>

{#if settingsOpen}
  <Settings onClose={() => (settingsOpen = false)} />
{:else}
  <button
    class="gear-btn"
    on:click={() => (settingsOpen = true)}
    title="Settings"
    aria-label="Open settings"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  </button>
  <WordDisplay />
  <Controls />
{/if}

<style>
  .gear-btn {
    position: fixed;
    top: 1.25rem;
    left: 1.25rem;
    z-index: 10;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--word);
    padding: 0.4rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.25;
    transition: opacity 200ms, color 120ms;
  }
  .gear-btn:hover {
    opacity: 1;
    color: var(--accent);
  }
</style>
