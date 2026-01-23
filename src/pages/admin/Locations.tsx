import React, { useState, useEffect } from 'react';
import { Building, MapPin, Users, Activity, Loader, Plus, Edit2, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  agentCount: number;
  status: 'online' | 'offline';
  lastUpdate: string;
}

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      // Fetch from API or use mock data
      const mockLocations: Location[] = [
        {
          id: '1',
          name: 'Main Office',
          city: 'Johannesburg',
          country: 'South Africa',
          agentCount: 42,
          status: 'online',
          lastUpdate: '2 minutes ago'
        },
        {
          id: '2',
          name: 'Cape Town Branch',
          city: 'Cape Town',
          country: 'South Africa',
          agentCount: 28,
          status: 'online',
          lastUpdate: '1 minute ago'
        },
        {
          id: '3',
          name: 'Durban Office',
          city: 'Durban',
          country: 'South Africa',
          agentCount: 15,
          status: 'online',
          lastUpdate: '5 minutes ago'
        },
        {
          id: '4',
          name: 'Remote Team',
          city: 'Distributed',
          country: 'South Africa',
          agentCount: 12,
          status: 'online',
          lastUpdate: 'Just now'
        }
      ];
      setLocations(mockLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
            <p className="text-gray-600 mt-1">{locations.length} location(s)</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
            Add Location
          </button>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      {location.city}, {location.country}
                    </div>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${location.status === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Agents</span>
                  </div>
                  <span className="font-semibold text-gray-900">{location.agentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Last Update</span>
                  </div>
                  <span className="text-sm text-gray-500">{location.lastUpdate}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Locations;
