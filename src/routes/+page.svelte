<script lang="ts">
  import WordDisplay from "$lib/components/WordDisplay.svelte";
  import Controls from "$lib/components/Controls.svelte";
  import SettingsDrawer from "$lib/components/SettingsDrawer.svelte";
  import { reader } from "$lib/stores/reader";
  import { settings, settingsLoaded } from "$lib/stores/settings";
  import { platform } from "$lib/platform";
  import { onMount, onDestroy } from "svelte";
  import "../app.css";

  async function loadFile(file: File) {
    if (!file.name.endsWith('.txt') && !file.type.startsWith('text/')) return;
    const text = (await file.text()).trim();
    if (text) { reader.stop(); reader.loadText(text); }
  }

  let _cleanupListeners: (() => void) | null = null;

  onMount(async () => {
    await settingsLoaded;
    reader.setWpm($settings.defaultWpm);
    const text = await platform.getSelectedText();
    if (text.trim()) reader.loadText(text.trim());

    function handlePaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData('text/plain').trim() ?? '';
      if (text) { reader.stop(); reader.loadText(text); }
    }

    function handleDragOver(e: DragEvent) { e.preventDefault(); }

    async function handleDrop(e: DragEvent) {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file) await loadFile(file);
    }

    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    _cleanupListeners = () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  });

  onDestroy(() => _cleanupListeners?.());
</script>

<SettingsDrawer />
<WordDisplay />
<Controls />
