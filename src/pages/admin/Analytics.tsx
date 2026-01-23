import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Loader, Download } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface AnalyticsData {
  totalIssuesDetected: number;
  issuesResolved: number;
  successRate: number;
  avgResolutionTime: number;
  downtime: number;
  costSavings: number;
  modules: {
    name: string;
    issues: number;
    resolved: number;
    pending: number;
  }[];
  timeline: {
    date: string;
    detected: number;
    resolved: number;
  }[];
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock analytics data
      const mockData: AnalyticsData = {
        totalIssuesDetected: 342,
        issuesResolved: 328,
        successRate: 95.9,
        avgResolutionTime: 4.2,
        downtime: 2.1,
        costSavings: 45320,
        modules: [
          { name: 'Network', issues: 85, resolved: 82, pending: 3 },
          { name: 'Disk', issues: 67, resolved: 64, pending: 3 },
          { name: 'Printer', issues: 95, resolved: 91, pending: 4 },
          { name: 'Service', issues: 95, resolved: 91, pending: 4 }
        ],
        timeline: [
          { date: 'Mon', detected: 45, resolved: 42 },
          { date: 'Tue', detected: 52, resolved: 50 },
          { date: 'Wed', detected: 48, resolved: 46 },
          { date: 'Thu', detected: 61, resolved: 59 },
          { date: 'Fri', detected: 55, resolved: 54 },
          { date: 'Sat', detected: 32, resolved: 31 },
          { date: 'Sun', detected: 29, resolved: 27 }
        ]
      };
      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">System performance and remediation metrics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Issues Detected</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalIssuesDetected}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Issues Resolved</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.issuesResolved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Resolution Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.avgResolutionTime} min</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Prevented Downtime</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.downtime} hours</p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Cost Savings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">R{(data.costSavings / 1000).toFixed(0)}K</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Issues by Module</h2>
            <div className="space-y-4">
              {data.modules.map((module) => (
                <div key={module.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{module.name}</span>
                    <span className="text-sm text-gray-600">{module.resolved}/{module.issues}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(module.resolved / module.issues) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Resolved: {module.resolved}</span>
                    <span className="text-xs text-gray-500">Pending: {module.pending}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trend</h2>
            <div className="flex items-end justify-between h-48 gap-2">
              {data.timeline.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="flex gap-1 mb-2">
                    <div
                      className="bg-red-500 rounded-t"
                      style={{
                        width: '12px',
                        height: `${(day.detected / 65) * 120}px`
                      }}
                      title={`Detected: ${day.detected}`}
                    />
                    <div
                      className="bg-green-500 rounded-t"
                      style={{
                        width: '12px',
                        height: `${(day.resolved / 65) * 120}px`
                      }}
                      title={`Resolved: ${day.resolved}`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{day.date}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-gray-700">Detected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-700">Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
