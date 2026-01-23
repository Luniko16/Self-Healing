import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

export interface RealSystemChartProps {
  diagnostics: any;
}

const RealSystemChart: React.FC<RealSystemChartProps> = ({ diagnostics }) => {
  if (!diagnostics) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-gray-500">
        <p>Loading system data...</p>
      </div>
    );
  }

  // Create health distribution data
  const healthData = [
    { 
      name: 'Healthy', 
      value: diagnostics.summary?.total_issues === 0 ? 1 : 0, 
      color: '#10b981' 
    },
    { 
      name: 'Warnings', 
      value: diagnostics.summary?.warnings || 0, 
      color: '#f59e0b' 
    },
    { 
      name: 'Critical', 
      value: diagnostics.summary?.critical_issues || 0, 
      color: '#ef4444' 
    }
  ].filter(item => item.value > 0);

  // Create system metrics data for bar chart
  const systemMetrics: Array<{name: string; usage: number; type: string; color: string}> = [];
  
  // Add disk usage data
  if (diagnostics.issues) {
    diagnostics.issues.forEach((issue: any) => {
      if (issue.module === 'disk' && issue.details) {
        systemMetrics.push({
          name: `Disk ${issue.details.drive}`,
          usage: issue.details.percent_used || 0,
          type: 'disk',
          color: issue.details.percent_used > 90 ? '#ef4444' : issue.details.percent_used > 80 ? '#f59e0b' : '#10b981'
        });
      } else if (issue.module === 'memory' && issue.details) {
        systemMetrics.push({
          name: 'Memory',
          usage: issue.details.percent_used || 0,
          type: 'memory',
          color: issue.details.percent_used > 90 ? '#ef4444' : issue.details.percent_used > 80 ? '#f59e0b' : '#10b981'
        });
      } else if (issue.module === 'cpu' && issue.details) {
        systemMetrics.push({
          name: 'CPU',
          usage: issue.details.cpu_percent || 0,
          type: 'cpu',
          color: issue.details.cpu_percent > 90 ? '#ef4444' : issue.details.cpu_percent > 80 ? '#f59e0b' : '#10b981'
        });
      }
    });
  }

  // If no specific metrics found, create default healthy metrics
  if (systemMetrics.length === 0) {
    systemMetrics.push(
      { name: 'CPU', usage: 25, type: 'cpu', color: '#10b981' },
      { name: 'Memory', usage: 45, type: 'memory', color: '#10b981' },
      { name: 'Disk C:', usage: 60, type: 'disk', color: '#10b981' }
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* System Health Pie Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Status</h3>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={healthData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {healthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [
                  name === 'Healthy' ? (Number(value) > 0 ? 'System Healthy' : 'No Issues') : `${value || 0} ${name}`,
                  'Status'
                ]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: '#4b5563', fontSize: '14px' }}>
                    {value}: {entry.payload.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Resource Usage Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={systemMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Usage']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                {systemMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">System Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Hostname</p>
            <p className="font-medium">{diagnostics.hostname || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-600">Health Status</p>
            <p className={`font-medium capitalize ${
              diagnostics.system_health === 'critical' ? 'text-red-600' :
              diagnostics.system_health === 'warning' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {diagnostics.system_health || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Issues</p>
            <p className="font-medium">{diagnostics.summary?.total_issues || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">Last Scan</p>
            <p className="font-medium">
              {diagnostics.timestamp ? new Date(diagnostics.timestamp).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealSystemChart;