import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Download, 
  Play, 
  StopCircle, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Code,
  Shield,
  Clock,
  HardDrive,
  Wifi,
  Printer
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';

const AgentStatus: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices(setDevices);
    return () => unsubscribe();
  }, []);

  const agentCommands = [
    { name: 'Check Health', command: 'Get-ServicePulseHealth', description: 'Run health checks' },
    { name: 'Force Repair', command: 'Repair-ServicePulse -Force', description: 'Force all repairs' },
    { name: 'View Logs', command: 'Get-ServicePulseLogs', description: 'Display agent logs' },
    { name: 'Restart Agent', command: 'Restart-ServicePulseAgent', description: 'Restart agent service' },
    { name: 'Update Config', command: 'Update-ServicePulseConfig', description: 'Update configuration' },
    { name: 'Network Test', command: 'Test-ServicePulseNetwork', description: 'Test connectivity' },
  ];

  const deploymentSteps = [
    { step: 1, name: 'Download Agent', description: 'Get PowerShell scripts', status: 'completed' },
    { step: 2, name: 'Configure Settings', description: 'Update config.json', status: 'completed' },
    { step: 3, name: 'Install as Service', description: 'Register scheduled task', status: 'pending' },
    { step: 4, name: 'Test Connection', description: 'Verify Firebase connection', status: 'pending' },
    { step: 5, name: 'Start Monitoring', description: 'Begin automatic checks', status: 'pending' },
  ];

  const getAgentStatus = (device: DeviceData) => {
    const lastUpdate = new Date(device.agent.lastUpdated);
    const now = new Date();
    const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

    if (minutesAgo < 5) return { status: 'active', color: 'text-green-500', label: 'Active' };
    if (minutesAgo < 30) return { status: 'warning', color: 'text-yellow-500', label: 'Delayed' };
    return { status: 'inactive', color: 'text-red-500', label: 'Inactive' };
  };

  const handleDeployAgent = async () => {
    setIsDeploying(true);
    // Simulate deployment
    setTimeout(() => setIsDeploying(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PowerShell Agent Status</h1>
          <p className="text-gray-600">Monitor and manage ServicePulse Windows agents</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Download Agent</span>
          </button>
          
          <button
            onClick={handleDeployAgent}
            disabled={isDeploying}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {isDeploying ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>{isDeploying ? 'Deploying...' : 'Deploy Agent'}</span>
          </button>
        </div>
      </div>

      {/* Deployment Guide */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Terminal className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Agent Deployment Guide</h2>
              <p className="text-gray-600">Step-by-step instructions for deploying PowerShell agents</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Code className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {deploymentSteps.map((step) => (
            <div key={step.step} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : step.step}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{step.name}</h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              <div className="text-sm text-gray-500">
                {step.status === 'completed' ? '✓ Completed' : 'Pending'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Terminal className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => getAgentStatus(d).status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Successful Checks</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.reduce((sum, d) => sum + (d.actions?.repairsCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delayed Agents</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => getAgentStatus(d).status === 'warning').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive Agents</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => getAgentStatus(d).status === 'inactive').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Active Agents</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {devices.slice(0, 5).map((device) => {
                const agentStatus = getAgentStatus(device);
                
                return (
                  <div 
                    key={device.id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedAgent === device.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedAgent(device.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          agentStatus.status === 'active' ? 'bg-green-50' :
                          agentStatus.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
                        }`}>
                          <Terminal className={`w-5 h-5 ${
                            agentStatus.status === 'active' ? 'text-green-600' :
                            agentStatus.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{device.agent.computerName}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-sm ${agentStatus.color}`}>
                              {agentStatus.label}
                            </span>
                            <span className="text-sm text-gray-500">
                              Last update: {new Date(device.agent.lastUpdated).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Wifi className={`w-4 h-4 ${
                            device.checks.network.PingSuccess ? 'text-green-500' : 'text-red-500'
                          }`} />
                          <Printer className={`w-4 h-4 ${
                            device.checks.printer.ServiceRunning ? 'text-green-500' : 'text-red-500'
                          }`} />
                          <HardDrive className={`w-4 h-4 ${
                            device.checks.disk.PercentFree > 10 ? 'text-green-500' : 'text-yellow-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PowerShell Commands */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">PowerShell Commands</h3>
            <div className="space-y-3">
              {agentCommands.map((cmd, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{cmd.name}</span>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Play className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <code className="block text-sm bg-gray-800 text-gray-100 p-2 rounded font-mono">
                    {cmd.command}
                  </code>
                  <p className="text-xs text-gray-500 mt-1">{cmd.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-lg text-gray-900">Agent Security</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Execution Policy</span>
                <span className="font-medium text-green-600">✓ Configured</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Firewall Rules</span>
                <span className="font-medium text-green-600">✓ Allowed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">SSL Certificates</span>
                <span className="font-medium text-green-600">✓ Valid</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Authentication</span>
                <span className="font-medium text-green-600">✓ Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Logs */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Agent Logs</h2>
              <p className="text-gray-600">Real-time monitoring of agent activities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Clear Logs
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Download Logs
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
          <div className="text-green-400 mb-2">PS C:&gt; Get-ServicePulseLogs -Last 10</div>
          <div className="space-y-1 text-gray-300">
            <div>[2024-01-15 14:30:22] INFO: Health check completed - All systems normal</div>
            <div>[2024-01-15 14:25:10] INFO: Network connectivity test passed</div>
            <div>[2024-01-15 14:20:05] WARNING: Disk space below 15% - Cleanup initiated</div>
            <div>[2024-01-15 14:15:33] INFO: Temporary files cleaned - 2.1GB freed</div>
            <div>[2024-01-15 14:10:18] INFO: Print Spooler service restarted successfully</div>
            <div>[2024-01-15 14:05:42] INFO: Agent status reported to Firebase</div>
            <div>[2024-01-15 14:00:00] INFO: Scheduled health check started</div>
            <div className="text-blue-400 animate-pulse">[2024-01-15 13:59:59] INFO: Agent is active and monitoring...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatus;
