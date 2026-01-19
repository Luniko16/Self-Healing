import React from 'react';
import { Monitor, Wifi, Printer, HardDrive, Clock, Activity, MapPin, Tag } from 'lucide-react';
import { DeviceData } from '../types';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';

interface DeviceCardProps {
  device: DeviceData;
  onDelete?: (deviceId: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onDelete }) => {
  const lastUpdated = device.agent.lastUpdated instanceof Date 
    ? device.agent.lastUpdated 
    : device.agent.lastUpdated?.toDate?.() || new Date();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-100 text-green-800';
      case 'WARNING': 
      case 'DEGRADED': return 'bg-yellow-100 text-yellow-800';
      case 'CRITICAL': 
      case 'FAILED': 
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card hover:border-blue-200 border transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Monitor className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 truncate">{device.agent.computerName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-500">{device.location || 'Unknown Location'}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {device.type || 'demo'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={device.status.Status} />
            {device.source && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                device.source === 'agent' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {device.source === 'agent' ? 'Live Agent' : 'Public Service'}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">v{device.agent.version}</span>
        </div>
      </div>

      {/* Status Message */}
      <p className="text-gray-600 mb-6 text-sm line-clamp-2">{device.status.Message}</p>

      {/* Health Metrics */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Network</span>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(device.checks.network.Status)}`}>
            {device.checks.network.PingSuccess ? '✓ Online' : '✗ Offline'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Printer</span>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            device.checks.printer.ServiceRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {device.checks.printer.ServiceRunning ? '✓ Running' : '✗ Stopped'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Disk ({device.checks.disk.Drive})</span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-medium ${getStatusColor(device.checks.disk.Status)}`}>
              {device.checks.disk.Status}
            </span>
            <div className="text-xs text-gray-500">
              {device.checks.disk.FreeGB.toFixed(1)} GB free ({device.checks.disk.PercentFree.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {device.tags && device.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {device.tags.map((tag, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{format(lastUpdated, 'MMM d, h:mm a')}</span>
        </div>
        <div className="flex items-center gap-3">
          {device.actions && device.actions.repairsCount > 0 && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
              {device.actions.repairsCount} repair{device.actions.repairsCount !== 1 ? 's' : ''}
            </span>
          )}
          <Activity className={`w-4 h-4 ${
            device.status.Status === 'OPEN' ? 'text-green-500 animate-pulse' :
            device.status.Status === 'LIMITED' ? 'text-yellow-500 animate-pulse-slow' :
            'text-red-500 animate-pulse'
          }`} />
          {onDelete && (
            <button
              onClick={() => onDelete(device.id)}
              className="text-xs text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete device"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;