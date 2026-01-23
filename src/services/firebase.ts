import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { DeviceData } from '../types';
import { geolocationService } from './geolocation';

// Use Flask API endpoints when Firebase is not available
const USE_FLASK_API = !process.env.REACT_APP_FIREBASE_API_KEY;
const FLASK_API_BASE = process.env.REACT_APP_API_URL || '';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase only if config is available
let app: any = null;
let db: any = null;

if (!USE_FLASK_API && firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

class FirebaseService {
  private devicesCollection: any = null;
  private locationsCollection: any = null;

  constructor() {
    if (db) {
      this.devicesCollection = collection(db, 'devices');
      this.locationsCollection = collection(db, 'locations');
    }
  }

  // Subscribe to ALL data: real devices + demo locations
  subscribeToAllDevices(callback: (devices: DeviceData[]) => void) {
    let callbackCalled = false;
    
    if (USE_FLASK_API) {
      // Use Flask API polling
      this.pollFlaskAPI((devices) => {
        callbackCalled = true;
        callback(devices);
      });
      
      // Fallback to demo data after 2 seconds if no data received
      setTimeout(() => {
        if (!callbackCalled) {
          console.warn('🔄 No data from Flask API, using demo data');
          const demoDevices = this.generateDemoDevices();
          callback(demoDevices);
          callbackCalled = true;
        }
      }, 2000);
      
      return () => {}; // Return empty unsubscribe function
    }

    console.log('🔥 FirebaseService: Starting to listen to all devices...');
    const allDevices: DeviceData[] = [];
    
    // Provide immediate demo data
    setTimeout(() => {
      if (!callbackCalled) {
        console.warn('⏱️ Firebase taking too long, using demo data');
        callback(this.generateDemoDevices());
        callbackCalled = true;
      }
    }, 2000);
    
    // 1. Subscribe to real agent devices
    console.log('📁 Listening to "devices" collection...');
    const devicesQuery = query(this.devicesCollection, orderBy('agent.lastUpdated', 'desc'));
    const devicesUnsub = onSnapshot(devicesQuery,
      (snapshot: any) => {
        console.log(`💻 Got ${snapshot.size} agent device documents:`);
        snapshot.forEach((docSnapshot: any) => {
          console.log(`  - ${docSnapshot.id}:`, docSnapshot.data());
        });
        // Clear previous agent devices
        const agentDevices = allDevices.filter(d => d.source !== 'location');
        allDevices.length = 0;
        allDevices.push(...agentDevices);
        
        // Add new agent devices
        snapshot.forEach((docSnapshot: any) => {
          const data = docSnapshot.data();
          const device = this.mapToDevice(docSnapshot.id, data, 'agent');
          allDevices.push(device);
        });
        
        // Sort by last updated
        allDevices.sort((a, b) => 
          new Date(b.agent.lastUpdated).getTime() - new Date(a.agent.lastUpdated).getTime()
        );
        
        console.log('📊 Calling callback with', allDevices.length, 'total devices');
        callback([...allDevices]);
        callbackCalled = true;
      },
      (error) => {
        console.error('❌ Devices collection error:', error);
        // Don't show toast, just provide demo data
        if (!callbackCalled) {
          callback(this.generateDemoDevices());
          callbackCalled = true;
        }
      }
    );

    // 2. Subscribe to location data (your existing 4 locations)
    console.log('📍 Listening to "locations" collection...');
    const locationsUnsub = onSnapshot(this.locationsCollection,
      (snapshot: any) => {
        console.log(`🏢 Got ${snapshot.size} location documents:`);
        snapshot.forEach((docSnapshot: any) => {
          console.log(`  - ${docSnapshot.id}:`, docSnapshot.data());
        });
        // Add location devices (these are static/demo)
        snapshot.forEach((docSnapshot: any) => {
          const data = docSnapshot.data();
          const locationId = docSnapshot.id;
          
          // Check if this location already exists
          const existingIndex = allDevices.findIndex(d => d.id === `location_${locationId}`);
          if (existingIndex === -1) {
            const device = this.mapLocationToDevice(locationId, data);
            allDevices.push(device);
          }
        });
        
        callback([...allDevices]);
        callbackCalled = true;
      },
      (error) => {
        console.error('Locations collection error:', error);
        // Don't show toast, just provide demo data
        if (!callbackCalled) {
          callback(this.generateDemoDevices());
          callbackCalled = true;
        }
      }
    );

    return () => {
      devicesUnsub();
      locationsUnsub();
    };
  }

  private generateDemoDevices(): DeviceData[] {
    return [
      {
        id: 'demo_1',
        agent: {
          version: '1.0.0',
          computerName: 'Main Office Server',
          lastUpdated: new Date(),
          timestamp: new Date().toISOString()
        },
        status: {
          Status: 'OPEN',
          Message: 'All systems operational',
          Code: 0
        },
        checks: {
          network: { Status: 'HEALTHY', PingSuccess: true, DNSSuccess: true, Details: ['✓ Connected'] },
          printer: { Status: 'HEALTHY', ServiceRunning: true, ServiceState: 'Running' },
          disk: { Status: 'HEALTHY', FreeGB: 250, TotalGB: 500, PercentFree: 50, Drive: 'C:' }
        },
        actions: { repairsCount: 0 },
        location: 'New York, NY',
        type: 'office',
        tags: ['production', 'critical'],
        source: 'agent'
      },
      {
        id: 'demo_2',
        agent: {
          version: '1.0.0',
          computerName: 'Branch Office Workstation',
          lastUpdated: new Date(),
          timestamp: new Date().toISOString()
        },
        status: {
          Status: 'LIMITED',
          Message: 'Some services degraded',
          Code: 1
        },
        checks: {
          network: { Status: 'DEGRADED', PingSuccess: true, DNSSuccess: false, Details: ['⚠ Slow DNS'] },
          printer: { Status: 'HEALTHY', ServiceRunning: true, ServiceState: 'Running' },
          disk: { Status: 'WARNING', FreeGB: 50, TotalGB: 500, PercentFree: 10, Drive: 'C:' }
        },
        actions: { repairsCount: 1 },
        location: 'Los Angeles, CA',
        type: 'office',
        tags: ['warning'],
        source: 'agent'
      },
      {
        id: 'demo_3',
        agent: {
          version: '1.0.0',
          computerName: 'Remote Site System',
          lastUpdated: new Date(),
          timestamp: new Date().toISOString()
        },
        status: {
          Status: 'CLOSED',
          Message: 'Critical issues detected',
          Code: 2
        },
        checks: {
          network: { Status: 'FAILED', PingSuccess: false, DNSSuccess: false, Details: ['✗ No connection'] },
          printer: { Status: 'FAILED', ServiceRunning: false, ServiceState: 'Stopped' },
          disk: { Status: 'CRITICAL', FreeGB: 5, TotalGB: 500, PercentFree: 1, Drive: 'C:' }
        },
        actions: { repairsCount: 3 },
        location: 'Chicago, IL',
        type: 'office',
        tags: ['critical', 'urgent'],
        source: 'agent'
      }
    ];
  }

  // Flask API polling method
  private async pollFlaskAPI(callback: (devices: DeviceData[]) => void) {
    const pollWithTimeout = async (url: string, timeout: number = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const poll = async () => {
      try {
        // First try to get live scan data with 3 second timeout
        try {
          let response = await pollWithTimeout(`${FLASK_API_BASE}/api/system/live-scan`, 3000);
          if (response.ok) {
            const scanData = await response.json();
            if (scanData.devices && scanData.devices.length > 0) {
              const devices = scanData.devices.map((device: any) => this.convertScanDataToDevice(device));
              callback(devices);
              return;
            }
          }
        } catch (error) {
          // Silently fail and try next endpoint
        }
        
        // Fallback to public status with 3 second timeout
        try {
          let response = await pollWithTimeout(`${FLASK_API_BASE}/api/public/status`, 3000);
          if (response.ok) {
            const data = await response.json();
            const devices = this.convertFlaskDataToDevices(data);
            callback(devices);
          }
        } catch (error) {
          // Silently fail - use demo data
        }
      } catch (error) {
        console.warn('Flask API unavailable, using demo data');
      }
    };

    // Initial poll
    poll();
    
    // Poll every 30 seconds
    const interval = setInterval(poll, 30000);
    
    return () => clearInterval(interval);
  }

  // Search services using Flask API with real geolocation
  async searchServices(query: string, filters?: any): Promise<DeviceData[]> {
    if (USE_FLASK_API) {
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters?.location) params.append('location', filters.location);
        
        // Add real location data with high accuracy
        try {
          const userLocation = await geolocationService.getHighAccuracyLocation();
          params.append('user_lat', userLocation.latitude.toString());
          params.append('user_lon', userLocation.longitude.toString());
          if (userLocation.city) params.append('user_city', userLocation.city);
          if (userLocation.accuracy) params.append('user_accuracy', userLocation.accuracy.toString());
        } catch (error) {
          console.warn('Could not get user location for search:', error);
        }
        
        const response = await fetch(`${FLASK_API_BASE}/api/public/search?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          return data.services.map((service: any) => this.convertSearchResultToDevice(service));
        }
      } catch (error) {
        console.error('Error searching services:', error);
      }
    }
    
    // Fallback to local filtering with generated nearby services
    return this.generateLocalServices(query, filters);
  }

  // Generate local services based on real user location
  private async generateLocalServices(query: string, filters?: any): Promise<DeviceData[]> {
    try {
      const userLocation = await geolocationService.getHighAccuracyLocation();
      const nearbyServices = geolocationService.generateNearbyServiceLocations(userLocation, 8);
      
      const devices: DeviceData[] = nearbyServices.map((service, index) => {
        const isOperational = Math.random() > 0.3; // 70% chance of being operational
        const status: DeviceData['status']['Status'] = isOperational ? 'OPEN' : 
                     Math.random() > 0.5 ? 'LIMITED' : 'CLOSED';
        
        return {
          id: `local_${service.name.replace(/\s+/g, '_').toLowerCase()}_${index}`,
          agent: {
            version: '1.0.0',
            computerName: service.name,
            lastUpdated: new Date(),
            timestamp: new Date().toISOString()
          },
          status: {
            Status: status,
            Message: status === 'OPEN' ? 'All services operational' :
                    status === 'LIMITED' ? 'Limited services available' :
                    'Service temporarily unavailable',
            Code: status === 'OPEN' ? 0 : status === 'LIMITED' ? 1 : 2
          },
          checks: {
            network: {
              Status: isOperational ? 'HEALTHY' : 'DEGRADED',
              PingSuccess: isOperational,
              DNSSuccess: isOperational,
              Details: isOperational ? ['✓ Network connectivity stable'] : ['✗ Network issues detected']
            },
            printer: {
              Status: isOperational ? 'HEALTHY' : 'FAILED',
              ServiceRunning: isOperational,
              ServiceState: isOperational ? 'Running' : 'Stopped'
            },
            disk: {
              Status: isOperational ? 'HEALTHY' : 'WARNING',
              FreeGB: Math.floor(Math.random() * 100) + 50,
              TotalGB: 500,
              PercentFree: Math.floor(Math.random() * 30) + 10,
              Drive: 'C:'
            }
          },
          actions: { repairsCount: isOperational ? 0 : Math.floor(Math.random() * 3) },
          location: service.address || `${service.city}, ${service.country}`,
          type: service.type as DeviceData['type'],
          tags: ['real-location', service.type, userLocation.city || 'local'],
          source: 'agent',
          coordinates: [service.latitude, service.longitude] // Add coordinates for map
        };
      });
      
      // Apply filters
      let filteredDevices = devices;
      
      if (query) {
        const searchTerm = query.toLowerCase();
        filteredDevices = filteredDevices.filter(device => 
          device.agent.computerName.toLowerCase().includes(searchTerm) ||
          device.location?.toLowerCase().includes(searchTerm) ||
          device.type?.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters?.status && filters.status !== 'all') {
        filteredDevices = filteredDevices.filter(device => device.status.Status === filters.status);
      }
      
      if (filters?.type && filters.type !== 'all') {
        filteredDevices = filteredDevices.filter(device => device.type === filters.type);
      }
      
      if (filters?.location) {
        const locationTerm = filters.location.toLowerCase();
        filteredDevices = filteredDevices.filter(device => 
          device.location?.toLowerCase().includes(locationTerm)
        );
      }
      
      return filteredDevices;
      
    } catch (error) {
      console.error('Error generating local services:', error);
      return [];
    }
  }
  private convertSearchResultToDevice(service: any): DeviceData {
    return {
      id: `search_${service.display_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}`,
      agent: {
        version: '1.0.0',
        computerName: service.display_name || service.name || 'Unknown Service',
        lastUpdated: new Date(),
        timestamp: new Date().toISOString()
      },
      status: {
        Status: service.operational ? 'OPEN' : 'CLOSED',
        Message: service.status || 'Service status',
        Code: service.operational ? 0 : 2
      },
      checks: {
        network: {
          Status: service.type === 'Network' ? (service.operational ? 'HEALTHY' : 'FAILED') : 'UNKNOWN',
          PingSuccess: service.type === 'Network' ? service.operational : true,
          DNSSuccess: service.type === 'Network' ? service.operational : true,
          Details: []
        },
        printer: {
          Status: service.type === 'Printing' ? (service.operational ? 'HEALTHY' : 'FAILED') : 'UNKNOWN',
          ServiceRunning: service.type === 'Printing' ? service.operational : true,
          ServiceState: service.type === 'Printing' ? (service.operational ? 'Running' : 'Stopped') : 'Unknown'
        },
        disk: {
          Status: service.type === 'Storage' ? (service.operational ? 'HEALTHY' : 'CRITICAL') : 'UNKNOWN',
          FreeGB: service.type === 'Storage' ? (parseFloat(service.status?.split(' ')[0]) || 100) : 100,
          TotalGB: service.type === 'Storage' ? (parseFloat(service.status?.split('of ')[1]?.split('GB')[0]) || 500) : 500,
          PercentFree: service.type === 'Storage' ? (service.percent_used ? 100 - service.percent_used : 20) : 20,
          Drive: service.name?.includes('Drive') ? service.name.split(' ')[1] : 'C:'
        }
      },
      actions: { repairsCount: 0 },
      location: service.location || 'Unknown Location',
      type: service.service_type === 'clinic' ? 'clinic' :
            service.service_type === 'school' ? 'school' :
            service.service_type === 'office' ? 'office' : 'demo',
      tags: ['searchable', service.service_type || 'system'],
      source: 'agent'
    };
  }

  // Convert live scan data to DeviceData format
  private convertScanDataToDevice(scanDevice: any): DeviceData {
    return {
      id: scanDevice.id || 'unknown',
      agent: {
        version: scanDevice.agent?.version || '1.0.0',
        computerName: scanDevice.agent?.computerName || 'Unknown System',
        lastUpdated: new Date(scanDevice.agent?.lastUpdated || new Date()),
        timestamp: scanDevice.agent?.timestamp || new Date().toISOString()
      },
      status: {
        Status: scanDevice.status?.Status || 'UNKNOWN',
        Message: scanDevice.status?.Message || 'No status available',
        Code: scanDevice.status?.Code || 3
      },
      checks: {
        network: {
          Status: scanDevice.checks?.network?.Status || 'UNKNOWN',
          PingSuccess: scanDevice.checks?.network?.PingSuccess || false,
          DNSSuccess: scanDevice.checks?.network?.DNSSuccess || false,
          Details: scanDevice.checks?.network?.Details || []
        },
        printer: {
          Status: scanDevice.checks?.printer?.Status || 'UNKNOWN',
          ServiceRunning: scanDevice.checks?.printer?.ServiceRunning || false,
          ServiceState: scanDevice.checks?.printer?.ServiceState || 'Unknown'
        },
        disk: {
          Status: scanDevice.checks?.disk?.Status || 'UNKNOWN',
          FreeGB: scanDevice.checks?.disk?.FreeGB || 0,
          TotalGB: scanDevice.checks?.disk?.TotalGB || 0,
          PercentFree: scanDevice.checks?.disk?.PercentFree || 0,
          Drive: scanDevice.checks?.disk?.Drive || 'C:'
        }
      },
      actions: {
        repairsCount: scanDevice.actions?.repairsCount || 0,
        repairsPerformed: scanDevice.actions?.repairsPerformed || []
      },
      location: scanDevice.location || 'Unknown Location',
      type: scanDevice.type || 'demo',
      tags: scanDevice.tags || [],
      source: 'agent'
    };
  }

  // Convert Flask API data to DeviceData format
  private convertFlaskDataToDevices(flaskData: any): DeviceData[] {
    const devices: DeviceData[] = [];
    
    if (flaskData.services && Array.isArray(flaskData.services)) {
      flaskData.services.forEach((service: any, index: number) => {
        const device: DeviceData = {
          id: `real_service_${service.name?.replace(/\s+/g, '_').toLowerCase() || index}`,
          agent: {
            version: '1.0.0',
            computerName: service.name || `Service ${index + 1}`,
            lastUpdated: new Date(),
            timestamp: new Date().toISOString()
          },
          status: {
            Status: service.operational ? 'OPEN' : 'CLOSED',
            Message: service.status || 'Service status',
            Code: service.operational ? 0 : 2
          },
          checks: {
            network: {
              Status: service.type === 'Network' ? (service.operational ? 'HEALTHY' : 'FAILED') : 'UNKNOWN',
              PingSuccess: service.type === 'Network' ? service.operational : true,
              DNSSuccess: service.type === 'Network' ? service.operational : true,
              Details: service.type === 'Network' ? (service.operational ? ['✓ Network connectivity stable'] : ['✗ Network connectivity issues']) : []
            },
            printer: {
              Status: service.type === 'Printing' ? (service.operational ? 'HEALTHY' : 'FAILED') : 'UNKNOWN',
              ServiceRunning: service.type === 'Printing' ? service.operational : true,
              ServiceState: service.type === 'Printing' ? (service.operational ? 'Running' : 'Stopped') : 'Unknown'
            },
            disk: {
              Status: service.type === 'Storage' ? (service.operational ? 'HEALTHY' : 'CRITICAL') : 'UNKNOWN',
              FreeGB: service.type === 'Storage' ? (parseFloat(service.status?.split(' ')[0]) || 100) : 100,
              TotalGB: service.type === 'Storage' ? (parseFloat(service.status?.split('of ')[1]?.split('GB')[0]) || 500) : 500,
              PercentFree: service.type === 'Storage' ? (service.percent_used ? 100 - service.percent_used : 20) : 20,
              Drive: service.name?.includes('Drive') ? service.name.split(' ')[1] : 'C:'
            }
          },
          actions: { repairsCount: 0 },
          location: 'Local System',
          type: service.type === 'Storage' ? 'server' : 
                service.type === 'Printing' ? 'office' : 
                service.type === 'Network' ? 'server' : 'demo',
          tags: ['real-data', service.type?.toLowerCase() || 'system'],
          source: 'agent'
        };
        devices.push(device);
      });
    }
    
    return devices;
  }

  // Map Firestore document to DeviceData
  private mapToDevice(id: string, data: any, source: 'agent' | 'location'): DeviceData {
    const baseDevice: DeviceData = {
      id: source === 'location' ? `location_${id}` : id,
      agent: {
        version: data.agent?.version || '1.0.0',
        computerName: data.agent?.computerName || this.formatDeviceName(id, source),
        lastUpdated: data.agent?.lastUpdated?.toDate?.() || new Date(),
        timestamp: data.agent?.timestamp || new Date().toISOString()
      },
      status: data.status || {
        Status: 'UNKNOWN' as const,
        Message: 'No status available',
        Code: 3
      },
      checks: data.checks || this.getDefaultChecks(),
      actions: data.actions || { repairsCount: 0 },
      location: data.location || 'Unknown Location',
      type: data.type || (source === 'location' ? this.getTypeFromId(id) : 'demo'),
      tags: data.tags || [],
      source: source  // Track where this data came from
    };

    return baseDevice;
  }

  // Map your location data to device format
  private mapLocationToDevice(locationId: string, data: any): DeviceData {
    const status = this.getStatusForLocation(data);
    
    return {
      id: `location_${locationId}`,
      agent: {
        version: '1.0.0',
        computerName: this.formatLocationName(locationId),
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
        timestamp: data.timestamp || new Date().toISOString()
      },
      status: status,
      checks: this.getChecksForLocation(status.Status),
      actions: { repairsCount: Math.floor(Math.random() * 3) }, // Random for demo
      location: this.getAreaFromId(locationId),
      type: this.getTypeFromId(locationId),
      tags: ['public-service', 'location', this.getTypeFromId(locationId) || 'demo'],
      source: 'location'
    };
  }

  // Helper methods
  private formatDeviceName(id: string, source: string): string {
    if (source === 'location') {
      return id.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return id.replace(/-/g, ' ').replace(/_/g, ' ');
  }

  private formatLocationName(id: string): string {
    // Convert "clinic_johannesburg_central" to "Johannesburg Central Clinic"
    const parts = id.split('_');
    if (parts[0] === 'clinic') {
      return `${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)} ${parts.slice(2).join(' ')} Clinic`;
    } else if (parts[0] === 'school') {
      return `${parts.slice(2).join(' ')} School`;
    }
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  private getTypeFromId(id: string): DeviceData['type'] {
    if (id.startsWith('clinic_')) return 'clinic';
    if (id.startsWith('school_')) return 'school';
    if (id.startsWith('home_affairs_')) return 'office';
    if (id.startsWith('ngo_')) return 'office';
    return 'demo';
  }

  private getAreaFromId(id: string): string {
    const parts = id.split('_');
    if (parts.length > 1) {
      const area = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      const detail = parts.length > 2 ? 
        parts.slice(2).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') : '';
      return `${area}${detail ? ` - ${detail}` : ''}`;
    }
    return id;
  }

  private getStatusForLocation(data: any): DeviceData['status'] {
    // Use existing status from your location data, or generate one
    if (data.status) {
      return {
        Status: data.status.Status || 'OPEN',
        Message: data.status.Message || 'Public service operational',
        Code: data.status.Code || 0
      };
    }
    
    // Generate random status for demo
    const statuses: DeviceData['status']['Status'][] = ['OPEN', 'LIMITED', 'CLOSED'];
    const weights = [0.7, 0.2, 0.1]; // 70% OPEN, 20% LIMITED, 10% CLOSED
    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedStatus: DeviceData['status']['Status'] = 'OPEN';
    
    for (let i = 0; i < statuses.length; i++) {
      cumulativeWeight += weights[i];
      if (random < cumulativeWeight) {
        selectedStatus = statuses[i];
        break;
      }
    }
    
    const messages = {
      'OPEN': 'All public services operational',
      'LIMITED': 'Services operating with reduced capacity',
      'CLOSED': 'Temporarily closed for maintenance',
      'UNKNOWN': 'Status unavailable'
    };
    
    return {
      Status: selectedStatus,
      Message: messages[selectedStatus],
      Code: selectedStatus === 'OPEN' ? 0 : selectedStatus === 'LIMITED' ? 1 : 2
    };
  }

  private getChecksForLocation(status: DeviceData['status']['Status']): DeviceData['checks'] {
    return {
      network: {
        Status: status === 'OPEN' ? 'HEALTHY' : 'DEGRADED',
        PingSuccess: status !== 'CLOSED',
        DNSSuccess: status !== 'CLOSED',
        Details: status === 'OPEN' 
          ? ['✓ Internet connectivity stable', '✓ Network latency normal'] 
          : ['⚠ Network connectivity issues', '✗ High latency detected']
      },
      printer: {
        Status: status === 'OPEN' ? 'HEALTHY' : 'FAILED',
        ServiceRunning: status === 'OPEN',
        ServiceState: status === 'OPEN' ? 'Running' : 'Stopped'
      },
      disk: {
        Status: status === 'OPEN' ? 'HEALTHY' : 
               status === 'LIMITED' ? 'WARNING' : 'CRITICAL',
        FreeGB: status === 'OPEN' ? 156.3 :
                status === 'LIMITED' ? 18.7 : 3.2,
        TotalGB: 500,
        PercentFree: status === 'OPEN' ? 31.3 :
                     status === 'LIMITED' ? 3.7 : 0.6,
        Drive: 'C:'
      }
    };
  }

  private getDefaultChecks(): DeviceData['checks'] {
    return {
      network: {
        Status: 'UNKNOWN',
        PingSuccess: false,
        DNSSuccess: false,
        Details: []
      },
      printer: {
        Status: 'UNKNOWN',
        ServiceRunning: false,
        ServiceState: 'Unknown'
      },
      disk: {
        Status: 'UNKNOWN',
        FreeGB: 0,
        TotalGB: 0,
        PercentFree: 0,
        Drive: 'C:'
      }
    };
  }

  // Get all public devices (filtered for public view)
  async getPublicDevices(): Promise<DeviceData[]> {
    return new Promise((resolve) => {
      this.subscribeToAllDevices((devices: DeviceData[]) => {
        // Filter to only show public/location services
        const publicDevices = devices.filter(device => 
          device.source === 'location' || (device.tags && device.tags.includes('public-service'))
        );
        resolve(publicDevices);
      });
    });
  }

  // Get a single device by ID
  async getDeviceById(deviceId: string): Promise<DeviceData | null> {
    return new Promise((resolve) => {
      this.subscribeToAllDevices((devices: DeviceData[]) => {
        const device = devices.find(d => d.id === deviceId);
        resolve(device || null);
      });
    });
  }

  // Real agent methods (for PowerShell agent data)
  async addOrUpdateDevice(deviceId: string, deviceData: Partial<DeviceData>) {
    if (USE_FLASK_API) {
      // Use Flask API
      try {
        const response = await fetch(`${FLASK_API_BASE}/api/devices/${deviceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deviceData)
        });
        
        if (response.ok) {
          toast.success(`Device ${deviceId} updated`);
          return true;
        } else {
          toast.error('Failed to update device');
          return false;
        }
      } catch (error) {
        console.error('Error updating device:', error);
        toast.error('Failed to update device');
        return false;
      }
    }

    try {
      const deviceRef = doc(this.devicesCollection, deviceId);
      await setDoc(deviceRef, {
        ...deviceData,
        agent: {
          ...deviceData.agent,
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      
      toast.success(`Device ${deviceId} updated`);
      return true;
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
      return false;
    }
  }

  async deleteDevice(deviceId: string) {
    if (USE_FLASK_API) {
      // Use Flask API
      try {
        const response = await fetch(`${FLASK_API_BASE}/api/devices/${deviceId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast.success(`Device ${deviceId} deleted`);
          return true;
        } else {
          toast.error('Failed to delete device');
          return false;
        }
      } catch (error) {
        console.error('Error deleting device:', error);
        toast.error('Failed to delete device');
        return false;
      }
    }

    try {
      const deviceRef = doc(this.devicesCollection, deviceId);
      await deleteDoc(deviceRef);
      toast.success(`Device ${deviceId} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
      return false;
    }
  }

  // Demo simulation (creates in devices collection)
  async simulateDevice(deviceName: string, status: DeviceData['status']['Status']) {
    const deviceId = deviceName.replace(/\s+/g, '-').toUpperCase();
    
    const deviceData: Partial<DeviceData> = {
      agent: {
        version: '1.0.0',
        computerName: deviceName,
        lastUpdated: new Date(),
        timestamp: new Date().toISOString()
      },
      status: {
        Status: status,
        Message: status === 'OPEN' ? 'All systems operational' :
                status === 'LIMITED' ? 'Some systems degraded' :
                'Core systems down - Immediate attention required',
        Code: status === 'OPEN' ? 0 : status === 'LIMITED' ? 1 : 2
      },
      checks: this.getChecksForLocation(status), // Reuse same logic
      actions: {
        repairsCount: status === 'OPEN' ? 0 : 1,
        repairsPerformed: status === 'OPEN' ? [] : [
          { type: 'network', success: true },
          { type: 'printer', success: false }
        ]
      },
      location: 'Main Office',
      type: 'demo',
      tags: status === 'OPEN' ? ['healthy', 'production'] :
            status === 'LIMITED' ? ['warning', 'needs-attention'] :
            ['critical', 'urgent'],
      source: 'agent'
    };

    return this.addOrUpdateDevice(deviceId, deviceData);
  }

  // Health statistics
  getHealthStats(devices: DeviceData[]) {
    const stats = {
      total: devices.length,
      healthy: 0,
      limited: 0,
      critical: 0,
      online: 0,
      agents: devices.filter(d => d.source === 'agent').length,
      locations: devices.filter(d => d.source === 'location').length,
      overall: 'UNKNOWN' as DeviceData['status']['Status'],
      lastUpdated: new Date()
    };

    devices.forEach(device => {
      switch (device.status.Status) {
        case 'OPEN':
          stats.healthy++;
          break;
        case 'LIMITED':
          stats.limited++;
          break;
        case 'CLOSED':
          stats.critical++;
          break;
      }
      
      if (device.checks.network.PingSuccess) {
        stats.online++;
      }
    });

    // Determine overall status
    if (stats.critical > 0) {
      stats.overall = 'CLOSED';
    } else if (stats.limited > 0) {
      stats.overall = 'LIMITED';
    } else if (stats.healthy > 0) {
      stats.overall = 'OPEN';
    }

    return stats;
  }
}

export const firebaseService = new FirebaseService();
export { db };