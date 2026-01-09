import { useCallback, useEffect } from 'react';
import { useMyPresence } from '~/liveblocks.config';

export function useCursorTracking() {
  const [, updatePresence] = useMyPresence();

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      updatePresence({
        cursor: { x: e.clientX, y: e.clientY },
      });
    },
    [updatePresence]
  );

  const handlePointerLeave = useCallback(() => {
    updatePresence({ cursor: null });
  }, [updatePresence]);

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerLeave]);
}
