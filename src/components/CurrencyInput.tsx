import { forwardRef, useState, useEffect } from 'react';
import type { InputHTMLAttributes } from 'react';
import { formatCurrency, parseCurrency } from '../lib/finance';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  quickPicks?: number[];
  min?: number;
  max?: number;
  disabled?: boolean;
  highlighted?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      label,
      quickPicks = [],
      min = 0,
      max = Infinity,
      disabled = false,
      highlighted = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(formatCurrency(value));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value, isFocused]);

    const handleFocus = () => {
      setIsFocused(true);
      setDisplayValue(value === 0 ? '' : value.toString());
    };

    const handleBlur = () => {
      setIsFocused(false);
      const parsed = parseCurrency(displayValue);
      const clamped = Math.min(Math.max(parsed, min), max);
      onChange(clamped);
      setDisplayValue(formatCurrency(clamped));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow only numbers and decimal point while typing
      const cleaned = raw.replace(/[^0-9.]/g, '');
      setDisplayValue(cleaned);

      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        onChange(Math.min(Math.max(parsed, min), max));
      }
    };

    const handleQuickPick = (pickValue: number) => {
      onChange(pickValue);
      setDisplayValue(formatCurrency(pickValue));
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {label}
          </label>
        )}

        <div
          className={`
            relative rounded-xl border-2 transition-all duration-200
            ${disabled ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
            ${isFocused && !disabled ? 'border-gray-900 dark:border-white ring-1 ring-gray-900 dark:ring-white' : ''}
            ${highlighted ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''}
          `}
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            $
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue.replace('$', '').replace(/,/g, '')}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={`
              w-full py-3 pl-8 pr-4 text-lg font-semibold bg-transparent
              text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              focus:outline-none
              disabled:cursor-not-allowed disabled:text-gray-500
            `}
            placeholder="0"
            {...props}
          />
        </div>

        {quickPicks.length > 0 && (
          <div className="flex gap-2 mt-2">
            {quickPicks.map((pick) => (
              <button
                key={pick}
                type="button"
                onClick={() => handleQuickPick(pick)}
                disabled={disabled}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${value === pick
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {formatCurrency(pick)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
