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
	<title>Google Drive</title>
	<meta
		name="description"
		content="Short-link splash page before redirecting to the destination in Google Drive."
	/>
</svelte:head>

<div class="splash-shell">
	<div class="loader" aria-hidden="true">
		<div class="loader-ring loader-ring-outer"></div>
		<div class="loader-ring loader-ring-middle"></div>
		<div class="loader-core"></div>
	</div>

	<p class="countdown" aria-live="polite">{countdown}</p>
	<p class="label">Cargando vinculo</p>
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.loader {
		position: relative;
		width: 5rem;
		height: 5rem;
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

	.countdown {
		font-size: 2rem;
		font-weight: 800;
		color: #10233d;
		margin: 0;
	}

	.label {
		font-size: 1rem;
		color: #3e526d;
		margin: 0;
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
</style>
