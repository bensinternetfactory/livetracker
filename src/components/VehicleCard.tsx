import { formatCurrency } from '../lib/finance';
import { Card } from './Card';

interface VehicleCardProps {
  title: string;
  year: number;
  make: string;
  model: string;
  price: number;
  imageUrl?: string;
  highlighted?: boolean;
}

export function VehicleCard({
  title,
  year,
  make,
  model,
  price,
  imageUrl,
  highlighted = false,
}: VehicleCardProps) {
  const displayTitle = title || `${year} ${make} ${model}`;

  return (
    <Card
      padding="none"
      shadow="md"
      className={`overflow-hidden ${highlighted ? 'ring-2 ring-blue-400' : ''}`}
    >
      {/* Image */}
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
          {displayTitle}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {year} {make} {model}
        </p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">
          {formatCurrency(price)}
        </p>
      </div>
    </Card>
  );
}
