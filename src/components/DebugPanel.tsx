import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebase';
import { DeviceData } from '../types';
import { X, Copy } from 'lucide-react';

const DebugPanel = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [firestoreData, setFirestoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAllDevices((devicesData) => {
      console.log('📊 DebugPanel: Received devices:', devicesData);
      setDevices(devicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Test direct Firestore access
  const testDirectAccess = async () => {
    try {
      const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
      console.log('🔧 Testing direct Firestore access for project:', projectId);
      
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/locations`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const data = await response.json();
      console.log('🔧 Direct Firestore response:', data);
      setFirestoreData(data);
    } catch (error) {
      console.error('Direct access error:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-50 shadow-lg rounded-lg p-4 border border-yellow-200 z-50">
        <p className="text-sm text-yellow-800">📊 Loading debug info...</p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50 text-sm font-medium flex items-center gap-2"
      >
        🐛 Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-2xl rounded-lg max-w-md max-h-96 overflow-auto z-50 border border-gray-300">
      {/* Header */}
      <div className="sticky top-0 bg-blue-600 text-white px-4 py-3 flex items-center justify-between border-b">
        <h3 className="font-bold text-lg">🐛 Firebase Debug</h3>
        <button
          onClick={() => setExpanded(false)}
          className="hover:bg-blue-700 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Actions */}
        <div>
          <button
            onClick={testDirectAccess}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium w-full transition-colors"
          >
            Test Direct Firestore
          </button>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 rounded p-3 border border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">📈 Summary</h4>
          <div className="text-xs space-y-1 text-gray-700">
            <div className="flex justify-between">
              <span>Total Devices:</span>
              <span className="font-bold">{devices.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Live Agents:</span>
              <span className="font-bold text-blue-600">{devices.filter(d => d.source === 'agent').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Public Services:</span>
              <span className="font-bold text-purple-600">{devices.filter(d => d.source === 'location').length}</span>
            </div>
          </div>
        </div>

        {/* Device List */}
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">📋 Devices</h4>
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {devices.length === 0 ? (
              <p className="text-gray-500 italic">No devices found</p>
            ) : (
              devices.map(device => (
                <div key={device.id} className="flex items-start gap-2 p-1.5 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => copyToClipboard(device.id)}>
                  <span className={`px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${
                    device.source === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {device.source === 'agent' ? 'A' : 'L'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs truncate text-gray-800">{device.id}</div>
                    <div className="text-xs text-gray-600">{device.agent.computerName}</div>
                    <div className={`text-xs font-medium ${
                      device.status.Status === 'OPEN' ? 'text-green-600' :
                      device.status.Status === 'LIMITED' ? 'text-yellow-600' :
                      device.status.Status === 'CLOSED' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {device.status.Status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {copied && <p className="text-xs text-green-600 mt-1">✓ Copied to clipboard</p>}
        </div>

        {/* Firestore Raw Response */}
        {firestoreData && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">🔍 Firestore Response</h4>
            <div className="bg-gray-900 text-green-400 text-xs p-2 rounded font-mono overflow-x-auto max-h-32 overflow-y-auto">
              <pre>{JSON.stringify(firestoreData, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Project Info */}
        <div className="bg-gray-50 rounded p-2 border border-gray-200">
          <h4 className="font-semibold text-xs text-gray-700 mb-1">⚙️ Config</h4>
          <div className="text-xs text-gray-600 space-y-0.5 font-mono">
            <div className="truncate">Project: {process.env.REACT_APP_FIREBASE_PROJECT_ID}</div>
            <div className="truncate">Auth Domain: {process.env.REACT_APP_FIREBASE_AUTH_DOMAIN}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
