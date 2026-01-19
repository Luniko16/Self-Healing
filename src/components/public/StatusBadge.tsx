import React from 'react';

interface StatusBadgeProps {
  status: 'OPEN' | 'LIMITED' | 'CLOSED';
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showDot = true 
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'OPEN':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          dot: 'bg-green-600',
          border: 'border-green-200'
        };
      case 'LIMITED':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          dot: 'bg-yellow-600',
          border: 'border-yellow-200'
        };
      case 'CLOSED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          dot: 'bg-red-600',
          border: 'border-red-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          dot: 'bg-gray-600',
          border: 'border-gray-200'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const styles = getStatusStyles();
  const sizeClasses = getSizeStyles();

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
      )}
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
