export type FingerprintField = { key: string; label: string; value: string };
export type FingerprintSection = { title: string; description: string; fields: FingerprintField[] };
export type FingerprintResult = {
  hash: string;
  browserData: Record<string, Record<string, string>>;
  sections: FingerprintSection[];
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

export const sectionKeyMap: Record<string, string> = {
  'Browser identity': 'browserIdentity',
  'Screen and device': 'screenAndDevice',
  Environment: 'environment',
  'Graphics and media': 'graphicsAndMedia',
  'Installed features': 'installedFeatures'
};

export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'Unavailable';
  }
  return String(value);
}

export function boolValue(value: boolean | undefined): string {
  if (value === undefined) return 'Unavailable';
  return value ? 'Yes' : 'No';
}

export function detectStorage(type: 'localStorage' | 'sessionStorage'): string {
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

export function detectFonts(fonts: string[]): string[] {
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

export async function hashText(input: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return 'Unavailable';

  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export async function getCanvasFingerprint(): Promise<string> {
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

export function getWebGLData(): Record<string, string> {
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

export async function getBatteryStatus(): Promise<string> {
  try {
    const browserNavigator = navigator as NavigatorWithExtras;
    if (!browserNavigator.getBattery) return 'Unavailable';

    const battery = await browserNavigator.getBattery();

    return `${Math.round(battery.level * 100)}% | charging ${battery.charging ? 'yes' : 'no'}`;
  } catch {
    return 'Unavailable';
  }
}

export async function getPermissionsSummary(): Promise<string> {
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

export async function getMediaDevicesSummary(): Promise<string> {
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

export function getAudioSupport(): string {
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

export function getVideoSupport(): string {
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

export function getConnectionSummary(): string {
  const connection = (navigator as NavigatorWithExtras).connection;

  if (!connection) return 'Unavailable';

  return [
    `type:${connection.effectiveType ?? 'unknown'}`,
    `downlink:${connection.downlink ?? 'unknown'}`,
    `rtt:${connection.rtt ?? 'unknown'}`,
    `saveData:${connection.saveData ? 'yes' : 'no'}`
  ].join(' | ');
}

export async function getGeolocation(): Promise<string> {
  try {
    if (!navigator.permissions?.query || !navigator.geolocation) return '0, 0';

    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state !== 'granted') return '0, 0';

    return await new Promise<string>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
        () => resolve('0, 0'),
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  } catch {
    return '0, 0';
  }
}

export function getAdBlockHint(): string {
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

export async function collectFingerprint(): Promise<FingerprintResult> {
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

  const [battery, canvas, permissions, mediaDevices, geolocation] = await Promise.all([
    getBatteryStatus(),
    getCanvasFingerprint(),
    getPermissionsSummary(),
    getMediaDevicesSummary(),
    getGeolocation()
  ]);

  const sections: FingerprintSection[] = [
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
        { key: 'geolocation', label: 'Geolocation', value: geolocation },
        {
          key: 'battery',
          label: 'Battery status',
          value: battery
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
          value: canvas
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
          value: permissions
        },
        {
          key: 'mediaDevices',
          label: 'Media devices',
          value: mediaDevices
        }
      ]
    }
  ];

  const browserData = Object.fromEntries(
    sections
      .filter((s) => s.title in sectionKeyMap)
      .map((s) => [
        sectionKeyMap[s.title],
        Object.fromEntries(s.fields.map((f) => [f.key, f.value]))
      ])
  );

  const hash = await hashText(JSON.stringify(browserData));

  return { hash, browserData, sections };
}
