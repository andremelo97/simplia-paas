import React from 'react';
import { Button } from './Button';
import { Plus } from 'lucide-react';

interface FormSectionProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  addButtonText?: string;
  addButtonDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  onAdd,
  addButtonText,
  addButtonDisabled = false,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        {onAdd && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAdd}
            disabled={addButtonDisabled}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {addButtonText || 'Add'}
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};