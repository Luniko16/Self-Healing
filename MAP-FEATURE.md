# 🗺️ Map Feature Documentation

## Overview
The ServicePulse application now includes an interactive map feature that allows users to visualize service locations across South Africa with real-time status indicators.

## Features

### 🎯 Interactive Map View
- **Toggle Views**: Switch between List View and Map View using the toggle buttons
- **Real-time Markers**: Service locations displayed with color-coded status markers
- **Custom Icons**: Different emojis for different service types (🏥 clinics, 🏫 schools, 🏢 offices)
- **Status Colors**: 
  - 🟢 Green: Operational services
  - 🟡 Yellow: Limited services  
  - 🔴 Red: Closed/Critical services

### 📍 Location Coverage
The map covers major South African cities and areas:
- **Johannesburg Central** (-26.2041, 28.0473)
- **Sandton** (-26.1076, 28.0567)
- **Soweto** (-26.2678, 27.8546)
- **Pretoria** (-25.7479, 28.2293)
- **Cape Town** (-33.9249, 18.4241)
- **Durban** (-29.8587, 31.0218)

### 🔍 Interactive Features
- **Clickable Markers**: Click on any marker to see detailed service information
- **Popup Details**: Each marker shows:
  - Service name and location
  - Current operational status
  - Service type (clinic, school, office)
  - Last updated timestamp
  - Network, Printer, and Disk status indicators
- **Auto-fit Bounds**: Map automatically adjusts to show all service locations
- **Selected Service Panel**: Clicking a marker shows detailed service card below the map

### 🛠️ Technical Implementation
- **Mapping Library**: React Leaflet with OpenStreetMap tiles
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Data**: Integrates with existing Flask API endpoints
- **Search Integration**: Map updates based on search filters and queries

## Usage

### Accessing the Map
1. Navigate to http://localhost:5000/search
2. Use the search and filter functionality as normal
3. Click the "Map View" toggle button to switch to map mode
4. Click "List View" to return to the traditional card layout

### Interacting with the Map
1. **View All Services**: The map automatically shows all services matching your current search/filters
2. **Click Markers**: Click any marker to see detailed information
3. **Zoom and Pan**: Use mouse wheel to zoom, click and drag to pan
4. **Mobile Support**: Touch gestures work on mobile devices

### Search and Filter Integration
- All existing search functionality works with the map
- Filtering by status, type, or location updates the map markers
- Text search results are reflected on the map
- Real-time updates refresh map markers

## API Integration

### Enhanced Search Endpoint
The `/api/public/search` endpoint now includes coordinates:
```json
{
  "services": [
    {
      "display_name": "Central Health Clinic",
      "location": "Johannesburg Central",
      "coordinates": [-26.2041, 28.0473],
      "operational": true,
      "service_type": "clinic",
      "status": "Connected",
      "type": "Network"
    }
  ]
}
```

### Real-time Data
- Map markers update automatically with system status changes
- Service status reflects actual Windows service states
- Location data combines real system monitoring with geographic information

## Benefits

### For Citizens
- **Visual Location Finding**: Easily see where services are located geographically
- **Status at a Glance**: Quickly identify which areas have operational services
- **Better Planning**: Plan visits based on geographic proximity and service status

### For Administrators
- **Geographic Overview**: See service distribution across regions
- **Status Monitoring**: Visual representation of system health by location
- **Resource Planning**: Identify areas needing attention or support

## Future Enhancements
- **Clustering**: Group nearby markers when zoomed out
- **Routing**: Directions to service locations
- **Heatmaps**: Service availability density visualization
- **Historical Data**: Time-based status changes on the map
- **Mobile App**: Native mobile map experience

## Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance
- **Lightweight**: Uses efficient OpenStreetMap tiles
- **Responsive**: Fast marker updates and smooth interactions
- **Optimized**: Minimal bundle size impact with tree-shaking
- **Cached**: Map tiles cached for improved performance

---

The map feature enhances the ServicePulse application by providing an intuitive, visual way to understand service availability across South African locations, making it easier for citizens to find and access the services they need.