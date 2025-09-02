import React from 'react';
import { FormSection } from '@client/common/ui';
import { useRepeater } from '@client/common/hooks/useRepeater';
import { ContactItemForm } from './ContactItemForm';
import { ContactFormValues, ContactType } from './types';

interface ContactsRepeaterProps {
  contacts: ContactFormValues[];
  onChange: (contacts: ContactFormValues[]) => void;
  errors?: Record<string, Partial<Record<keyof ContactFormValues, string>>>;
}

export const ContactsRepeater: React.FC<ContactsRepeaterProps> = ({
  contacts,
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
  } = useRepeater<ContactFormValues>({
    initialItems: contacts,
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

  // Only reset when contacts prop changes from outside
  React.useEffect(() => {
    if (!isInternalChangeRef.current) {
      resetItems(contacts);
    }
  }, [contacts, resetItems]);

  const handleAdd = () => {
    isInternalChangeRef.current = true;
    add({
      type: 'ADMIN' as ContactType,
      name: '',
      is_primary: items.length === 0
    });
  };

  const handleFieldChange = (index: number, field: keyof ContactFormValues, value: any) => {
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
    
    // If we removed the primary contact and have other contacts, make the first one primary
    if (items[index]?.is_primary && items.length > 1) {
      const remainingItems = items.filter((_, i) => i !== index);
      if (remainingItems.length > 0) {
        // Find the first contact of the same type, or just the first one
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
      title="Contacts"
      description="Add tenant contacts for different departments and purposes. Having at least one contact is recommended."
      onAdd={handleAdd}
      addButtonText="Add Contact"
      addButtonDisabled={false}
    >
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No contacts added yet.</p>
          <p className="text-sm">Click "Add Contact" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((contact, index) => (
            <ContactItemForm
              key={contact.id || `contact-${index}`}
              contact={contact}
              index={index}
              errors={errors[contact.id || `temp-${index}`]}
              onChange={handleFieldChange}
              onRemove={handleRemove}
              onSetPrimary={handleSetPrimary}
              canRemove={items.length > 1}
            />
          ))}
        </div>
      )}
      
      {items.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Primary Contact:</strong> {
              items.find(contact => contact.is_primary)
                ? `${items.find(contact => contact.is_primary)?.name} (${items.find(contact => contact.is_primary)?.type})`
                : 'None selected'
            }
          </p>
          <p className="text-xs text-green-600 mt-1">
            The primary contact is used for important notifications and communication.
          </p>
        </div>
      )}
    </FormSection>
  );
};