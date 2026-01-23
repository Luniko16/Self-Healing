import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search,
  Clock,
  MapPin,
  Wifi,
  Printer,
  HardDrive
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';

const PublicStatus: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices((devicesData: DeviceData[]) => {
      setDevices(devicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = firebaseService.getHealthStats(devices);
  
  const filteredDevices = devices.filter(device =>
    device.agent.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'LIMITED': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'CLOSED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-blue-500 animate-pulse mx-auto" />
        <p className="mt-4 text-gray-600">Loading service status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Real-Time Service Status
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Check the availability of public services before you visit. Updated every 5 minutes.
        </p>
        
        {/* Overall Status */}
        <div className="inline-flex items-center space-x-3 mt-6 px-6 py-3 bg-white rounded-lg shadow-sm">
          <div className={`w-3 h-3 rounded-full ${
            stats.overall === 'OPEN' ? 'bg-green-500' :
            stats.overall === 'LIMITED' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="font-semibold">
            Overall System Status: <span className={
              stats.overall === 'OPEN' ? 'text-green-600' :
              stats.overall === 'LIMITED' ? 'text-yellow-600' : 'text-red-600'
            }>{stats.overall}</span>
          </span>
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for clinics, schools, or government offices..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Locations</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-green-600">{stats.healthy}</div>
          <div className="text-sm text-gray-600 mt-1">Fully Operational</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.limited}</div>
          <div className="text-sm text-gray-600 mt-1">Limited Services</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-gray-600 mt-1">Closed/Critical</div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Service Locations</h2>
          <p className="text-gray-600">Showing {filteredDevices.length} of {stats.total} locations</p>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="mt-4 text-gray-600">No services match your search</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredDevices.map((device) => (
              <div key={device.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(device.status.Status)}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {device.agent.computerName}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{device.location || 'Location not specified'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            device.status.Status === 'OPEN' ? 'bg-green-100 text-green-800' :
                            device.status.Status === 'LIMITED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {device.status.Status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-2">{device.status.Message}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className={`flex items-center space-x-2 ${
                        device.checks.network.PingSuccess ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm">{device.checks.network.PingSuccess ? 'Network Online' : 'Network Offline'}</span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 ${
                        device.checks.printer.ServiceRunning ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Printer className="w-4 h-4" />
                        <span className="text-sm">{device.checks.printer.ServiceRunning ? 'Printer Working' : 'Printer Issues'}</span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 ${
                        device.checks.disk.PercentFree > 10 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        <HardDrive className="w-4 h-4" />
                        <span className="text-sm">{device.checks.disk.FreeGB.toFixed(1)} GB free</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <Link
                      to={`/service/${device.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      View Details
                    </Link>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Updated {new Date(device.agent.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <Activity className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">About ServicePulse</h3>
            <p className="text-gray-700 mb-3">
              ServicePulse provides real-time updates on the operational status of public services. 
              Our system monitors critical infrastructure including network connectivity, printing services, 
              and system resources to ensure you have accurate information before visiting.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Open - All services operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Limited - Some services affected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Closed - Critical issues</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="text-center">
        <p className="text-gray-600">
          For emergency service disruptions, please contact: 
          <a href="tel:0800123000" className="ml-2 font-bold text-blue-600 hover:text-blue-700">
            ☎ 0800 123 000
          </a>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Data is automatically updated every 5 minutes. Last full refresh: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PublicStatus;
