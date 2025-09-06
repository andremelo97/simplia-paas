import React from 'react';

interface FieldErrorProps {
  error?: string;
  message?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ 
  error, 
  message,
  className = '' 
}) => {
  const displayMessage = error || message;
  if (!displayMessage) return null;

  return (
    <p 
      className={`mt-1 text-sm text-red-600 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {displayMessage}
    </p>
  );
};