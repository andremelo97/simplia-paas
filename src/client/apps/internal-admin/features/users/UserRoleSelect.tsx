import React from 'react';
import { Select } from '@client/common/ui';
import { UserRole, USER_ROLE_OPTIONS } from './types';

interface UserRoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  error?: string;
}

export const UserRoleSelect: React.FC<UserRoleSelectProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  className = '',
  id,
  required = false,
  error 
}) => {
  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      options={USER_ROLE_OPTIONS}
      disabled={disabled}
      required={required}
      error={error}
      className={className}
    />
  );
};