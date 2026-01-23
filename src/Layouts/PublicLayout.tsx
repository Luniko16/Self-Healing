import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity, Search, Info, Shield, Phone } from 'lucide-react';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ServicePulse</h1>
                <p className="text-sm text-gray-500">Real-time Service Status</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Service Status
              </Link>
              <Link to="/search" className="text-gray-700 hover:text-blue-600 font-medium">
                <Search className="w-4 h-4 inline mr-1" />
                Find Services
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
                <Info className="w-4 h-4 inline mr-1" />
                About
              </Link>
              <a href="tel:0800123000" className="text-gray-700 hover:text-blue-600 font-medium">
                <Phone className="w-4 h-4 inline mr-1" />
                Emergency: 0800 123 000
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                to="/admin" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Activity className="w-8 h-8" />
                <span className="text-xl font-bold">ServicePulse</span>
              </div>
              <p className="text-gray-400">
                Real-time service availability monitoring for public institutions.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Service Status</Link></li>
                <li><Link to="/search" className="text-gray-400 hover:text-white">Find Services</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Services</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Healthcare Clinics</li>
                <li className="text-gray-400">Government Offices</li>
                <li className="text-gray-400">Schools & Universities</li>
                <li className="text-gray-400">NGO Services</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Trust & Security</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-green-400">All systems secure</span>
              </div>
              <p className="text-sm text-gray-400">
                Data is updated every 5 minutes. Last refresh: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2026 ServicePulse. Created by Ntsika Mtshixa and Karabo Radebe. Providing transparency in public services.</p>
            <p className="text-sm mt-2">For emergencies, call 0800 123 000</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;