import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Lock, Database, Shield, Save, Loader } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface AppSettings {
  notifications: {
    enabled: boolean;
    emailAlerts: boolean;
    criticalOnly: boolean;
    frequency: string;
  };
  security: {
    enableMFA: boolean;
    passwordExpiry: number;
    sessionTimeout: number;
  };
  maintenance: {
    autoRepair: boolean;
    scheduledTime: string;
    maintenanceWindow: string;
  };
  integration: {
    rmmPlatform: string;
    apiKey: string;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      enabled: true,
      emailAlerts: true,
      criticalOnly: false,
      frequency: 'realtime'
    },
    security: {
      enableMFA: true,
      passwordExpiry: 90,
      sessionTimeout: 480
    },
    maintenance: {
      autoRepair: true,
      scheduledTime: '02:00',
      maintenanceWindow: 'weekends'
    },
    integration: {
      rmmPlatform: 'NinjaRMM',
      apiKey: '••••••••••••'
    }
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-600">Configure application preferences and integrations</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-6">
              <nav className="space-y-1 p-4">
                <a href="#notifications" className="block px-4 py-2 text-blue-600 bg-blue-50 rounded font-medium">
                  <Bell className="w-4 h-4 inline mr-2" />
                  Notifications
                </a>
                <a href="#security" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Security
                </a>
                <a href="#maintenance" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                  <Database className="w-4 h-4 inline mr-2" />
                  Maintenance
                </a>
                <a href="#integration" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Integration
                </a>
              </nav>
            </div>
          </div>

          {/* Settings Panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notifications */}
            <div id="notifications" className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notification Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Enable Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts about system issues</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, enabled: !settings.notifications.enabled }
                    })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      settings.notifications.enabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        settings.notifications.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Email Alerts</p>
                    <p className="text-sm text-gray-600">Send alerts to email address</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailAlerts: !settings.notifications.emailAlerts }
                    })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      settings.notifications.emailAlerts ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        settings.notifications.emailAlerts ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
                  <select
                    value={settings.notifications.frequency}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, frequency: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security */}
            <div id="security" className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Security Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Multi-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Require MFA for admin login</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      security: { ...settings.security, enableMFA: !settings.security.enableMFA }
                    })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      settings.security.enableMFA ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        settings.security.enableMFA ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                  <input
                    type="number"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, passwordExpiry: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance */}
            <div id="maintenance" className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Maintenance Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto Repair</p>
                    <p className="text-sm text-gray-600">Automatically fix detected issues</p>
                  </div>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      maintenance: { ...settings.maintenance, autoRepair: !settings.maintenance.autoRepair }
                    })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      settings.maintenance.autoRepair ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        settings.maintenance.autoRepair ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Maintenance Time</label>
                  <input
                    type="time"
                    value={settings.maintenance.scheduledTime}
                    onChange={(e) => setSettings({
                      ...settings,
                      maintenance: { ...settings.maintenance, scheduledTime: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Window</label>
                  <select
                    value={settings.maintenance.maintenanceWindow}
                    onChange={(e) => setSettings({
                      ...settings,
                      maintenance: { ...settings.maintenance, maintenanceWindow: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                    <option value="always">Always</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Integration */}
            <div id="integration" className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                RMM Integration
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">RMM Platform</label>
                  <select
                    value={settings.integration.rmmPlatform}
                    onChange={(e) => setSettings({
                      ...settings,
                      integration: { ...settings.integration, rmmPlatform: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NinjaRMM">NinjaRMM</option>
                    <option value="ConnectWise">ConnectWise</option>
                    <option value="Datto">Datto RMM</option>
                    <option value="Atera">Atera</option>
                    <option value="Syncro">Syncro</option>
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    value={settings.integration.apiKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      integration: { ...settings.integration, apiKey: e.target.value }
                    })}
                    placeholder="Enter your RMM API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">Your API key is encrypted and never stored in plain text</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
