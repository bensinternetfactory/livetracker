import { RangeSlider } from './RangeSlider';
import { CurrencyInput } from './CurrencyInput';
import { Toggle } from './Toggle';
import { formatCurrency } from '../lib/finance';
import type { ControlId } from '~/liveblocks.config';

export interface TermsValues {
  termMonths: number;
  downPayment: number;
  balloonEnabled: boolean;
  balloonPercent: number;
}

interface TermsPanelProps {
  values: TermsValues;
  onChange: (values: TermsValues) => void;
  constraints: {
    minTermMonths: number;
    maxTermMonths: number;
    vehiclePrice: number;
    balloonAllowed: boolean;
    maxBalloonPercent?: number;
  };
  disabled?: boolean;
  highlightedControl?: ControlId;
}

export function TermsPanel({
  values,
  onChange,
  constraints,
  disabled = false,
  highlightedControl,
}: TermsPanelProps) {
  const { termMonths, downPayment, balloonEnabled, balloonPercent } = values;
  const { minTermMonths, maxTermMonths, vehiclePrice, balloonAllowed, maxBalloonPercent = 30 } = constraints;

  const updateValue = <K extends keyof TermsValues>(key: K, value: TermsValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  // Quick pick values for down payment
  const quickPicks = [0, 1000, 2500, 5000].filter(v => v < vehiclePrice);

  return (
    <div className="space-y-6">
      {/* Term Slider */}
      <div>
        <RangeSlider
          min={minTermMonths}
          max={maxTermMonths}
          step={6}
          value={termMonths}
          onChange={(v) => updateValue('termMonths', v)}
          label="Loan Term"
          formatValue={(v) => `${v} mo`}
          showTicks
          tickCount={Math.min(5, Math.floor((maxTermMonths - minTermMonths) / 12) + 1)}
          disabled={disabled}
          highlighted={highlightedControl === 'termSlider'}
        />
      </div>

      {/* Down Payment */}
      <div>
        <CurrencyInput
          value={downPayment}
          onChange={(v) => updateValue('downPayment', v)}
          label="Down Payment"
          min={0}
          max={vehiclePrice}
          quickPicks={quickPicks}
          disabled={disabled}
          highlighted={highlightedControl === 'downPayment'}
        />
      </div>

      {/* Balloon Toggle */}
      {balloonAllowed && (
        <>
          <Toggle
            checked={balloonEnabled}
            onChange={(v) => {
              updateValue('balloonEnabled', v);
              if (!v) {
                updateValue('balloonPercent', 0);
              }
            }}
            label="Balloon Payment"
            description="Lower monthly payments with a lump sum due at end"
            disabled={disabled}
            highlighted={highlightedControl === 'balloonToggle'}
          />

          {/* Balloon Amount Slider */}
          {balloonEnabled && (
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <RangeSlider
                min={0}
                max={maxBalloonPercent}
                step={5}
                value={balloonPercent}
                onChange={(v) => updateValue('balloonPercent', v)}
                label="Balloon Amount"
                valueLabel={`${balloonPercent}% (${formatCurrency(vehiclePrice * balloonPercent / 100)})`}
                showTicks
                tickCount={Math.min(5, maxBalloonPercent / 10 + 1)}
                formatValue={(v) => `${v}%`}
                disabled={disabled}
                highlighted={highlightedControl === 'balloonSlider'}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
