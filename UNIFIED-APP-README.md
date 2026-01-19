# ServicePulse - Unified Application

A comprehensive IT monitoring and self-healing system combining a modern React frontend with a powerful Flask backend.

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Modern Dashboard**: Real-time monitoring interface
- **Public Status Pages**: Citizen-friendly service status
- **Responsive Design**: Works on desktop and mobile
- **TypeScript**: Type-safe development

### Backend (Flask + Python)
- **Self-Healing Agent**: Automated IT issue detection and resolution
- **PowerShell Integration**: Windows system management
- **RESTful API**: JSON endpoints for frontend
- **Real-time Monitoring**: System health checks

## 🚀 Quick Start

### Option 1: Automated Build & Run
```bash
# Install Node.js dependencies and build React app, then start Flask server
python build-and-run.py
```

### Option 2: Manual Setup
```bash
# 1. Install Node.js dependencies
npm install

# 2. Build React frontend
npm run build

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start Flask server (serves React app + API)
cd CrossPlatform/web
python dashboard.py
```

### Option 3: Development Mode
```bash
# Run React dev server + Flask API simultaneously
npm run dev
```

## 🌐 Application URLs

### Unified Application (Production)
- **Main App**: http://localhost:5000
- **Admin Dashboard**: http://localhost:5000/admin
- **Public Status**: http://localhost:5000/status
- **API Endpoints**: http://localhost:5000/api/*

### Legacy Flask Templates (Backward Compatibility)
- **Legacy Dashboard**: http://localhost:5000/legacy
- **Legacy Monitoring**: http://localhost:5000/legacy/monitoring
- **Legacy Public**: http://localhost:5000/legacy/public

### Development Mode
- **React Dev Server**: http://localhost:3000 (with hot reload)
- **Flask API Server**: http://localhost:5000

## 📁 Project Structure

```
ServicePulse/
├── src/                          # React frontend source
│   ├── components/               # React components
│   ├── pages/                   # Page components
│   ├── services/                # API services
│   └── types/                   # TypeScript types
├── public/                      # React public assets
├── build/                       # React build output (generated)
├── CrossPlatform/               # Python backend
│   ├── web/                     # Flask application
│   │   ├── dashboard.py         # Main Flask server
│   │   └── templates/           # Legacy Flask templates
│   ├── modules/                 # Self-healing modules
│   └── src/                     # Python utilities
├── Modules/                     # PowerShell modules
├── build-and-run.py            # Automated build script
├── package.json                # Node.js dependencies
└── requirements.txt            # Python dependencies
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Flask API Configuration
REACT_APP_API_URL=http://localhost:5000

# Optional: Firebase (if using Firebase backend)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config

# Development
REACT_APP_DEBUG=true
```

## 🔌 API Endpoints

### Public Status API
- `GET /api/public/status` - Get service status
- `GET /api/public/search?q=query` - Search services

### Admin API
- `GET /api/status` - Get agent status
- `POST /api/scan` - Start system scan
- `GET /api/results` - Get scan results
- `POST /api/fix/{module}/{issue}` - Fix specific issue

### System Monitoring API
- `GET /api/system/metrics` - System metrics
- `GET /api/software/inventory` - Software inventory
- `GET /api/events/critical` - Critical events
- `GET /api/security/compliance` - Security compliance

## 🛠️ Development

### Frontend Development
```bash
# Start React dev server with hot reload
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Backend Development
```bash
# Start Flask server
cd CrossPlatform/web
python dashboard.py

# Run self-healing agent
cd CrossPlatform
python agent.py
```

### Full Stack Development
```bash
# Run both frontend and backend simultaneously
npm run dev
```

## 🔒 Security Features

- **PowerShell Execution Policy**: Secure script execution
- **Admin Privilege Detection**: Automatic privilege checking
- **Input Validation**: All API inputs validated
- **CORS Configuration**: Secure cross-origin requests
- **Session Management**: Secure session handling

## 📊 Monitoring Features

### IT Admin Dashboard
- Real-time system health monitoring
- Automated issue detection and resolution
- PowerShell integration for Windows management
- Comprehensive reporting and analytics

### Public Status Pages
- Simple, citizen-friendly interface
- Real-time service availability
- Mobile-responsive design
- Automatic refresh every 30 seconds

### Self-Healing Capabilities
- **Network Issues**: Automatic connectivity restoration
- **Disk Space**: Cleanup and optimization
- **Service Management**: Automatic service restart
- **Printer Issues**: Spooler service management

## 🚀 Deployment

### Production Deployment
1. Build React app: `npm run build`
2. Install Python dependencies: `pip install -r requirements.txt`
3. Configure environment variables
4. Start Flask server: `python CrossPlatform/web/dashboard.py`

### Docker Deployment (Optional)
```dockerfile
# Create Dockerfile for containerized deployment
FROM node:16 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY --from=frontend /app/build ./build
COPY CrossPlatform ./CrossPlatform
COPY Modules ./Modules
EXPOSE 5000
CMD ["python", "CrossPlatform/web/dashboard.py"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review the troubleshooting guide
- Open an issue on GitHub

---

**ServicePulse** - Keeping your IT infrastructure healthy and your users happy! 🚀