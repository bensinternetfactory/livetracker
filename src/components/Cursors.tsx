import { useOthers } from '~/liveblocks.config';

export function Cursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        // Only show rep cursors to customers
        if (!presence.cursor || presence.role !== 'rep') return null;

        return (
          <div
            key={connectionId}
            className="pointer-events-none fixed z-50"
            style={{
              left: presence.cursor.x,
              top: presence.cursor.y,
              transform: 'translate(-2px, -2px)',
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
                fill="#3B82F6"
              />
            </svg>
            {/* Rep name label */}
            <div className="ml-4 -mt-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-md whitespace-nowrap shadow-md">
              {presence.name || 'Rep'}
            </div>
          </div>
        );
      })}
    </>
  );
}
