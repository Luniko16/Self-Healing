import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin,
  Zap,
  Loader,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  location?: string;
  time: string;
  module: string;
  severity: string;
  status: 'active' | 'resolved' | 'ignored';
  canFix?: boolean;
  fixable?: boolean;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved' | 'ignored'>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const alerts = (data.notifications || []).map((notif: any, idx: number) => ({
          id: notif.id || `alert-${idx}`,
          type: notif.type || 'info',
          title: notif.title,
          description: notif.description,
          location: notif.location || 'System-wide',
          time: notif.time,
          module: extractModuleFromTitle(notif.title),
          severity: notif.type === 'critical' ? 'Critical' : notif.type === 'warning' ? 'Warning' : 'Info',
          status: 'active' as const,
          canFix: notif.type === 'critical' || notif.type === 'warning',
          fixable: true
        }));
        setAlerts(alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Fallback to mock data
      setAlerts([
        {
          id: '1',
          type: 'critical',
          title: 'Network Connectivity Lost',
          description: 'Main office network connection lost. DNS resolution failing.',
          location: 'Main Office',
          time: '2 min ago',
          module: 'Network',
          severity: 'Critical',
          status: 'active',
          canFix: true,
          fixable: true
        },
        {
          id: '2',
          type: 'warning',
          title: 'Disk Space Low',
          description: 'C: drive below 10% capacity. Recommend cleanup of temporary files.',
          location: 'Server-01',
          time: '15 min ago',
          module: 'Disk',
          severity: 'Warning',
          status: 'active',
          canFix: true,
          fixable: true
        },
        {
          id: '3',
          type: 'warning',
          title: 'Print Spooler Service Down',
          description: 'Print spooler service is not running. Printer unavailable.',
          location: 'Workstation-05',
          time: '1 hour ago',
          module: 'Printer',
          severity: 'Warning',
          status: 'active',
          canFix: true,
          fixable: true
        },
        {
          id: '4',
          type: 'success',
          title: 'DHCP Service Restored',
          description: 'DHCP service has been successfully restarted and is operational.',
          location: 'Network',
          time: '3 hours ago',
          module: 'Network',
          severity: 'Info',
          status: 'resolved',
          canFix: false,
          fixable: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAlert = async (alert: Alert) => {
    if (!window.confirm(`Fix this issue: ${alert.title}?`)) {
      return;
    }

    setFixing(alert.id);
    try {
      toast.loading('Attempting to fix issue...');
      
      // Simulate fix operation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update alert status
      setAlerts(alerts.map(a => 
        a.id === alert.id 
          ? { ...a, status: 'resolved' as const, type: 'success' as const }
          : a
      ));

      toast.success(`Successfully fixed: ${alert.title}`);
    } catch (error) {
      console.error('Error fixing alert:', error);
      toast.error('Failed to fix issue');
    } finally {
      setFixing(null);
    }
  };

  const handleIgnoreAlert = (alertId: string) => {
    setAlerts(alerts.map(a =>
      a.id === alertId
        ? { ...a, status: 'ignored' as const }
        : a
      ));
    toast.success('Alert ignored');
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(alerts.map(a =>
      a.id === alertId
        ? { ...a, status: 'resolved' as const }
        : a
      ));
    toast.success('Alert marked as resolved');
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    return true;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="text-gray-600 mt-1">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={fetchAlerts}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                const csv = alerts.map(a => 
                  `"${a.title}","${a.severity}","${a.status}","${a.time}"`
                ).join('\n');
                const link = document.createElement('a');
                link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
                link.download = 'alerts.csv';
                link.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-6">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts</h3>
            <p className="text-gray-600">All systems are operating normally</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alert.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {alert.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {alert.module}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {alert.canFix && alert.status === 'active' && (
                      <button
                        onClick={() => handleFixAlert(alert)}
                        disabled={fixing === alert.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {fixing === alert.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Fixing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Fix Now
                          </>
                        )}
                      </button>
                    )}

                    {alert.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleIgnoreAlert(alert.id)}
                          className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                          Ignore
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function extractModuleFromTitle(title: string): string {
  if (title.toLowerCase().includes('network')) return 'Network';
  if (title.toLowerCase().includes('disk') || title.toLowerCase().includes('space')) return 'Disk';
  if (title.toLowerCase().includes('print')) return 'Printer';
  if (title.toLowerCase().includes('service')) return 'Service';
  return 'System';
}

export default Alerts;
