/**
 * Finance Calculation Module
 *
 * Handles all loan payment calculations including:
 * - Standard amortization
 * - Balloon payment amortization
 * - Total payments and interest
 */

export interface LoanParams {
  principal: number;      // Amount financed (price - down payment)
  annualRate: number;     // APR as decimal (e.g., 0.0799 for 7.99%)
  termMonths: number;     // Loan term in months (24-84)
  balloonAmount?: number; // Optional balloon/residual at end
}

export interface PaymentBreakdown {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  balloonAmount: number;
  dueAtSigning: number;
  amountFinanced: number;
}

/**
 * Calculate monthly payment using standard amortization formula
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0) return 0;
  if (termMonths <= 0) return 0;

  // Handle 0% APR edge case
  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);

  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate monthly payment with balloon amount
 *
 * When a balloon exists, we calculate the payment such that
 * the remaining balance at the end of the term equals the balloon amount.
 *
 * Formula: PMT = [P - B/(1+r)^n] * [r(1+r)^n] / [(1+r)^n - 1]
 * Where B = balloon amount
 */
export function calculateMonthlyPaymentWithBalloon(
  principal: number,
  annualRate: number,
  termMonths: number,
  balloonAmount: number
): number {
  if (principal <= 0) return 0;
  if (termMonths <= 0) return 0;
  if (balloonAmount >= principal) return 0;

  // Handle 0% APR edge case
  if (annualRate === 0) {
    return (principal - balloonAmount) / termMonths;
  }

  const monthlyRate = annualRate / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);

  // Present value of balloon payment
  const balloonPV = balloonAmount / factor;

  // Adjusted principal (principal minus PV of balloon)
  const adjustedPrincipal = principal - balloonPV;

  return adjustedPrincipal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate full payment breakdown
 */
export function calculatePaymentBreakdown(
  vehiclePrice: number,
  downPayment: number,
  annualRate: number,
  termMonths: number,
  balloonAmount: number = 0,
  fees: number = 0
): PaymentBreakdown {
  const amountFinanced = vehiclePrice - downPayment + fees;

  const monthlyPayment = balloonAmount > 0
    ? calculateMonthlyPaymentWithBalloon(amountFinanced, annualRate, termMonths, balloonAmount)
    : calculateMonthlyPayment(amountFinanced, annualRate, termMonths);

  const totalPayments = (monthlyPayment * termMonths) + balloonAmount;
  const totalInterest = totalPayments - amountFinanced;
  const dueAtSigning = downPayment + fees;

  return {
    monthlyPayment: roundCurrency(monthlyPayment),
    totalPayments: roundCurrency(totalPayments),
    totalInterest: roundCurrency(totalInterest),
    balloonAmount: roundCurrency(balloonAmount),
    dueAtSigning: roundCurrency(dueAtSigning),
    amountFinanced: roundCurrency(amountFinanced),
  };
}

/**
 * Round to 2 decimal places (currency)
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format number as currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number as currency with cents
 */
export function formatCurrencyWithCents(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate loan parameters against approval constraints
 */
export function validateLoanParams(
  params: LoanParams,
  constraints: {
    maxAmount: number;
    minDownPayment: number;
    maxTermMonths: number;
    minTermMonths: number;
    maxBalloonPercent?: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.principal > constraints.maxAmount) {
    errors.push(`Amount financed exceeds maximum of ${formatCurrency(constraints.maxAmount)}`);
  }

  if (params.termMonths < constraints.minTermMonths) {
    errors.push(`Term must be at least ${constraints.minTermMonths} months`);
  }

  if (params.termMonths > constraints.maxTermMonths) {
    errors.push(`Term cannot exceed ${constraints.maxTermMonths} months`);
  }

  if (params.balloonAmount && constraints.maxBalloonPercent) {
    const balloonPercent = (params.balloonAmount / params.principal) * 100;
    if (balloonPercent > constraints.maxBalloonPercent) {
      errors.push(`Balloon cannot exceed ${constraints.maxBalloonPercent}% of amount financed`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
