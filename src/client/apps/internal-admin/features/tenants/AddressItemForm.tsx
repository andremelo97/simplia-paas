import React from 'react';
import { Input, Label, Button, SelectCountry, FieldError, Select } from '@client/common/ui';
import { Trash2 } from 'lucide-react';
import { AddressFormValues, AddressType, ADDRESS_TYPE_OPTIONS } from './types';

interface AddressItemFormProps {
  address: AddressFormValues;
  index: number;
  errors?: Partial<Record<keyof AddressFormValues, string>>;
  onChange: (index: number, field: keyof AddressFormValues, value: any) => void;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  canRemove: boolean;
}

export const AddressItemForm: React.FC<AddressItemFormProps> = ({
  address,
  index,
  errors = {},
  onChange,
  onRemove,
  onSetPrimary,
  canRemove
}) => {
  const handleFieldChange = (field: keyof AddressFormValues, value: any) => {
    onChange(index, field, value);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Address {index + 1}
          {address.is_primary && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800" style={{ backgroundColor: 'rgba(233, 30, 99, 0.1)', color: 'var(--brand-secondary)' }}>
              Primary
            </span>
          )}
        </h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            aria-label={`Remove address ${index + 1}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor={`address-${index}-type`} className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Type
          </Label>
          <Select
            id={`address-${index}-type`}
            value={address.type}
            onChange={(e) => handleFieldChange('type', e.target.value as AddressType)}
            options={ADDRESS_TYPE_OPTIONS}
            required
            error={errors.type}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`address-${index}-label`}>
            Label
          </Label>
          <Input
            id={`address-${index}-label`}
            value={address.label || ''}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            placeholder="e.g., Main Office, Warehouse..."
            error={errors.label}
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label htmlFor={`address-${index}-line1`} className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Address Line 1
          </Label>
          <Input
            id={`address-${index}-line1`}
            value={address.line1}
            onChange={(e) => handleFieldChange('line1', e.target.value)}
            placeholder="Street address, P.O. box, company name, c/o"
            required
            error={errors.line1}
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label htmlFor={`address-${index}-line2`}>
            Address Line 2
          </Label>
          <Input
            id={`address-${index}-line2`}
            value={address.line2 || ''}
            onChange={(e) => handleFieldChange('line2', e.target.value)}
            placeholder="Apartment, suite, unit, building, floor, etc."
            error={errors.line2}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`address-${index}-city`} className="after:content-['*'] after:ml-0.5 after:text-red-500">
            City
          </Label>
          <Input
            id={`address-${index}-city`}
            value={address.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder="City name"
            required
            error={errors.city}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`address-${index}-state`}>
            State/Province
          </Label>
          <Input
            id={`address-${index}-state`}
            value={address.state || ''}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            placeholder="State or province"
            error={errors.state}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`address-${index}-postal_code`}>
            Postal Code
          </Label>
          <Input
            id={`address-${index}-postal_code`}
            value={address.postal_code || ''}
            onChange={(e) => handleFieldChange('postal_code', e.target.value)}
            placeholder="ZIP or postal code"
            error={errors.postal_code}
          />
        </div>

        <SelectCountry
          label="Country"
          value={address.country_code}
          onChange={(value) => handleFieldChange('country_code', value)}
          required
          error={errors.country_code}
        />
      </div>

      <div className="flex items-center pt-2 border-t border-gray-200">
        <input
          type="checkbox"
          id={`address-${index}-primary`}
          checked={address.is_primary}
          onChange={(e) => {
            if (e.target.checked) {
              onSetPrimary(index);
            } else {
              // Allow unchecking by setting this item to false
              onChange(index, 'is_primary', false);
            }
          }}
          className="h-4 w-4 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] border-gray-300 rounded"
        />
        <Label htmlFor={`address-${index}-primary`} className="ml-2 text-sm">
          Set as primary address
        </Label>
      </div>
    </div>
  );
};