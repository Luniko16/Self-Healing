import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue',
  onClick
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' };
      case 'red':
        return { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' };
      case 'yellow':
        return { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-200' };
      case 'purple':
        return { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' };
      default:
        return { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-600 mt-2">{description}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
