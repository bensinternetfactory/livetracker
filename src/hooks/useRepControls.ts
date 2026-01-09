import { useCallback } from 'react';
import { useBroadcastEvent, useMyPresence } from '~/liveblocks.config';
import type { ControlId } from '~/liveblocks.config';

export function useRepControls() {
  const broadcast = useBroadcastEvent();
  const [, updatePresence] = useMyPresence();

  const lockControls = useCallback(() => {
    broadcast({ type: 'LOCK_CONTROLS' });
  }, [broadcast]);

  const unlockControls = useCallback(() => {
    broadcast({ type: 'UNLOCK_CONTROLS' });
  }, [broadcast]);

  const spotlightControl = useCallback(
    (controlId: ControlId) => {
      updatePresence({ spotlightedControl: controlId });
    },
    [updatePresence]
  );

  const clearSpotlight = useCallback(() => {
    updatePresence({ spotlightedControl: null });
  }, [updatePresence]);

  return {
    lockControls,
    unlockControls,
    spotlightControl,
    clearSpotlight,
  };
}
