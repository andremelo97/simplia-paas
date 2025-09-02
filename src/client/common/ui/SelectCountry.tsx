import React from 'react';
import { Label } from './Label';
import { FieldError } from './FieldError';

interface SelectCountryProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

// Minimal hardcoded ISO-2 country list - commonly used countries first
const COUNTRIES = [
  { code: '', name: 'Select country...' },
  { code: 'BR', name: 'Brazil' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'ZA', name: 'South Africa' }
];

export const SelectCountry: React.FC<SelectCountryProps> = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  placeholder = 'Select country...'
}) => {
  const selectId = React.useId();

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <Label 
          htmlFor={selectId}
          className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}
        >
          {label}
        </Label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]
          disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50
          ${error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300'
          }
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {COUNTRIES.slice(1).map(country => (
          <option key={country.code} value={country.code}>
            {country.name} ({country.code})
          </option>
        ))}
      </select>
      <FieldError error={error} />
      <p className="text-sm text-gray-500">
        ISO-2 country code
      </p>
    </div>
  );
};