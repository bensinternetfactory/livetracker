import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Card } from '~/components';
import { RoomProvider } from '~/liveblocks.config';
import { CollaborativeTermsPage } from '~/components/CollaborativeTermsPage';

export const Route = createFileRoute('/terms/$sessionId')({
  component: TermsPage,
});

function TermsPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  // Query session with approval and vehicle data
  const {
    data: session,
    isLoading,
    error: queryError,
  } = useQuery({
    ...convexQuery(api.sessions.get, { id: sessionId as Id<'sessions'> }),
  });

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md space-y-4">
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl mt-4" />
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mt-4" />
          </div>
        </div>
      </main>
    );
  }

  // Session not found or error
  if (!session || queryError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <Card padding="lg" shadow="md" className="text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Session Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                This session may have expired or is invalid.
              </p>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // Session completed - redirect to closing
  if (session.status === 'completed') {
    navigate({ to: '/closing/$sessionId', params: { sessionId: session._id } });
    return null;
  }

  // Session not verified - show warning but allow for testing
  const isPending = session.status === 'pending';

  const customerName = session.approval?.customerName || 'Customer';

  return (
    <RoomProvider
      id={`session-${sessionId}`}
      initialPresence={{
        cursor: null,
        spotlightedControl: null,
        role: 'customer',
        name: customerName,
        scrollY: 0,
        isControlling: false,
      }}
    >
      {isPending && (
        <div className="bg-yellow-500 text-yellow-950 text-center py-2 text-sm font-medium">
          Dev Mode: Session not verified yet
        </div>
      )}
      <CollaborativeTermsPage session={session as any} />
    </RoomProvider>
  );
}
