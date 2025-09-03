import React from 'react';

export type TenantStatus = 'active' | 'inactive';

interface TenantStatusBadgeProps {
  status: TenantStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const TenantStatusBadge: React.FC<TenantStatusBadgeProps> = ({ 
  status, 
  size = 'sm',
  className = '' 
}) => {
  const getStatusStyles = (status: TenantStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: TenantStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';

  return (
    <span
      className={`inline-flex ${sizeClasses} font-semibold rounded-full ${getStatusStyles(status)} ${className}`}
      role="status"
      aria-label={`Tenant status: ${getStatusLabel(status)}`}
      aria-live="polite"
    >
      {getStatusLabel(status)}
    </span>
  );
};