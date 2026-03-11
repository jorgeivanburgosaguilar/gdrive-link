<script lang="ts">
	import { onMount } from 'svelte';

	import type { PageData } from './$types';

	type Field = {
		key: string;
		label: string;
		value: string;
	};

	type Section = {
		title: string;
		description: string;
		fields: Field[];
	};

	type NetworkInformation = {
		effectiveType?: string;
		downlink?: number;
		rtt?: number;
		saveData?: boolean;
	};

	type BatteryStatus = {
		level: number;
		charging: boolean;
	};

	type NavigatorWithExtras = Navigator & {
		connection?: NetworkInformation;
		deviceMemory?: number;
		getBattery?: () => Promise<BatteryStatus>;
		pdfViewerEnabled?: boolean;
	};

	let { data }: { data: PageData } = $props();

	let fingerprintSections = $state<Section[]>([]);
	let fingerprintHash = $state('Collecting...');
	let refreshedAt = $state('Pending');
	let status = $state('Reading browser APIs...');

	function stringifyValue(value: unknown): string {
		if (value === null || value === undefined || value === '') return 'Unavailable';
		if (Array.isArray(value)) {
			return value.length ? value.join(', ') : 'Unavailable';
		}

		return String(value);
	}

	function boolValue(value: boolean | undefined): string {
		if (value === undefined) return 'Unavailable';
		return value ? 'Yes' : 'No';
	}

	function detectStorage(type: 'localStorage' | 'sessionStorage'): string {
		try {
			const storage = window[type];
			const key = `fingerprint-${type}`;
			storage.setItem(key, '1');
			storage.removeItem(key);
			return 'Available';
		} catch {
			return 'Blocked';
		}
	}

	function detectFonts(fonts: string[]): string[] {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');

		if (!context) return [];

		const sample = 'mmmmmmmmmmlli';
		const size = '72px';
		const baseline = new Map(
			['monospace', 'sans-serif', 'serif'].map((fallback) => {
				context.font = `${size} ${fallback}`;
				return [fallback, context.measureText(sample).width];
			})
		);

		return fonts.filter((font) =>
			['monospace', 'sans-serif', 'serif'].some((fallback) => {
				context.font = `${size} "${font}", ${fallback}`;
				return context.measureText(sample).width !== baseline.get(fallback);
			})
		);
	}

	async function hashText(input: string): Promise<string> {
		if (!globalThis.crypto?.subtle) return 'Unavailable';

		const encoded = new TextEncoder().encode(input);
		const digest = await crypto.subtle.digest('SHA-256', encoded);

		return Array.from(new Uint8Array(digest))
			.map((value) => value.toString(16).padStart(2, '0'))
			.join('');
	}

	async function getCanvasFingerprint(): Promise<string> {
		try {
			const canvas = document.createElement('canvas');
			canvas.width = 280;
			canvas.height = 80;

			const context = canvas.getContext('2d');
			if (!context) return 'Unavailable';

			context.textBaseline = 'top';
			context.font = '16px "Times New Roman"';
			context.fillStyle = '#1a1a1a';
			context.fillRect(0, 0, 280, 80);
			context.fillStyle = '#f6c344';
			context.fillText('amiunique-like fingerprint sample', 12, 12);
			context.strokeStyle = '#4b7bec';
			context.beginPath();
			context.arc(210, 40, 26, 0, Math.PI * 1.75, true);
			context.stroke();

			return await hashText(canvas.toDataURL());
		} catch {
			return 'Unavailable';
		}
	}

	function getWebGLData(): Record<string, string> {
		try {
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

			if (!context || !(context instanceof WebGLRenderingContext)) {
				return {
					renderer: 'Unavailable',
					vendor: 'Unavailable',
					version: 'Unavailable',
					shadingLanguage: 'Unavailable'
				};
			}

			const debug = context.getExtension('WEBGL_debug_renderer_info');
			const renderer = debug
				? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: context.getParameter(context.RENDERER);
			const vendor = debug
				? context.getParameter(debug.UNMASKED_VENDOR_WEBGL)
				: context.getParameter(context.VENDOR);

			return {
				renderer: stringifyValue(renderer),
				vendor: stringifyValue(vendor),
				version: stringifyValue(context.getParameter(context.VERSION)),
				shadingLanguage: stringifyValue(context.getParameter(context.SHADING_LANGUAGE_VERSION))
			};
		} catch {
			return {
				renderer: 'Unavailable',
				vendor: 'Unavailable',
				version: 'Unavailable',
				shadingLanguage: 'Unavailable'
			};
		}
	}

	async function getBatteryStatus(): Promise<string> {
		try {
			const browserNavigator = navigator as NavigatorWithExtras;
			if (!browserNavigator.getBattery) return 'Unavailable';

			const battery = await browserNavigator.getBattery();

			return `${Math.round(battery.level * 100)}% | charging ${battery.charging ? 'yes' : 'no'}`;
		} catch {
			return 'Unavailable';
		}
	}

	async function getPermissionsSummary(): Promise<string> {
		try {
			if (!navigator.permissions?.query) return 'Unavailable';

			const names = [
				'geolocation',
				'notifications',
				'microphone',
				'camera',
				'clipboard-read'
			] as PermissionName[];

			const results = await Promise.all(
				names.map(async (name) => {
					try {
						const permission = await navigator.permissions.query({ name });
						return `${name}:${permission.state}`;
					} catch {
						return `${name}:unsupported`;
					}
				})
			);

			return results.join(' | ');
		} catch {
			return 'Unavailable';
		}
	}

	async function getMediaDevicesSummary(): Promise<string> {
		try {
			if (!navigator.mediaDevices?.enumerateDevices) return 'Unavailable';

			const devices = await navigator.mediaDevices.enumerateDevices();
			const counts = devices.reduce<Record<string, number>>((accumulator, device) => {
				accumulator[device.kind] = (accumulator[device.kind] ?? 0) + 1;
				return accumulator;
			}, {});

			const summary = Object.entries(counts).map(([kind, count]) => `${kind}:${count}`);

			return summary.length ? summary.join(' | ') : 'Unavailable';
		} catch {
			return 'Unavailable';
		}
	}

	function getAudioSupport(): string {
		try {
			const element = document.createElement('audio');
			if (!element.canPlayType) return 'Unavailable';

			const formats = {
				mp3: element.canPlayType('audio/mpeg'),
				ogg: element.canPlayType('audio/ogg; codecs="vorbis"'),
				wav: element.canPlayType('audio/wav; codecs="1"'),
				aac: element.canPlayType('audio/aac')
			};

			return Object.entries(formats)
				.map(([format, support]) => `${format}:${support || 'no'}`)
				.join(' | ');
		} catch {
			return 'Unavailable';
		}
	}

	function getVideoSupport(): string {
		try {
			const element = document.createElement('video');
			if (!element.canPlayType) return 'Unavailable';

			const formats = {
				mp4: element.canPlayType('video/mp4; codecs="avc1.42E01E"'),
				webm: element.canPlayType('video/webm; codecs="vp8, vorbis"'),
				ogg: element.canPlayType('video/ogg; codecs="theora"')
			};

			return Object.entries(formats)
				.map(([format, support]) => `${format}:${support || 'no'}`)
				.join(' | ');
		} catch {
			return 'Unavailable';
		}
	}

	function getConnectionSummary(): string {
		const connection = (navigator as NavigatorWithExtras).connection;

		if (!connection) return 'Unavailable';

		return [
			`type:${connection.effectiveType ?? 'unknown'}`,
			`downlink:${connection.downlink ?? 'unknown'}`,
			`rtt:${connection.rtt ?? 'unknown'}`,
			`saveData:${connection.saveData ? 'yes' : 'no'}`
		].join(' | ');
	}

	function getAdBlockHint(): string {
		try {
			const bait = document.createElement('div');
			bait.className = 'adsbox banner_ad ad-unit';
			bait.style.position = 'absolute';
			bait.style.left = '-9999px';
			document.body.appendChild(bait);

			const blocked = bait.offsetHeight === 0 || getComputedStyle(bait).display === 'none';
			bait.remove();

			return blocked ? 'Likely enabled' : 'Not detected';
		} catch {
			return 'Unavailable';
		}
	}

	async function collectFingerprint() {
		status = 'Reading browser APIs...';

		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Unavailable';
		const now = new Date();
		const webgl = getWebGLData();
		const fonts = detectFonts([
			'Arial',
			'Courier New',
			'Georgia',
			'Helvetica',
			'Impact',
			'Segoe UI',
			'Tahoma',
			'Times New Roman',
			'Trebuchet MS',
			'Verdana'
		]);
		const plugins = Array.from(navigator.plugins ?? []).map((plugin) => plugin.name);

		const sections: Section[] = [
			{
				title: 'Browser identity',
				description: 'Low-level identifiers exposed by the navigator object.',
				fields: [
					{ key: 'userAgent', label: 'User agent', value: stringifyValue(navigator.userAgent) },
					{ key: 'platform', label: 'Platform', value: stringifyValue(navigator.platform) },
					{ key: 'vendor', label: 'Vendor', value: stringifyValue(navigator.vendor) },
					{ key: 'languages', label: 'Languages', value: stringifyValue(navigator.languages) },
					{ key: 'language', label: 'Primary language', value: stringifyValue(navigator.language) },
					{ key: 'cookie', label: 'Cookies enabled', value: boolValue(navigator.cookieEnabled) },
					{ key: 'dnt', label: 'Do not track', value: stringifyValue(navigator.doNotTrack) },
					{
						key: 'webdriver',
						label: 'Automation flag',
						value: boolValue('webdriver' in navigator ? navigator.webdriver : undefined)
					},
					{
						key: 'pdf',
						label: 'Built-in PDF viewer',
						value: boolValue((navigator as NavigatorWithExtras).pdfViewerEnabled)
					}
				]
			},
			{
				title: 'Screen and device',
				description: 'Display, input and hardware information available to the page.',
				fields: [
					{
						key: 'screen',
						label: 'Screen resolution',
						value: `${screen.width} x ${screen.height}`
					},
					{
						key: 'availableScreen',
						label: 'Available screen',
						value: `${screen.availWidth} x ${screen.availHeight}`
					},
					{
						key: 'viewport',
						label: 'Viewport',
						value: `${window.innerWidth} x ${window.innerHeight}`
					},
					{ key: 'depth', label: 'Color depth', value: `${screen.colorDepth}-bit` },
					{
						key: 'pixelRatio',
						label: 'Device pixel ratio',
						value: stringifyValue(window.devicePixelRatio)
					},
					{
						key: 'touch',
						label: 'Max touch points',
						value: stringifyValue(navigator.maxTouchPoints)
					},
					{
						key: 'memory',
						label: 'Device memory',
						value: stringifyValue(
							(navigator as NavigatorWithExtras).deviceMemory
								? `${(navigator as NavigatorWithExtras).deviceMemory} GB`
								: undefined
						)
					},
					{
						key: 'cpu',
						label: 'Hardware concurrency',
						value: stringifyValue(navigator.hardwareConcurrency)
					}
				]
			},
			{
				title: 'Environment',
				description: 'Locale, storage and session capabilities observable in this browser.',
				fields: [
					{ key: 'timezone', label: 'Timezone', value: timezone },
					{
						key: 'utcOffset',
						label: 'UTC offset',
						value: `${-now.getTimezoneOffset() / 60} hours`
					},
					{
						key: 'sessionStorage',
						label: 'Session storage',
						value: detectStorage('sessionStorage')
					},
					{
						key: 'localStorage',
						label: 'Local storage',
						value: detectStorage('localStorage')
					},
					{
						key: 'indexedDb',
						label: 'IndexedDB',
						value: boolValue('indexedDB' in window)
					},
					{
						key: 'adblock',
						label: 'Ad blocker hint',
						value: getAdBlockHint()
					},
					{
						key: 'connection',
						label: 'Network information',
						value: getConnectionSummary()
					},
					{
						key: 'battery',
						label: 'Battery status',
						value: await getBatteryStatus()
					}
				]
			},
			{
				title: 'Graphics and media',
				description: 'Rendering and codec support commonly used for browser fingerprinting.',
				fields: [
					{
						key: 'canvas',
						label: 'Canvas fingerprint hash',
						value: await getCanvasFingerprint()
					},
					{ key: 'webglVendor', label: 'WebGL vendor', value: webgl.vendor },
					{ key: 'webglRenderer', label: 'WebGL renderer', value: webgl.renderer },
					{ key: 'webglVersion', label: 'WebGL version', value: webgl.version },
					{
						key: 'webglShader',
						label: 'Shading language',
						value: webgl.shadingLanguage
					},
					{ key: 'audio', label: 'Audio support', value: getAudioSupport() },
					{ key: 'video', label: 'Video support', value: getVideoSupport() }
				]
			},
			{
				title: 'Installed features',
				description: 'Plugins, fonts, permissions and device inventory visible to the page.',
				fields: [
					{ key: 'plugins', label: 'Plugins', value: stringifyValue(plugins) },
					{ key: 'fonts', label: 'Detected fonts', value: stringifyValue(fonts) },
					{
						key: 'permissions',
						label: 'Permissions summary',
						value: await getPermissionsSummary()
					},
					{
						key: 'mediaDevices',
						label: 'Media devices',
						value: await getMediaDevicesSummary()
					}
				]
			}
		];

		fingerprintSections = sections;
		refreshedAt = new Date().toLocaleString();

		const normalized = JSON.stringify({
			requestHeaders: data.requestHeaders,
			requestUrl: data.requestUrl,
			host: data.host,
			protocol: data.protocol,
			sections
		});

		fingerprintHash = await hashText(normalized);
		status = 'Ready';
	}

	function handleRefresh(event: SubmitEvent) {
		event.preventDefault();
		void collectFingerprint();
	}

	onMount(() => {
		void collectFingerprint();
	});
</script>

<svelte:head>
	<title>Session Fingerprint</title>
	<meta
		name="description"
		content="Inspect the request and browser properties exposed by the current session."
	/>
</svelte:head>

<div class="page-shell">
	<header class="hero">
		<p class="eyebrow">Browser session snapshot</p>
		<h1>Session fingerprint form</h1>
		<p class="intro">
			This page mirrors the data-collection feature of fingerprinting tools without copying the
			source site's design. Everything shown here is read from the current request or from browser
			APIs available in this session.
		</p>
	</header>

	<form class="fingerprint-form" onsubmit={handleRefresh}>
		<section class="summary-grid">
			<label class="summary-card">
				<span>Fingerprint hash</span>
				<textarea readonly rows="3">{fingerprintHash}</textarea>
			</label>

			<label class="summary-card">
				<span>Status</span>
				<input readonly value={status} />
			</label>

			<label class="summary-card">
				<span>Last refresh</span>
				<input readonly value={refreshedAt} />
			</label>

			<label class="summary-card">
				<span>Request URL</span>
				<input readonly value={data.requestUrl} />
			</label>

			<label class="summary-card">
				<span>Host</span>
				<input readonly value={data.host} />
			</label>

			<label class="summary-card">
				<span>Protocol</span>
				<input readonly value={data.protocol} />
			</label>
		</section>

		<section class="panel">
			<div class="panel-header">
				<div>
					<h2>Request headers</h2>
					<p>Values seen by the server for this page request.</p>
				</div>
				<button type="submit">Refresh current session</button>
			</div>

			<div class="field-grid">
				{#each data.requestHeaders as field (field.key)}
					<label class="field">
						<span>{field.label}</span>
						<textarea readonly rows="2">{field.value}</textarea>
					</label>
				{/each}
			</div>
		</section>

		{#each fingerprintSections as section (section.title)}
			<section class="panel">
				<div class="panel-header">
					<div>
						<h2>{section.title}</h2>
						<p>{section.description}</p>
					</div>
				</div>

				<div class="field-grid">
					{#each section.fields as field (field.key)}
						<label class="field">
							<span>{field.label}</span>
							<textarea readonly rows="3">{field.value}</textarea>
						</label>
					{/each}
				</div>
			</section>
		{/each}
	</form>
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

	.hero {
		margin-bottom: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.5rem;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #8a5a16;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.25rem, 6vw, 4.4rem);
		line-height: 0.95;
	}

	.intro {
		max-width: 72ch;
		margin: 1rem 0 0;
		font-size: 1rem;
		line-height: 1.6;
		color: #4f4438;
	}

	.fingerprint-form {
		display: grid;
		gap: 1.25rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.summary-card,
	.field {
		display: grid;
		gap: 0.5rem;
	}

	.panel {
		padding: 1.25rem;
		border: 1px solid rgba(31, 27, 22, 0.12);
		border-radius: 1.25rem;
		background: rgba(255, 252, 246, 0.92);
		box-shadow: 0 18px 40px rgba(75, 62, 42, 0.08);
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.panel-header h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.panel-header p {
		margin: 0.35rem 0 0;
		color: #655748;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
	}

	span {
		font-size: 0.84rem;
		font-weight: 700;
		color: #5a4a35;
	}

	input,
	textarea {
		width: 100%;
		border: 1px solid rgba(31, 27, 22, 0.14);
		border-radius: 0.9rem;
		background: #fffdfa;
		color: #1f1b16;
		padding: 0.8rem 0.9rem;
		font:
			500 0.95rem/1.45 'Consolas',
			'Courier New',
			monospace;
	}

	textarea {
		resize: vertical;
		min-height: 4.75rem;
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

		.panel-header {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
