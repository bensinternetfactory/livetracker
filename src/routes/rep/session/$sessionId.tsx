import { createFileRoute } from '@tanstack/react-router';
import { RoomProvider } from '~/liveblocks.config';
import { RepSessionView } from '~/components/RepSessionView';

export const Route = createFileRoute('/rep/session/$sessionId')({
  component: RepSessionPage,
});

function RepSessionPage() {
  const { sessionId } = Route.useParams();

  return (
    <RoomProvider
      id={`session-${sessionId}`}
      initialPresence={{
        cursor: null,
        spotlightedControl: null,
        role: 'rep',
        name: 'Sales Rep',
      }}
    >
      <RepSessionView sessionId={sessionId} />
    </RoomProvider>
  );
}
