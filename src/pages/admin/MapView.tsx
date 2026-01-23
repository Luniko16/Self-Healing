import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, CheckCircle, RefreshCw, Wifi, Server, HardDrive } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: 'online' | 'offline' | 'warning';
  agentCount: number;
  alerts: number;
  lastSeen: string;
  services: {
    network: boolean;
    printer: boolean;
    disk: boolean;
  };
}

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (status: string) => {
  const color = status === 'online' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#6b7280';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const MapView: React.FC = () => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMapData();
    
    // Set up real-time data polling
    const interval = setInterval(fetchRealTimeData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRealTimeData = async () => {
    try {
      // Fetch updated workstation locations with real-time data
      const response = await fetch('/api/workstations/locations');
      if (response.ok) {
        const data = await response.json();
        
        // Update markers with fresh real-time data
        const updatedMarkers: MapMarker[] = data.locations.map((location: any) => ({
          id: location.id,
          name: location.name,
          lat: location.lat,
          lon: location.lon,
          status: location.status,
          agentCount: location.agentCount,
          alerts: location.alerts,
          lastSeen: location.lastSeen,
          services: location.services
        }));
        
        setMarkers(updatedMarkers);
      } else {
        // Fallback to legacy live-scan endpoint
        const legacyResponse = await fetch('/api/system/live-scan');
        if (legacyResponse.ok) {
          const legacyData = await legacyResponse.json();
          updateMarkersWithRealTimeData(legacyData.devices || []);
        }
      }
    } catch (error) {
      console.error('Error fetching real-time workstation data:', error);
      
      // Try legacy endpoint as fallback
      try {
        const legacyResponse = await fetch('/api/system/live-scan');
        if (legacyResponse.ok) {
          const legacyData = await legacyResponse.json();
          updateMarkersWithRealTimeData(legacyData.devices || []);
        }
      } catch (legacyError) {
        console.error('Legacy endpoint also failed:', legacyError);
      }
    }
  };

  const updateMarkersWithRealTimeData = (devices: any[]) => {
    setMarkers(prevMarkers => 
      prevMarkers.map(marker => {
        // Find corresponding device data
        const deviceData = devices.find(d => 
          d.agent?.computerName?.toLowerCase().includes(marker.name.toLowerCase())
        );
        
        if (deviceData) {
          const networkStatus = deviceData.checks?.network?.Status === 'HEALTHY';
          const printerStatus = deviceData.checks?.printer?.ServiceRunning;
          const diskStatus = deviceData.checks?.disk?.Status === 'HEALTHY';
          
          const hasIssues = !networkStatus || !printerStatus || !diskStatus;
          
          return {
            ...marker,
            status: hasIssues ? 'warning' : 'online',
            lastSeen: deviceData.agent?.timestamp || new Date().toISOString(),
            services: {
              network: networkStatus,
              printer: printerStatus,
              disk: diskStatus
            },
            alerts: hasIssues ? 1 : 0
          };
        }
        
        return marker;
      })
    );
  };

  const fetchMapData = async () => {
    try {
      setLoading(true);
      
      // Fetch real workstation locations from backend
      const response = await fetch('/api/workstations/locations');
      if (response.ok) {
        const data = await response.json();
        
        // Convert backend location data to map markers
        const realMarkers: MapMarker[] = data.locations.map((location: any) => ({
          id: location.id,
          name: location.name,
          lat: location.lat,
          lon: location.lon,
          status: location.status,
          agentCount: location.agentCount,
          alerts: location.alerts,
          lastSeen: location.lastSeen,
          services: location.services
        }));
        
        setMarkers(realMarkers);
        toast.success(`Loaded ${realMarkers.length} real workstation locations`);
      } else {
        throw new Error('Failed to fetch workstation locations');
      }
      
    } catch (error) {
      console.error('Error fetching real workstation data:', error);
      toast.error('Could not load real workstation locations, using fallback data');
      
      // Fallback to browser geolocation or default locations
      try {
        let userLocation = null;
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
        }
        
        // Create fallback markers
        const fallbackMarkers: MapMarker[] = userLocation ? [
          {
            id: '1',
            name: 'Current Browser Location',
            lat: userLocation.lat,
            lon: userLocation.lon,
            status: 'online',
            agentCount: 1,
            alerts: 0,
            lastSeen: new Date().toISOString(),
            services: { network: true, printer: true, disk: true }
          },
          {
            id: '2',
            name: 'Local Network Hub',
            lat: userLocation.lat + 0.01,
            lon: userLocation.lon + 0.01,
            status: 'online',
            agentCount: 5,
            alerts: 0,
            lastSeen: new Date().toISOString(),
            services: { network: true, printer: false, disk: true }
          }
        ] : [
          {
            id: '1',
            name: 'Main Office - Johannesburg',
            lat: -26.2023,
            lon: 28.0436,
            status: 'online',
            agentCount: 42,
            alerts: 2,
            lastSeen: new Date().toISOString(),
            services: { network: true, printer: true, disk: false }
          },
          {
            id: '2',
            name: 'Cape Town Branch',
            lat: -33.9249,
            lon: 18.4241,
            status: 'online',
            agentCount: 28,
            alerts: 0,
            lastSeen: new Date().toISOString(),
            services: { network: true, printer: true, disk: true }
          },
          {
            id: '3',
            name: 'Durban Office',
            lat: -29.8587,
            lon: 31.0218,
            status: 'warning',
            agentCount: 15,
            alerts: 3,
            lastSeen: new Date().toISOString(),
            services: { network: false, printer: true, disk: true }
          }
        ];
        
        setMarkers(fallbackMarkers);
        
      } catch (geoError) {
        console.error('Geolocation also failed:', geoError);
        // Use default South African locations as final fallback
        setMarkers([
          {
            id: '1',
            name: 'Default Location - Johannesburg',
            lat: -26.2023,
            lon: 28.0436,
            status: 'online',
            agentCount: 1,
            alerts: 0,
            lastSeen: new Date().toISOString(),
            services: { network: true, printer: true, disk: true }
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRealTimeData();
    setRefreshing(false);
    toast.success('Map data refreshed');
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'offline':
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <MapPin className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner 
          size="lg" 
          message="Detecting workstation locations..." 
          className="text-center"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <Toaster position="top-right" />

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Workstation Locations</h1>
                <p className="text-gray-600 mt-1">Real-time locations of installed workstations and agents</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Locations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b font-semibold text-gray-900 flex items-center justify-between">
                <span>Workstations ({markers.length})</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {markers.map((marker) => (
                  <button
                    key={marker.id}
                    onClick={() => setSelectedMarker(marker)}
                    className={`w-full p-4 text-left hover:bg-blue-50 transition ${
                      selectedMarker?.id === marker.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getMarkerColor(marker.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{marker.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{marker.agentCount} agents</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Wifi className={`w-3 h-3 ${marker.services.network ? 'text-green-500' : 'text-red-500'}`} />
                          <Server className={`w-3 h-3 ${marker.services.printer ? 'text-green-500' : 'text-red-500'}`} />
                          <HardDrive className={`w-3 h-3 ${marker.services.disk ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                        {marker.alerts > 0 && (
                          <p className="text-xs text-red-600 mt-1 font-medium">{marker.alerts} alert(s)</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Last seen: {new Date(marker.lastSeen).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real Leaflet Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-96 relative">
              <MapContainer
                center={markers.length > 0 ? [markers[0].lat, markers[0].lon] : [-26.2023, 28.0436]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                className="z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {markers.map((marker) => (
                  <Marker
                    key={marker.id}
                    position={[marker.lat, marker.lon]}
                    icon={createCustomIcon(marker.status)}
                    eventHandlers={{
                      click: () => setSelectedMarker(marker)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-48">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(marker.status)}
                          <h3 className="font-semibold text-gray-900">{marker.name}</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><strong>Agents:</strong> {marker.agentCount}</p>
                          <p><strong>Status:</strong> <span className={`capitalize ${
                            marker.status === 'online' ? 'text-green-600' :
                            marker.status === 'warning' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>{marker.status}</span></p>
                          <p><strong>Alerts:</strong> {marker.alerts}</p>
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-600 mb-1">Services:</p>
                            <div className="flex gap-2">
                              <div className={`flex items-center gap-1 text-xs ${marker.services.network ? 'text-green-600' : 'text-red-600'}`}>
                                <Wifi className="w-3 h-3" />
                                Network
                              </div>
                              <div className={`flex items-center gap-1 text-xs ${marker.services.printer ? 'text-green-600' : 'text-red-600'}`}>
                                <Server className="w-3 h-3" />
                                Printer
                              </div>
                              <div className={`flex items-center gap-1 text-xs ${marker.services.disk ? 'text-green-600' : 'text-red-600'}`}>
                                <HardDrive className="w-3 h-3" />
                                Disk
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 pt-1">
                            Last update: {new Date(marker.lastSeen).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              
              {/* Live indicator */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Live Data</span>
                </div>
              </div>
            </div>

            {/* Selected Marker Details */}
            {selectedMarker && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(selectedMarker.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedMarker.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Coordinates: {selectedMarker.lat.toFixed(4)}°, {selectedMarker.lon.toFixed(4)}°
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedMarker.status === 'online' ? 'bg-green-100 text-green-800' :
                    selectedMarker.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedMarker.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Agents</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{selectedMarker.agentCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Alerts</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{selectedMarker.alerts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Seen</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(selectedMarker.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Services Status */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Service Status</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Wifi className={`w-4 h-4 ${selectedMarker.services.network ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm text-gray-700">Network</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedMarker.services.network ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedMarker.services.network ? 'OK' : 'Issue'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className={`w-4 h-4 ${selectedMarker.services.printer ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm text-gray-700">Printer</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedMarker.services.printer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedMarker.services.printer ? 'OK' : 'Issue'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className={`w-4 h-4 ${selectedMarker.services.disk ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm text-gray-700">Disk</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedMarker.services.disk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedMarker.services.disk ? 'OK' : 'Issue'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;