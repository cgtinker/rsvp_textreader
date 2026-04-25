<script lang="ts">
  import { reader } from '$lib/stores/reader'
  import { onMount, onDestroy } from 'svelte'

  let dragOver = false

  function load(text: string) {
    const t = text.trim()
    if (t) reader.loadText(t)
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      load(text)
    } catch {
      // Clipboard API blocked — browser will show permission prompt or fail silently
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    dragOver = true
  }

  function onDragLeave() {
    dragOver = false
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault()
    dragOver = false
    const file = e.dataTransfer?.files[0]
    if (!file) return
    if (!file.name.endsWith('.txt') && !file.type.startsWith('text/')) return
    const text = await file.text()
    load(text)
  }

  function onKeyDown(e: KeyboardEvent) {
    // Let Ctrl/Cmd+V trigger paste without clicking the button
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      pasteFromClipboard()
    }
  }

  onMount(() => window.addEventListener('keydown', onKeyDown))
  onDestroy(() => window.removeEventListener('keydown', onKeyDown))
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="overlay"
  class:drag-over={dragOver}
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
>
  <div class="card">
    <svg class="icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
    <p class="hint">Paste text or drop a <code>.txt</code> file</p>
    <button class="paste-btn" on:click={pasteFromClipboard}>
      Paste from clipboard
      <kbd>{navigator.platform?.includes('Mac') ? '⌘V' : 'Ctrl+V'}</kbd>
    </button>
    {#if dragOver}
      <div class="drop-label">Drop to load</div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    z-index: 5;
    transition: background 150ms;
  }

  .overlay.drag-over {
    background: color-mix(in srgb, var(--accent) 8%, var(--bg));
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2.5rem 3rem;
    border: 1.5px dashed var(--guide);
    border-radius: 12px;
    transition: border-color 150ms;
  }

  .overlay.drag-over .card {
    border-color: var(--accent);
  }

  .icon {
    color: var(--muted);
  }

  .hint {
    color: var(--muted);
    font-size: 0.875rem;
    text-align: center;
  }

  .hint code {
    font-family: monospace;
    color: var(--word);
  }

  .paste-btn {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 1.1rem;
    background: none;
    border: 1px solid var(--guide);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--word);
    transition: border-color 120ms, color 120ms;
  }

  .paste-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  kbd {
    font-size: 0.75rem;
    padding: 0.1rem 0.35rem;
    border: 1px solid var(--guide);
    border-radius: 3px;
    color: var(--muted);
    font-family: monospace;
  }

  .drop-label {
    font-size: 0.875rem;
    color: var(--accent);
    font-weight: 600;
  }
</style>
