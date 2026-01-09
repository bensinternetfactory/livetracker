import { useState, useMemo } from 'react';
import { useEventListener, useOthers } from '~/liveblocks.config';
import type { ControlId } from '~/liveblocks.config';

export function useCollaborativeState() {
  const [isLocked, setIsLocked] = useState(false);
  const others = useOthers();

  // Listen for lock/unlock events from rep
  useEventListener(({ event }) => {
    if (event.type === 'LOCK_CONTROLS') {
      setIsLocked(true);
    } else if (event.type === 'UNLOCK_CONTROLS') {
      setIsLocked(false);
    }
  });

  // Get the rep's spotlight from presence
  const repSpotlight = useMemo<ControlId>(() => {
    const rep = others.find((user) => user.presence?.role === 'rep');
    return rep?.presence?.spotlightedControl ?? null;
  }, [others]);

  // Check if rep is in the room
  const repPresent = useMemo(() => {
    return others.some((user) => user.presence?.role === 'rep');
  }, [others]);

  return {
    isLocked,
    repSpotlight,
    repPresent,
  };
}
