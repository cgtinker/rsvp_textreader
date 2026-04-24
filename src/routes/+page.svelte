<script lang="ts">
  import WordDisplay from "$lib/components/WordDisplay.svelte";
  import Controls from "$lib/components/Controls.svelte";
  import { reader } from "$lib/stores/reader";
  import "../app.css";

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

<WordDisplay />
<Controls />
