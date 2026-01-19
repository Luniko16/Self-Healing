import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'OPEN' | 'LIMITED' | 'CLOSED' | 'UNKNOWN';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showIcon = true, 
  size = 'md',
  className = ''
}) => {
  const config = {
    OPEN: {
      icon: CheckCircle,
      colors: 'status-healthy',
      iconColor: 'text-green-500',
      label: 'Healthy'
    },
    LIMITED: {
      icon: AlertTriangle,
      colors: 'status-warning',
      iconColor: 'text-yellow-500',
      label: 'Limited'
    },
    CLOSED: {
      icon: XCircle,
      colors: 'status-critical',
      iconColor: 'text-red-500',
      label: 'Critical'
    },
    UNKNOWN: {
      icon: HelpCircle,
      colors: 'status-offline',
      iconColor: 'text-gray-500',
      label: 'Unknown'
    }
  };

  const { icon: Icon, colors, iconColor, label } = config[status];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`${sizeClasses[size]} ${colors} ${className}`}>
      {showIcon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      <span className="font-medium">{label}</span>
    </div>
  );
};

export default StatusBadge;