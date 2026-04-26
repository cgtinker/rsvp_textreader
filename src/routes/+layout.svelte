<script lang="ts">
  import { settings } from '$lib/stores/settings';

  // Apply theme token and accent color to the root element reactively.
  // Kept here rather than in the store so the store stays a pure data layer.
  $: document.documentElement.setAttribute('data-theme', $settings.darkMode ? 'dark' : 'light');
  $: document.documentElement.style.setProperty('--accent', $settings.accentColor);
</script>

<slot />
