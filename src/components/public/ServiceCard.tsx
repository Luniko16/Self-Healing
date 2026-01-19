import React from 'react';
import { MapPin, Wifi, Printer, HardDrive, ChevronRight } from 'lucide-react';

interface ServiceCardProps {
  id: string;
  computerName: string;
  location: string;
  status: 'OPEN' | 'LIMITED' | 'CLOSED';
  networkStatus: boolean;
  printerStatus: boolean;
  diskStatus: boolean;
  lastUpdated: Date;
  onClick?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  computerName,
  location,
  status,
  networkStatus,
  printerStatus,
  diskStatus,
  lastUpdated,
  onClick
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-50 border-green-200';
      case 'LIMITED':
        return 'bg-yellow-50 border-yellow-200';
      case 'CLOSED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadgeColor = () => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'LIMITED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{computerName}</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor()}`}>
          {status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${networkStatus ? 'bg-green-100' : 'bg-red-100'}`}>
            <Wifi className={`w-4 h-4 ${networkStatus ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Network</p>
            <p className="text-xs text-gray-600">
              {networkStatus ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <span className={`w-2 h-2 rounded-full ${networkStatus ? 'bg-green-600' : 'bg-red-600'}`}></span>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${printerStatus ? 'bg-green-100' : 'bg-red-100'}`}>
            <Printer className={`w-4 h-4 ${printerStatus ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Printer</p>
            <p className="text-xs text-gray-600">
              {printerStatus ? 'Operational' : 'Offline'}
            </p>
          </div>
          <span className={`w-2 h-2 rounded-full ${printerStatus ? 'bg-green-600' : 'bg-red-600'}`}></span>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${diskStatus ? 'bg-green-100' : 'bg-red-100'}`}>
            <HardDrive className={`w-4 h-4 ${diskStatus ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Disk Space</p>
            <p className="text-xs text-gray-600">
              {diskStatus ? 'Sufficient' : 'Low'}
            </p>
          </div>
          <span className={`w-2 h-2 rounded-full ${diskStatus ? 'bg-green-600' : 'bg-red-600'}`}></span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
        <span className="text-xs text-gray-600">
          Updated: {formatTime(lastUpdated)}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </div>
    </div>
  );
};

export default ServiceCard;
