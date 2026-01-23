import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './Layouts/AdminLayout';
import PublicLayout from './Layouts/PublicLayout';
import Dashboard from './pages/admin/Dashboard';
import MapView from './pages/admin/MapView';
import Locations from './pages/admin/Locations';
import AgentStatus from './pages/admin/AgentStatus';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import Alerts from './pages/admin/Alerts';
import PublicStatus from './pages/public/PublicStatus';
import LocationSearch from './pages/public/LocationSearch';
import ServiceDetails from './pages/public/ServiceDetails';
import LoadingScreen from './components/shared/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing ServicePulse...');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app initialization steps
        setLoadingMessage('Connecting to backend services...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setLoadingMessage('Loading system configuration...');
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setLoadingMessage('Preparing dashboard...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Check if backend is available
        try {
          const response = await fetch('/api/status');
          if (response.ok) {
            setLoadingMessage('Backend connected successfully!');
          } else {
            setLoadingMessage('Backend unavailable - using offline mode');
          }
        } catch (error) {
          setLoadingMessage('Backend unavailable - using offline mode');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('App initialization error:', error);
        setLoadingMessage('Initialization complete');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="locations" element={<Locations />} />
          <Route path="agents" element={<AgentStatus />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="notifications" element={<Alerts />} />
        </Route>

        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<PublicStatus />} />
          <Route path="status" element={<PublicStatus />} />
          <Route path="search" element={<LocationSearch />} />
          <Route path="service/:id" element={<ServiceDetails />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;