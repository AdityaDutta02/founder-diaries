import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { useUIStore } from '@/stores/uiStore';
import { getPersona } from '@/services/personaService';
import { logger } from '@/lib/logger';

const PROFILE_READY_SHOWN_KEY = 'profile_readiness_toast_shown';
const MIN_CONFIDENCE = 0.3;

/**
 * Monitors persona readiness after diary syncs.
 * Shows a one-time toast when the user's content profile has been built
 * (confidence_score >= threshold, indicating 5+ entries were analyzed).
 */
export function useProfileReadiness(): void {
  const session = useAuthStore((s) => s.session);
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt);
  const showToast = useUIStore((s) => s.showToast);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!session?.user.id || !lastSyncAt) return;

    async function checkReadiness() {
      try {
        const alreadyShown = await SecureStore.getItemAsync(PROFILE_READY_SHOWN_KEY);
        if (alreadyShown === 'true') return;

        const persona = await getPersona(session!.user.id);
        if (!persona) return;

        if (persona.confidence_score >= MIN_CONFIDENCE && persona.entry_count_at_last_analysis >= 5) {
          showToast('Your content profile is ready', 'success', 4000);
          await SecureStore.setItemAsync(PROFILE_READY_SHOWN_KEY, 'true');
          logger.info('Content profile readiness toast shown', {
            userId: session!.user.id,
            confidence: persona.confidence_score,
            entryCount: persona.entry_count_at_last_analysis,
          });
        }
      } catch (err) {
        logger.warn('Profile readiness check failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Debounce: only check once per mount cycle
    if (!checkedRef.current) {
      checkedRef.current = true;
      void checkReadiness();
    }
  }, [session, lastSyncAt, showToast]);

  // Reset ref when lastSyncAt changes so we re-check after each sync
  useEffect(() => {
    checkedRef.current = false;
  }, [lastSyncAt]);
}
