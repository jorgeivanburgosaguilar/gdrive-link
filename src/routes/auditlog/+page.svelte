<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import type { PageData } from './$types';

  type RowState = {
    expanded: boolean;
    loading: boolean;
    content: string | null;
    error: string | null;
  };

  let { data }: { data: PageData } = $props();
  let rowStates = new SvelteMap<number, RowState>();

  $effect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  });

  function getState(id: number): RowState {
    return rowStates.get(id) ?? { expanded: false, loading: false, content: null, error: null };
  }

  function setState(id: number, next: RowState) {
    rowStates.set(id, next);
  }

  async function toggle(entry: { id: number; identityId: number }) {
    const state = getState(entry.id);
    if (state.expanded) {
      setState(entry.id, { ...state, expanded: false });
      return;
    }
    if (state.content !== null || state.error !== null) {
      setState(entry.id, { ...state, expanded: true });
      return;
    }
    setState(entry.id, { ...state, expanded: true, loading: true });
    try {
      const res = await fetch(`/api/identity/${entry.identityId}`);
      const json = await res.json();
      if (!res.ok) {
        setState(entry.id, {
          expanded: true,
          loading: false,
          content: null,
          error: json.error ?? 'Error desconocido'
        });
      } else {
        const pretty = JSON.stringify(JSON.parse(json.content), null, 2);
        setState(entry.id, { expanded: true, loading: false, content: pretty, error: null });
      }
    } catch {
      setState(entry.id, { expanded: true, loading: false, content: null, error: 'Error de red' });
    }
  }
</script>

<div class="min-h-screen dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 py-8 dark:text-gray-100">
    <h1 class="mb-6 text-2xl font-semibold dark:text-gray-100">Audit Log</h1>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr
            class="border-b border-gray-200 text-left text-xs text-gray-500 uppercase dark:border-gray-700 dark:text-gray-400"
          >
            <th class="py-2 pr-4 font-medium">Fecha</th>
            <th class="py-2 pr-4 font-medium">URL</th>
            <th class="py-2 pr-4 font-medium">Referrer</th>
            <th class="py-2 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {#each data.entries as entry (entry.id)}
            {@const state = getState(entry.id)}
            <tr
              class="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              <td class="py-2 pr-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                <button
                  onclick={() => toggle(entry)}
                  class="inline-flex cursor-pointer items-center gap-2"
                >
                  <svg
                    class="h-3 w-3 shrink-0 transition-transform {state.expanded
                      ? 'rotate-90'
                      : ''}"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M4 2l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {entry.createdAt}
                </button>
              </td>
              <td class="py-2 pr-4 break-all">{entry.requestUrl}</td>
              <td class="py-2 pr-4 break-all text-gray-600 dark:text-gray-400"
                >{entry.referer ?? '—'}</td
              >
              <td class="py-2 font-mono text-gray-600 dark:text-gray-400">{entry.ip}</td>
            </tr>
            {#if state.expanded}
              <tr class="bg-gray-50 dark:bg-gray-800/30">
                <td colspan="4" class="px-4 py-2">
                  {#if state.loading}
                    <span class="text-xs text-gray-400 dark:text-gray-500">Cargando...</span>
                  {:else if state.error}
                    <span class="text-xs text-red-500 dark:text-red-400">{state.error}</span>
                  {:else if state.content}
                    <pre
                      class="overflow-x-auto p-4 font-mono text-xs whitespace-pre dark:text-gray-300">{state.content}</pre>
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
      {#if data.entries.length === 0}
        <p class="py-12 text-center text-gray-400 dark:text-gray-600">No hay registros.</p>
      {/if}
    </div>
  </div>
</div>
