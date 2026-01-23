import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const TestMap: React.FC = () => {
  const position: [number, number] = [-26.2041, 28.0473]; // Johannesburg

  return (
    <div style={{ height: '400px', width: '100%', border: '2px solid red' }}>
      <h3>Map Container Test</h3>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '350px', width: '100%', border: '1px solid blue' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Test marker in Johannesburg
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default TestMap;