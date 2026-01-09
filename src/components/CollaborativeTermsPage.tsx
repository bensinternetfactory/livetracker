import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../convex/_generated/api';
import {
  Button,
  Card,
  PaymentBreakdown,
  PaymentDisplay,
  TermsPanel,
  VehicleCard,
} from '~/components';
import type { TermsValues } from '~/components';
import { calculatePaymentBreakdown } from '~/lib/finance';
import { Cursors } from './Cursors';
import { useCollaborativeState } from '~/hooks/useCollaborativeState';

interface Session {
  _id: string;
  status: string;
  vehicle?: {
    title?: string;
    year: number;
    make: string;
    model: string;
    price: number;
    imageUrl?: string;
  };
  approval?: {
    customerName: string;
    apr: number;
    minTermMonths: number;
    maxTermMonths: number;
    balloonAllowed: boolean;
    maxBalloonPercent?: number;
    documentFee?: number;
    otherFees?: number;
  };
}

interface CollaborativeTermsPageProps {
  session: Session;
}

export function CollaborativeTermsPage({ session }: CollaborativeTermsPageProps) {
  const navigate = useNavigate();
  const { isLocked, repSpotlight, repPresent } = useCollaborativeState();

  // Confirm terms mutation
  const { mutateAsync: confirmTerms, isPending: isConfirming } = useMutation({
    mutationFn: useConvexMutation(api.termSelections.confirm),
  });

  // Complete session mutation
  const { mutateAsync: completeSession } = useMutation({
    mutationFn: useConvexMutation(api.sessions.complete),
  });

  // Default values from approval
  const defaultTerms: TermsValues = useMemo(
    () => ({
      termMonths: session.approval?.maxTermMonths ?? 72,
      downPayment: 0,
      balloonEnabled: false,
      balloonPercent: 0,
    }),
    [session.approval?.maxTermMonths]
  );

  const [terms, setTerms] = useState<TermsValues>(defaultTerms);
  const [error, setError] = useState<string | undefined>();

  // Reset terms when session loads
  useMemo(() => {
    if (session.approval) {
      setTerms({
        termMonths: session.approval.maxTermMonths,
        downPayment: 0,
        balloonEnabled: false,
        balloonPercent: 0,
      });
    }
  }, [session.approval?.maxTermMonths]);

  // Calculate payment breakdown
  const breakdown = useMemo(() => {
    if (!session.vehicle || !session.approval) return null;

    const balloonAmount = terms.balloonEnabled
      ? (session.vehicle.price * terms.balloonPercent) / 100
      : 0;

    const fees =
      (session.approval.documentFee ?? 0) + (session.approval.otherFees ?? 0);

    return calculatePaymentBreakdown(
      session.vehicle.price,
      terms.downPayment,
      session.approval.apr,
      terms.termMonths,
      balloonAmount,
      fees
    );
  }, [session, terms]);

  const handleConfirm = useCallback(async () => {
    if (!session || !breakdown) return;

    setError(undefined);

    try {
      const balloonAmount = terms.balloonEnabled
        ? (session.vehicle!.price * terms.balloonPercent) / 100
        : 0;

      await confirmTerms({
        sessionId: session._id as any,
        termMonths: terms.termMonths,
        downPayment: terms.downPayment,
        balloonAmount,
        monthlyPayment: breakdown.monthlyPayment,
        totalPayments: breakdown.totalPayments,
        totalInterest: breakdown.totalInterest,
        amountFinanced: breakdown.amountFinanced,
      });

      // Mark session as completed
      await completeSession({ sessionId: session._id as any });

      // Navigate to closing page
      navigate({ to: '/closing/$sessionId', params: { sessionId: session._id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm terms');
    }
  }, [session, breakdown, terms, confirmTerms, completeSession, navigate]);

  const { vehicle, approval } = session;

  if (!vehicle || !approval || !breakdown) {
    return null;
  }

  return (
    <>
      {/* Rep cursor overlay */}
      <Cursors />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
        {/* Rep presence indicator */}
        {repPresent && (
          <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
            A sales rep is viewing your session
          </div>
        )}

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Vehicle Card */}
          <VehicleCard
            title={vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            year={vehicle.year}
            make={vehicle.make}
            model={vehicle.model}
            price={vehicle.price}
            imageUrl={vehicle.imageUrl}
          />

          {/* Payment Display */}
          <Card padding="none" shadow="sm">
            <PaymentDisplay
              amount={breakdown.monthlyPayment}
              label="Monthly Payment"
              sublabel={`for ${terms.termMonths} months`}
              size="xl"
            />
            <div className="px-4 pb-2">
              <PaymentBreakdown
                amountFinanced={breakdown.amountFinanced}
                totalPayments={breakdown.totalPayments}
                totalInterest={breakdown.totalInterest}
                dueAtSigning={breakdown.dueAtSigning}
                balloonAmount={breakdown.balloonAmount}
                termMonths={terms.termMonths}
                apr={approval.apr}
              />
            </div>
          </Card>

          {/* Terms Panel */}
          <Card padding="lg" shadow="sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Customize Your Terms
            </h2>
            <TermsPanel
              values={terms}
              onChange={setTerms}
              constraints={{
                minTermMonths: approval.minTermMonths,
                maxTermMonths: approval.maxTermMonths,
                vehiclePrice: vehicle.price,
                balloonAllowed: approval.balloonAllowed,
                maxBalloonPercent: approval.maxBalloonPercent,
              }}
              disabled={isLocked}
              highlightedControl={repSpotlight}
            />

            {/* Locked indicator */}
            {isLocked && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center">
                  Controls are temporarily locked by your sales rep
                </p>
              </div>
            )}
          </Card>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Sticky Confirm Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleConfirm}
              loading={isConfirming}
              disabled={isConfirming || isLocked}
              className="w-full"
            >
              Confirm Terms
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
