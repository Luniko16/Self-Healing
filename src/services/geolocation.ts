// Geolocation service to get the actual location of the PC
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  country?: string;
  address?: string;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private currentLocation: LocationData | null = null;
  private locationPromise: Promise<LocationData> | null = null;

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  // Get current location using browser geolocation API with high accuracy
  async getCurrentLocation(): Promise<LocationData> {
    if (this.currentLocation) {
      return this.currentLocation;
    }

    if (this.locationPromise) {
      return this.locationPromise;
    }

    this.locationPromise = new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,        // Use GPS if available
        timeout: 15000,                  // Increased timeout for better accuracy
        maximumAge: 60000               // Reduced cache time for fresher location
      };

      // Try multiple times for better accuracy
      let attempts = 0;
      const maxAttempts = 3;
      let bestLocation: LocationData | null = null;

      const tryGetLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };

            // If this is more accurate than previous attempts, use it
            if (!bestLocation || (position.coords.accuracy < (bestLocation.accuracy || Infinity))) {
              bestLocation = location;
            }

            attempts++;

            // If we have a very accurate reading (< 100m) or reached max attempts, proceed
            if (position.coords.accuracy < 100 || attempts >= maxAttempts) {
              try {
                const addressInfo = await this.reverseGeocode(bestLocation.latitude, bestLocation.longitude);
                bestLocation.city = addressInfo.city;
                bestLocation.country = addressInfo.country;
                bestLocation.address = addressInfo.address;
              } catch (error) {
                console.warn('Could not get address information:', error);
              }

              this.currentLocation = bestLocation;
              resolve(bestLocation);
            } else {
              // Try again for better accuracy
              setTimeout(tryGetLocation, 1000);
            }
          },
          (error) => {
            if (attempts === 0) {
              let errorMessage = 'Unknown geolocation error';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location access denied by user';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  break;
              }
              reject(new Error(errorMessage));
            }
          },
          options
        );
      };

      tryGetLocation();
    });

    return this.locationPromise;
  }

  // Get location using multiple IP-based geolocation services for better accuracy
  async getLocationByIP(): Promise<LocationData> {
    const services = [
      {
        name: 'ipapi.co',
        url: 'https://ipapi.co/json/',
        parser: (data: any) => ({
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          country: data.country_name,
          address: `${data.city}, ${data.region}, ${data.country_name}`,
          accuracy: 10000 // IP-based accuracy estimate
        })
      },
      {
        name: 'ipgeolocation.io',
        url: 'https://api.ipgeolocation.io/ipgeo?apiKey=free',
        parser: (data: any) => ({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          city: data.city,
          country: data.country_name,
          address: `${data.city}, ${data.state_prov}, ${data.country_name}`,
          accuracy: 8000
        })
      },
      {
        name: 'ip-api.com',
        url: 'http://ip-api.com/json/',
        parser: (data: any) => ({
          latitude: data.lat,
          longitude: data.lon,
          city: data.city,
          country: data.country,
          address: `${data.city}, ${data.regionName}, ${data.country}`,
          accuracy: 12000
        })
      }
    ];

    let bestLocation: LocationData | null = null;
    let errors: string[] = [];

    for (const service of services) {
      try {
        console.log(`Trying IP geolocation service: ${service.name}`);
        const response = await fetch(service.url);
        const data = await response.json();
        
        if (data && (data.latitude || data.lat) && (data.longitude || data.lon)) {
          const location = service.parser(data);
          
          // Validate coordinates
          if (location.latitude >= -90 && location.latitude <= 90 && 
              location.longitude >= -180 && location.longitude <= 180) {
            
            // Use the most accurate service (lowest accuracy number)
            if (!bestLocation || (location.accuracy && location.accuracy < (bestLocation.accuracy || Infinity))) {
              bestLocation = location;
            }
            
            console.log(`${service.name} location:`, location);
          }
        }
      } catch (error) {
        const errorMsg = `${service.name} failed: ${error}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
      }
    }

    if (bestLocation) {
      this.currentLocation = bestLocation;
      console.log('Best IP-based location:', bestLocation);
      return bestLocation;
    } else {
      const errorMessage = `All IP geolocation services failed: ${errors.join(', ')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Enhanced reverse geocoding with multiple services for better accuracy
  private async reverseGeocode(lat: number, lon: number): Promise<{city?: string, country?: string, address?: string}> {
    const services = [
      {
        name: 'Nominatim',
        url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        parser: (data: any) => ({
          city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality,
          country: data.address?.country,
          address: data.display_name
        })
      },
      {
        name: 'BigDataCloud',
        url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        parser: (data: any) => ({
          city: data.city || data.locality,
          country: data.countryName,
          address: `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`
        })
      }
    ];

    for (const service of services) {
      try {
        console.log(`Trying reverse geocoding service: ${service.name}`);
        const response = await fetch(service.url);
        const data = await response.json();
        
        if (data) {
          const result = service.parser(data);
          if (result.city && result.country) {
            console.log(`${service.name} reverse geocoding result:`, result);
            return result;
          }
        }
      } catch (error) {
        console.warn(`${service.name} reverse geocoding failed:`, error);
      }
    }
    
    console.warn('All reverse geocoding services failed');
    return {};
  }

  // Get location with enhanced accuracy using multiple methods
  async getLocationWithFallback(): Promise<LocationData> {
    let gpsLocation: LocationData | null = null;
    let ipLocation: LocationData | null = null;
    let errors: string[] = [];

    // Try GPS first (most accurate)
    try {
      console.log('Attempting GPS location...');
      gpsLocation = await this.getCurrentLocation();
      console.log('GPS location obtained:', gpsLocation);
      
      // If GPS is very accurate (< 500m), use it immediately
      if (gpsLocation.accuracy && gpsLocation.accuracy < 500) {
        return gpsLocation;
      }
    } catch (error) {
      const errorMsg = `GPS location failed: ${error}`;
      console.warn(errorMsg);
      errors.push(errorMsg);
    }

    // Try IP-based location (fallback)
    try {
      console.log('Attempting IP-based location...');
      ipLocation = await this.getLocationByIP();
      console.log('IP location obtained:', ipLocation);
    } catch (ipError) {
      const errorMsg = `IP location failed: ${ipError}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    // Choose the best available location
    if (gpsLocation && ipLocation) {
      // If we have both, prefer GPS but validate against IP location
      const distance = this.calculateDistance(
        gpsLocation.latitude, gpsLocation.longitude,
        ipLocation.latitude, ipLocation.longitude
      );
      
      console.log(`Distance between GPS and IP location: ${distance.toFixed(2)} km`);
      
      // If GPS and IP locations are very far apart (>100km), something might be wrong
      if (distance > 100) {
        console.warn('Large discrepancy between GPS and IP location, using IP location for safety');
        return ipLocation;
      } else {
        // GPS location seems reasonable, use it
        return gpsLocation;
      }
    } else if (gpsLocation) {
      return gpsLocation;
    } else if (ipLocation) {
      return ipLocation;
    } else {
      console.error('All location methods failed:', errors);
      // Ultimate fallback - try to determine region from browser language/timezone
      return this.getIntelligentDefaultLocation();
    }
  }

  // Calculate distance between two coordinates in kilometers
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Intelligent default location based on browser settings
  private getIntelligentDefaultLocation(): LocationData {
    // Try to guess location from browser language and timezone
    const language = navigator.language || 'en-US';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log('Browser language:', language, 'Timezone:', timezone);
    
    // Map common timezones to approximate locations
    const timezoneMap: { [key: string]: LocationData } = {
      'America/New_York': { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'United States' },
      'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', country: 'United States' },
      'America/Chicago': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago', country: 'United States' },
      'Europe/London': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'United Kingdom' },
      'Europe/Paris': { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
      'Europe/Berlin': { latitude: 52.5200, longitude: 13.4050, city: 'Berlin', country: 'Germany' },
      'Asia/Tokyo': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
      'Asia/Shanghai': { latitude: 31.2304, longitude: 121.4737, city: 'Shanghai', country: 'China' },
      'Australia/Sydney': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
      'Africa/Johannesburg': { latitude: -26.2041, longitude: 28.0473, city: 'Johannesburg', country: 'South Africa' },
    };
    
    // Check for exact timezone match
    if (timezoneMap[timezone]) {
      const location = timezoneMap[timezone];
      console.log('Using timezone-based location:', location);
      return {
        ...location,
        address: `${location.city}, ${location.country}`,
        accuracy: 50000 // Very approximate
      };
    }
    
    // Fallback based on language
    const languageMap: { [key: string]: LocationData } = {
      'en-US': { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'United States' },
      'en-GB': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'United Kingdom' },
      'fr': { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
      'de': { latitude: 52.5200, longitude: 13.4050, city: 'Berlin', country: 'Germany' },
      'ja': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
      'zh': { latitude: 31.2304, longitude: 121.4737, city: 'Shanghai', country: 'China' },
    };
    
    const langCode = language.split('-')[0];
    if (languageMap[language] || languageMap[langCode]) {
      const location = languageMap[language] || languageMap[langCode];
      console.log('Using language-based location:', location);
      return {
        ...location,
        address: `${location.city}, ${location.country}`,
        accuracy: 100000 // Very approximate
      };
    }
    
    // Ultimate fallback
    console.log('Using ultimate fallback location (New York)');
    return {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'United States',
      address: 'New York, NY, United States',
      accuracy: 100000
    };
  }

  // Validate and improve location accuracy
  async validateAndImproveLocation(location: LocationData): Promise<LocationData> {
    // Basic coordinate validation
    if (location.latitude < -90 || location.latitude > 90 || 
        location.longitude < -180 || location.longitude > 180) {
      throw new Error('Invalid coordinates');
    }

    // If accuracy is poor (>10km), try to get a better reading
    if (location.accuracy && location.accuracy > 10000) {
      console.log('Location accuracy is poor, attempting to improve...');
      
      try {
        // Try to get a fresh GPS reading
        this.clearLocation();
        const improvedLocation = await this.getCurrentLocation();
        
        if (improvedLocation.accuracy && improvedLocation.accuracy < location.accuracy) {
          console.log('Improved location accuracy from', location.accuracy, 'to', improvedLocation.accuracy);
          return improvedLocation;
        }
      } catch (error) {
        console.warn('Could not improve location accuracy:', error);
      }
    }

    // Enhance with better address information if missing
    if (!location.city || !location.address) {
      try {
        const addressInfo = await this.reverseGeocode(location.latitude, location.longitude);
        return {
          ...location,
          city: location.city || addressInfo.city,
          country: location.country || addressInfo.country,
          address: location.address || addressInfo.address
        };
      } catch (error) {
        console.warn('Could not enhance address information:', error);
      }
    }

    return location;
  }

  // Get the most accurate location possible
  async getHighAccuracyLocation(): Promise<LocationData> {
    console.log('Getting high accuracy location...');
    
    const location = await this.getLocationWithFallback();
    const validatedLocation = await this.validateAndImproveLocation(location);
    
    console.log('Final location:', validatedLocation);
    return validatedLocation;
  }
  clearLocation(): void {
    this.currentLocation = null;
    this.locationPromise = null;
  }

  // Get cached location without making new requests
  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  // Check if geolocation is supported
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Generate nearby service locations based on actual location
  generateNearbyServiceLocations(centerLocation: LocationData, count: number = 6): Array<LocationData & {name: string, type: string}> {
    const services = [
      { name: 'Local Health Clinic', type: 'clinic' },
      { name: 'Community Center', type: 'office' },
      { name: 'Public Library', type: 'office' },
      { name: 'Local School', type: 'school' },
      { name: 'Government Office', type: 'office' },
      { name: 'Medical Center', type: 'clinic' }
    ];

    return services.slice(0, count).map((service, index) => {
      // Generate locations within ~10km radius of the center location
      const radiusInDegrees = 0.1; // Approximately 10km
      const angle = (index / count) * 2 * Math.PI;
      const distance = Math.random() * radiusInDegrees;
      
      const lat = centerLocation.latitude + (distance * Math.cos(angle));
      const lon = centerLocation.longitude + (distance * Math.sin(angle));
      
      return {
        latitude: lat,
        longitude: lon,
        name: service.name,
        type: service.type,
        city: centerLocation.city,
        country: centerLocation.country,
        address: `Near ${centerLocation.address}`
      };
    });
  }
}

export const geolocationService = GeolocationService.getInstance();