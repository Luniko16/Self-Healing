import React, { useState, useEffect } from 'react';
import { Server, Activity, CheckCircle, AlertTriangle, Loader, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  location: string;
  version: string;
  lastCheck: string;
  uptime: string;
  cpu: number;
  memory: number;
}

const AgentStatus: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const mockAgents: Agent[] = [
        {
          id: 'agent-001',
          name: 'WORKSTATION-01',
          status: 'online',
          location: 'Main Office',
          version: '1.0.0',
          lastCheck: '2 minutes ago',
          uptime: '28 days 5 hours',
          cpu: 15,
          memory: 45
        },
        {
          id: 'agent-002',
          name: 'SERVER-01',
          status: 'online',
          location: 'Main Office',
          version: '1.0.0',
          lastCheck: '1 minute ago',
          uptime: '156 days 12 hours',
          cpu: 28,
          memory: 72
        },
        {
          id: 'agent-003',
          name: 'WORKSTATION-02',
          status: 'online',
          location: 'Cape Town',
          version: '1.0.0',
          lastCheck: '5 minutes ago',
          uptime: '14 days 8 hours',
          cpu: 8,
          memory: 32
        },
        {
          id: 'agent-004',
          name: 'LAPTOP-01',
          status: 'offline',
          location: 'Remote',
          version: '0.9.9',
          lastCheck: '2 hours ago',
          uptime: '2 days 4 hours',
          cpu: 0,
          memory: 0
        },
        {
          id: 'agent-005',
          name: 'SERVER-02',
          status: 'online',
          location: 'Durban',
          version: '1.0.0',
          lastCheck: 'Just now',
          uptime: '89 days 18 hours',
          cpu: 42,
          memory: 68
        }
      ];
      setAgents(mockAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'offline':
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const offlineCount = agents.filter(a => a.status === 'offline').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Status</h1>
            <p className="text-gray-600 mt-1">{agents.length} agent(s) total</p>
          </div>
          <button
            onClick={fetchAgents}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-700 font-medium">Online</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{onlineCount}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-700 font-medium">Offline</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{offlineCount}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-700 font-medium">Avg CPU</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">
              {Math.round(agents.reduce((sum, a) => sum + a.cpu, 0) / agents.length)}%
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-700 font-medium">Avg Memory</div>
            <div className="text-3xl font-bold text-purple-900 mt-2">
              {Math.round(agents.reduce((sum, a) => sum + a.memory, 0) / agents.length)}%
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Agent Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">CPU / Memory</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Uptime</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Check</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Server className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-500">v{agent.version}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(agent.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{agent.location}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">{agent.cpu}%</div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${agent.cpu > 80 ? 'bg-red-500' : agent.cpu > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${agent.cpu}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">{agent.memory}%</div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${agent.memory > 80 ? 'bg-red-500' : agent.memory > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${agent.memory}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{agent.uptime}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{agent.lastCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentStatus;
