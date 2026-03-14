<script lang="ts">
  import { onMount } from 'svelte';

  import type { PageData } from './$types';
  import * as fingerprintLib from '$lib/fingerprint';
  import { sectionKeyMap } from '$lib/fingerprint';

  import type { FingerprintSection } from '$lib/fingerprint';

  let { data }: { data: PageData } = $props();

  let fingerprintSections = $state<FingerprintSection[]>([]);
  let fingerprintHash = $state('Collecting...');
  let refreshedAt = $state('Pending');
  let status = $state('Reading browser APIs...');
  let copied = $state(false);

  let jsonOutput = $derived(
    JSON.stringify(
      {
        clientIp: data.clientIp,
        requestUrl: data.requestUrl,
        browser: Object.fromEntries(
          fingerprintSections
            .filter((s) => s.title in sectionKeyMap)
            .map((s) => [
              sectionKeyMap[s.title],
              Object.fromEntries(s.fields.map((f) => [f.key, f.value]))
            ])
        )
      },
      null,
      2
    )
  );

  function saveHash(hash: string): void {
    const raw = localStorage.getItem('fp_hashes');
    const hashes: string[] = raw ? JSON.parse(raw) : [];
    if (!hashes.includes(hash)) {
      hashes.push(hash);
      localStorage.setItem('fp_hashes', JSON.stringify(hashes));
    }
  }

  async function collectFingerprint() {
    status = 'Reading browser APIs...';
    const result = await fingerprintLib.collectFingerprint();
    fingerprintSections = result.sections;
    refreshedAt = new Date().toLocaleString();
    fingerprintHash = result.hash;
    saveHash(result.hash);
    status = 'Ready';
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(jsonOutput);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  onMount(() => {
    void collectFingerprint();
  });
</script>

<svelte:head>
  <title>Test me page</title>
  <meta name="description" content="Test page" />
</svelte:head>

<div class="page-shell">
  <div class="toolbar">
    <div class="meta">
      <span class="hash-label">Hash</span>
      <code class="hash-value">{fingerprintHash.slice(0, 16)}…</code>
      <span class="status-badge">{status}</span>
      <span class="refresh-time">{refreshedAt}</span>
    </div>
    <div class="actions">
      <button onclick={copyToClipboard}>{copied ? 'Copied!' : 'Copy JSON'}</button>
      <button onclick={() => void collectFingerprint()}>Refresh</button>
    </div>
  </div>

  <pre class="json-block"><code>{jsonOutput}</code></pre>
</div>

<style>
  :global(body) {
    margin: 0;
    background:
      radial-gradient(circle at top, rgba(246, 196, 68, 0.18), transparent 28%),
      linear-gradient(180deg, #f7f5ef 0%, #ebe5d5 100%);
    color: #1f1b16;
    font-family: 'Segoe UI', 'Tahoma', sans-serif;
  }

  .page-shell {
    max-width: 1120px;
    margin: 0 auto;
    padding: 3rem 1.25rem 4rem;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(31, 27, 22, 0.12);
    border-radius: 1rem;
    background: rgba(255, 252, 246, 0.92);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.9rem;
  }

  .hash-label {
    font-weight: 700;
    color: #5a4a35;
    font-size: 0.84rem;
  }

  .hash-value {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 0.85rem;
    color: #1f1b16;
  }

  .status-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: #1f1b16;
    color: #fff8e8;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .refresh-time {
    color: #655748;
    font-size: 0.85rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .json-block {
    margin: 0;
    padding: 1.5rem;
    border: 1px solid rgba(31, 27, 22, 0.12);
    border-radius: 1.25rem;
    background: rgba(255, 252, 246, 0.92);
    box-shadow: 0 18px 40px rgba(75, 62, 42, 0.08);
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 0.88rem;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre;
    color: #1f1b16;
  }

  .json-block code {
    font: inherit;
  }

  button {
    border: 0;
    border-radius: 999px;
    padding: 0.85rem 1.2rem;
    background: #1f1b16;
    color: #fff8e8;
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 720px) {
    .page-shell {
      padding-top: 2rem;
    }
  }
</style>
