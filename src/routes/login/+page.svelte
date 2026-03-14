<script lang="ts">
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  $effect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  });
</script>

<div class="min-h-screen dark:bg-gray-900">
  <div class="flex min-h-screen items-center justify-center px-4">
    <div
      class="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <h1 class="mb-6 text-center text-xl font-semibold dark:text-gray-100">Acceso restringido</h1>

      <form method="POST">
        <div class="mb-4">
          <label for="password" class="mb-1 block text-sm font-medium dark:text-gray-300">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            class="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="••••••••"
          />
        </div>

        {#if form?.error}
          <p class="mb-4 text-sm text-red-400 dark:text-red-400">{form.error}</p>
        {/if}

        <button
          type="submit"
          class="w-full rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
        >
          Entrar
        </button>
      </form>
    </div>
  </div>
</div>
