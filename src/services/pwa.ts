import { registerSW } from 'virtual:pwa-register';

let applyUpdate: (() => Promise<void>) | null = null;
let safeToReload = false;

function applyIfSafe() {
  if (safeToReload && applyUpdate) {
    void applyUpdate();
    applyUpdate = null;
  }
}

/**
 * Registers the service worker that keeps the app, fonts and word lists
 * cached for offline play. Does nothing in dev.
 */
export function startServiceWorker() {
  const update = registerSW({
    onNeedRefresh() {
      applyUpdate = () => update(true);
      applyIfSafe();
    },
  });
}

/**
 * Says whether a reload would lose anything. A downloaded update waits
 * until it is safe, so it never interrupts a game.
 */
export function setSafeToReload(safe: boolean) {
  safeToReload = safe;
  applyIfSafe();
}
