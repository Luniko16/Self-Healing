import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Calendar, 
  Navigation, 
  Share2,
  Printer,
  Wifi,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedServices, setRelatedServices] = useState<DeviceData[]>([]);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices((devices: DeviceData[]) => {
      const foundDevice = devices.find((d: DeviceData) => d.id === id);
      setDevice(foundDevice || null);
      
      // Get related services (same type or location)
      if (foundDevice) {
        const related = devices
          .filter((d: DeviceData) => d.id !== id && (d.type === foundDevice.type || d.location === foundDevice.location))
          .slice(0, 3);
        setRelatedServices(related);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Service Not Found</h2>
        <p className="text-gray-600 mt-2">The requested service could not be found.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Services
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 border-green-200';
      case 'LIMITED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CLOSED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'LIMITED': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'CLOSED': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to All Services
        </Link>
      </div>

      {/* Service Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{device.agent.computerName}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(device.status.Status)}`}>
                    {getStatusIcon(device.status.Status)}
                    {device.status.Status}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Updated {new Date(device.agent.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Navigation className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{device.location || 'Location not specified'}</span>
              </div>
              <div className="mt-2 text-gray-600">
                {device.type ? device.type.charAt(0).toUpperCase() + device.type.slice(1) : 'Service'}
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-gray-700">{device.status.Message}</p>
            </div>
          </div>
          
          <div className="lg:w-80 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Quick Info</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Service Type</span>
                  <span className="font-medium">{device.type || 'General'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Agent Version</span>
                  <span className="font-medium">v{device.agent.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Full Check</span>
                  <span className="font-medium">
                    {new Date(device.agent.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Get Directions
            </button>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">System Health Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Network Status */}
          <div className={`p-6 rounded-lg border ${
            device.checks.network.PingSuccess 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                device.checks.network.PingSuccess 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Network</h3>
                <p className="text-sm text-gray-600">Internet connectivity</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Ping Test</span>
                <span className={`font-medium ${
                  device.checks.network.PingSuccess ? 'text-green-600' : 'text-red-600'
                }`}>
                  {device.checks.network.PingSuccess ? '✓ Successful' : '✗ Failed'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">DNS Resolution</span>
                <span className={`font-medium ${
                  device.checks.network.DNSSuccess ? 'text-green-600' : 'text-red-600'
                }`}>
                  {device.checks.network.DNSSuccess ? '✓ Working' : '✗ Issues'}
                </span>
              </div>
            </div>
          </div>

          {/* Printer Status */}
          <div className={`p-6 rounded-lg border ${
            device.checks.printer.ServiceRunning 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                device.checks.printer.ServiceRunning 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Printer Service</h3>
                <p className="text-sm text-gray-600">Print spooler status</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Service Status</span>
                <span className={`font-medium ${
                  device.checks.printer.ServiceRunning ? 'text-green-600' : 'text-red-600'
                }`}>
                  {device.checks.printer.ServiceRunning ? '✓ Running' : '✗ Stopped'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Check</span>
                <span className="font-medium">
                  {new Date(device.agent.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Disk Status */}
          <div className={`p-6 rounded-lg border ${
            device.checks.disk.PercentFree > 10 
              ? 'bg-green-50 border-green-200' 
              : device.checks.disk.PercentFree > 5 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                device.checks.disk.PercentFree > 10 
                  ? 'bg-green-100 text-green-600' 
                  : device.checks.disk.PercentFree > 5 
                  ? 'bg-yellow-100 text-yellow-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Storage</h3>
                <p className="text-sm text-gray-600">Disk space availability</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Free Space</span>
                <span className="font-bold text-gray-900">
                  {device.checks.disk.FreeGB.toFixed(1)} GB
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    device.checks.disk.PercentFree > 10 
                      ? 'bg-green-500' 
                      : device.checks.disk.PercentFree > 5 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${device.checks.disk.PercentFree}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 text-center">
                {device.checks.disk.PercentFree.toFixed(1)}% available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Hours */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Contact & Hours</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Contact Number</p>
                <p className="text-gray-600">+27 11 123 4567</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Operating Hours</p>
                <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                <p className="text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
                <p className="text-gray-600">Sunday: Closed</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Holiday Schedule</p>
                <p className="text-gray-600">Closed on public holidays</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {device.actions && device.actions.repairsCount && device.actions.repairsCount > 0 ? (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Auto-repairs performed</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {device.actions && device.actions.repairsCount} automatic repair{device.actions && device.actions.repairsCount !== 1 ? 's' : ''} completed
                </p>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">No recent repairs needed</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  System has been stable and operational
                </p>
              </div>
            )}
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Status Check</span>
                <span className="font-medium">
                  {new Date(device.agent.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Agent Version</span>
                <span className="font-medium">v{device.agent.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Related Services</h3>
            <Link
              to="/search"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedServices.map(service => (
              <Link
                key={service.id}
                to={`/service/${service.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    service.status.Status === 'OPEN' ? 'bg-green-100 text-green-600' :
                    service.status.Status === 'LIMITED' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {getStatusIcon(service.status.Status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{service.agent.computerName}</h4>
                    <p className="text-sm text-gray-600 truncate">{service.location}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Important Notice</h4>
            <p className="text-gray-700">
              Service status is updated every 5 minutes. For the most current information, 
              please contact the service location directly if you have urgent needs.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Last updated: {new Date(device.agent.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;