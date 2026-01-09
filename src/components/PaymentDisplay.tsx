import { formatCurrencyWithCents } from '../lib/finance';

interface PaymentDisplayProps {
  amount: number;
  label?: string;
  sublabel?: string;
  size?: 'md' | 'lg' | 'xl';
  highlighted?: boolean;
}

export function PaymentDisplay({
  amount,
  label = 'Monthly Payment',
  sublabel,
  size = 'lg',
  highlighted = false,
}: PaymentDisplayProps) {
  const sizes = {
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  return (
    <div
      className={`
        text-center py-6 px-4 rounded-2xl transition-all duration-300
        ${highlighted ? 'bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-400' : 'bg-gray-50 dark:bg-gray-800/50'}
      `}
    >
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </p>
      <p className={`${sizes[size]} font-bold text-gray-900 dark:text-white tracking-tight`}>
        {formatCurrencyWithCents(amount)}
      </p>
      {sublabel && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {sublabel}
        </p>
      )}
    </div>
  );
}
