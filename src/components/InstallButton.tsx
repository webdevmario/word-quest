import { Download, Share, SquarePlus } from 'lucide-react';
import { useState } from 'react';

import { promptInstall, useInstall } from '@/app/useInstall';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/** "Add to home screen", shown only where the browser can do it. */
export function InstallButton() {
  const kind = useInstall();
  const [showSteps, setShowSteps] = useState(false);

  if (!kind) {
    return null;
  }
  return (
    <>
      <button
        type="button"
        onClick={() =>
          kind === 'prompt' ? void promptInstall() : setShowSteps(true)
        }
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-parchment-300 hover:bg-white/5 hover:text-parchment-100"
      >
        <Download className="size-4" aria-hidden /> Add to home screen
      </button>
      <Modal
        open={showSteps}
        onClose={() => setShowSteps(false)}
        title="Add to home screen"
      >
        <ol className="mt-4 space-y-3 text-lg">
          <li className="flex items-center gap-3">
            <Share className="size-6 shrink-0" aria-hidden />
            Tap the Share button.
          </li>
          <li className="flex items-center gap-3">
            <SquarePlus className="size-6 shrink-0" aria-hidden />
            Tap Add to Home Screen.
          </li>
        </ol>
        <p className="mt-4 text-ink/70">
          Word Quest will open from its own icon and work without the internet.
        </p>
        <Button
          variant="gilt"
          className="mt-6 w-full"
          onClick={() => setShowSteps(false)}
        >
          Got it
        </Button>
      </Modal>
    </>
  );
}
