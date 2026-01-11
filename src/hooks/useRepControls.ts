import { useCallback, useRef } from 'react';
import { useBroadcastEvent, useMyPresence } from '~/liveblocks.config';
import type { ControlId } from '~/liveblocks.config';

export function useRepControls() {
  const broadcast = useBroadcastEvent();
  const [, updatePresence] = useMyPresence();
  const controllingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const broadcastInputChange = useCallback(
    (controlId: ControlId, value: number | boolean) => {
      // Set isControlling to true for visual feedback
      updatePresence({ isControlling: true });

      // Broadcast the input change event
      broadcast({ type: 'INPUT_CHANGE', controlId, value });

      // Clear any existing timeout
      if (controllingTimeoutRef.current) {
        clearTimeout(controllingTimeoutRef.current);
      }

      // Clear isControlling after 500ms of inactivity
      controllingTimeoutRef.current = setTimeout(() => {
        updatePresence({ isControlling: false });
        controllingTimeoutRef.current = null;
      }, 500);
    },
    [broadcast, updatePresence]
  );

  const syncScroll = useCallback(
    (scrollY: number) => {
      updatePresence({ scrollY });
    },
    [updatePresence]
  );

  return {
    lockControls,
    unlockControls,
    spotlightControl,
    clearSpotlight,
    broadcastInputChange,
    syncScroll,
  };
}
