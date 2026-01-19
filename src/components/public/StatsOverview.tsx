import React from 'react';
import { MapPin, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface StatsOverviewProps {
  totalLocations: number;
  fullyOperational: number;
  limitedServices: number;
  closed: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalLocations,
  fullyOperational,
  limitedServices,
  closed
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Locations</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalLocations}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4">Service locations monitored</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Fully Operational</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{fullyOperational}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          {totalLocations > 0 ? Math.round((fullyOperational / totalLocations) * 100) : 0}% of locations
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Limited Services</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{limitedServices}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4">Partial service availability</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Closed/Critical</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{closed}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4">Requires attention</p>
      </div>
    </div>
  );
};

export default StatsOverview;
