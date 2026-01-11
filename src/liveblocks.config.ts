import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  // Use public key for MVP - no auth required
  // In production, switch to authEndpoint for proper security
  publicApiKey: import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY || 'pk_dev_placeholder',
});

// Control identifiers for spotlight/locking
export type ControlId =
  | 'termSlider'
  | 'downPayment'
  | 'balloonToggle'
  | 'balloonSlider'
  | null;

// Presence: Real-time ephemeral state (cursors, selections)
type Presence = {
  // Container-relative cursor position (percentages for cross-screen-size accuracy)
  cursor: { containerX: number; containerY: number; scrollY: number } | null;
  spotlightedControl: ControlId;
  role: 'rep' | 'customer';
  name: string;
  // Scroll position for scroll sync
  scrollY: number;
  // Whether this user is actively controlling inputs
  isControlling: boolean;
};

// Broadcast event types for commands
type RoomEvent =
  | { type: 'LOCK_CONTROLS' }
  | { type: 'UNLOCK_CONTROLS' }
  | { type: 'INPUT_CHANGE'; controlId: ControlId; value: number | boolean }
  | { type: 'SCROLL_SYNC'; scrollY: number };

// User metadata from auth endpoint
type UserMeta = {
  id: string;
  info: {
    name: string;
    role: 'rep' | 'customer';
    sessionId: string;
  };
};

export const {
  RoomProvider,
  useOthers,
  useMyPresence,
  useBroadcastEvent,
  useEventListener,
  useSelf,
} = createRoomContext<Presence, never, UserMeta, RoomEvent>(client);
