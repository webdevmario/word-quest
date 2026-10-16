import { useNav } from '@/app/nav';
import type { Profile } from '@/game/types';
import { useAppData } from '@/store/appStore';

/** The player who is playing right now, or null on the home screen. */
export function useCurrentProfile(): Profile | null {
  const { profileId } = useNav();
  return useAppData((d) => d.profiles.find((p) => p.id === profileId) ?? null);
}
