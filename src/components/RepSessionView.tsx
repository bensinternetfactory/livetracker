import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
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
import { useCursorTracking } from '~/hooks/useCursorTracking';
import { useRepControls } from '~/hooks/useRepControls';
import { useOthers } from '~/liveblocks.config';
import type { ControlId } from '~/liveblocks.config';

// Helper to detect which control changed
function detectChangedControl(
  prev: TermsValues,
  next: TermsValues
): { id: ControlId; value: number | boolean } | null {
  if (prev.termMonths !== next.termMonths) return { id: 'termSlider', value: next.termMonths };
  if (prev.downPayment !== next.downPayment) return { id: 'downPayment', value: next.downPayment };
  if (prev.balloonEnabled !== next.balloonEnabled) return { id: 'balloonToggle', value: next.balloonEnabled };
  if (prev.balloonPercent !== next.balloonPercent) return { id: 'balloonSlider', value: next.balloonPercent };
  return null;
}

interface RepSessionViewProps {
  sessionId: string;
}

export function RepSessionView({ sessionId }: RepSessionViewProps) {
  // Container ref for cursor tracking and scroll sync
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Track rep's cursor for customer to see
  useCursorTracking({ containerRef: previewContainerRef });

  const { lockControls, unlockControls, spotlightControl, clearSpotlight, broadcastInputChange, syncScroll } =
    useRepControls();

  const [isLocked, setIsLocked] = useState(false);
  const [activeSpotlight, setActiveSpotlight] = useState<ControlId>(null);
  const [copied, setCopied] = useState(false);

  // Check if customer is connected
  const others = useOthers();
  const customerConnected = others.some((user) => user.presence?.role === 'customer');

  // Query session data
  const { data: session, isLoading } = useQuery({
    ...convexQuery(api.sessions.get, { id: sessionId as Id<'sessions'> }),
  });

  // Default terms values from approval
  const defaultTerms: TermsValues = useMemo(
    () => ({
      termMonths: session?.approval?.maxTermMonths ?? 72,
      downPayment: 0,
      balloonEnabled: false,
      balloonPercent: 0,
    }),
    [session?.approval?.maxTermMonths]
  );

  // Mutable terms state for rep control
  const [terms, setTerms] = useState<TermsValues>(defaultTerms);

  // Reset terms when session loads
  useEffect(() => {
    setTerms(defaultTerms);
  }, [defaultTerms]);

  // Scroll tracking: sync rep's scroll position to customer
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        syncScroll(container.scrollTop);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [syncScroll]);

  // Get magic link URL from localStorage
  const magicLinkUrl = useMemo(() => {
    try {
      const tokens = JSON.parse(localStorage.getItem('sessionTokens') || '{}');
      const token = tokens[sessionId];
      if (token) {
        return `${window.location.origin}/a/${token}`;
      }
    } catch {
      // Ignore JSON parse errors
    }
    return null;
  }, [sessionId]);

  // Handle terms change from rep
  const handleTermsChange = (newTerms: TermsValues) => {
    const changedControl = detectChangedControl(terms, newTerms);
    if (changedControl) {
      broadcastInputChange(changedControl.id, changedControl.value);
    }
    setTerms(newTerms);
  };

  const handleCopyMagicLink = () => {
    if (magicLinkUrl) {
      navigator.clipboard.writeText(magicLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate payment breakdown for preview
  const breakdown = useMemo(() => {
    if (!session?.vehicle || !session?.approval) return null;

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

  const handleLockToggle = () => {
    if (isLocked) {
      unlockControls();
      setIsLocked(false);
    } else {
      lockControls();
      setIsLocked(true);
    }
  };

  const handleSpotlight = (controlId: ControlId) => {
    if (activeSpotlight === controlId) {
      clearSpotlight();
      setActiveSpotlight(null);
    } else {
      spotlightControl(controlId);
      setActiveSpotlight(controlId);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse text-gray-500">Loading session...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card padding="lg">
          <p className="text-red-500">Session not found</p>
        </Card>
      </main>
    );
  }

  const { vehicle, approval } = session;

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Left: Customer View Preview */}
        <div ref={previewContainerRef} className="flex-1 border-r border-gray-300 dark:border-gray-700 overflow-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Customer View
              </h2>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  customerConnected
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {customerConnected ? 'Customer Connected' : 'Waiting for Customer'}
              </div>
            </div>

            {/* Preview of customer's view */}
            <div className="max-w-md mx-auto space-y-4">
              {vehicle && (
                <VehicleCard
                  title={vehicle.title}
                  year={vehicle.year}
                  make={vehicle.make}
                  model={vehicle.model}
                  price={vehicle.price}
                  imageUrl={vehicle.imageUrl}
                />
              )}

              {breakdown && approval && (
                <Card padding="none" shadow="sm">
                  <PaymentDisplay
                    amount={breakdown.monthlyPayment}
                    label="Monthly Payment"
                    sublabel={`for ${terms.termMonths} months`}
                    size="lg"
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
              )}

              {approval && vehicle && (
                <Card padding="lg" shadow="sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Adjust Terms
                  </h3>
                  <TermsPanel
                    values={terms}
                    onChange={handleTermsChange}
                    constraints={{
                      minTermMonths: approval.minTermMonths,
                      maxTermMonths: approval.maxTermMonths,
                      vehiclePrice: vehicle.price,
                      balloonAllowed: approval.balloonAllowed,
                      maxBalloonPercent: approval.maxBalloonPercent,
                    }}
                    disabled={false}
                    highlightedControl={activeSpotlight}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Right: Rep Controls */}
        <div className="w-80 bg-white dark:bg-gray-800 p-4 overflow-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Rep Controls
          </h2>

          {/* Session Info */}
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {approval?.customerName || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Status</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {session.status}
            </p>
          </div>

          {/* Magic Link URL */}
          {magicLinkUrl && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Customer Magic Link
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={magicLinkUrl}
                  readOnly
                  className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyMagicLink}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Lock/Unlock Toggle */}
          <div className="mb-6">
            <button
              onClick={handleLockToggle}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isLocked
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
              }`}
            >
              {isLocked ? 'Unlock Controls' : 'Lock Controls'}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {isLocked
                ? "Customer's controls are locked"
                : 'Lock to prevent customer changes'}
            </p>
          </div>

          {/* Spotlight Controls */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Spotlight Control
            </p>
            <div className="grid grid-cols-2 gap-2">
              <SpotlightButton
                label="Term"
                active={activeSpotlight === 'termSlider'}
                onClick={() => handleSpotlight('termSlider')}
              />
              <SpotlightButton
                label="Down Pmt"
                active={activeSpotlight === 'downPayment'}
                onClick={() => handleSpotlight('downPayment')}
              />
              <SpotlightButton
                label="Balloon"
                active={activeSpotlight === 'balloonToggle'}
                onClick={() => handleSpotlight('balloonToggle')}
              />
              <SpotlightButton
                label="Balloon %"
                active={activeSpotlight === 'balloonSlider'}
                onClick={() => handleSpotlight('balloonSlider')}
              />
            </div>
            <button
              onClick={() => {
                clearSpotlight();
                setActiveSpotlight(null);
              }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Spotlight
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Quick Actions
            </p>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.open(`/terms/${sessionId}`, '_blank')}
              >
                Open Customer View
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SpotlightButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
}
