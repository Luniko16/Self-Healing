import React from 'react';
import { TrendingUp } from 'lucide-react';

interface HealthData {
  label: string;
  percentage: number;
  color: 'green' | 'yellow' | 'red';
}

interface DeviceHealthChartProps {
  title?: string;
  data: HealthData[];
  height?: number;
}

const DeviceHealthChart: React.FC<DeviceHealthChartProps> = ({
  title = 'Device Health Status',
  data,
  height = 300
}) => {
  const getColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getColorLabel = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <TrendingUp className="w-5 h-5 text-blue-600" />
      </div>

      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{item.label}</span>
              <span className={`text-sm font-bold ${getColorLabel(item.color)}`}>
                {item.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getColorClass(item.color)}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Health Score</span>
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(
              data.reduce((acc, item) => acc + item.percentage, 0) / data.length
            )}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeviceHealthChart;
