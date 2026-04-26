<script lang="ts">
  import Settings from '$lib/components/Settings.svelte';
  import IconGear from '$lib/components/ui/icons/IconGear.svelte';

  let open = false;
</script>

{#if open}
  <Settings onClose={() => (open = false)} />
{:else}
  <button
    class="gear-btn"
    on:click={() => (open = true)}
    title="Settings"
    aria-label="Open settings"
  >
    <IconGear />
  </button>
{/if}

<style>
  .gear-btn {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
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
