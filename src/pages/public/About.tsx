import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Shield, 
  Users, 
  Globe, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Heart,
  Target,
  BarChart3,
  Server,
  Zap,
  Eye,
  TrendingUp,
  Cloud,
  Cpu
} from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Real-time Monitoring',
      description: 'Continuous health checks every 5 minutes'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Auto-repair System',
      description: 'Automatically fixes common issues'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Public Transparency',
      description: 'Citizens can check service status before visiting'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Wide Coverage',
      description: 'Monitors clinics, schools, government offices'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: '24/7 Operation',
      description: 'Continuous monitoring and alerting'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics & Reports',
      description: 'Performance insights and trend analysis'
    }
  ];

  const statusTypes = [
    {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      status: 'OPEN',
      color: 'bg-green-100 text-green-800',
      description: 'All services operational and available'
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      status: 'LIMITED',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Some services affected or limited availability'
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      status: 'CLOSED',
      color: 'bg-red-100 text-red-800',
      description: 'Critical issues or service unavailable'
    }
  ];

  const impactStats = [
    { value: '90%', label: 'Downtime Reduction', icon: <TrendingUp className="w-6 h-6" /> },
    { value: '95%', label: 'Faster Resolution', icon: <Zap className="w-6 h-6" /> },
    { value: '85%', label: 'Public Trust Increase', icon: <Heart className="w-6 h-6" /> },
    { value: '60%', label: 'Support Tickets Reduced', icon: <Cpu className="w-6 h-6" /> }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          About ServicePulse
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A comprehensive solution designed to eliminate service downtime and restore 
          public trust in critical institutions through real-time transparency and 
          automated self-healing.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-gray-700">
            To eliminate preventable service disruptions in public institutions by 
            combining cutting-edge automation with radical transparency. We believe 
            that citizens deserve to know service status before traveling, and 
            institutions deserve tools that prevent failures before they affect users.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
          </div>
          <p className="text-gray-700">
            A future where service downtime is rare, citizens are informed, and 
            institutions are trusted. We envision a world where technology serves 
            people transparently and reliably, especially in critical public services 
            that impact daily lives.
          </p>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          How ServicePulse Works
        </h2>
        
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Deploy PowerShell Agent</h3>
              <p className="text-gray-600">
                Install lightweight PowerShell agents on Windows endpoints in clinics, 
                schools, and government offices. The agent requires no external 
                dependencies and follows least-privilege security principles.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex-shrink-0">
              <Server className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Monitor & Auto-repair</h3>
              <p className="text-gray-600">
                Agents continuously monitor network connectivity, printer services, 
                and disk space. When issues are detected, safe automated repairs are 
                executed without human intervention, fixing common problems in minutes.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex-shrink-0">
              <Activity className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Status Updates</h3>
              <p className="text-gray-600">
                Agent status is sent to Firebase in real-time and displayed on our 
                public dashboard. Citizens can check service availability before 
                traveling, reducing wasted trips and building trust.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex-shrink-0">
              <Cloud className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Dashboard & Analytics</h3>
              <p className="text-gray-600">
                IT teams access comprehensive dashboards with analytics, alerts, 
                and management tools. Track performance trends, receive alerts, 
                and manage all locations from a single interface.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex-shrink-0">
              <BarChart3 className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Types */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Understanding Status Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusTypes.map((status, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${status.color}`}>
                  {status.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{status.status}</h3>
              <p className="text-gray-600">{status.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Stats */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold text-center mb-8">
          Transformative Impact
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {impactStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="flex items-center justify-center gap-2 mb-2">
                {stat.icon}
                <div className="text-sm">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Sectors */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Who We Serve
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Healthcare</h3>
            <p className="text-gray-600 text-sm">Clinics, hospitals, diagnostic centers</p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Government</h3>
            <p className="text-gray-600 text-sm">Public offices, municipal services</p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Education</h3>
            <p className="text-gray-600 text-sm">Schools, colleges, universities</p>
          </div>
          
          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">NGOs & NPOs</h3>
            <p className="text-gray-600 text-sm">Non-profit service organizations</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to Transform Your Services?
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Join institutions that have eliminated preventable downtime and restored 
          public trust through ServicePulse.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            View Service Status
          </Link>
          <Link
            to="/admin"
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-gray-500 text-sm">
        <p>ServicePulse - Making Public Services Reliable and Transparent</p>
        <p className="mt-2">© 2024 ServicePulse. All rights reserved.</p>
      </div>
    </div>
  );
};

export default About;