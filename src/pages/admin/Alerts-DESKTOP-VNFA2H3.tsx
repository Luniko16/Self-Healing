import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Settings,
  Archive,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2
} from 'lucide-react';

const Alerts: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  // Mock alert data
  const alerts = [
    {
      id: '1',
      type: 'critical',
      title: 'Network Connectivity Lost',
      description: 'Main office network connection lost for 15+ minutes',
      location: 'HQ Building - Floor 3',
      time: '2 minutes ago',
      read: false,
      icon: <XCircle className="w-5 h-5 text-red-600" />
    },
    {
      id: '2',
      type: 'warning',
      title: 'Disk Space Low',
      description: 'C: drive below 10% capacity on multiple machines',
      location: 'Accounting Department',
      time: '15 minutes ago',
      read: false,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />
    },
    {
      id: '3',
      type: 'info',
      title: 'Automatic Repair Successful',
      description: 'Printer service restored automatically',
      location: 'Reception Area',
      time: '1 hour ago',
      read: true,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />
    },
    {
      id: '4',
      type: 'critical',
      title: 'Firebase Connection Lost',
      description: 'Unable to sync data with Firebase for 30+ minutes',
      location: 'Server Room',
      time: '3 hours ago',
      read: true,
      icon: <XCircle className="w-5 h-5 text-red-600" />
    },
    {
      id: '5',
      type: 'warning',
      title: 'High CPU Usage',
      description: 'Server CPU consistently above 90%',
      location: 'Data Center',
      time: '5 hours ago',
      read: true,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />
    },
    {
      id: '6',
      type: 'info',
      title: 'Daily Health Report',
      description: 'All systems operational for the past 24 hours',
      location: 'System-wide',
      time: '1 day ago',
      read: true,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />
    },
  ];

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(a => a.id));
    }
  };

  const handleMarkAsRead = () => {
    // Implementation for marking as read
    console.log('Mark as read:', selectedAlerts);
  };

  const handleArchive = () => {
    // Implementation for archiving
    console.log('Archive:', selectedAlerts);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600">Monitor system alerts and notifications</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700">
              {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Alert Settings</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {unreadCount} unread • {criticalCount} critical
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Requiring immediate attention
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Monitoring recommended
          </div>
        </div>
      </div>

      {/* Alerts Container */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Alerts</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warnings Only</option>
                  <option value="info">Info Only</option>
                </select>
              </div>
              
              {selectedAlerts.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    {selectedAlerts.length} selected
                  </span>
                  <button
                    onClick={handleMarkAsRead}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-lg">
                <Archive className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="divide-y">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center">
              <BellOff className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="mt-4 text-gray-600">No alerts found</p>
              <p className="text-sm text-gray-500 mt-1">All systems are operating normally</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !alert.read ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(alert.type)}`}>
                      {alert.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className={`font-bold ${!alert.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(alert.type)}`}>
                          {alert.type.toUpperCase()}
                        </span>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mt-1">{alert.description}</p>
                      
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <span>📍</span>
                          <span>{alert.location}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAlerts([...selectedAlerts, alert.id]);
                        } else {
                          setSelectedAlerts(selectedAlerts.filter(id => id !== alert.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <button className="p-2 hover:bg-gray-200 rounded-lg">
                      {alert.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Channels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">admin@servicepulse.local</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-green-600">✓ Active</span>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Slack</p>
                <p className="text-sm text-gray-600">#service-alerts</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-green-600">✓ Connected</span>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Push</p>
                <p className="text-sm text-gray-600">Mobile devices</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-yellow-600">⚠ Limited</span>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Volume2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">SMS</p>
                <p className="text-sm text-gray-600">Emergency contacts</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-red-600">✗ Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
