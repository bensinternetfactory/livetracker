import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { PinInput } from './PinInput';

interface VerificationPageProps {
  maxAttempts: number;
  attemptCount: number;
  customerName?: string;
  onVerify: (last4: string) => Promise<void>;
  isVerifying: boolean;
  error?: string;
}

export function VerificationPage({
  maxAttempts,
  attemptCount,
  customerName,
  onVerify,
  isVerifying,
  error,
}: VerificationPageProps) {
  const [pin, setPin] = useState('');
  const attemptsRemaining = maxAttempts - attemptCount;

  const handleSubmit = async () => {
    if (pin.length === 4) {
      await onVerify(pin);
      setPin(''); // Clear on error
    }
  };

  const handleComplete = async (value: string) => {
    await onVerify(value);
    setPin(''); // Clear on error
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <Card padding="lg" shadow="md" className="text-center">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Verify Your Identity
              </h1>
              {customerName && (
                <p className="text-gray-500 dark:text-gray-400">
                  Welcome, {customerName}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-300">
                Enter the last 4 digits of your SSN
              </p>
            </div>

            {/* PIN Input */}
            <div className="py-4">
              <PinInput
                value={pin}
                onChange={setPin}
                onComplete={handleComplete}
                disabled={isVerifying}
                error={!!error}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={pin.length !== 4}
              loading={isVerifying}
              className="w-full"
              size="lg"
            >
              Verify
            </Button>

            {/* Attempts Remaining */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
            </p>
          </div>
        </Card>

        {/* Security Note */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Your information is encrypted and secure
        </p>
      </div>
    </main>
  );
}

// Error states for different session conditions
export function VerificationError({
  type,
  message
}: {
  type: 'invalid' | 'expired' | 'locked';
  message?: string;
}) {
  const content = {
    invalid: {
      title: 'Invalid Link',
      description: 'This verification link is invalid or has already been used.',
      icon: (
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ),
    },
    expired: {
      title: 'Session Expired',
      description: 'This verification session has expired. Please contact your representative for a new link.',
      icon: (
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    locked: {
      title: 'Session Locked',
      description: 'Too many incorrect attempts. Please contact your representative for assistance.',
      icon: (
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  };

  const { title, description, icon } = content[type];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <Card padding="lg" shadow="md" className="text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              {icon}
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {message || description}
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}

// Loading state
export function VerificationLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <Card padding="lg" shadow="md" className="text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Loading...
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
