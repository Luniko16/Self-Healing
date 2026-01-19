import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Server,
  Wifi,
  Printer,
  HardDrive
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';

const Analytics: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices((devicesData: DeviceData[]) => {
      setDevices(devicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mock analytics data for demo
  const uptimeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [98, 96, 99, 97, 95, 94, 99]
  };

  const issueTrends = {
    labels: ['Network', 'Printer', 'Disk', 'Other'],
    values: [45, 30, 20, 5]
  };

  const resolutionTimes = {
    labels: ['<5min', '5-15min', '15-30min', '>30min'],
    values: [60, 25, 10, 5]
  };

  const getStatusDistribution = () => {
    const healthy = devices.filter(d => d.status.Status === 'OPEN').length;
    const limited = devices.filter(d => d.status.Status === 'LIMITED').length;
    const critical = devices.filter(d => d.status.Status === 'CLOSED').length;
    const unknown = devices.filter(d => d.status.Status === 'UNKNOWN').length;
    
    return { healthy, limited, critical, unknown };
  };

  const getHealthMetrics = () => {
    const networkSuccess = devices.filter(d => d.checks.network.PingSuccess).length;
    const printerSuccess = devices.filter(d => d.checks.printer.ServiceRunning).length;
    const diskHealthy = devices.filter(d => d.checks.disk.PercentFree > 10).length;
    const total = devices.length || 1;
    
    return {
      network: Math.round((networkSuccess / total) * 100),
      printer: Math.round((printerSuccess / total) * 100),
      disk: Math.round((diskHealthy / total) * 100)
    };
  };

  const stats = firebaseService.getHealthStats(devices);
  const statusDist = getStatusDistribution();
  const healthMetrics = getHealthMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+2.5%</span>
          </div>
          <p className="text-sm text-gray-500">Overall Uptime</p>
          <p className="text-3xl font-bold text-gray-900">98.2%</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '98.2%' }}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+5%</span>
          </div>
          <p className="text-sm text-gray-500">Healthy Locations</p>
          <p className="text-3xl font-bold text-gray-900">{statusDist.healthy}</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(statusDist.healthy / (devices.length || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-red-600">-3%</span>
          </div>
          <p className="text-sm text-gray-500">Issues Detected</p>
          <p className="text-3xl font-bold text-gray-900">{statusDist.limited + statusDist.critical}</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${((statusDist.limited + statusDist.critical) / (devices.length || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-green-600">-45%</span>
          </div>
          <p className="text-sm text-gray-500">Avg. Resolution Time</p>
          <p className="text-3xl font-bold text-gray-900">4.2min</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '80%' }}></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Status Distribution</h2>
            <Filter className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Open & Operational</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">{statusDist.healthy}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({devices.length > 0 ? Math.round((statusDist.healthy / devices.length) * 100) : 0}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">Limited Services</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">{statusDist.limited}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({devices.length > 0 ? Math.round((statusDist.limited / devices.length) * 100) : 0}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Critical / Closed</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">{statusDist.critical}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({devices.length > 0 ? Math.round((statusDist.critical / devices.length) * 100) : 0}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-gray-700">Unknown</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">{statusDist.unknown}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({devices.length > 0 ? Math.round((statusDist.unknown / devices.length) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
          
          {/* Bar chart visualization */}
          <div className="mt-6 flex items-end h-32 space-x-2">
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-green-500 rounded-t"
                style={{ height: `${(statusDist.healthy / (devices.length || 1)) * 100}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">Open</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-yellow-500 rounded-t"
                style={{ height: `${(statusDist.limited / (devices.length || 1)) * 100}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">Limited</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-red-500 rounded-t"
                style={{ height: `${(statusDist.critical / (devices.length || 1)) * 100}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">Critical</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gray-500 rounded-t"
                style={{ height: `${(statusDist.unknown / (devices.length || 1)) * 100}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">Unknown</span>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">System Health Metrics</h2>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">Network Connectivity</span>
                </div>
                <span className="font-bold text-gray-900">{healthMetrics.network}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${healthMetrics.network}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">Printer Services</span>
                </div>
                <span className="font-bold text-gray-900">{healthMetrics.printer}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${healthMetrics.printer}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Disk Space Health</span>
                </div>
                <span className="font-bold text-gray-900">{healthMetrics.disk}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${healthMetrics.disk}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-700">Agent Uptime</span>
                </div>
                <span className="font-bold text-gray-900">96.8%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: '96.8%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Trends */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Issue Trends</h2>
            <p className="text-gray-600">Most common issues by category</p>
          </div>
          <div className="flex items-center space-x-2">
            <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {issueTrends.labels.map((label, index) => (
            <div key={label} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{label}</span>
                <span className="text-2xl font-bold text-gray-900">{issueTrends.values[index]}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${issueTrends.values[index]}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Auto-Repair Success</h3>
              <p className="text-sm text-gray-600">Automatically fixed issues</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">92%</div>
            <p className="text-sm text-gray-600 mt-2">Of issues resolved automatically</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Response Time</h3>
              <p className="text-sm text-gray-600">Average detection time</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">45s</div>
            <p className="text-sm text-gray-600 mt-2">To detect and alert</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">User Impact</h3>
              <p className="text-sm text-gray-600">Prevented disruptions</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">2.4k</div>
            <p className="text-sm text-gray-600 mt-2">User hours saved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
