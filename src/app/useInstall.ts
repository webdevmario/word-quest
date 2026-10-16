import { useSyncExternalStore } from 'react';

/** Chromium's install prompt event; not in the DOM typings yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallKind = 'prompt' | 'ios' | null;

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// The event can fire before any screen mounts, so listen from the start.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone and iPad have no install prompt, only Share → Add to Home Screen. */
function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function getKind(): InstallKind {
  if (isStandalone()) {
    return null;
  }
  if (deferred) {
    return 'prompt';
  }
  return isIos() ? 'ios' : null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shows the browser's install dialog. Resolves true if the app was added. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) {
    return false;
  }
  deferred = null;
  emit();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
}

/**
 * How this browser can add Word Quest to the home screen: its own prompt,
 * the iOS Share menu, or not at all (already installed or unsupported).
 */
export function useInstall(): InstallKind {
  return useSyncExternalStore(subscribe, getKind, () => null);
}
