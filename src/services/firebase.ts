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
    if (USE_FLASK_API) {
      // Use Flask API polling
      this.pollFlaskAPI(callback);
      return () => {}; // Return empty unsubscribe function
    }

    console.log('🔥 FirebaseService: Starting to listen to all devices...');
    const allDevices: DeviceData[] = [];
    
    // 1. Subscribe to real agent devices
    console.log('📁 Listening to "devices" collection...');
    const devicesQuery = query(this.devicesCollection, orderBy('agent.lastUpdated', 'desc'));
    const devicesUnsub = onSnapshot(devicesQuery,
      (snapshot) => {
        console.log(`💻 Got ${snapshot.size} agent device documents:`);
        snapshot.forEach((docSnapshot) => {
          console.log(`  - ${docSnapshot.id}:`, docSnapshot.data());
        });
        // Clear previous agent devices
        const agentDevices = allDevices.filter(d => d.source !== 'location');
        allDevices.length = 0;
        allDevices.push(...agentDevices);
        
        // Add new agent devices
        snapshot.forEach((docSnapshot) => {
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
      },
      (error) => {
        console.error('❌ Devices collection error:', error);
        toast.error('Failed to load agent devices');
      }
    );

    // 2. Subscribe to location data (your existing 4 locations)
    console.log('📍 Listening to "locations" collection...');
    const locationsUnsub = onSnapshot(this.locationsCollection,
      (snapshot) => {
        console.log(`🏢 Got ${snapshot.size} location documents:`);
        snapshot.forEach((docSnapshot) => {
          console.log(`  - ${docSnapshot.id}:`, docSnapshot.data());
        });
        // Add location devices (these are static/demo)
        snapshot.forEach((docSnapshot) => {
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
      },
      (error) => {
        console.error('Locations collection error:', error);
        toast.error('Failed to load location data');
      }
    );

    return () => {
      devicesUnsub();
      locationsUnsub();
    };
  }

  // Flask API polling method
  private async pollFlaskAPI(callback: (devices: DeviceData[]) => void) {
    const poll = async () => {
      try {
        const response = await fetch(`${FLASK_API_BASE}/api/public/status`);
        if (response.ok) {
          const data = await response.json();
          const devices = this.convertFlaskDataToDevices(data);
          callback(devices);
        } else {
          console.error('Failed to fetch from Flask API');
        }
      } catch (error) {
        console.error('Error polling Flask API:', error);
      }
    };

    // Initial poll
    poll();
    
    // Poll every 30 seconds
    const interval = setInterval(poll, 30000);
    
    return () => clearInterval(interval);
  }

  // Convert Flask API data to DeviceData format
  private convertFlaskDataToDevices(flaskData: any): DeviceData[] {
    const devices: DeviceData[] = [];
    
    if (flaskData.services && Array.isArray(flaskData.services)) {
      flaskData.services.forEach((service: any, index: number) => {
        const device: DeviceData = {
          id: `flask_service_${index}`,
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
              Status: service.operational ? 'HEALTHY' : 'FAILED',
              PingSuccess: service.operational,
              DNSSuccess: service.operational,
              Details: []
            },
            printer: {
              Status: service.operational ? 'HEALTHY' : 'FAILED',
              ServiceRunning: service.operational,
              ServiceState: service.operational ? 'Running' : 'Stopped'
            },
            disk: {
              Status: service.operational ? 'HEALTHY' : 'CRITICAL',
              FreeGB: service.operational ? 100 : 5,
              TotalGB: 500,
              PercentFree: service.operational ? 20 : 1,
              Drive: 'C:'
            }
          },
          actions: { repairsCount: 0 },
          location: 'Flask Backend',
          type: 'server',
          tags: ['flask-api'],
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