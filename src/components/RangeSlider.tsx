import { forwardRef, useMemo } from 'react';
import type { InputHTMLAttributes } from 'react';

interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  valueLabel?: string;
  formatValue?: (value: number) => string;
  showTicks?: boolean;
  tickCount?: number;
  disabled?: boolean;
  highlighted?: boolean;
}

export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(
  (
    {
      min,
      max,
      step = 1,
      value,
      onChange,
      label,
      valueLabel,
      formatValue = (v) => v.toString(),
      showTicks = false,
      tickCount = 5,
      disabled = false,
      highlighted = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const ticks = useMemo(() => {
      if (!showTicks) return [];
      const tickValues: number[] = [];
      const tickStep = (max - min) / (tickCount - 1);
      for (let i = 0; i < tickCount; i++) {
        tickValues.push(Math.round(min + tickStep * i));
      }
      return tickValues;
    }, [min, max, tickCount, showTicks]);

    return (
      <div className={`w-full ${className}`}>
        {(label || valueLabel) && (
          <div className="flex justify-between items-baseline mb-2">
            {label && (
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {label}
              </label>
            )}
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {valueLabel || formatValue(value)}
            </span>
          </div>
        )}

        <div className="relative">
          <div
            className={`
              relative h-2 rounded-full transition-all duration-200
              ${disabled ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'}
              ${highlighted ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''}
            `}
          >
            {/* Filled track */}
            <div
              className={`
                absolute h-full rounded-full transition-all duration-100
                ${disabled ? 'bg-gray-400' : 'bg-gray-900 dark:bg-white'}
              `}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className={`
              absolute inset-0 w-full h-2 appearance-none bg-transparent cursor-pointer
              disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-gray-900
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:duration-100
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:active:scale-95
              dark:[&::-webkit-slider-thumb]:bg-gray-900
              dark:[&::-webkit-slider-thumb]:border-white
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-gray-900
              [&::-moz-range-thumb]:shadow-md
            `}
            {...props}
          />
        </div>

        {showTicks && (
          <div className="flex justify-between mt-1 px-0.5">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="text-xs text-gray-500 dark:text-gray-500"
              >
                {formatValue(tick)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);

RangeSlider.displayName = 'RangeSlider';
