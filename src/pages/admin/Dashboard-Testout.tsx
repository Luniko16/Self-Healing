import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  Printer, 
  HardDrive, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlusCircle,
  RefreshCw,
  BarChart3,
  Users,
  Globe,
  Info
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { firebaseService } from '../../services/firebase';
import { DeviceData } from '../../types';
import DeviceCard from '../../components/DeviceCard';
import HealthChart from '../../components/HealthChart';
import RealSystemChart from '../../components/RealSystemChart';
import StatusBadge from '../../components/StatusBadge';
import AddDeviceModal from '../../components/AddDeviceModal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [realDiagnostics, setRealDiagnostics] = useState<any>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices((devicesData: DeviceData[]) => {
      setDevices(devicesData);
      setLoading(false);
      if (refreshing) {
        setRefreshing(false);
        toast.success('Devices refreshed');
      }
    });

    // Fetch real diagnostics data
    fetchRealDiagnostics();

    return () => unsubscribe();
  }, [refreshing]);

  const fetchRealDiagnostics = async () => {
    try {
      setDiagnosticsLoading(true);
      const response = await fetch('/api/diagnostics/real-issues');
      if (response.ok) {
        const diagnosticsData = await response.json();
        setRealDiagnostics(diagnosticsData);
        
        // Show toast for critical issues
        if (diagnosticsData.summary?.critical_issues > 0) {
          toast.error(`${diagnosticsData.summary.critical_issues} critical issues detected!`);
        } else if (diagnosticsData.summary?.total_issues > 0) {
          toast(`${diagnosticsData.summary.total_issues} issues found`, {
            icon: '⚠️',
            style: {
              borderLeft: '4px solid #f59e0b',
            },
          });
        } else {
          toast.success('System health check completed - no issues found');
        }
      }
    } catch (error) {
      console.error('Error fetching real diagnostics:', error);
      toast.error('Could not fetch system diagnostics');
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const stats = firebaseService.getHealthStats(devices);

  const handleDeleteDevice = async (deviceId: string) => {
    if (window.confirm(`Are you sure you want to delete device ${deviceId}?`)) {
      await firebaseService.deleteDevice(deviceId);
    }
  };

  const handleAutoFix = async (issue: any) => {
    alert(`Auto-fix called for ${issue.module}: ${issue.description}`);
    
    const issueKey = `${issue.module}_${issue.timestamp}`;
    
    console.log('Starting auto-fix for:', issue);
    
    if (fixingIssues.has(issueKey)) {
      console.log('Already fixing this issue:', issueKey);
      return; // Already fixing this issue
    }

    // Confirmation dialog for critical issues
    if (issue.severity === 'critical') {
      const confirmed = window.confirm(
        `Are you sure you want to auto-fix this critical issue?\n\n` +
        `Module: ${issue.module}\n` +
        `Issue: ${issue.description}\n\n` +
        `This will perform system-level changes.`
      );
      if (!confirmed) return;
    }

    setFixingIssues(prev => new Set(prev).add(issueKey));
    
    try {
      console.log('Showing loading toast for:', issueKey);
      toast.loading(`Fixing ${issue.module} issue...`, { id: issueKey });
      
      console.log('Making API call to auto-fix...');
      const response = await fetch('/api/diagnostics/auto-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: issue.module,
          description: issue.description,
          details: issue.details || {}
        })
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API result:', result);

      if (result.success) {
        console.log('Fix successful, showing success toast');
        toast.success(
          `✅ ${issue.module} issue fixed! Actions: ${result.actions_taken.join(', ')}`,
          { 
            id: issueKey,
            duration: 6000,
            style: {
              maxWidth: '500px',
            }
          }
        );
        
        // Refresh diagnostics after successful fix
        setTimeout(() => {
          console.log('Refreshing diagnostics after fix');
          fetchRealDiagnostics();
        }, 2000);
      } else {
        console.log('Fix failed, showing error toast');
        toast.error(
          `❌ Fix failed: ${result.message}${result.errors?.length ? '. Errors: ' + result.errors.join(', ') : ''}`,
          { 
            id: issueKey,
            duration: 8000,
            style: {
              maxWidth: '500px',
            }
          }
        );
      }
    } catch (error) {
      console.error('Auto-fix error:', error);
      toast.error(`Failed to fix ${issue.module} issue: ${error}`, { id: issueKey });
    } finally {
      console.log('Cleaning up fixing state for:', issueKey);
      setFixingIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueKey);
        return newSet;
      });
    }
  };

  const handleAutoFixAll = async () => {
    if (!realDiagnostics?.critical_issues?.length && !realDiagnostics?.warnings?.length) {
      toast.error('No auto-fixable issues found');
      return;
    }

    const autoFixableIssues = [
      ...(realDiagnostics.critical_issues || []),
      ...(realDiagnostics.warnings || [])
    ].filter(issue => issue.auto_fixable);

    if (autoFixableIssues.length === 0) {
      toast.error('No auto-fixable issues available');
      return;
    }

    const confirmed = window.confirm(
      `Auto-fix ${autoFixableIssues.length} issues?\n\n` +
      `This will attempt to fix:\n` +
      autoFixableIssues.slice(0, 3).map(issue => `• ${issue.module}: ${issue.description.substring(0, 50)}...`).join('\n') +
      (autoFixableIssues.length > 3 ? `\n... and ${autoFixableIssues.length - 3} more` : '') +
      `\n\nThis may take several minutes and will perform system-level changes.`
    );

    if (!confirmed) return;

    toast.loading(`Auto-fixing ${autoFixableIssues.length} issues...`, { id: 'auto-fix-all' });

    let successCount = 0;
    let failCount = 0;

    for (const issue of autoFixableIssues) {
      try {
        const response = await fetch('/api/diagnostics/auto-fix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            module: issue.module,
            description: issue.description,
            details: issue.details || {}
          })
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0 && failCount === 0) {
      toast.success(
        `✅ All ${successCount} issues fixed successfully!`,
        { 
          id: 'auto-fix-all',
          duration: 6000
        }
      );
    } else if (successCount > 0) {
      toast(`⚠️ ${successCount} issues fixed, ${failCount} failed`, {
        id: 'auto-fix-all',
        duration: 8000,
        style: {
          borderLeft: '4px solid #f59e0b',
        }
      });
    } else {
      toast.error(`❌ All ${failCount} auto-fix attempts failed`, { id: 'auto-fix-all' });
    }

    // Refresh diagnostics after batch fix
    setTimeout(() => {
      fetchRealDiagnostics();
    }, 3000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRealDiagnostics(); // Also refresh diagnostics
  };

  const quickAddDevice = (name: string, status: DeviceData['status']['Status']) => {
    firebaseService.simulateDevice(name, status);
  };

  return (
    <div className="bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'toast',
          duration: 4000,
        }}
      />

      <AddDeviceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Server className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Real-time monitoring of {stats.total} Windows device{stats.total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden lg:block">
                <StatusBadge status={stats.overall} size="lg" />
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Device
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">Total Devices</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Healthy</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.healthy}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 font-medium">Limited</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.limited}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium">Critical</p>
                <h3 className="text-4xl font-bold text-gray-900 mt-2">{stats.critical}</h3>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          message="Loading ServicePulse Dashboard..." 
          className="text-center"
        />
      </div>
    );
  }

              {/* System Health Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg border-2 ${
                  realDiagnostics.system_health === 'critical' ? 'border-red-200 bg-red-50' :
                  realDiagnostics.system_health === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {realDiagnostics.system_health === 'critical' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : realDiagnostics.system_health === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <span className="font-semibold text-gray-900 capitalize">
                      {realDiagnostics.system_health} Health
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {realDiagnostics.summary?.total_issues || 0} total issues found
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-900">Critical Issues</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {realDiagnostics.summary?.critical_issues || 0}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-gray-900">Warnings</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {realDiagnostics.summary?.warnings || 0}
                  </p>
                </div>
              </div>

        {/* Real System Diagnostics */}
        {realDiagnostics && (
          <div className="mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Real System Diagnostics</h2>
                    <p className="text-sm text-gray-600">
                      Live issues from {realDiagnostics.hostname} • Last scan: {new Date(realDiagnostics.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Test Auto-Fix Button */}
                  <button
                    onClick={() => {
                      console.log('Test button clicked');
                      alert('Test auto-fix button clicked!');
                      handleAutoFix({
                        module: 'disk',
                        description: 'Test disk issue',
                        details: {},
                        timestamp: Date.now(),
                        auto_fixable: true,
                        severity: 'warning'
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    🧪 Test Fix
                  </button>
                  
                  {(realDiagnostics.critical_issues?.length > 0 || realDiagnostics.warnings?.length > 0) && (
                    <button
                      onClick={handleAutoFixAll}
                      disabled={fixingIssues.size > 0}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {fixingIssues.size > 0 ? 'Fixing...' : 'Auto-Fix All'}
                    </button>
                  )}
                  <button
                    onClick={fetchRealDiagnostics}
                    disabled={diagnosticsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${diagnosticsLoading ? 'animate-spin' : ''}`} />
                    {diagnosticsLoading ? 'Scanning...' : 'Rescan'}
                  </button>
                </div>
              </div>

              {/* Critical Issues List */}
              {realDiagnostics.critical_issues && realDiagnostics.critical_issues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Critical Issues Requiring Immediate Attention
                  </h3>
                  <div className="space-y-3">
                    {realDiagnostics.critical_issues.map((issue: any, index: number) => {
                      const issueKey = `${issue.module}_${issue.timestamp}`;
                      const isFixing = fixingIssues.has(issueKey);
                      
                      return (
                        <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded uppercase">
                                  {issue.module}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(issue.timestamp).toLocaleTimeString()}
                                </span>
                                {issue.auto_fixable && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                    Auto-Fixable
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-1">{issue.description}</p>
                              {issue.details && (
                                <div className="text-xs text-gray-600">
                                  {Object.entries(issue.details).map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {issue.auto_fixable && (
                              <button 
                                onClick={() => handleAutoFix(issue)}
                                disabled={isFixing}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {isFixing ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Fixing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Fix Now
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {realDiagnostics.recommendations && realDiagnostics.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    System Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {realDiagnostics.recommendations.map((recommendation: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings List */}
              {realDiagnostics.warnings && realDiagnostics.warnings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Warnings & Recommendations
                  </h3>
                  <div className="space-y-2">
                    {realDiagnostics.warnings.slice(0, 5).map((issue: any, index: number) => {
                      const issueKey = `${issue.module}_${issue.timestamp}`;
                      const isFixing = fixingIssues.has(issueKey);
                      
                      return (
                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded uppercase">
                                  {issue.module}
                                </span>
                                {issue.auto_fixable && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                    Auto-Fixable
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-900">{issue.description}</p>
                            </div>
                            {issue.auto_fixable && (
                              <button 
                                onClick={() => handleAutoFix(issue)}
                                disabled={isFixing}
                                className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                              >
                                {isFixing ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Fixing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Fix
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {realDiagnostics.warnings.length > 5 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        ... and {realDiagnostics.warnings.length - 5} more warnings
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* No Issues Found */}
              {(!realDiagnostics.issues || realDiagnostics.issues.length === 0) && (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">System Health Excellent</h3>
                  <p className="text-gray-600 mb-4">No issues detected in the latest diagnostic scan.</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={fetchRealDiagnostics}
                      disabled={diagnosticsLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${diagnosticsLoading ? 'animate-spin' : ''}`} />
                      {diagnosticsLoading ? 'Scanning...' : 'Run Full Scan'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
          {/* Real System Chart Section */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {realDiagnostics ? 'Real System Analytics' : 'System Health Distribution'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {realDiagnostics 
                        ? 'Live system performance and health metrics' 
                        : `${stats.total} total devices monitored`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchRealDiagnostics}
                  disabled={diagnosticsLoading}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${diagnosticsLoading ? 'animate-spin' : ''}`} />
                  {realDiagnostics ? 'Refresh' : 'Load Real Data'}
                </button>
              </div>
              
              {realDiagnostics ? (
                <RealSystemChart diagnostics={realDiagnostics} />
              ) : devices.length > 0 ? (
                <HealthChart devices={devices} />
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No system data available</p>
                    <button
                      onClick={fetchRealDiagnostics}
                      disabled={diagnosticsLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {diagnosticsLoading ? 'Loading...' : 'Load System Analytics'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & System Status */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <Globe className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => quickAddDevice('CLINIC-PC-01', 'OPEN')}
                  className="w-full py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Add Healthy Clinic PC
                </button>
                <button
                  onClick={() => quickAddDevice('SCHOOL-PC-01', 'LIMITED')}
                  className="w-full py-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Add Limited School PC
                </button>
                <button
                  onClick={() => quickAddDevice('OFFICE-PC-01', 'CLOSED')}
                  className="w-full py-3 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Add Critical Office PC
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-6">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Wifi className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Network Online</span>
                  </div>
                  <span className="font-bold text-green-600">{stats.online}/{stats.total}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Printer className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Print Services</span>
                  </div>
                  <span className={`font-medium ${
                    stats.critical > 0 ? 'text-red-600' : 
                    stats.limited > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stats.critical > 0 ? 'Issues Detected' : 
                     stats.limited > 0 ? 'Partial Issues' : 'All Running'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <HardDrive className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">Storage Health</span>
                  </div>
                  <span className={`font-medium ${
                    stats.critical > 0 ? 'text-red-600' : 
                    stats.limited > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stats.critical > 0 ? 'Critical' : 
                     stats.limited > 0 ? 'Warning' : 'Good'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Managed Devices</h2>
              <p className="text-gray-600 mt-1">
                Real-time status of all connected Windows devices
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="card text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-blue-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Server className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No devices connected yet</h3>
                <p className="text-gray-600 mb-8">
                  Start monitoring by adding your first demo device. The dashboard will show real-time health status, network connectivity, and system metrics.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => quickAddDevice('DEMO-PC-01', 'OPEN')}
                    className="btn-primary"
                  >
                    Add First Device
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-secondary"
                  >
                    Custom Device
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <DeviceCard 
                  key={device.id} 
                  device={device} 
                  onDelete={handleDeleteDevice}
                />
              ))}
            </div>
          )}
        </div>

        {/* Demo Information */}
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <Info className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hackathon Demo Information</h3>
              <p className="text-gray-600 mb-4">
                This is a demo dashboard for the ServicePulse hackathon project. Real devices would connect via the PowerShell agent which sends health data to Firebase in real-time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">PowerShell Agent</div>
                  <div className="text-gray-600">Self-healing Windows agent monitors network, printer, and disk</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">Firebase Integration</div>
                  <div className="text-gray-600">Real-time data sync between agents and dashboard</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">Automatic Repair</div>
                  <div className="text-gray-600">Agent automatically fixes common issues when detected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;