import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, X } from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';
import ServiceCard from '../../components/public/ServiceCard';
import StatusBadge from '../../components/public/StatusBadge';

const LocationSearch: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices(setDevices);
    return () => unsubscribe();
  }, []);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.agent.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || device.status.Status === filters.status;
    const matchesType = filters.type === 'all' || device.type === filters.type;
    const matchesLocation = !filters.location || device.location?.toLowerCase().includes(filters.location.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation;
  });

  const clearFilters = () => {
    setFilters({ status: 'all', type: 'all', location: '' });
    setSearchTerm('');
  };

  const stats = firebaseService.getHealthStats(filteredDevices);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Services</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Search for specific clinics, schools, government offices, and other services
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, location, or service type..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Filter Services</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="OPEN">Open & Operational</option>
                  <option value="LIMITED">Limited Services</option>
                  <option value="CLOSED">Closed / Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="all">All Types</option>
                  <option value="clinic">Clinics</option>
                  <option value="school">Schools</option>
                  <option value="office">Government Offices</option>
                  <option value="ngo">NGO Services</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Area
                </label>
                <input
                  type="text"
                  placeholder="Enter area or city..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-6">
          <div>
            <span className="font-medium text-gray-900">{filteredDevices.length}</span>
            <span className="text-gray-600"> services found</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              Showing services in your area
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <div className="text-2xl font-bold text-gray-900">{filteredDevices.length}</div>
          <div className="text-sm text-gray-600">Total Found</div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">
            {filteredDevices.filter(d => d.status.Status === 'OPEN').length}
          </div>
          <div className="text-sm text-gray-600">Open Now</div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredDevices.filter(d => d.status.Status === 'LIMITED').length}
          </div>
          <div className="text-sm text-gray-600">Limited</div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
          <div className="text-2xl font-bold text-red-600">
            {filteredDevices.filter(d => d.status.Status === 'CLOSED').length}
          </div>
          <div className="text-sm text-gray-600">Closed</div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Available Services</h2>
          <p className="text-gray-600">Real-time status of service locations</p>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900 mt-4">No services found</h3>
            <p className="text-gray-600 mt-2">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredDevices.map(device => (
              <ServiceCard 
                key={device.id}
                id={device.id}
                computerName={device.agent.computerName}
                location={device.location || 'Unknown Location'}
                status={device.status.Status as 'OPEN' | 'LIMITED' | 'CLOSED'}
                networkStatus={device.checks.network.PingSuccess}
                printerStatus={device.checks.printer.ServiceRunning}
                diskStatus={device.checks.disk.PercentFree > 10}
                lastUpdated={new Date(device.agent.lastUpdated)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Search Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Search Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Use Specific Terms</div>
            <div className="text-sm text-gray-600">
              Try "clinic", "school", or specific area names
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Filter by Status</div>
            <div className="text-sm text-gray-600">
              Show only open services or check limited availability
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Check Operating Hours</div>
            <div className="text-sm text-gray-600">
              Some services may have specific operating hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSearch;