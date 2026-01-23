import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  Printer, 
  HardDrive, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlusCircle,
  RefreshCw,
  BarChart3,
  Users,
  Globe,
  Info,
  MapPin,
  Tag,
  Clock
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';
import DeviceCard from '../../components/DeviceCard';
import HealthChart from '../../components/HealthChart';
import StatusBadge from '../../components/StatusBadge';
import AddDeviceModal from '../../components/AddDeviceModal';

const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices((devicesData: DeviceData[]) => {
      setDevices(devicesData);
      setLoading(false);
      if (refreshing) {
        setRefreshing(false);
        toast.success('Devices refreshed');
      }
    });

    return () => unsubscribe();
  }, [refreshing]);

  const stats = firebaseService.getHealthStats(devices);

  const handleDeleteDevice = async (deviceId: string) => {
    if (window.confirm(`Are you sure you want to delete device ${deviceId}?`)) {
      await firebaseService.deleteDevice(deviceId);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const quickAddDevice = (name: string, status: DeviceData['status']['Status']) => {
    firebaseService.simulateDevice(name, status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 blur-xl opacity-20 animate-pulse rounded-full"></div>
          </div>
          <h3 className="mt-6 text-xl font-semibold text-gray-700">Loading ServicePulse Dashboard</h3>
          <p className="mt-2 text-gray-500">Connecting to Firebase and loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'toast',
          duration: 4000,
        }}
      />

      <AddDeviceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Server className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ServicePulse Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Real-time monitoring of {stats.total} Windows device{stats.total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden lg:block">
                <StatusBadge status={stats.overall} size="lg" />
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Device
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">Total Devices</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Healthy</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.healthy}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 font-medium">Limited</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.limited}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium">Critical</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.critical}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Health Distribution</h2>
                </div>
                <span className="text-sm text-gray-500">{stats.total} total devices</span>
              </div>
              <HealthChart devices={devices} />
            </div>
          </div>

          {/* Quick Actions & System Status */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <Globe className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => quickAddDevice('CLINIC-PC-01', 'OPEN')}
                  className="w-full py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Add Healthy Clinic PC
                </button>
                <button
                  onClick={() => quickAddDevice('SCHOOL-PC-01', 'LIMITED')}
                  className="w-full py-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Add Limited School PC
                </button>
                <button
                  onClick={() => quickAddDevice('OFFICE-PC-01', 'CLOSED')}
                  className="w-full py-3 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Add Critical Office PC
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-6">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Wifi className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Network Online</span>
                  </div>
                  <span className="font-bold text-green-600">{stats.online}/{stats.total}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Printer className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Print Services</span>
                  </div>
                  <span className={`font-medium ${
                    stats.critical > 0 ? 'text-red-600' : 
                    stats.limited > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stats.critical > 0 ? 'Issues Detected' : 
                     stats.limited > 0 ? 'Partial Issues' : 'All Running'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <HardDrive className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">Storage Health</span>
                  </div>
                  <span className={`font-medium ${
                    stats.critical > 0 ? 'text-red-600' : 
                    stats.limited > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stats.critical > 0 ? 'Critical' : 
                     stats.limited > 0 ? 'Warning' : 'Good'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Managed Devices</h2>
              <p className="text-gray-600 mt-1">
                Real-time status of all connected Windows devices
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="card text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-blue-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Server className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No devices connected yet</h3>
                <p className="text-gray-600 mb-8">
                  Start monitoring by adding your first demo device. The dashboard will show real-time health status, network connectivity, and system metrics.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => quickAddDevice('DEMO-PC-01', 'OPEN')}
                    className="btn-primary"
                  >
                    Add First Device
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-secondary"
                  >
                    Custom Device
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <DeviceCard 
                  key={device.id} 
                  device={device} 
                  onDelete={handleDeleteDevice}
                />
              ))}
            </div>
          )}
        </div>

        {/* Demo Information */}
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Info className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hackathon Demo Information</h3>
              <p className="text-gray-600 mb-4">
                This is a demo dashboard for the ServicePulse hackathon project. Real devices would connect via the PowerShell agent which sends health data to Firebase in real-time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">PowerShell Agent</div>
                  <div className="text-gray-600">Self-healing Windows agent monitors network, printer, and disk</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">Firebase Integration</div>
                  <div className="text-gray-600">Real-time data sync between agents and dashboard</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">Automatic Repair</div>
                  <div className="text-gray-600">Agent automatically fixes common issues when detected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">ServicePulse</h3>
              <p className="text-gray-600 mt-1">Hackathon Project • Real-time Windows Health Monitoring</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">
                Dashboard Version 1.0.0 • Built with React, TypeScript, and Firebase
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;