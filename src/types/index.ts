export interface DeviceData {
  id: string;
  agent: {
    version: string;
    computerName: string;
    lastUpdated: Date | any;
    timestamp?: string;
  };
  status: {
    Status: 'OPEN' | 'LIMITED' | 'CLOSED' | 'UNKNOWN';
    Message: string;
    Code: number;
  };
  checks: {
    network: {
      Status: string;
      PingSuccess: boolean;
      DNSSuccess: boolean;
      Details?: string[];
    };
    printer: {
      Status: string;
      ServiceRunning: boolean;
      ServiceState?: string;
    };
    disk: {
      Status: string;
      FreeGB: number;
      TotalGB?: number;
      PercentFree: number;
      Drive?: string;
    };
  };
  actions?: {
    repairsCount: number;
    repairsPerformed?: Array<{
      type: string;
      success: boolean;
    }>;
  };
  location?: string;
  type?: 'clinic' | 'school' | 'office' | 'server' | 'demo';
  tags?: string[];
  source?: 'agent' | 'location';
}

export interface HealthStats {
  total: number;
  healthy: number;
  limited: number;
  critical: number;
  online: number;
  agents: number;
  locations: number;
  overall: 'OPEN' | 'LIMITED' | 'CLOSED' | 'UNKNOWN';
  lastUpdated: Date;
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}