import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button, Card } from '~/components';
import { formatCurrency, formatCurrencyWithCents } from '~/lib/finance';

export const Route = createFileRoute('/closing/$sessionId')({
  component: ClosingPage,
});

function ClosingPage() {
  const { sessionId } = Route.useParams();

  // Query session data
  const { data: session, isLoading } = useQuery({
    ...convexQuery(api.sessions.get, { id: sessionId as Id<'sessions'> }),
  });

  // Query term selection
  const { data: termSelection } = useQuery({
    ...convexQuery(api.termSelections.getBySession, { sessionId: sessionId as Id<'sessions'> }),
  });

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
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
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const { vehicle } = session;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Success Header */}
        <Card padding="lg" shadow="md" className="text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Terms Confirmed
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Your financing terms have been locked in.
              </p>
            </div>
          </div>
        </Card>

        {/* Vehicle Summary */}
        {vehicle && (
          <Card padding="md" shadow="sm">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Vehicle
            </h2>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {formatCurrency(vehicle.price)}
            </p>
          </Card>
        )}

        {/* Terms Summary */}
        {termSelection && (
          <Card padding="md" shadow="sm">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Your Terms
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly Payment</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyWithCents(termSelection.monthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Term</span>
                <span className="text-gray-900 dark:text-white">
                  {termSelection.termMonths} months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Down Payment</span>
                <span className="text-gray-900 dark:text-white">
                  {formatCurrency(termSelection.downPayment)}
                </span>
              </div>
              {termSelection.balloonAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Balloon Payment</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(termSelection.balloonAmount)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount Financed</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(termSelection.amountFinanced)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* E-Sign Placeholder */}
        <Card padding="lg" shadow="sm" className="text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Document Signing
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Coming soon - electronic document signing
              </p>
            </div>
            <Button variant="secondary" disabled className="w-full">
              E-Sign Documents
            </Button>
          </div>
        </Card>

        {/* Contact Info */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Your sales representative will contact you shortly to complete the process.
        </p>
      </div>
    </main>
  );
}
