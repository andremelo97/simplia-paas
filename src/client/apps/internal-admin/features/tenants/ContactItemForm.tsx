import React from 'react';
import { Input, Label, Button, FieldError } from '@client/common/ui';
import { Trash2 } from 'lucide-react';
import { ContactFormValues, ContactType, CONTACT_TYPE_OPTIONS } from './types';

interface ContactItemFormProps {
  contact: ContactFormValues;
  index: number;
  errors?: Partial<Record<keyof ContactFormValues, string>>;
  onChange: (index: number, field: keyof ContactFormValues, value: any) => void;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  canRemove: boolean;
}

export const ContactItemForm: React.FC<ContactItemFormProps> = ({
  contact,
  index,
  errors = {},
  onChange,
  onRemove,
  onSetPrimary,
  canRemove
}) => {
  const handleFieldChange = (field: keyof ContactFormValues, value: any) => {
    onChange(index, field, value);
  };

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else {
      return `+${cleaned.slice(0, -10)} ${cleaned.slice(-10, -7)}-${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 15) {
      handleFieldChange('phone_number', cleaned);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Contact {index + 1}
          {contact.is_primary && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
            aria-label={`Remove contact ${index + 1}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-type`} className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Type
          </Label>
          <select
            id={`contact-${index}-type`}
            value={contact.type}
            onChange={(e) => handleFieldChange('type', e.target.value as ContactType)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]
              ${errors.type 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
              }
            `}
            required
          >
            {CONTACT_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError error={errors.type} />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-label`}>
            Label
          </Label>
          <Input
            id={`contact-${index}-label`}
            value={contact.label || ''}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            placeholder="e.g., Main Office, Support Line..."
            error={errors.label}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-name`} className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Contact Name
          </Label>
          <Input
            id={`contact-${index}-name`}
            value={contact.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Full name or department"
            required
            error={errors.name}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-title`}>
            Title/Position
          </Label>
          <Input
            id={`contact-${index}-title`}
            value={contact.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Job title or role"
            error={errors.title}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-email`}>
            Email
          </Label>
          <Input
            id={`contact-${index}-email`}
            type="email"
            value={contact.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="contact@company.com"
            error={errors.email}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-phone`}>
            Phone Number
          </Label>
          <Input
            id={`contact-${index}-phone`}
            type="tel"
            value={contact.phone_number ? formatPhoneNumber(contact.phone_number) : ''}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="+1 555-123-4567"
            error={errors.phone_number}
          />
          <p className="text-xs text-gray-500">
            E.164 format (numbers only, up to 15 digits)
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-department`}>
            Department
          </Label>
          <Input
            id={`contact-${index}-department`}
            value={contact.department || ''}
            onChange={(e) => handleFieldChange('department', e.target.value)}
            placeholder="e.g., Sales, Support, Billing"
            error={errors.department}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`contact-${index}-language`}>
            Preferred Language
          </Label>
          <select
            id={`contact-${index}-language`}
            value={contact.language || ''}
            onChange={(e) => handleFieldChange('language', e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]
              border-gray-300
            `}
          >
            <option value="">Select language...</option>
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
          <FieldError error={errors.language} />
        </div>

        <div className="md:col-span-2 space-y-1">
          <Label htmlFor={`contact-${index}-notes`}>
            Notes
          </Label>
          <textarea
            id={`contact-${index}-notes`}
            value={contact.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            rows={3}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]
              border-gray-300 resize-vertical
            `}
            placeholder="Additional notes about this contact..."
          />
          <FieldError error={errors.notes} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`contact-${index}-primary`}
            checked={contact.is_primary}
            onChange={(e) => {
              if (e.target.checked) {
                onSetPrimary(index);
              }
            }}
            className="h-4 w-4 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] border-gray-300 rounded"
          />
          <Label htmlFor={`contact-${index}-primary`} className="ml-2 text-sm">
            Set as primary contact
          </Label>
        </div>
        
        <p className="text-xs text-gray-500">
          Primary contact is used for important notifications
        </p>
      </div>
    </div>
  );
};