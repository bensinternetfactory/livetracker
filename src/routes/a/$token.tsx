import { useState, useEffect, useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import { hashToken } from '~/lib/hash';
import {
  VerificationPage,
  VerificationError,
  VerificationLoading,
} from '~/components';

export const Route = createFileRoute('/a/$token')({
  component: VerificationRoute,
});

function VerificationRoute() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  // Hash the token client-side
  useEffect(() => {
    hashToken(token).then(setTokenHash);
  }, [token]);

  // Query session by hashed token
  const {
    data: session,
    isLoading,
    refetch,
  } = useQuery({
    ...convexQuery(api.sessions.getByToken, tokenHash ? { tokenHash } : 'skip'),
    enabled: !!tokenHash,
  });

  // Verify mutation - wrap useConvexMutation with useMutation
  const { mutateAsync: verify, isPending: isVerifying } = useMutation({
    mutationFn: useConvexMutation(api.sessions.verify),
  });

  const handleVerify = useCallback(
    async (last4: string) => {
      if (!tokenHash) return;

      setError(undefined);

      try {
        const result = await verify({
          tokenHash,
          last4,
        });

        if (result.success && result.sessionId) {
          // Redirect to terms page
          navigate({ to: '/terms/$sessionId', params: { sessionId: result.sessionId } });
        } else {
          setError(result.error || 'Verification failed');
          // Refetch session to update attempt count
          refetch();
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
      }
    },
    [tokenHash, verify, navigate, refetch]
  );

  // Loading state
  if (!tokenHash || isLoading) {
    return <VerificationLoading />;
  }

  // Session not found
  if (!session) {
    return <VerificationError type="invalid" />;
  }

  // Check session status
  if (session.status === 'expired') {
    return <VerificationError type="expired" />;
  }

  if (session.status === 'locked') {
    return <VerificationError type="locked" />;
  }

  // Already verified - redirect
  if (session.status === 'verified' || session.status === 'active' || session.status === 'completed') {
    navigate({ to: '/terms/$sessionId', params: { sessionId: session._id } });
    return <VerificationLoading />;
  }

  // Show verification form
  return (
    <VerificationPage
      maxAttempts={session.maxAttempts}
      attemptCount={session.attemptCount}
      customerName={session.approval?.customerName}
      onVerify={handleVerify}
      isVerifying={isVerifying}
      error={error}
    />
  );
}
