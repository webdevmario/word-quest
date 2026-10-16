import { act, renderHook } from '@testing-library/react';

import { promptInstall, useInstall } from '@/app/useInstall';

function installEvent(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = vi.fn(() => Promise.resolve());
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  return { event, prompt };
}

describe('useInstall', () => {
  it('shows nothing when the browser cannot install', () => {
    const { result } = renderHook(() => useInstall());
    expect(result.current).toBeNull();
  });

  it('offers the browser prompt once it is available', async () => {
    const { result } = renderHook(() => useInstall());
    const { event, prompt } = installEvent('accepted');
    act(() => {
      window.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(result.current).toBe('prompt');

    let added = false;
    await act(async () => {
      added = await promptInstall();
    });
    expect(prompt).toHaveBeenCalledOnce();
    expect(added).toBe(true);
    // The prompt can only be used once.
    expect(result.current).toBeNull();
  });

  it('hides the hint after the app is installed', () => {
    const { result } = renderHook(() => useInstall());
    act(() => {
      window.dispatchEvent(installEvent('dismissed').event);
    });
    expect(result.current).toBe('prompt');
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(result.current).toBeNull();
  });
});
