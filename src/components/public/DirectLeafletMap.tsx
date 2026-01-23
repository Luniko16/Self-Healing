import React, { useEffect, useRef, useState } from 'react';
import { DeviceData } from '../../types';
import { geolocationService } from '../../services/geolocation';

// Declare Leaflet as a global variable
declare global {
  interface Window {
    L: any;
  }
}

interface DirectLeafletMapProps {
  devices: DeviceData[];
  onMarkerClick?: (device: DeviceData) => void;
  height?: string;
}

const DirectLeafletMap: React.FC<DirectLeafletMapProps> = ({ 
  devices, 
  onMarkerClick,
  height = '400px' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get coordinates for any location (fallback to device coordinates if available)
  const getCoordinatesForLocation = (location: string, device?: DeviceData): [number, number] => {
    // If device has coordinates, use them
    if (device && (device as any).coordinates) {
      const coords = (device as any).coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        return [coords[0], coords[1]];
      }
    }
    
    // Fallback location mapping (can be expanded)
    const locationMap: { [key: string]: [number, number] } = {
      // Common locations
      'local system': userLocation ? [userLocation.lat, userLocation.lon] : [40.7128, -74.0060],
      'unknown location': userLocation ? [userLocation.lat, userLocation.lon] : [40.7128, -74.0060],
      'near': userLocation ? [userLocation.lat, userLocation.lon] : [40.7128, -74.0060],
      
      // Major world cities (can be expanded based on deployment)
      'new york': [40.7128, -74.0060],
      'london': [51.5074, -0.1278],
      'paris': [48.8566, 2.3522],
      'tokyo': [35.6762, 139.6503],
      'sydney': [-33.8688, 151.2093],
      'toronto': [43.6532, -79.3832],
      'berlin': [52.5200, 13.4050],
      'madrid': [40.4168, -3.7038],
      'rome': [41.9028, 12.4964],
      'moscow': [55.7558, 37.6176],
      
      // South African cities (for backward compatibility)
      'johannesburg': [-26.2041, 28.0473],
      'cape town': [-33.9249, 18.4241],
      'durban': [-29.8587, 31.0218],
      'pretoria': [-25.7479, 28.2293],
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
    
    // Default to user location or NYC if no match found
    return userLocation ? [userLocation.lat, userLocation.lon] : [40.7128, -74.0060];
  };

  // Get user's real location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await geolocationService.getHighAccuracyLocation();
        setUserLocation({ lat: location.latitude, lon: location.longitude });
        setLocationError(null);
        console.log('High accuracy location obtained:', location);
      } catch (error) {
        console.error('Failed to get user location:', error);
        setLocationError(error instanceof Error ? error.message : 'Location unavailable');
        // Use intelligent default location
        try {
          const fallbackLocation = await geolocationService.getLocationWithFallback();
          setUserLocation({ lat: fallbackLocation.latitude, lon: fallbackLocation.longitude });
        } catch (fallbackError) {
          // Ultimate fallback
          setUserLocation({ lat: 40.7128, lon: -74.0060 }); // NYC default
        }
      }
    };

    getUserLocation();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.L || !userLocation) {
      console.log('Map container, Leaflet, or user location not available');
      return;
    }

    try {
      // Create map centered on user's location
      const map = window.L.map(mapRef.current).setView([userLocation.lat, userLocation.lon], 12);
      
      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add user location marker
      const userMarker = window.L.marker([userLocation.lat, userLocation.lon], {
        icon: window.L.divIcon({
          className: 'user-location-marker',
          html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);
      
      userMarker.bindPopup(`
        <div style="text-align: center;">
          <strong>Your Location</strong><br/>
          ${locationError ? 'Approximate location' : 'Current location'}
        </div>
      `);
      
      mapInstanceRef.current = map;
      console.log('Map initialized successfully at user location:', userLocation);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation, locationError]);

  // Update markers when devices change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !devices.length) {
      return;
    }

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });
      markersRef.current = [];

      // Add new markers
      const bounds = window.L.latLngBounds();
      
      devices.forEach((device) => {
        const coordinates = getCoordinatesForLocation(device.location || '', device);
        
        // Create marker
        const marker = window.L.marker(coordinates);
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${device.agent.computerName}</h3>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Location:</strong> ${device.location}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Status:</strong> 
              <span style="color: ${device.status.Status === 'OPEN' ? '#059669' : 
                                   device.status.Status === 'LIMITED' ? '#d97706' : '#dc2626'};">
                ${device.status.Status}
              </span>
            </p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Type:</strong> ${device.type}</p>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Network: ${device.checks.network.PingSuccess ? '✓' : '✗'}</span>
                <span>Printer: ${device.checks.printer.ServiceRunning ? '✓' : '✗'}</span>
                <span>Disk: ${device.checks.disk.PercentFree > 10 ? '✓' : '✗'}</span>
              </div>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click handler
        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(device));
        }
        
        // Add to map
        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
        
        // Add to bounds
        bounds.extend(coordinates);
      });

      // Fit map to bounds
      if (devices.length === 1) {
        mapInstanceRef.current.setView(getCoordinatesForLocation(devices[0].location || ''), 12);
      } else if (devices.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
      
      console.log(`Added ${devices.length} markers to map`);
      
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [devices, onMarkerClick]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="z-0"
      />
      {!window.L && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-gray-600">Loading map...</p>
            <p className="text-sm text-gray-500 mt-2">
              If this message persists, there may be an issue loading the map library.
            </p>
          </div>
        </div>
      )}
      
      {/* Location Status Indicator */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${locationError ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {locationError ? 'Approximate Location' : 'Live Location'}
            </div>
            <div className="text-gray-600 text-xs">
              {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}` : 'Loading...'}
            </div>
          </div>
        </div>
        {locationError && (
          <div className="text-xs text-yellow-600 mt-1">
            Using IP-based location
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectLeafletMap;