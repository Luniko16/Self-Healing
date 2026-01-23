import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';
import StatusBadge from '../../components/StatusBadge';

const LocationSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<DeviceData[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const allDevices = await firebaseService.getPublicDevices();
      const filtered = allDevices.filter(device =>
        device.agent.computerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setResults(filtered);
      setSearched(true);
    } catch (error) {
      console.error('Error searching devices:', error);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Locations</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location name or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searched && (
        <div>
          {results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Found {results.length} result(s)</p>
              {results.map(device => (
                <div key={device.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{device.agent.computerName}</h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{device.location || 'No location specified'}</span>
                      </div>
                    </div>
                    <StatusBadge status={device.status.Status} />
                  </div>
                  {device.agent?.version && (
                    <p className="text-gray-600">Version: {device.agent.version}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
