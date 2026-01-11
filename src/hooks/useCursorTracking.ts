import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useMyPresence } from '~/liveblocks.config';

interface UseCursorTrackingOptions {
  containerRef: RefObject<HTMLElement | null>;
}

export function useCursorTracking({ containerRef }: UseCursorTrackingOptions) {
  const [, updatePresence] = useMyPresence();
  const rafIdRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ containerX: number; containerY: number; scrollY: number } | null>(null);

  // Flush pending cursor update via requestAnimationFrame (60fps throttling)
  const flushCursorUpdate = useCallback(() => {
    if (pendingCursorRef.current !== null) {
      updatePresence({ cursor: pendingCursorRef.current });
      pendingCursorRef.current = null;
    }
    rafIdRef.current = null;
  }, [updatePresence]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Calculate cursor position as percentage of container dimensions
      const containerX = ((e.clientX - rect.left) / rect.width) * 100;
      const containerY = ((e.clientY - rect.top) / rect.height) * 100;
      const scrollY = container.scrollTop;

      // Store pending update
      pendingCursorRef.current = { containerX, containerY, scrollY };

      // Schedule update on next animation frame (throttle to 60fps)
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushCursorUpdate);
      }
    },
    [containerRef, flushCursorUpdate]
  );

  const handlePointerLeave = useCallback(() => {
    // Cancel any pending update
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingCursorRef.current = null;
    updatePresence({ cursor: null });
  }, [updatePresence]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);

      // Clean up any pending animation frame on unmount
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [containerRef, handlePointerMove, handlePointerLeave]);
}
