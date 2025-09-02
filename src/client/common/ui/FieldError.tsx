import React from 'react';

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ 
  error, 
  className = '' 
}) => {
  if (!error) return null;

  return (
    <p 
      className={`mt-1 text-sm text-red-600 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {error}
    </p>
  );
};