<script lang="ts">
  // Svelte 5 with Runes
  import { onMount } from 'svelte';

  // Using Svelte 5 runes
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log(`Count is now: ${count}`);
  });

  function increment() {
    count++;
  }
</script>

<main class="min-h-screen bg-gray-100 flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold mb-4 text-blue-600">Svelte 5 + TypeScript</h1>
    <p class="mb-4">Count: {count}</p>
    <p class="mb-4">Doubled: {doubled}</p>
    <button
      onclick={increment}
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Increment
    </button>
    <p class="mt-4 text-sm text-gray-600">
      Built with Svelte 5 Runes, TypeScript, and TanStack Libraries
    </p>
  </div>
</main>

<style>
  /* Additional styles if needed */
</style>
