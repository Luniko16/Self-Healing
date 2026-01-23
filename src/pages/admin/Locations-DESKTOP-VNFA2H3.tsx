import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  MapPin,
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';

const Locations: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<DeviceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<'computerName' | 'status' | 'location' | 'lastUpdated'>('computerName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices(setDevices);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = devices.filter(device => {
      const matchesSearch = 
        device.agent.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || device.status.Status === statusFilter;
      const matchesType = typeFilter === 'all' || device.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'computerName':
          aValue = a.agent.computerName;
          bValue = b.agent.computerName;
          break;
        case 'status':
          aValue = a.status.Status;
          bValue = b.status.Status;
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
          break;
        case 'lastUpdated':
          aValue = new Date(a.agent.lastUpdated).getTime();
          bValue = new Date(b.agent.lastUpdated).getTime();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDevices(result);
  }, [devices, searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map(d => d.id));
    }
  };

  const handleSelectDevice = (deviceId: string) => {
    if (selectedDevices.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    } else {
      setSelectedDevices([...selectedDevices, deviceId]);
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedDevices.length} location(s)?`)) {
      for (const deviceId of selectedDevices) {
        await firebaseService.deleteDevice(deviceId);
      }
      setSelectedDevices([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      OPEN: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      LIMITED: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-4 h-4" /> },
      CLOSED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
      UNKNOWN: { color: 'bg-gray-100 text-gray-800', icon: <Activity className="w-4 h-4" /> }
    };

    const { color, icon } = config[status as keyof typeof config] || config.UNKNOWN;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        {icon}
        <span>{status}</span>
      </div>
    );
  };

  const getHealthIndicator = (device: DeviceData) => {
    const issues = [
      !device.checks.network.PingSuccess,
      !device.checks.printer.ServiceRunning,
      device.checks.disk.PercentFree < 5
    ].filter(Boolean).length;

    if (issues === 0) return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
    if (issues === 1) return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
    return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Locations</h1>
          <p className="text-gray-600">Manage and monitor all service locations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/map"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
          >
            <MapPin className="w-5 h-5" />
            <span>View on Map</span>
          </Link>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search locations, types, or locations..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="OPEN">Open Only</option>
                <option value="LIMITED">Limited Only</option>
                <option value="CLOSED">Critical Only</option>
              </select>
            </div>
            
            <select
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="clinic">Clinics</option>
              <option value="school">Schools</option>
              <option value="office">Offices</option>
              <option value="server">Servers</option>
              <option value="demo">Demo</option>
            </select>
            
            <button className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedDevices.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedDevices.length} location{selectedDevices.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedDevices.length} of {filteredDevices.length} locations
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                  Bulk Edit
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('computerName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Location Name</span>
                    {sortField === 'computerName' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Location</span>
                    {sortField === 'location' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastUpdated')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Updated</span>
                    {sortField === 'lastUpdated' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <Search className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">No locations found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.id)}
                        onChange={() => handleSelectDevice(device.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                          <Server className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{device.agent.computerName}</div>
                          <div className="text-sm text-gray-500">v{device.agent.version}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(device.status.Status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getHealthIndicator(device)}
                        <div className="text-sm text-gray-900">
                          {device.checks.network.PingSuccess ? '✓' : '✗'} Net • 
                          {device.checks.printer.ServiceRunning ? '✓' : '✗'} Print • 
                          {device.checks.disk.PercentFree > 5 ? '✓' : '✗'} Disk
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-900">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {device.location || 'Not specified'}
                      </div>
                      <div className="text-sm text-gray-500">{device.type || 'Unknown type'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(device.agent.lastUpdated).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(device.agent.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/service/${device.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => firebaseService.deleteDevice(device.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{filteredDevices.length}</span> of{' '}
                <span className="font-medium">{devices.length}</span> locations
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  3
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{devices.length}</div>
            <div className="text-sm text-gray-600">Total Locations</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {devices.filter(d => d.status.Status === 'OPEN').length}
            </div>
            <div className="text-sm text-gray-600">Operational</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {devices.filter(d => d.status.Status === 'LIMITED').length}
            </div>
            <div className="text-sm text-gray-600">Limited</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {devices.filter(d => d.status.Status === 'CLOSED').length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;
