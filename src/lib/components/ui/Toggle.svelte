<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked: boolean;
  export let label: string;

  const dispatch = createEventDispatcher<{ change: void }>();
</script>

<button
  class="toggle"
  class:on={checked}
  role="switch"
  aria-checked={checked}
  aria-label={label}
  on:click={() => dispatch('change')}
>
  <span class="thumb"></span>
</button>

<style>
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
</style>
