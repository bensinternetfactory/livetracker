import { formatCurrency } from '../lib/finance';

interface PaymentBreakdownProps {
  amountFinanced: number;
  totalPayments: number;
  totalInterest: number;
  dueAtSigning: number;
  balloonAmount?: number;
  termMonths: number;
  apr: number;
}

export function PaymentBreakdown({
  amountFinanced,
  totalPayments,
  totalInterest,
  dueAtSigning,
  balloonAmount = 0,
  termMonths,
  apr,
}: PaymentBreakdownProps) {
  const rows = [
    { label: 'Amount Financed', value: formatCurrency(amountFinanced) },
    { label: 'Term', value: `${termMonths} months` },
    { label: 'APR', value: `${(apr * 100).toFixed(2)}%` },
    { label: 'Total of Payments', value: formatCurrency(totalPayments) },
    { label: 'Total Interest', value: formatCurrency(totalInterest) },
    { label: 'Due at Signing', value: formatCurrency(dueAtSigning), highlight: true },
  ];

  if (balloonAmount > 0) {
    rows.splice(5, 0, { label: 'Balloon Payment', value: formatCurrency(balloonAmount) });
  }

  return (
    <div className="space-y-2 py-4">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`
            flex justify-between items-center py-2 px-3 rounded-lg
            ${row.highlight ? 'bg-gray-100 dark:bg-gray-800' : ''}
          `}
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.label}
          </span>
          <span
            className={`
              text-sm font-medium
              ${row.highlight ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
            `}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
