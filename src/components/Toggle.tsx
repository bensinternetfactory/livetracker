import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  highlighted?: boolean;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      checked,
      onChange,
      label,
      description,
      disabled = false,
      highlighted = false,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <label
        className={`
          flex items-center justify-between gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
          ${highlighted ? 'bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-400' : ''}
          ${className}
        `}
      >
        <div className="flex-1">
          {label && (
            <span className="block text-base font-medium text-gray-900 dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </span>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={`
              w-12 h-7 rounded-full transition-colors duration-200
              ${checked
                ? 'bg-gray-900 dark:bg-white'
                : 'bg-gray-200 dark:bg-gray-700'
              }
            `}
          >
            <div
              className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 shadow-md transition-transform duration-200
                ${checked ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </div>
        </div>
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
