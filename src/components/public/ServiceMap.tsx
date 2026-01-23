import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { DeviceData } from '../../types';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface ServiceMapProps {
  devices: DeviceData[];
  onMarkerClick?: (device: DeviceData) => void;
  height?: string;
}

// Component to fit map bounds to markers
const FitBounds: React.FC<{ devices: DeviceData[] }> = ({ devices }) => {
  const map = useMap();
  
  useEffect(() => {
    if (devices.length > 0) {
      const coordinates = devices.map(device => getCoordinatesForLocation(device.location || ''));
      const bounds = new LatLngBounds(coordinates);
      
      if (coordinates.length === 1) {
        // If only one marker, center on it with a reasonable zoom
        map.setView(coordinates[0], 12);
      } else if (coordinates.length > 1) {
        // If multiple markers, fit bounds with padding
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [devices, map]);
  
  return null;
};

// Get coordinates for South African locations
const getCoordinatesForLocation = (location: string): [number, number] => {
  const locationMap: { [key: string]: [number, number] } = {
    // Major South African cities and areas
    'johannesburg central': [-26.2041, 28.0473],
    'johannesburg': [-26.2041, 28.0473],
    'sandton': [-26.1076, 28.0567],
    'soweto': [-26.2678, 27.8546],
    'pretoria': [-25.7479, 28.2293],
    'cape town': [-33.9249, 18.4241],
    'durban': [-29.8587, 31.0218],
    'local system': [-26.2041, 28.0473], // Default to Johannesburg
    'unknown location': [-26.2041, 28.0473],
    
    // Additional areas
    'rosebank': [-26.1467, 28.0436],
    'midrand': [-25.9953, 28.1294],
    'centurion': [-25.8601, 28.1888],
    'bellville': [-33.8903, 18.6292],
    'pietermaritzburg': [-29.6196, 30.3794],
    'bloemfontein': [-29.0852, 26.1596],
    'port elizabeth': [-33.9608, 25.6022],
    'east london': [-33.0153, 27.9116],
  };
  
  const key = location.toLowerCase();
  
  // Try exact match first
  if (locationMap[key]) {
    return locationMap[key];
  }
  
  // Try partial matches
  for (const [mapKey, coords] of Object.entries(locationMap)) {
    if (key.includes(mapKey) || mapKey.includes(key)) {
      return coords;
    }
  }
  
  // Default to Johannesburg if no match found
  return locationMap['johannesburg'];
};

// Create custom icons based on service status
const createStatusIcon = (status: DeviceData['status']['Status'], type: DeviceData['type']) => {
  const getColor = () => {
    switch (status) {
      case 'OPEN': return '#10b981'; // green
      case 'LIMITED': return '#f59e0b'; // yellow
      case 'CLOSED': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };
  
  const getEmoji = () => {
    switch (type) {
      case 'clinic': return '🏥';
      case 'school': return '🏫';
      case 'office': return '🏢';
      default: return '📍';
    }
  };
  
  const color = getColor();
  const emoji = getEmoji();
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" font-size="12" fill="white">${emoji}</text>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const ServiceMap: React.FC<ServiceMapProps> = ({ 
  devices, 
  onMarkerClick,
  height = '400px' 
}) => {
  // Default center on South Africa (Johannesburg)
  const defaultCenter: [number, number] = [-26.2041, 28.0473];
  const defaultZoom = 6;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds devices={devices} />
        
        {devices.map((device) => {
          const coordinates = getCoordinatesForLocation(device.location || '');
          const icon = createStatusIcon(device.status.Status, device.type);
          
          return (
            <Marker
              key={device.id}
              position={coordinates}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick?.(device),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {device.agent.computerName}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium">{device.location}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        device.status.Status === 'OPEN' ? 'bg-green-100 text-green-800' :
                        device.status.Status === 'LIMITED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {device.status.Status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium capitalize">{device.type}</span>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(device.agent.lastUpdated).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          device.checks.network.PingSuccess ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="text-xs text-gray-600">Network</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          device.checks.printer.ServiceRunning ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="text-xs text-gray-600">Printer</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          device.checks.disk.PercentFree > 10 ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="text-xs text-gray-600">Disk</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ServiceMap;