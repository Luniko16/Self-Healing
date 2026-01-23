import React from 'react';

const SimpleMapTest: React.FC = () => {
  return (
    <div style={{ 
      height: '400px', 
      width: '100%', 
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#eff6ff',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h3 style={{ color: '#1e40af', margin: 0 }}>Map Placeholder</h3>
      <p style={{ color: '#3730a3', textAlign: 'center', margin: 0 }}>
        This is where the interactive map would appear.<br/>
        If you can see this, the React component rendering is working.
      </p>
      <div style={{
        width: '200px',
        height: '100px',
        backgroundColor: '#dbeafe',
        border: '1px solid #93c5fd',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1e40af'
      }}>
        🗺️ Map Area
      </div>
    </div>
  );
};

export default SimpleMapTest;