import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Building, 
  Server, 
  BarChart3, 
  Settings,
  Bell,
  Globe,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch notifications from API
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to mock data
        setNotifications([
          {
            id: '1',
            type: 'critical',
            title: 'Network Connectivity Lost',
            description: 'Main office network connection lost',
            time: '2 min ago',
            read: false
          },
          {
            id: '2',
            type: 'warning',
            title: 'Disk Space Low',
            description: 'C: drive below 10% capacity',
            time: '15 min ago',
            read: false
          }
        ]);
        setUnreadCount(2);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/admin/map', icon: <MapPin className="w-5 h-5" />, label: 'Map View' },
    { to: '/admin/locations', icon: <Building className="w-5 h-5" />, label: 'Locations' },
    { to: '/admin/agents', icon: <Server className="w-5 h-5" />, label: 'Agent Status' },
    { to: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics' },
    { to: '/admin/alerts', icon: <Bell className="w-5 h-5" />, label: 'Alerts' },
    { to: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-auto md:z-auto md:w-56
        lg:w-64 xl:w-72
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ServicePulse</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin/dashboard'}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">System Administrator</p>
                <p className="text-xs text-gray-500 truncate">admin@servicepulse.local</p>
              </div>
            </div>
            
            <a 
              href="/" 
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mt-2"
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">View Public Page</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold text-gray-900">
                  ServicePulse Admin Dashboard
                </h2>
                <p className="text-sm text-gray-500">Real-time monitoring of IT services</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          <button
                            onClick={() => {
                              navigate('/admin/alerts');
                              setNotificationsOpen(false);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View All
                          </button>
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div 
                              key={notification.id}
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                navigate('/admin/alerts');
                                setNotificationsOpen(false);
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'critical' ? 'bg-red-500' :
                                  notification.type === 'warning' ? 'bg-yellow-500' :
                                  notification.type === 'info' ? 'bg-blue-500' :
                                  'bg-green-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 truncate">
                                    {notification.description}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-xs text-gray-500">
                                      {notification.time}
                                    </p>
                                    {notification.location && (
                                      <>
                                        <span className="text-xs text-gray-400">•</span>
                                        <p className="text-xs text-gray-500">
                                          {notification.location}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {notifications.length > 5 && (
                        <div className="p-3 border-t text-center">
                          <button
                            onClick={() => {
                              navigate('/admin/alerts');
                              setNotificationsOpen(false);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View All {notifications.length} Notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <div className="h-6 w-px bg-gray-200"></div>
              
              <button 
                onClick={() => {
                  // Clear any stored authentication data
                  localStorage.removeItem('authToken');
                  sessionStorage.clear();
                  
                  // Navigate to public page
                  navigate('/');
                  
                  // Optional: Show logout confirmation
                  console.log('User logged out successfully');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2026 ServicePulse. Created by Ntsika Mtshixa and Karabo Radebe. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
              <span className="text-sm text-gray-500">Version 1.0.0</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">System Online</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;