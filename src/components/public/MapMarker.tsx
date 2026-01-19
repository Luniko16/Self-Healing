import React from 'react';
import { MapPin, Wifi, Printer, HardDrive } from 'lucide-react';

interface MapMarkerProps {
  id: string;
  computerName: string;
  location: string;
  status: 'OPEN' | 'LIMITED' | 'CLOSED';
  networkStatus: boolean;
  printerStatus: boolean;
  diskStatus: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({
  id,
  computerName,
  location,
  status,
  networkStatus,
  printerStatus,
  diskStatus,
  isSelected = false,
  onClick
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-600 border-green-700';
      case 'LIMITED':
        return 'bg-yellow-600 border-yellow-700';
      case 'CLOSED':
        return 'bg-red-600 border-red-700';
      default:
        return 'bg-gray-600 border-gray-700';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'OPEN':
        return 'text-green-600';
      case 'LIMITED':
        return 'text-yellow-600';
      case 'CLOSED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all ${
        isSelected ? 'scale-110 z-50' : 'hover:scale-105'
      }`}
    >
      {/* Main Marker Circle */}
      <div
        className={`w-12 h-12 rounded-full border-3 flex items-center justify-center text-white font-bold text-sm shadow-lg ${getStatusColor()}`}
      >
        {computerName.charAt(0).toUpperCase()}
      </div>

      {/* Selection Ring */}
      {isSelected && (
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-blue-400 animate-pulse"></div>
      )}

      {/* Tooltip on Hover */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg whitespace-nowrap text-sm shadow-lg">
          <p className="font-bold">{computerName}</p>
          <p className="text-xs text-gray-300">{location}</p>
        </div>
      </div>

      {/* Popup Card - Shows when selected */}
      {isSelected && (
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-3 w-64 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            {/* Header */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h4 className="font-bold text-gray-900 text-sm">{computerName}</h4>
              <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mt-2 ${getStatusTextColor()} bg-opacity-10`}>
                {status}
              </span>
            </div>

            {/* Status Items */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${networkStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <Wifi className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-700">
                  Network: <span className="font-bold">{networkStatus ? 'Online' : 'Offline'}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${printerStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <Printer className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-700">
                  Printer: <span className="font-bold">{printerStatus ? 'Ready' : 'Offline'}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${diskStatus ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <HardDrive className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-700">
                  Storage: <span className="font-bold">{diskStatus ? 'OK' : 'Low'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapMarker;
