import React from 'react';
import { Activity, CheckCircle, AlertCircle, XCircle, TrendingUp } from 'lucide-react';

interface HealthMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'yellow' | 'red';
}

interface SystemHealthProps {
  metrics: HealthMetric[];
  overallStatus: 'healthy' | 'warning' | 'critical';
  uptime?: number;
}

const SystemHealth: React.FC<SystemHealthProps> = ({
  metrics,
  overallStatus,
  uptime
}) => {
  const getStatusColor = () => {
    switch (overallStatus) {
      case 'healthy':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
      case 'warning':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' };
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' };
    }
  };

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'healthy':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-8 h-8 text-red-600" />;
    }
  };

  const getStatusLabel = () => {
    switch (overallStatus) {
      case 'healthy':
        return 'All Systems Operational';
      case 'warning':
        return 'Some Issues Detected';
      case 'critical':
        return 'Critical Issues Present';
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Status Header */}
      <div
        className={`px-6 py-8 ${statusColor.bg} border-b ${statusColor.border}`}
      >
        <div className="flex items-center space-x-4">
          <div>{getStatusIcon()}</div>
          <div>
            <h3 className={`text-xl font-bold ${statusColor.text}`}>
              {getStatusLabel()}
            </h3>
            {uptime && (
              <p className="text-sm text-gray-600 mt-1">
                Uptime: {uptime}%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Health Metrics
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const getMetricColor = () => {
              switch (metric.color) {
                case 'green':
                  return 'bg-green-100 text-green-800';
                case 'yellow':
                  return 'bg-yellow-100 text-yellow-800';
                case 'red':
                  return 'bg-red-100 text-red-800';
              }
            };

            return (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {metric.label}
                  </span>
                  <span className={`text-2xl font-bold ${getMetricColor()}`}>
                    {metric.value}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.color === 'green'
                        ? 'bg-green-500'
                        : metric.color === 'yellow'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Indicator */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>System actively monitoring all devices</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
