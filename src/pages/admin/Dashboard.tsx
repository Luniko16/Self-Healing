import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Wifi, 
  Printer, 
  HardDrive, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';

const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices((devicesData) => {
      setDevices(devicesData);
      setLoading(false);
      if (refreshing) {
        setRefreshing(false);
      }
    });

    return () => unsubscribe();
  }, [refreshing]);

  const stats = firebaseService.getHealthStats(devices);
  const recentDevices = devices.slice(0, 5);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Real-time monitoring of {stats.total} service locations</p>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {stats.agents} Live Agents
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              {stats.locations} Public Services
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Locations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-xs text-gray-600 mt-2">+2 this week</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Operational</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.healthy}</p>
              <p className="text-xs text-gray-600 mt-2">{stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0}% healthy</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Limited Services</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.limited}</p>
              <p className="text-xs text-gray-600 mt-2">Needs attention</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.critical}</p>
              <p className="text-xs text-gray-600 mt-2">Immediate action required</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Service Health Overview</h2>
              <Link to="/admin/analytics" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View details →
              </Link>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Network Status</span>
                  <span className="text-sm font-bold text-blue-600">
                    {Math.round(
                      (devices.filter(d => d.checks.network.PingSuccess).length / (devices.length || 1)) * 100
                    )}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${Math.round(
                        (devices.filter(d => d.checks.network.PingSuccess).length / (devices.length || 1)) * 100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Printer Services</span>
                  <span className="text-sm font-bold text-purple-600">
                    {Math.round(
                      (devices.filter(d => d.checks.printer.ServiceRunning).length / (devices.length || 1)) * 100
                    )}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-500 transition-all"
                    style={{
                      width: `${Math.round(
                        (devices.filter(d => d.checks.printer.ServiceRunning).length / (devices.length || 1)) * 100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Disk Space Healthy</span>
                  <span className="text-sm font-bold text-green-600">
                    {Math.round(
                      (devices.filter(d => d.checks.disk.PercentFree > 10).length / (devices.length || 1)) * 100
                    )}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.round(
                        (devices.filter(d => d.checks.disk.PercentFree > 10).length / (devices.length || 1)) * 100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900">Overall Status</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.critical === 0 ? 'Healthy' : 'Warning'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Operational Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">Total Monitored</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => firebaseService.simulateDevice('CLINIC-01', 'OPEN')}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Add Healthy Clinic</span>
                </div>
              </button>
              
              <button
                onClick={() => firebaseService.simulateDevice('SCHOOL-01', 'LIMITED')}
                className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-700">Add Limited School</span>
                </div>
              </button>
              
              <Link
                to="/admin/map"
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">View on Map</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Devices */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Location Updates</h2>
          <Link to="/admin/locations" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all locations →
          </Link>
        </div>
        <div className="space-y-4">
          {recentDevices.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No devices available</p>
          ) : (
            recentDevices.map((device) => (
              <div key={device.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{device.agent.computerName}</h4>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                      <span>📍</span>
                      <span>{device.location || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-600">
                      {Math.round(
                        ([
                          device.checks.network.PingSuccess,
                          device.checks.printer.ServiceRunning,
                          device.checks.disk.PercentFree > 10
                        ].filter((s) => s).length / 3) * 100
                      )}%
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(device.agent.lastUpdated).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      device.checks.network.PingSuccess
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <Wifi className="w-3 h-3" />
                    <span>Network</span>
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      device.checks.printer.ServiceRunning
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <Printer className="w-3 h-3" />
                    <span>Printer</span>
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      device.checks.disk.PercentFree > 10
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <HardDrive className="w-3 h-3" />
                    <span>Disk</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wifi className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Network Connectivity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.online}/{stats.total}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Devices with active internet connection</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Printer className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Printer Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => d.checks.printer.ServiceRunning).length}/{stats.total}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Print spooler services running</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <HardDrive className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disk Space</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => d.checks.disk.PercentFree > 10).length}/{stats.total}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Devices with sufficient disk space</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
