import React from 'react';
import { FormSection } from '@client/common/ui';
import { useRepeater } from '@client/common/hooks/useRepeater';
import { AddressItemForm } from './AddressItemForm';
import { AddressFormValues, AddressType } from './types';

interface AddressesRepeaterProps {
  addresses: AddressFormValues[];
  onChange: (addresses: AddressFormValues[]) => void;
  errors?: Record<string, Partial<Record<keyof AddressFormValues, string>>>;
}

export const AddressesRepeater: React.FC<AddressesRepeaterProps> = ({
  addresses,
  onChange,
  errors = {}
}) => {
  const isInternalChangeRef = React.useRef(false);
  
  const {
    items,
    add,
    remove,
    update,
    setPrimary,
    resetItems
  } = useRepeater<AddressFormValues>({
    initialItems: addresses,
    primaryKey: 'is_primary',
    typeKey: 'type'
  });

  // Only call onChange when items change from internal operations
  React.useEffect(() => {
    if (isInternalChangeRef.current) {
      onChange(items);
      isInternalChangeRef.current = false;
    }
  }, [items, onChange]);

  // Only reset when addresses prop changes from outside
  React.useEffect(() => {
    if (!isInternalChangeRef.current) {
      resetItems(addresses);
    }
  }, [addresses, resetItems]);

  const handleAdd = () => {
    isInternalChangeRef.current = true;
    add({
      type: 'HQ' as AddressType,
      line1: '',
      city: '',
      country_code: '',
      is_primary: items.length === 0
    });
  };

  const handleFieldChange = (index: number, field: keyof AddressFormValues, value: any) => {
    isInternalChangeRef.current = true;
    update(index, { [field]: value });
  };

  const handleSetPrimary = (index: number) => {
    isInternalChangeRef.current = true;
    setPrimary(index, 'type');
  };

  const handleRemove = (index: number) => {
    isInternalChangeRef.current = true;
    remove(index);
    
    // If we removed the primary address and have other addresses, make the first one primary
    if (items[index]?.is_primary && items.length > 1) {
      const remainingItems = items.filter((_, i) => i !== index);
      if (remainingItems.length > 0) {
        // Find the first address of the same type, or just the first one
        const newPrimaryIndex = 0;
        setTimeout(() => {
          isInternalChangeRef.current = true;
          setPrimary(newPrimaryIndex);
        }, 0);
      }
    }
  };

  return (
    <FormSection
      title="Addresses"
      description="Add tenant addresses for billing, shipping, and other purposes. At least one address is required."
      onAdd={handleAdd}
      addButtonText="Add Address"
      addButtonDisabled={false}
    >
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No addresses added yet.</p>
          <p className="text-sm">Click "Add Address" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((address, index) => (
            <AddressItemForm
              key={address.id || `address-${index}`}
              address={address}
              index={index}
              errors={errors[address.id || `temp-${index}`]}
              onChange={handleFieldChange}
              onRemove={handleRemove}
              onSetPrimary={handleSetPrimary}
              canRemove={items.length > 1}
            />
          ))}
        </div>
      )}
      
    </FormSection>
  );
};