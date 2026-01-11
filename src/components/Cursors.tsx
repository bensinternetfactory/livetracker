import { memo, useMemo, type RefObject } from 'react';
import { useOthers } from '~/liveblocks.config';

interface CursorsProps {
  containerRef: RefObject<HTMLElement | null>;
}

export const Cursors = memo(function Cursors({ containerRef }: CursorsProps) {
  const others = useOthers();

  // Filter for rep cursor only (customers only see rep cursors)
  const repPresence = useMemo(() => {
    const rep = others.find(
      (other) => other.presence.role === 'rep' && other.presence.cursor
    );
    return rep?.presence ?? null;
  }, [others]);

  if (!repPresence?.cursor) return null;

  const container = containerRef.current;
  if (!container) return null;

  const rect = container.getBoundingClientRect();

  // Convert percentage-based position to absolute pixels
  const absoluteX = (repPresence.cursor.containerX / 100) * rect.width + rect.left;
  const absoluteY = (repPresence.cursor.containerY / 100) * rect.height + rect.top;

  // Determine cursor color based on isControlling state
  const cursorColor = repPresence.isControlling ? '#22C55E' : '#3B82F6'; // green when controlling, blue otherwise
  const labelBgClass = repPresence.isControlling ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left: absoluteX,
        top: absoluteY,
        transform: 'translate(-2px, -2px)',
        willChange: 'transform, left, top',
        transition: 'left 50ms linear, top 50ms linear',
      }}
    >
      {/* Figma-style cursor SVG */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.65376 12.4563L0.161938 0.833658C0.0447327 0.575448 0.267612 0.296005 0.54036 0.357859L12.9392 3.67399C13.2135 3.73583 13.3169 4.07019 13.1246 4.27844L5.65376 12.4563Z"
          fill={cursorColor}
          style={{ transition: 'fill 150ms ease' }}
        />
      </svg>
      {/* Rep name label */}
      <div
        className={`ml-4 -mt-1 px-2 py-1 ${labelBgClass} text-white text-xs font-medium rounded-md whitespace-nowrap shadow-md`}
        style={{ transition: 'background-color 150ms ease' }}
      >
        {repPresence.name || 'Rep'}
        {repPresence.isControlling && ' (controlling)'}
      </div>
    </div>
  );
});
