import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import HealthChart from '../../components/HealthChart';

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevice = async () => {
      if (!id) {
        setError('Service ID is required');
        setLoading(false);
        return;
      }

      try {
        const data = await firebaseService.getDeviceById(id);
        if (data) {
          setDevice(data);
        } else {
          setError('Service not found');
        }
      } catch (err) {
        console.error('Error fetching device:', err);
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Go Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error || 'Service not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Go Back
      </button>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{device.agent.computerName}</h1>
            <p className="text-gray-600 mt-2">{device.location || 'No location'}</p>
          </div>
          <StatusBadge status={device.status.Status} />
        </div>

        {device.type && (
          <p className="text-gray-700 mb-6">Type: {device.type}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
            <p className="text-gray-700">{device.status.Message}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Last Update</h3>
            <div className="flex items-center text-gray-700">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                {device.agent?.lastUpdated
                  ? new Date(device.agent.lastUpdated).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {device.status.Status === 'CLOSED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Critical Issues</h4>
                <p className="text-red-800">{device.status.Message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Health Status</h3>
          <HealthChart devices={[device]} />
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
