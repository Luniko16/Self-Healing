import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Filter, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Navigation,
  Layers,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';

const MapView: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(100);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices(setDevices);
    return () => unsubscribe();
  }, []);

  const filteredDevices = devices.filter(device => {
    const matchesStatus = filterStatus === 'all' || device.status.Status === filterStatus;
    const matchesSearch = 
      device.agent.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-500 border-green-600';
      case 'LIMITED': return 'bg-yellow-500 border-yellow-600';
      case 'CLOSED': return 'bg-red-500 border-red-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <CheckCircle className="w-4 h-4 text-white" />;
      case 'LIMITED': return <AlertTriangle className="w-4 h-4 text-white" />;
      case 'CLOSED': return <XCircle className="w-4 h-4 text-white" />;
      default: return <MapPin className="w-4 h-4 text-white" />;
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 50));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Map</h1>
          <p className="text-gray-600">Interactive map showing real-time service availability</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Open</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Limited</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="OPEN">Open Only</option>
                    <option value="LIMITED">Limited Only</option>
                    <option value="CLOSED">Critical Only</option>
                  </select>
                </div>

                {/* Map Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Navigation className="w-5 h-5" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Layers className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredDevices.length}</div>
            <div className="text-sm text-gray-600">Locations Found</div>
            <div className="mt-2 text-xs text-gray-500">
              {devices.filter(d => d.status.Status === 'OPEN').length} open • 
              {devices.filter(d => d.status.Status === 'LIMITED').length} limited • 
              {devices.filter(d => d.status.Status === 'CLOSED').length} critical
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: '600px' }}>
            <div 
              ref={mapRef}
              className="relative w-full h-full bg-gradient-to-br from-blue-50 to-gray-100"
            >
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-10">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 10}%` }}></div>
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute w-px h-full bg-gray-400" style={{ left: `${i * 10}%` }}></div>
                ))}
              </div>

              {/* Device Markers */}
              {filteredDevices.map((device, index) => {
                const left = 10 + (index % 8) * 12.5;
                const top = 10 + Math.floor(index / 8) * 15;
                
                return (
                  <button
                    key={device.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${getStatusColor(device.status.Status)} border-2 rounded-full p-2 hover:scale-110 transition-transform duration-200 ${
                      selectedDevice?.id === device.id ? 'ring-4 ring-blue-300 ring-opacity-50' : ''
                    }`}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${zoom / 10}px`,
                      height: `${zoom / 10}px`
                    }}
                    onClick={() => setSelectedDevice(device)}
                    title={`${device.agent.computerName}: ${device.status.Status}`}
                  >
                    {/* Pulsing effect */}
                    <div className={`absolute inset-0 ${getStatusColor(device.status.Status).split(' ')[0]} rounded-full animate-ping opacity-20`}></div>
                    
                    {/* Marker content */}
                    <div className="relative flex items-center justify-center w-full h-full">
                      {getStatusIcon(device.status.Status)}
                    </div>
                    
                    {/* Label */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap">
                      <div className="px-2 py-1 bg-white rounded-lg shadow-sm border text-xs font-medium">
                        {device.agent.computerName.split('-')[0]}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-medium text-gray-900 mb-2">Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Open & Operational</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Limited Services</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Closed / Critical</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Selected Device Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Location Details</h3>
            
            {selectedDevice ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedDevice.agent.computerName}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedDevice.location || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedDevice.status.Status === 'OPEN' ? 'bg-green-100 text-green-800' :
                    selectedDevice.status.Status === 'LIMITED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedDevice.status.Status}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedDevice.status.Message}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Network Status</span>
                    <span className={`font-medium ${
                      selectedDevice.checks.network.PingSuccess ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedDevice.checks.network.PingSuccess ? '✓ Online' : '✗ Offline'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Printer Service</span>
                    <span className={`font-medium ${
                      selectedDevice.checks.printer.ServiceRunning ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedDevice.checks.printer.ServiceRunning ? '✓ Running' : '✗ Stopped'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Disk Space</span>
                    <span className={`font-medium ${
                      selectedDevice.checks.disk.PercentFree > 10 ? 'text-green-600' : 
                      selectedDevice.checks.disk.PercentFree > 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedDevice.checks.disk.FreeGB.toFixed(1)} GB ({selectedDevice.checks.disk.PercentFree.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Info className="w-4 h-4" />
                      <span>Last updated: {new Date(selectedDevice.agent.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link
                    to={`/admin/locations?device=${selectedDevice.id}`}
                    className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Details
                  </Link>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Directions
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="mt-4 text-gray-600">Click on a location marker to view details</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Locations</span>
                <span className="font-bold">{devices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Currently Online</span>
                <span className="font-bold text-green-600">
                  {devices.filter(d => d.checks.network.PingSuccess).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Printers Running</span>
                <span className="font-bold text-purple-600">
                  {devices.filter(d => d.checks.printer.ServiceRunning).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Healthy Storage</span>
                <span className="font-bold text-green-600">
                  {devices.filter(d => d.checks.disk.PercentFree > 10).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Map Coverage</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.length > 0 ? '100%' : '0%'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">All monitored locations shown</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Service Availability</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.length > 0 ? Math.round((devices.filter(d => d.status.Status === 'OPEN').length / devices.length) * 100) : 0}%
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Locations fully operational</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Issues Detected</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => d.status.Status !== 'OPEN').length}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Requiring attention</p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
