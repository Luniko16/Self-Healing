import React from 'react';
import { MapPin, Clock, Wifi, Printer, HardDrive } from 'lucide-react';

interface Device {
  id: string;
  computerName: string;
  location: string;
  lastUpdated: Date;
  networkStatus: boolean;
  printerStatus: boolean;
  diskStatus: boolean;
}

interface RecentDevicesProps {
  devices: Device[];
  maxItems?: number;
  onDeviceClick?: (device: Device) => void;
}

const RecentDevices: React.FC<RecentDevicesProps> = ({
  devices,
  maxItems = 5,
  onDeviceClick
}) => {
  const recentDevices = devices.slice(0, maxItems);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getHealthScore = (device: Device) => {
    const healthy = [device.networkStatus, device.printerStatus, device.diskStatus].filter(
      (s) => s
    ).length;
    return (healthy / 3) * 100;
  };

  const getHealthColor = (score: number) => {
    if (score === 100) return 'text-green-600';
    if (score >= 66) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Updates</h3>

      <div className="space-y-4">
        {recentDevices.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">No devices found</p>
        ) : (
          recentDevices.map((device) => (
            <div
              key={device.id}
              onClick={() => onDeviceClick?.(device)}
              className={`p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all ${
                onDeviceClick ? 'cursor-pointer hover:bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{device.computerName}</h4>
                  <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{device.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold ${getHealthColor(getHealthScore(device))}`}
                  >
                    {Math.round(getHealthScore(device))}%
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(device.lastUpdated)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div
                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                    device.networkStatus
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <Wifi className="w-3 h-3" />
                  <span>Network</span>
                </div>
                <div
                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                    device.printerStatus
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <Printer className="w-3 h-3" />
                  <span>Printer</span>
                </div>
                <div
                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                    device.diskStatus
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
  );
};

export default RecentDevices;
