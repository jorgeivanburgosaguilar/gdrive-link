<script lang="ts">
	import { onMount } from 'svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let elapsedSeconds = $state(0);
	let countdown = $derived(Math.max(0, data.countdownSeconds - elapsedSeconds));

	onMount(() => {
		const redirectTimer = window.setTimeout(() => {
			window.location.replace(data.targetUrl);
		}, data.countdownSeconds * 1000);

		const countdownTimer = window.setInterval(() => {
			elapsedSeconds += 1;
		}, 1000);

		return () => {
			window.clearTimeout(redirectTimer);
			window.clearInterval(countdownTimer);
		};
	});
</script>

<svelte:head>
	<title>Redirecting to Google Drive</title>
	<meta
		name="description"
		content="Short-link splash page before redirecting to the destination in Google Drive."
	/>
</svelte:head>

<div class="splash-shell">
	<section class="splash-card">
		<div class="loader" aria-hidden="true">
			<div class="loader-ring loader-ring-outer"></div>
			<div class="loader-ring loader-ring-middle"></div>
			<div class="loader-core"></div>
		</div>

		<p class="eyebrow">Drive short-link</p>
		<h1>Redirecting to Google Drive</h1>
		<p class="summary">
			Your file link is ready. This page will forward you in
			<span aria-live="polite">{countdown}</span>
			seconds.
		</p>

		<div class="destination">
			<p>Requested path</p>
			<code>{data.displayPath}</code>
		</div>

		<div class="destination">
			<p>Destination</p>
			<code>{data.targetUrl}</code>
		</div>

		<form class="actions" method="GET" action={data.targetUrl}>
			<button class="primary-action" type="submit">Open now</button>
		</form>

		<p class="hint">If the automatic redirect does not happen, use the button above.</p>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		background:
			radial-gradient(circle at top, rgba(62, 129, 255, 0.2), transparent 30%),
			linear-gradient(180deg, #f5f7fb 0%, #dfe7f4 100%);
		color: #10233d;
		font-family: 'Segoe UI', 'Tahoma', sans-serif;
	}

	.splash-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
	}

	.splash-card {
		width: min(100%, 720px);
		padding: 2rem;
		border: 1px solid rgba(16, 35, 61, 0.12);
		border-radius: 1.75rem;
		background: rgba(255, 255, 255, 0.86);
		box-shadow: 0 24px 60px rgba(16, 35, 61, 0.12);
		backdrop-filter: blur(12px);
	}

	.loader {
		position: relative;
		width: 5rem;
		height: 5rem;
		margin-bottom: 1.5rem;
	}

	.loader-ring,
	.loader-core {
		position: absolute;
		inset: 0;
		border-radius: 999px;
	}

	.loader-ring-outer {
		border: 4px solid rgba(56, 113, 224, 0.2);
		border-top-color: #3871e0;
		animation: spin 1.4s linear infinite;
	}

	.loader-ring-middle {
		inset: 0.6rem;
		border: 4px solid rgba(17, 151, 167, 0.18);
		border-bottom-color: #1197a7;
		animation: spin-reverse 1s linear infinite;
	}

	.loader-core {
		inset: 1.45rem;
		background: linear-gradient(135deg, #3871e0, #1197a7);
		box-shadow: 0 0 30px rgba(56, 113, 224, 0.24);
	}

	.eyebrow {
		margin: 0 0 0.65rem;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #3871e0;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.1rem, 6vw, 4rem);
		line-height: 0.95;
	}

	.summary,
	.hint {
		line-height: 1.6;
		color: #3e526d;
	}

	.summary {
		margin: 1rem 0 1.5rem;
		font-size: 1rem;
	}

	.summary span {
		display: inline-block;
		min-width: 1.4ch;
		font-weight: 800;
		color: #10233d;
	}

	.destination {
		margin-bottom: 1rem;
		padding: 1rem;
		border-radius: 1rem;
		background: #f8fbff;
		border: 1px solid rgba(56, 113, 224, 0.12);
	}

	.destination p {
		margin: 0 0 0.35rem;
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #58708f;
	}

	code {
		display: block;
		overflow-wrap: anywhere;
		font:
			600 0.94rem/1.55 'Consolas',
			'Courier New',
			monospace;
		color: #10233d;
	}

	.actions {
		margin-top: 1.5rem;
	}

	.primary-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		padding: 0.95rem 1.35rem;
		border-radius: 999px;
		background: #10233d;
		color: #f7fbff;
		font-weight: 700;
		cursor: pointer;
	}

	.hint {
		margin: 1rem 0 0;
		font-size: 0.95rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes spin-reverse {
		to {
			transform: rotate(-360deg);
		}
	}

	@media (max-width: 640px) {
		.splash-card {
			padding: 1.5rem;
		}
	}
</style>
