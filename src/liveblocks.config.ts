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
  cursor: { x: number; y: number } | null;
  spotlightedControl: ControlId;
  role: 'rep' | 'customer';
  name: string;
};

// Broadcast event types for commands
type RoomEvent =
  | { type: 'LOCK_CONTROLS' }
  | { type: 'UNLOCK_CONTROLS' };

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
