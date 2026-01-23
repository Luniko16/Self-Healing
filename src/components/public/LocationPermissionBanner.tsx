import React, { useState, useEffect } from 'react';
import { MapPin, X, AlertCircle, Target } from 'lucide-react';
import { geolocationService } from '../../services/geolocation';

const LocationPermissionBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!geolocationService.isGeolocationSupported()) {
      setPermissionStatus('unsupported');
      return;
    }

    // Check if we already have location
    const cachedLocation = geolocationService.getCachedLocation();
    if (cachedLocation) {
      setPermissionStatus('granted');
      setLocationAccuracy(cachedLocation.accuracy || null);
      return;
    }

    // Check permission status if available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          setPermissionStatus('granted');
        } else if (permission.state === 'denied') {
          setPermissionStatus('denied');
          setShowBanner(true);
        } else {
          setPermissionStatus('prompt');
          setShowBanner(true);
        }
      } catch (error) {
        // Fallback for browsers that don't support permissions API
        setPermissionStatus('prompt');
        setShowBanner(true);
      }
    } else {
      setPermissionStatus('prompt');
      setShowBanner(true);
    }
  };

  const requestLocation = async () => {
    try {
      const location = await geolocationService.getHighAccuracyLocation();
      setPermissionStatus('granted');
      setLocationAccuracy(location.accuracy || null);
      setShowBanner(false);
      // Refresh the page to reload with new location
      window.location.reload();
    } catch (error) {
      console.error('Location request failed:', error);
      setPermissionStatus('denied');
      // Keep banner open to show fallback message
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              {permissionStatus === 'denied' ? 'Location Access Denied' : 'Enable Location Services'}
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              {permissionStatus === 'denied' ? (
                <>
                  <p>We're using your approximate location based on your internet connection.</p>
                  <p className="mt-1">For more accurate results, you can enable location access in your browser settings.</p>
                </>
              ) : permissionStatus === 'unsupported' ? (
                <p>Your browser doesn't support location services. We'll show services in your general area.</p>
              ) : (
                <>
                  <p>Allow location access to find services near you with accurate distances and directions.</p>
                  <p className="mt-1">We only use your location to show nearby services and don't store this information.</p>
                </>
              )}
            </div>
            {permissionStatus === 'prompt' && (
              <div className="mt-3">
                <button
                  onClick={requestLocation}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Get High Accuracy Location
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={dismissBanner}
          className="flex-shrink-0 text-blue-400 hover:text-blue-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {permissionStatus === 'denied' && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-blue-600">
          <AlertCircle className="w-3 h-3" />
          <span>Using IP-based location as fallback</span>
        </div>
      )}
      
      {permissionStatus === 'granted' && locationAccuracy && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-green-600">
          <Target className="w-3 h-3" />
          <span>
            Location accuracy: {locationAccuracy < 1000 ? 
              `${Math.round(locationAccuracy)}m` : 
              `${(locationAccuracy / 1000).toFixed(1)}km`}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationPermissionBanner;