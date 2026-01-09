import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  calculateMonthlyPaymentWithBalloon,
  calculatePaymentBreakdown,
  formatCurrency,
  parseCurrency,
  validateLoanParams,
  roundCurrency,
} from './finance';

describe('calculateMonthlyPayment', () => {
  it('calculates standard auto loan payment correctly', () => {
    // $30,000 loan, 7.99% APR, 60 months
    const payment = calculateMonthlyPayment(30000, 0.0799, 60);
    expect(payment).toBeCloseTo(608.15, 0);
  });

  it('handles 0% APR', () => {
    // $30,000 loan, 0% APR, 60 months = $500/month
    const payment = calculateMonthlyPayment(30000, 0, 60);
    expect(payment).toBe(500);
  });

  it('returns 0 for zero principal', () => {
    const payment = calculateMonthlyPayment(0, 0.0799, 60);
    expect(payment).toBe(0);
  });

  it('returns 0 for zero term', () => {
    const payment = calculateMonthlyPayment(30000, 0.0799, 0);
    expect(payment).toBe(0);
  });

  it('calculates shorter term correctly', () => {
    // $30,000 loan, 7.99% APR, 36 months
    const payment = calculateMonthlyPayment(30000, 0.0799, 36);
    expect(payment).toBeCloseTo(939.95, 0);
  });

  it('calculates 84 month term correctly', () => {
    // $50,000 loan, 8.5% APR, 84 months
    const payment = calculateMonthlyPayment(50000, 0.085, 84);
    expect(payment).toBeCloseTo(791.82, 0);
  });
});

describe('calculateMonthlyPaymentWithBalloon', () => {
  it('reduces payment when balloon is present', () => {
    const withoutBalloon = calculateMonthlyPayment(30000, 0.0799, 60);
    const withBalloon = calculateMonthlyPaymentWithBalloon(30000, 0.0799, 60, 5000);

    // Payment with balloon should be lower
    expect(withBalloon).toBeLessThan(withoutBalloon);
  });

  it('calculates correct payment with balloon', () => {
    // $30,000 loan, 7.99% APR, 60 months, $5,000 balloon
    // Payment should amortize to leave $5k balance at end
    const payment = calculateMonthlyPaymentWithBalloon(30000, 0.0799, 60, 5000);
    expect(payment).toBeCloseTo(540.08, 0);
  });

  it('handles 0% APR with balloon', () => {
    // $30,000 loan, 0% APR, 60 months, $6,000 balloon
    // ($30,000 - $6,000) / 60 = $400/month
    const payment = calculateMonthlyPaymentWithBalloon(30000, 0, 60, 6000);
    expect(payment).toBe(400);
  });

  it('returns 0 if balloon >= principal', () => {
    const payment = calculateMonthlyPaymentWithBalloon(30000, 0.0799, 60, 30000);
    expect(payment).toBe(0);
  });
});

describe('calculatePaymentBreakdown', () => {
  it('calculates full breakdown correctly', () => {
    const breakdown = calculatePaymentBreakdown(
      35000,  // vehicle price
      5000,   // down payment
      0.0799, // APR
      60,     // term
      0,      // no balloon
      0       // no fees
    );

    expect(breakdown.amountFinanced).toBe(30000);
    expect(breakdown.monthlyPayment).toBeCloseTo(608.15, 0);
    expect(breakdown.totalPayments).toBeCloseTo(36489, 0);
    expect(breakdown.totalInterest).toBeCloseTo(6489, 0);
    expect(breakdown.dueAtSigning).toBe(5000);
  });

  it('includes fees in amount financed', () => {
    const breakdown = calculatePaymentBreakdown(
      35000,  // vehicle price
      5000,   // down payment
      0.0799, // APR
      60,     // term
      0,      // no balloon
      500     // $500 in fees
    );

    expect(breakdown.amountFinanced).toBe(30500);
    expect(breakdown.dueAtSigning).toBe(5500);
  });

  it('calculates with balloon correctly', () => {
    const breakdown = calculatePaymentBreakdown(
      35000,
      5000,
      0.0799,
      60,
      5000, // balloon
      0
    );

    expect(breakdown.balloonAmount).toBe(5000);
    expect(breakdown.monthlyPayment).toBeLessThan(608); // less than without balloon
    expect(breakdown.totalPayments).toBeCloseTo(37405, 0); // includes balloon
  });
});

describe('formatCurrency', () => {
  it('formats whole dollars', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
  });

  it('rounds to whole dollars', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(50000)).toBe('$50,000');
  });
});

describe('parseCurrency', () => {
  it('parses formatted currency', () => {
    expect(parseCurrency('$1,234')).toBe(1234);
  });

  it('parses with cents', () => {
    expect(parseCurrency('$1,234.56')).toBe(1234.56);
  });

  it('returns 0 for invalid input', () => {
    expect(parseCurrency('abc')).toBe(0);
  });
});

describe('validateLoanParams', () => {
  const constraints = {
    maxAmount: 100000,
    minDownPayment: 0,
    minTermMonths: 24,
    maxTermMonths: 84,
    maxBalloonPercent: 30,
  };

  it('validates valid params', () => {
    const result = validateLoanParams(
      { principal: 50000, annualRate: 0.0799, termMonths: 60 },
      constraints
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('catches term too short', () => {
    const result = validateLoanParams(
      { principal: 50000, annualRate: 0.0799, termMonths: 12 },
      constraints
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('at least 24 months');
  });

  it('catches term too long', () => {
    const result = validateLoanParams(
      { principal: 50000, annualRate: 0.0799, termMonths: 96 },
      constraints
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('cannot exceed 84 months');
  });

  it('catches amount exceeding max', () => {
    const result = validateLoanParams(
      { principal: 150000, annualRate: 0.0799, termMonths: 60 },
      constraints
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('exceeds maximum');
  });

  it('catches balloon exceeding max percent', () => {
    const result = validateLoanParams(
      { principal: 50000, annualRate: 0.0799, termMonths: 60, balloonAmount: 20000 },
      constraints
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Balloon cannot exceed 30%');
  });
});

describe('roundCurrency', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundCurrency(123.456)).toBe(123.46);
    expect(roundCurrency(123.454)).toBe(123.45);
  });
});
