import { useState, useMemo, useEffect, useRef, type RefObject } from 'react';
import { useEventListener, useOthers } from '~/liveblocks.config';
import type { ControlId } from '~/liveblocks.config';

interface UseCollaborativeStateOptions {
  containerRef?: RefObject<HTMLElement | null>;
  onInputChange?: (controlId: ControlId, value: number | boolean) => void;
}

export function useCollaborativeState(options: UseCollaborativeStateOptions = {}) {
  const { containerRef, onInputChange } = options;
  const [isLocked, setIsLocked] = useState(false);
  const others = useOthers();
  const lastScrollY = useRef<number>(0);

  // Listen for lock/unlock and input change events from rep
  useEventListener(({ event }) => {
    if (event.type === 'LOCK_CONTROLS') {
      setIsLocked(true);
    } else if (event.type === 'UNLOCK_CONTROLS') {
      setIsLocked(false);
    } else if (event.type === 'INPUT_CHANGE') {
      onInputChange?.(event.controlId, event.value);
    }
  });

  // Find the rep user
  const rep = useMemo(() => {
    return others.find((user) => user.presence?.role === 'rep');
  }, [others]);

  // Get the rep's spotlight from presence
  const repSpotlight = useMemo<ControlId>(() => {
    return rep?.presence?.spotlightedControl ?? null;
  }, [rep]);

  // Check if rep is in the room
  const repPresent = useMemo(() => {
    return !!rep;
  }, [rep]);

  // Check if rep is actively controlling inputs
  const repIsControlling = useMemo(() => {
    return rep?.presence?.isControlling ?? false;
  }, [rep]);

  // Scroll sync: watch rep's scrollY in presence and sync customer's view
  useEffect(() => {
    if (!containerRef?.current || !rep?.presence) return;

    const repScrollY = rep.presence.scrollY ?? 0;
    const delta = Math.abs(repScrollY - lastScrollY.current);

    // Only sync when delta > 10px to avoid jitter
    if (delta > 10) {
      lastScrollY.current = repScrollY;
      containerRef.current.scrollTo({
        top: repScrollY,
        behavior: 'smooth',
      });
    }
  }, [containerRef, rep?.presence?.scrollY]);

  return {
    isLocked,
    repSpotlight,
    repPresent,
    repIsControlling,
  };
}
