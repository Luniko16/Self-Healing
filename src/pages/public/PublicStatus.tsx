import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';
import StatusBadge from '../../components/StatusBadge';

const PublicStatus: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await firebaseService.getPublicDevices();
        setDevices(data);
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthyCount = devices.filter((d: DeviceData) => d.status.Status === 'OPEN').length;
  const warningCount = devices.filter((d: DeviceData) => d.status.Status === 'LIMITED').length;
  const criticalCount = devices.filter((d: DeviceData) => d.status.Status === 'CLOSED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">System Status</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-10 w-10 text-green-500 mr-4" />
            <div>
              <p className="text-green-700 text-sm font-medium">Healthy</p>
              <p className="text-3xl font-bold text-green-900">{healthyCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mr-4" />
            <div>
              <p className="text-yellow-700 text-sm font-medium">Warning</p>
              <p className="text-3xl font-bold text-yellow-900">{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="h-10 w-10 text-red-500 mr-4" />
            <div>
              <p className="text-red-700 text-sm font-medium">Critical</p>
              <p className="text-3xl font-bold text-red-900">{criticalCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Services Overview</h2>
        <div className="space-y-4">
          {devices.map(device => (
            <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded">
              <div>
                <h3 className="font-semibold text-gray-900">{device.agent.computerName}</h3>
                <p className="text-sm text-gray-600">{device.location || 'No location'}</p>
              </div>
              <StatusBadge status={device.status.Status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicStatus;
