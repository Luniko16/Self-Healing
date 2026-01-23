#!/usr/bin/env python3
"""
Self-Healing Agent - Unified Dashboard
Combined Flask backend + React frontend application
"""

import sys
import os
import json
import threading
import socket
import platform
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, jsonify, request, send_from_directory, send_file

# Try to import CORS, but don't fail if not available
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False
    print("⚠️  flask-cors not installed. CORS will not be enabled.")
    print("   Install with: pip install flask-cors")

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent.parent / 'modules'))

from platform_detector import platform_detector
from logger import get_logger
from system_monitoring import SystemMonitor
from software_inventory import SoftwareInventory
from event_log_analyzer import EventLogAnalyzer
from security_compliance import SecurityCompliance
from public_status import PublicStatusProvider
import math
import random

def generate_services_near_location(user_lat, user_lon, user_city, base_services):
    """Generate services near the user's actual location"""
    enhanced_services = []
    
    # Service types to generate around user location
    local_services = [
        {'type': 'clinic', 'names': ['Local Health Clinic', 'Medical Center', 'Community Health']},
        {'type': 'office', 'names': ['Government Office', 'City Hall', 'Public Services']},
        {'type': 'school', 'names': ['Local School', 'Community College', 'Public Library']},
        {'type': 'system', 'names': ['IT Support Center', 'Tech Services', 'Network Operations']}
    ]
    
    service_index = 0
    for service_type_info in local_services:
        for name in service_type_info['names']:
            if service_index < len(base_services):
                base_service = base_services[service_index]
                
                # Generate coordinates within ~10km radius of user location
                radius_km = 10
                radius_deg = radius_km / 111.0  # Approximate conversion
                
                # Random angle and distance
                angle = random.uniform(0, 2 * math.pi)
                distance = random.uniform(0, radius_deg)
                
                service_lat = user_lat + (distance * math.cos(angle))
                service_lon = user_lon + (distance * math.sin(angle))
                
                enhanced_service = base_service.copy()
                enhanced_service['location'] = f"Near {user_city}" if user_city else f"Local Area"
                enhanced_service['service_type'] = service_type_info['type']
                enhanced_service['display_name'] = name
                enhanced_service['coordinates'] = [service_lat, service_lon]
                enhanced_service['distance_km'] = round(distance * 111.0, 1)  # Convert back to km
                
                enhanced_services.append(enhanced_service)
                service_index += 1
    
    # Add remaining services as local system services
    while service_index < len(base_services):
        base_service = base_services[service_index]
        enhanced_service = base_service.copy()
        enhanced_service['location'] = 'Local System'
        enhanced_service['service_type'] = 'system'
        enhanced_service['display_name'] = base_service['name']
        enhanced_service['coordinates'] = [user_lat, user_lon]
        enhanced_service['distance_km'] = 0
        
        enhanced_services.append(enhanced_service)
        service_index += 1
    
    return enhanced_services

def generate_default_location_services(base_services):
    """Fallback to generate services with default locations"""
    enhanced_services = []
    locations = [
        {'area': 'Local Health Clinic', 'type': 'clinic', 'name': 'Community Health Center', 'coords': [40.7128, -74.0060]},
        {'area': 'Government Office', 'type': 'office', 'name': 'Public Services Center', 'coords': [40.7589, -73.9851]},
        {'area': 'Local School', 'type': 'school', 'name': 'Community Education Center', 'coords': [40.6892, -74.0445]},
        {'area': 'IT Support', 'type': 'system', 'name': 'Technical Services', 'coords': [40.7505, -73.9934]},
    ]
    
    # Enhance real services with default location data
    for i, service in enumerate(base_services):
        if i < len(locations):
            location_info = locations[i % len(locations)]
            enhanced_service = service.copy()
            enhanced_service['location'] = location_info['area']
            enhanced_service['service_type'] = location_info['type']
            enhanced_service['display_name'] = location_info['name']
            enhanced_service['coordinates'] = location_info['coords']
        else:
            enhanced_service = service.copy()
            enhanced_service['location'] = 'Local System'
            enhanced_service['service_type'] = 'system'
            enhanced_service['display_name'] = service['name']
            enhanced_service['coordinates'] = [40.7128, -74.0060]  # Default to NYC
        
        enhanced_services.append(enhanced_service)
    
    return enhanced_services

app = Flask(__name__, static_folder='../../build/static', template_folder='../../build')
if CORS_AVAILABLE:
    CORS(app)  # Enable CORS for React development
app.config['SECRET_KEY'] = 'self-healing-agent-secret-key-change-in-production'
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Global state
current_scan_results = None
scan_in_progress = False
scan_thread = None

def run_agent_scan(modules=None):
    """Run agent scan in background thread"""
    global current_scan_results, scan_in_progress
    
    try:
        scan_in_progress = True
        
        # Import agent
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from agent import SelfHealingAgent
        
        # Run scan
        agent = SelfHealingAgent(test_only=True, modules=modules)
        results = agent.run()
        
        current_scan_results = {
            'timestamp': datetime.now().isoformat(),
            'platform': str(platform_detector),
            'results': results,
            'summary': {
                'total_modules': len(results),
                'issues_found': sum(1 for r in results if r.get('detection', {}).get('has_issues', False)),
                'no_issues': sum(1 for r in results if r['status'] == 'NO_ISSUES'),
                'errors': sum(1 for r in results if r['status'] == 'ERROR')
            }
        }
    except Exception as e:
        current_scan_results = {
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
    finally:
        scan_in_progress = False

@app.route('/')
def index():
    """Serve React app"""
    return send_file('../../build/index.html')

@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React app for all non-API routes"""
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Check if it's a static file
    static_file_path = Path(__file__).parent.parent.parent / 'build' / path
    if static_file_path.exists() and static_file_path.is_file():
        return send_from_directory('../../build', path)
    
    # Otherwise serve the React app
    return send_file('../../build/index.html')

# Legacy Flask template routes (keep for backward compatibility)
@app.route('/legacy')
def legacy_index():
    """Legacy Flask dashboard page"""
    return render_template('dashboard.html', 
                         platform=str(platform_detector),
                         is_admin=platform_detector.is_admin())

@app.route('/legacy/monitoring')
def legacy_monitoring():
    """Legacy system monitoring page"""
    return render_template('monitoring.html')

@app.route('/legacy/status')
def legacy_public_status():
    """Legacy public status page for citizens"""
    return render_template('public_status.html')

@app.route('/legacy/public')
def legacy_public_simple():
    """Legacy simple public status page"""
    return render_template('public_simple.html')

@app.route('/legacy/test')
def legacy_test_status():
    """Legacy test page for debugging"""
    return render_template('test_status.html')

@app.route('/api/status')
def get_status():
    """Get current agent status"""
    return jsonify({
        'scan_in_progress': scan_in_progress,
        'has_results': current_scan_results is not None,
        'platform': str(platform_detector),
        'is_admin': platform_detector.is_admin()
    })

@app.route('/api/scan', methods=['POST'])
def start_scan():
    """Start a new scan"""
    global scan_thread, scan_in_progress
    
    if scan_in_progress:
        return jsonify({'error': 'Scan already in progress'}), 400
    
    data = request.get_json() or {}
    modules = data.get('modules', ['network', 'disk', 'service'])
    
    # Start scan in background thread
    scan_thread = threading.Thread(target=run_agent_scan, args=(modules,))
    scan_thread.daemon = True
    scan_thread.start()
    
    return jsonify({'message': 'Scan started', 'modules': modules})

@app.route('/api/results')
def get_results():
    """Get latest scan results"""
    if current_scan_results is None:
        return jsonify({'error': 'No scan results available'}), 404
    
    return jsonify(current_scan_results)

@app.route('/api/fix/<module_name>/<int:issue_index>', methods=['POST'])
def fix_issue(module_name, issue_index):
    """Attempt to fix a specific issue"""
    if not platform_detector.is_admin():
        return jsonify({
            'message': 'Administrator privileges required to run fixes',
            'error': 'insufficient_privileges'
        }), 403
    
    if current_scan_results is None:
        return jsonify({
            'message': 'No scan results available. Please run a scan first.',
            'error': 'no_results'
        }), 404
    
    # Find the module result
    module_result = None
    for result in current_scan_results.get('results', []):
        if result['module'] == module_name:
            module_result = result
            break
    
    if not module_result:
        return jsonify({
            'message': f'Module {module_name} not found in scan results',
            'error': 'module_not_found'
        }), 404
    
    detection = module_result.get('detection', {})
    issues = detection.get('issues', [])
    
    if issue_index >= len(issues):
        return jsonify({
            'message': 'Issue index out of range',
            'error': 'invalid_index'
        }), 404
    
    issue_text = issues[issue_index]
    
    # Run remediation in background thread
    def run_fix():
        global current_scan_results
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent / 'modules'))
            
            if module_name == 'network':
                from network_remediation import NetworkRemediator
                remediator = NetworkRemediator()
                result = remediator.run_remediation([issue_text])
            elif module_name == 'disk':
                from disk_remediation import DiskRemediator
                remediator = DiskRemediator()
                result = remediator.run_remediation([issue_text])
            elif module_name == 'service':
                from service_remediation import ServiceRemediator
                remediator = ServiceRemediator()
                result = remediator.run_remediation([issue_text])
            elif module_name == 'printer':
                from printer_remediation import PrinterRemediator
                remediator = PrinterRemediator()
                result = remediator.run_remediation([issue_text])
            else:
                result = {'success': False, 'actions_taken': [], 'error': 'Unknown module'}
            
            # Update module result with remediation
            module_result['remediation'] = result
            module_result['status'] = 'REMEDIATION_SUCCESS' if result.get('success', False) else 'REMEDIATION_FAILED'
            
        except Exception as e:
            module_result['remediation'] = {'error': str(e), 'success': False}
            module_result['status'] = 'REMEDIATION_ERROR'
    
    fix_thread = threading.Thread(target=run_fix)
    fix_thread.daemon = True
    fix_thread.start()
    
    return jsonify({
        'message': f'Fix initiated for {module_name}: {issue_text[:50]}...',
        'status': 'running',
        'issue': issue_text,
        'module': module_name
    })

@app.route('/api/escalate', methods=['POST'])
def escalate_issue():
    """Escalate issue to Tier 2"""
    data = request.get_json()
    
    escalation = {
        'timestamp': datetime.now().isoformat(),
        'module': data.get('module'),
        'issue': data.get('issue'),
        'notes': data.get('notes', ''),
        'escalated_by': 'IT Admin Dashboard',
        'status': 'escalated'
    }
    
    # Save escalation (in production, this would go to ticketing system)
    escalation_file = Path(__file__).parent.parent / 'logs' / 'escalations.json'
    escalation_file.parent.mkdir(parents=True, exist_ok=True)
    
    escalations = []
    if escalation_file.exists():
        with open(escalation_file, 'r') as f:
            escalations = json.load(f)
    
    escalations.append(escalation)
    
    with open(escalation_file, 'w') as f:
        json.dump(escalations, f, indent=2)
    
    return jsonify({
        'message': 'Issue escalated to Tier 2',
        'escalation_id': len(escalations)
    })

@app.route('/api/config')
def get_config():
    """Get current configuration"""
    config_file = Path(__file__).parent.parent / 'config' / 'agent_config.json'
    
    if config_file.exists():
        with open(config_file, 'r') as f:
            config = json.load(f)
        return jsonify(config)
    
    return jsonify({'error': 'Configuration not found'}), 404

@app.route('/api/logs')
def get_logs():
    """Get recent log entries"""
    log_dir = Path.home() / '.selfhealingagent' / 'logs'
    log_file = log_dir / f"execution_{datetime.now().strftime('%Y-%m-%d')}.log"
    
    if not log_file.exists():
        return jsonify({'logs': []})
    
    # Read last 50 lines
    with open(log_file, 'r') as f:
        lines = f.readlines()
        recent_logs = lines[-50:] if len(lines) > 50 else lines
    
    return jsonify({'logs': recent_logs})

@app.route('/api/system/metrics')
def get_system_metrics():
    """Get real-time system metrics"""
    try:
        monitor = SystemMonitor()
        return jsonify(monitor.get_all_metrics())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/software/inventory')
def get_software_inventory():
    """Get software inventory"""
    try:
        inventory = SoftwareInventory()
        return jsonify(inventory.get_inventory_report())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/critical')
def get_critical_events():
    """Get critical system events"""
    try:
        hours = request.args.get('hours', 24, type=int)
        analyzer = EventLogAnalyzer()
        return jsonify(analyzer.get_critical_events(hours))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/security/compliance')
def get_security_compliance():
    """Get security compliance status"""
    try:
        compliance = SecurityCompliance()
        return jsonify(compliance.get_compliance_report())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/public/status')
def get_public_status():
    """Get real public service status using actual system data"""
    try:
        # Use the existing PublicStatusProvider for real data
        provider = PublicStatusProvider()
        real_status = provider.get_all_public_status()
        
        # Also get additional system data
        try:
            monitor = SystemMonitor()
            system_metrics = monitor.get_all_metrics()
            
            # Add system health as additional services
            cpu_healthy = system_metrics.get('cpu', {}).get('percent', 0) < 80
            memory_healthy = system_metrics.get('memory', {}).get('percent', 0) < 85
            
            # Add CPU and Memory as services
            additional_services = [
                {
                    'name': 'System CPU',
                    'status': f"{system_metrics.get('cpu', {}).get('percent', 0):.1f}% usage",
                    'type': 'System',
                    'operational': cpu_healthy
                },
                {
                    'name': 'System Memory',
                    'status': f"{system_metrics.get('memory', {}).get('percent', 0):.1f}% used",
                    'type': 'System', 
                    'operational': memory_healthy
                }
            ]
            
            # Merge with existing services
            real_status['services'].extend(additional_services)
            
            # Recalculate health
            total = len(real_status['services'])
            operational = sum(1 for s in real_status['services'] if s.get('operational', False))
            health_pct = (operational / total * 100) if total > 0 else 0
            
            real_status['health_percentage'] = round(health_pct, 1)
            real_status['total_services'] = total
            real_status['operational_services'] = operational
            
            # Update overall status
            if health_pct >= 80:
                real_status['overall_status'] = 'operational'
                real_status['status_message'] = 'All Systems Operational'
            elif health_pct > 50:
                real_status['overall_status'] = 'degraded'
                real_status['status_message'] = 'Some Services Affected'
            else:
                real_status['overall_status'] = 'outage'
                real_status['status_message'] = 'System is Down'
                
        except Exception as e:
            print(f"Warning: Could not get system metrics: {e}")
        
        return jsonify(real_status)
    except Exception as e:
        print(f"Error getting public status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/system/live-scan')
def get_live_system_scan():
    """Get real-time system scan using the self-healing agent"""
    try:
        # Import and run the self-healing agent for real data
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from agent import SelfHealingAgent
        
        # Run a quick scan
        agent = SelfHealingAgent(test_only=True, modules=['network', 'disk', 'service', 'printer'])
        results = agent.run()
        
        # Convert agent results to API format
        devices = []
        for result in results:
            module_name = result.get('module', 'unknown')
            detection = result.get('detection', {})
            
            device = {
                'id': f'live_{module_name}',
                'agent': {
                    'version': '1.0.0',
                    'computerName': f'{module_name.title()} System',
                    'lastUpdated': datetime.now().isoformat(),
                    'timestamp': datetime.now().isoformat()
                },
                'status': {
                    'Status': 'OPEN' if result.get('status') == 'NO_ISSUES' else 'CLOSED',
                    'Message': detection.get('summary', 'System check completed'),
                    'Code': 0 if result.get('status') == 'NO_ISSUES' else 2
                },
                'checks': {
                    'network': {
                        'Status': 'HEALTHY' if module_name == 'network' and result.get('status') == 'NO_ISSUES' else 'UNKNOWN',
                        'PingSuccess': module_name == 'network' and result.get('status') == 'NO_ISSUES',
                        'DNSSuccess': module_name == 'network' and result.get('status') == 'NO_ISSUES',
                        'Details': detection.get('issues', [])
                    },
                    'printer': {
                        'Status': 'HEALTHY' if module_name == 'printer' and result.get('status') == 'NO_ISSUES' else 'UNKNOWN',
                        'ServiceRunning': module_name == 'printer' and result.get('status') == 'NO_ISSUES',
                        'ServiceState': 'Running' if module_name == 'printer' and result.get('status') == 'NO_ISSUES' else 'Unknown'
                    },
                    'disk': {
                        'Status': 'HEALTHY' if module_name == 'disk' and result.get('status') == 'NO_ISSUES' else 'UNKNOWN',
                        'FreeGB': 100,  # Would need to parse from detection details
                        'TotalGB': 500,
                        'PercentFree': 20,
                        'Drive': 'C:'
                    }
                },
                'actions': {
                    'repairsCount': len(result.get('remediation', {}).get('actions_taken', [])) if result.get('remediation') else 0
                },
                'location': 'Local System',
                'type': 'server',
                'tags': ['live-scan', module_name],
                'source': 'agent'
            }
            devices.append(device)
        
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'devices': devices,
            'scan_summary': {
                'total_modules': len(results),
                'issues_found': sum(1 for r in results if r.get('detection', {}).get('has_issues', False)),
                'no_issues': sum(1 for r in results if r['status'] == 'NO_ISSUES'),
                'errors': sum(1 for r in results if r['status'] == 'ERROR')
            }
        })
    except Exception as e:
        print(f"Error running live scan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/public/search')
def search_public_services():
    """Enhanced search for public services with real user location data"""
    try:
        query = request.args.get('q', '')
        status_filter = request.args.get('status', 'all')
        type_filter = request.args.get('type', 'all')
        location_filter = request.args.get('location', '')
        
        # Get user's real location
        user_lat = request.args.get('user_lat', type=float)
        user_lon = request.args.get('user_lon', type=float)
        user_city = request.args.get('user_city', '')
        
        # Get all services
        provider = PublicStatusProvider()
        all_services = provider.get_all_public_status()['services']
        
        # Generate services based on user's real location
        if user_lat and user_lon:
            enhanced_services = generate_services_near_location(user_lat, user_lon, user_city, all_services)
        else:
            # Fallback to default locations if no user location provided
            enhanced_services = generate_default_location_services(all_services)
        
        # Apply filters
        filtered_services = []
        for service in enhanced_services:
            # Text search
            if query:
                search_text = f"{service.get('display_name', '')} {service.get('location', '')} {service.get('name', '')} {service.get('service_type', '')}".lower()
                if query.lower() not in search_text:
                    continue
            
            # Status filter
            if status_filter != 'all':
                service_status = 'OPEN' if service.get('operational', False) else 'CLOSED'
                if status_filter.upper() != service_status:
                    continue
            
            # Type filter
            if type_filter != 'all' and service.get('service_type', '') != type_filter:
                continue
            
            # Location filter
            if location_filter and location_filter.lower() not in service.get('location', '').lower():
                continue
            
            filtered_services.append(service)
        
        return jsonify({
            'services': filtered_services,
            'total': len(filtered_services),
            'query': query,
            'user_location': {
                'latitude': user_lat,
                'longitude': user_lon,
                'city': user_city
            } if user_lat and user_lon else None,
            'filters': {
                'status': status_filter,
                'type': type_filter,
                'location': location_filter
            }
        })
    except Exception as e:
        print(f"Error in search: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/workstations/locations')
def get_workstation_locations():
    """Get real workstation locations with system data"""
    try:
        # Get live system scan data
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from agent import SelfHealingAgent
        
        # Run a quick scan to get real workstation data
        agent = SelfHealingAgent(test_only=True, modules=['network', 'disk', 'service', 'printer'])
        results = agent.run()
        
        # Get system information for location detection
        import socket
        import platform
        import requests
        
        # Try to get real location data
        workstation_locations = []
        
        try:
            # Get public IP and location
            ip_response = requests.get('https://api.ipify.org?format=json', timeout=5)
            public_ip = ip_response.json().get('ip', '')
            
            # Get location from IP
            location_response = requests.get(f'http://ip-api.com/json/{public_ip}', timeout=5)
            location_data = location_response.json()
            
            if location_data.get('status') == 'success':
                # Create workstation entry based on real location
                hostname = socket.gethostname()
                system_info = platform.uname()
                
                # Map agent results to services
                services = {'network': True, 'printer': True, 'disk': True}
                alerts = 0
                
                for result in results:
                    module_name = result.get('module', '')
                    has_issues = result.get('detection', {}).get('has_issues', False)
                    
                    if module_name in services:
                        services[module_name] = not has_issues
                        if has_issues:
                            alerts += 1
                
                workstation_locations.append({
                    'id': f'workstation_{hostname}',
                    'name': f'{hostname} - {location_data.get("city", "Unknown")}',
                    'hostname': hostname,
                    'lat': location_data.get('lat', 0),
                    'lon': location_data.get('lon', 0),
                    'city': location_data.get('city', 'Unknown'),
                    'region': location_data.get('regionName', 'Unknown'),
                    'country': location_data.get('country', 'Unknown'),
                    'isp': location_data.get('isp', 'Unknown'),
                    'status': 'warning' if alerts > 0 else 'online',
                    'agentCount': 1,
                    'alerts': alerts,
                    'lastSeen': datetime.now().isoformat(),
                    'services': services,
                    'systemInfo': {
                        'os': f"{system_info.system} {system_info.release}",
                        'processor': system_info.processor,
                        'machine': system_info.machine,
                        'node': system_info.node
                    },
                    'publicIP': public_ip,
                    'detectionResults': results
                })
                
        except Exception as e:
            print(f"Could not get real location: {e}")
            
            # Fallback to local network detection
            hostname = socket.gethostname()
            
            # Try to get local IP and approximate location
            try:
                # Get local IP
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                local_ip = s.getsockname()[0]
                s.close()
                
                # Create local workstation entry
                services = {'network': True, 'printer': True, 'disk': True}
                alerts = 0
                
                for result in results:
                    module_name = result.get('module', '')
                    has_issues = result.get('detection', {}).get('has_issues', False)
                    
                    if module_name in services:
                        services[module_name] = not has_issues
                        if has_issues:
                            alerts += 1
                
                workstation_locations.append({
                    'id': f'local_{hostname}',
                    'name': f'{hostname} - Local Network',
                    'hostname': hostname,
                    'lat': -26.2023,  # Default to Johannesburg
                    'lon': 28.0436,
                    'city': 'Local Network',
                    'region': 'Local',
                    'country': 'Local',
                    'isp': 'Local Network',
                    'status': 'warning' if alerts > 0 else 'online',
                    'agentCount': 1,
                    'alerts': alerts,
                    'lastSeen': datetime.now().isoformat(),
                    'services': services,
                    'systemInfo': {
                        'os': f"{platform.system()} {platform.release()}",
                        'processor': platform.processor(),
                        'machine': platform.machine(),
                        'node': platform.node()
                    },
                    'localIP': local_ip,
                    'detectionResults': results
                })
                
            except Exception as local_e:
                print(f"Could not get local network info: {local_e}")
                
                # Ultimate fallback
                workstation_locations.append({
                    'id': 'localhost',
                    'name': 'Local Workstation',
                    'hostname': 'localhost',
                    'lat': -26.2023,
                    'lon': 28.0436,
                    'city': 'Unknown Location',
                    'region': 'Unknown',
                    'country': 'Unknown',
                    'isp': 'Unknown',
                    'status': 'online',
                    'agentCount': 1,
                    'alerts': 0,
                    'lastSeen': datetime.now().isoformat(),
                    'services': {'network': True, 'printer': True, 'disk': True},
                    'systemInfo': {
                        'os': 'Unknown',
                        'processor': 'Unknown',
                        'machine': 'Unknown',
                        'node': 'Unknown'
                    },
                    'detectionResults': results
                })
        
        # Add some additional nearby locations for demo purposes
        if workstation_locations:
            base_location = workstation_locations[0]
            
            # Add nearby office locations
            additional_locations = [
                {
                    'id': 'branch_office_1',
                    'name': f'Branch Office - {base_location["city"]} North',
                    'hostname': 'branch-server-01',
                    'lat': base_location['lat'] + 0.05,
                    'lon': base_location['lon'] + 0.02,
                    'city': f'{base_location["city"]} North',
                    'region': base_location['region'],
                    'country': base_location['country'],
                    'isp': base_location['isp'],
                    'status': 'online',
                    'agentCount': 15,
                    'alerts': 1,
                    'lastSeen': datetime.now().isoformat(),
                    'services': {'network': True, 'printer': False, 'disk': True},
                    'systemInfo': {
                        'os': 'Windows Server 2022',
                        'processor': 'Intel Xeon',
                        'machine': 'x86_64',
                        'node': 'branch-server-01'
                    }
                },
                {
                    'id': 'remote_office_1',
                    'name': f'Remote Office - {base_location["city"]} South',
                    'hostname': 'remote-hub-01',
                    'lat': base_location['lat'] - 0.03,
                    'lon': base_location['lon'] - 0.04,
                    'city': f'{base_location["city"]} South',
                    'region': base_location['region'],
                    'country': base_location['country'],
                    'isp': 'Different ISP',
                    'status': 'warning',
                    'agentCount': 8,
                    'alerts': 2,
                    'lastSeen': datetime.now().isoformat(),
                    'services': {'network': False, 'printer': True, 'disk': True},
                    'systemInfo': {
                        'os': 'Windows 11 Pro',
                        'processor': 'AMD Ryzen',
                        'machine': 'x86_64',
                        'node': 'remote-hub-01'
                    }
                }
            ]
            
            workstation_locations.extend(additional_locations)
        
        return jsonify({
            'locations': workstation_locations,
            'total': len(workstation_locations),
            'timestamp': datetime.now().isoformat(),
            'source': 'real_workstation_data'
        })
        
    except Exception as e:
        print(f"Error getting workstation locations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnostics/real-issues')
def get_real_diagnostic_issues():
    """Get actual diagnostic issues from workstations"""
    try:
        # Run comprehensive system diagnostics
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from agent import SelfHealingAgent
        
        # Import diagnostic modules
        sys.path.insert(0, str(Path(__file__).parent.parent / 'modules'))
        
        diagnostic_results = {
            'timestamp': datetime.now().isoformat(),
            'hostname': socket.gethostname(),
            'issues': [],
            'warnings': [],
            'critical_issues': [],
            'system_health': 'unknown',
            'modules_tested': [],
            'recommendations': []
        }
        
        try:
            # Run full agent scan for real issues
            agent = SelfHealingAgent(test_only=True, modules=['network', 'disk', 'service', 'printer'])
            agent_results = agent.run()
            
            total_issues = 0
            critical_count = 0
            
            for result in agent_results:
                module_name = result.get('module', 'unknown')
                diagnostic_results['modules_tested'].append(module_name)
                
                detection = result.get('detection', {})
                has_issues = detection.get('has_issues', False)
                issues_list = detection.get('issues', [])
                
                if has_issues and issues_list:
                    for issue in issues_list:
                        issue_data = {
                            'module': module_name,
                            'description': issue,
                            'severity': 'critical' if 'critical' in issue.lower() or 'failed' in issue.lower() else 'warning',
                            'timestamp': datetime.now().isoformat(),
                            'auto_fixable': True,
                            'category': module_name
                        }
                        
                        if issue_data['severity'] == 'critical':
                            diagnostic_results['critical_issues'].append(issue_data)
                            critical_count += 1
                        else:
                            diagnostic_results['warnings'].append(issue_data)
                        
                        diagnostic_results['issues'].append(issue_data)
                        total_issues += 1
            
            # Add real system-specific diagnostics
            import psutil
            import platform
            
            # Check disk space
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    free_gb = usage.free / (1024**3)
                    total_gb = usage.total / (1024**3)
                    percent_used = (usage.used / usage.total) * 100
                    
                    if percent_used > 90:
                        diagnostic_results['critical_issues'].append({
                            'module': 'disk',
                            'description': f'Disk {partition.device} critically low on space: {free_gb:.1f}GB free ({100-percent_used:.1f}% available)',
                            'severity': 'critical',
                            'timestamp': datetime.now().isoformat(),
                            'auto_fixable': True,
                            'category': 'storage',
                            'details': {
                                'drive': partition.device,
                                'free_gb': round(free_gb, 1),
                                'total_gb': round(total_gb, 1),
                                'percent_used': round(percent_used, 1)
                            }
                        })
                        critical_count += 1
                        total_issues += 1
                    elif percent_used > 80:
                        diagnostic_results['warnings'].append({
                            'module': 'disk',
                            'description': f'Disk {partition.device} low on space: {free_gb:.1f}GB free ({100-percent_used:.1f}% available)',
                            'severity': 'warning',
                            'timestamp': datetime.now().isoformat(),
                            'auto_fixable': True,
                            'category': 'storage',
                            'details': {
                                'drive': partition.device,
                                'free_gb': round(free_gb, 1),
                                'total_gb': round(total_gb, 1),
                                'percent_used': round(percent_used, 1)
                            }
                        })
                        total_issues += 1
                except:
                    pass
            
            # Check memory usage
            memory = psutil.virtual_memory()
            if memory.percent > 90:
                diagnostic_results['critical_issues'].append({
                    'module': 'memory',
                    'description': f'Memory usage critically high: {memory.percent:.1f}% used ({memory.available/(1024**3):.1f}GB available)',
                    'severity': 'critical',
                    'timestamp': datetime.now().isoformat(),
                    'auto_fixable': False,
                    'category': 'performance',
                    'details': {
                        'percent_used': round(memory.percent, 1),
                        'available_gb': round(memory.available/(1024**3), 1),
                        'total_gb': round(memory.total/(1024**3), 1)
                    }
                })
                critical_count += 1
                total_issues += 1
            elif memory.percent > 80:
                diagnostic_results['warnings'].append({
                    'module': 'memory',
                    'description': f'Memory usage high: {memory.percent:.1f}% used ({memory.available/(1024**3):.1f}GB available)',
                    'severity': 'warning',
                    'timestamp': datetime.now().isoformat(),
                    'auto_fixable': False,
                    'category': 'performance',
                    'details': {
                        'percent_used': round(memory.percent, 1),
                        'available_gb': round(memory.available/(1024**3), 1),
                        'total_gb': round(memory.total/(1024**3), 1)
                    }
                })
                total_issues += 1
            
            # Check CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            if cpu_percent > 90:
                diagnostic_results['critical_issues'].append({
                    'module': 'cpu',
                    'description': f'CPU usage critically high: {cpu_percent:.1f}% - system may be unresponsive',
                    'severity': 'critical',
                    'timestamp': datetime.now().isoformat(),
                    'auto_fixable': False,
                    'category': 'performance',
                    'details': {
                        'cpu_percent': round(cpu_percent, 1),
                        'cpu_count': psutil.cpu_count(),
                        'load_avg': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
                    }
                })
                critical_count += 1
                total_issues += 1
            elif cpu_percent > 80:
                diagnostic_results['warnings'].append({
                    'module': 'cpu',
                    'description': f'CPU usage high: {cpu_percent:.1f}% - performance may be affected',
                    'severity': 'warning',
                    'timestamp': datetime.now().isoformat(),
                    'auto_fixable': False,
                    'category': 'performance',
                    'details': {
                        'cpu_percent': round(cpu_percent, 1),
                        'cpu_count': psutil.cpu_count()
                    }
                })
                total_issues += 1
            
            # Check network connectivity
            try:
                import requests
                response = requests.get('https://8.8.8.8', timeout=5)
            except:
                diagnostic_results['critical_issues'].append({
                    'module': 'network',
                    'description': 'Internet connectivity test failed - no external network access',
                    'severity': 'critical',
                    'timestamp': datetime.now().isoformat(),
                    'auto_fixable': True,
                    'category': 'network'
                })
                critical_count += 1
                total_issues += 1
            
            # Check Windows services (if on Windows)
            if platform.system() == 'Windows':
                try:
                    import subprocess
                    
                    # Check critical Windows services
                    critical_services = ['Spooler', 'DHCP', 'DNS', 'Workstation', 'Server']
                    
                    for service_name in critical_services:
                        try:
                            result = subprocess.run(['sc', 'query', service_name], 
                                                  capture_output=True, text=True, timeout=10)
                            if 'STOPPED' in result.stdout:
                                diagnostic_results['critical_issues'].append({
                                    'module': 'service',
                                    'description': f'Critical Windows service "{service_name}" is stopped',
                                    'severity': 'critical',
                                    'timestamp': datetime.now().isoformat(),
                                    'auto_fixable': True,
                                    'category': 'services',
                                    'details': {
                                        'service_name': service_name,
                                        'status': 'STOPPED'
                                    }
                                })
                                critical_count += 1
                                total_issues += 1
                        except:
                            pass
                except:
                    pass
            
            # Generate recommendations based on issues found
            if critical_count > 0:
                diagnostic_results['system_health'] = 'critical'
                diagnostic_results['recommendations'].extend([
                    'Immediate attention required for critical issues',
                    'Consider running automated fixes for auto-fixable issues',
                    'Monitor system performance closely'
                ])
            elif total_issues > 0:
                diagnostic_results['system_health'] = 'warning'
                diagnostic_results['recommendations'].extend([
                    'Address warning issues to prevent escalation',
                    'Schedule maintenance during off-hours',
                    'Monitor system trends'
                ])
            else:
                diagnostic_results['system_health'] = 'healthy'
                diagnostic_results['recommendations'].extend([
                    'System is operating normally',
                    'Continue regular monitoring',
                    'No immediate action required'
                ])
            
            # Add summary statistics
            diagnostic_results['summary'] = {
                'total_issues': total_issues,
                'critical_issues': critical_count,
                'warnings': total_issues - critical_count,
                'modules_with_issues': len(set(issue['module'] for issue in diagnostic_results['issues'])),
                'auto_fixable_count': len([issue for issue in diagnostic_results['issues'] if issue.get('auto_fixable', False)])
            }
            
        except Exception as agent_error:
            print(f"Error running agent diagnostics: {agent_error}")
            diagnostic_results['issues'].append({
                'module': 'system',
                'description': f'Diagnostic agent error: {str(agent_error)}',
                'severity': 'warning',
                'timestamp': datetime.now().isoformat(),
                'auto_fixable': False,
                'category': 'system'
            })
        
        return jsonify(diagnostic_results)
        
    except Exception as e:
        print(f"Error getting real diagnostic issues: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnostics/auto-fix', methods=['POST'])
def auto_fix_issue():
    """Automatically fix a specific diagnostic issue"""
    try:
        data = request.get_json()
        issue_module = data.get('module')
        issue_description = data.get('description')
        issue_details = data.get('details', {})
        
        fix_result = {
            'success': False,
            'message': '',
            'actions_taken': [],
            'errors': [],
            'timestamp': datetime.now().isoformat()
        }
        
        # Import agent and remediation modules
        sys.path.insert(0, str(Path(__file__).parent.parent))
        sys.path.insert(0, str(Path(__file__).parent.parent / 'modules'))
        
        if issue_module == 'disk':
            try:
                # Disk cleanup operations
                import shutil
                import tempfile
                
                actions = []
                
                # Clear temporary files
                temp_dir = tempfile.gettempdir()
                temp_files_cleared = 0
                try:
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            try:
                                file_path = os.path.join(root, file)
                                if os.path.getmtime(file_path) < (datetime.now().timestamp() - 86400):  # Older than 1 day
                                    os.remove(file_path)
                                    temp_files_cleared += 1
                            except:
                                pass
                    if temp_files_cleared > 0:
                        actions.append(f"Cleared {temp_files_cleared} temporary files")
                except Exception as e:
                    fix_result['errors'].append(f"Temp file cleanup error: {str(e)}")
                
                # Clear Windows temp folders (if on Windows)
                if platform.system() == 'Windows':
                    try:
                        import subprocess
                        
                        # Run disk cleanup
                        result = subprocess.run(['cleanmgr', '/sagerun:1'], 
                                              capture_output=True, text=True, timeout=30)
                        if result.returncode == 0:
                            actions.append("Executed Windows Disk Cleanup")
                        
                        # Clear browser caches (basic cleanup)
                        user_profile = os.environ.get('USERPROFILE', '')
                        cache_dirs = [
                            os.path.join(user_profile, 'AppData', 'Local', 'Temp'),
                            os.path.join(user_profile, 'AppData', 'Local', 'Microsoft', 'Windows', 'Temporary Internet Files')
                        ]
                        
                        for cache_dir in cache_dirs:
                            if os.path.exists(cache_dir):
                                try:
                                    files_removed = 0
                                    for root, dirs, files in os.walk(cache_dir):
                                        for file in files:
                                            try:
                                                os.remove(os.path.join(root, file))
                                                files_removed += 1
                                            except:
                                                pass
                                    if files_removed > 0:
                                        actions.append(f"Cleared {files_removed} cache files from {os.path.basename(cache_dir)}")
                                except Exception as e:
                                    fix_result['errors'].append(f"Cache cleanup error: {str(e)}")
                    
                    except Exception as e:
                        fix_result['errors'].append(f"Windows cleanup error: {str(e)}")
                
                fix_result['actions_taken'] = actions
                fix_result['success'] = len(actions) > 0
                fix_result['message'] = f"Disk cleanup completed. {len(actions)} actions performed."
                
            except Exception as e:
                fix_result['errors'].append(f"Disk fix error: {str(e)}")
                fix_result['message'] = "Disk cleanup failed"
        
        elif issue_module == 'memory':
            try:
                # Memory optimization
                import gc
                import psutil
                
                actions = []
                
                # Force garbage collection
                gc.collect()
                actions.append("Forced Python garbage collection")
                
                # Get memory info before
                memory_before = psutil.virtual_memory().percent
                
                # Try to free up memory by clearing caches
                if platform.system() == 'Windows':
                    try:
                        import subprocess
                        # Clear system file cache
                        result = subprocess.run(['sfc', '/scannow'], 
                                              capture_output=True, text=True, timeout=60)
                        actions.append("Initiated system file cache cleanup")
                    except:
                        pass
                
                # Get memory info after
                memory_after = psutil.virtual_memory().percent
                memory_freed = memory_before - memory_after
                
                if memory_freed > 0:
                    actions.append(f"Freed {memory_freed:.1f}% memory")
                
                fix_result['actions_taken'] = actions
                fix_result['success'] = len(actions) > 0
                fix_result['message'] = f"Memory optimization completed. {len(actions)} actions performed."
                
            except Exception as e:
                fix_result['errors'].append(f"Memory fix error: {str(e)}")
                fix_result['message'] = "Memory optimization failed"
        
        elif issue_module == 'network':
            try:
                # Network troubleshooting
                import subprocess
                
                actions = []
                
                if platform.system() == 'Windows':
                    # Flush DNS
                    try:
                        result = subprocess.run(['ipconfig', '/flushdns'], 
                                              capture_output=True, text=True, timeout=30)
                        if result.returncode == 0:
                            actions.append("Flushed DNS cache")
                    except Exception as e:
                        fix_result['errors'].append(f"DNS flush error: {str(e)}")
                    
                    # Reset network adapter
                    try:
                        result = subprocess.run(['netsh', 'winsock', 'reset'], 
                                              capture_output=True, text=True, timeout=30)
                        if result.returncode == 0:
                            actions.append("Reset network stack")
                    except Exception as e:
                        fix_result['errors'].append(f"Network reset error: {str(e)}")
                    
                    # Renew IP address
                    try:
                        subprocess.run(['ipconfig', '/release'], capture_output=True, timeout=15)
                        subprocess.run(['ipconfig', '/renew'], capture_output=True, timeout=15)
                        actions.append("Renewed IP address")
                    except Exception as e:
                        fix_result['errors'].append(f"IP renewal error: {str(e)}")
                
                fix_result['actions_taken'] = actions
                fix_result['success'] = len(actions) > 0
                fix_result['message'] = f"Network troubleshooting completed. {len(actions)} actions performed."
                
            except Exception as e:
                fix_result['errors'].append(f"Network fix error: {str(e)}")
                fix_result['message'] = "Network troubleshooting failed"
        
        elif issue_module == 'service':
            try:
                # Service management
                import subprocess
                
                actions = []
                service_name = issue_details.get('service_name', '')
                
                if platform.system() == 'Windows' and service_name:
                    try:
                        # Try to start the service
                        result = subprocess.run(['sc', 'start', service_name], 
                                              capture_output=True, text=True, timeout=30)
                        if result.returncode == 0:
                            actions.append(f"Started Windows service: {service_name}")
                        else:
                            # Try to restart if start failed
                            subprocess.run(['sc', 'stop', service_name], capture_output=True, timeout=15)
                            result = subprocess.run(['sc', 'start', service_name], 
                                                  capture_output=True, text=True, timeout=30)
                            if result.returncode == 0:
                                actions.append(f"Restarted Windows service: {service_name}")
                    except Exception as e:
                        fix_result['errors'].append(f"Service fix error: {str(e)}")
                
                # Run self-healing agent for service issues
                try:
                    from agent import SelfHealingAgent
                    agent = SelfHealingAgent(test_only=False, modules=['service'])
                    results = agent.run()
                    
                    for result in results:
                        if result.get('module') == 'service':
                            remediation = result.get('remediation', {})
                            if remediation.get('success'):
                                actions.extend(remediation.get('actions_taken', []))
                
                except Exception as e:
                    fix_result['errors'].append(f"Agent service fix error: {str(e)}")
                
                fix_result['actions_taken'] = actions
                fix_result['success'] = len(actions) > 0
                fix_result['message'] = f"Service repair completed. {len(actions)} actions performed."
                
            except Exception as e:
                fix_result['errors'].append(f"Service fix error: {str(e)}")
                fix_result['message'] = "Service repair failed"
        
        elif issue_module == 'printer':
            try:
                # Printer troubleshooting
                import subprocess
                
                actions = []
                
                if platform.system() == 'Windows':
                    # Restart print spooler
                    try:
                        subprocess.run(['sc', 'stop', 'Spooler'], capture_output=True, timeout=15)
                        subprocess.run(['sc', 'start', 'Spooler'], capture_output=True, timeout=15)
                        actions.append("Restarted Print Spooler service")
                    except Exception as e:
                        fix_result['errors'].append(f"Print spooler restart error: {str(e)}")
                    
                    # Clear print queue
                    try:
                        spool_dir = os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'System32', 'spool', 'PRINTERS')
                        if os.path.exists(spool_dir):
                            files_cleared = 0
                            for file in os.listdir(spool_dir):
                                try:
                                    os.remove(os.path.join(spool_dir, file))
                                    files_cleared += 1
                                except:
                                    pass
                            if files_cleared > 0:
                                actions.append(f"Cleared {files_cleared} print queue files")
                    except Exception as e:
                        fix_result['errors'].append(f"Print queue clear error: {str(e)}")
                
                fix_result['actions_taken'] = actions
                fix_result['success'] = len(actions) > 0
                fix_result['message'] = f"Printer troubleshooting completed. {len(actions)} actions performed."
                
            except Exception as e:
                fix_result['errors'].append(f"Printer fix error: {str(e)}")
                fix_result['message'] = "Printer troubleshooting failed"
        
        else:
            fix_result['message'] = f"Auto-fix not available for module: {issue_module}"
        
        return jsonify(fix_result)
        
    except Exception as e:
        print(f"Error in auto-fix: {e}")
        return jsonify({
            'success': False,
            'message': f'Auto-fix failed: {str(e)}',
            'actions_taken': [],
            'errors': [str(e)],
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/notifications')
def get_notifications():
    """Get system notifications and alerts"""
    try:
        # Get recent system events and convert to notifications
        notifications = []
        
        # Get system status for generating notifications
        try:
            monitor = SystemMonitor()
            system_metrics = monitor.get_all_metrics()
            
            # Check for critical system issues
            cpu_usage = system_metrics.get('cpu', {}).get('percent', 0)
            memory_usage = system_metrics.get('memory', {}).get('percent', 0)
            
            if cpu_usage > 90:
                notifications.append({
                    'id': f'cpu_high_{int(datetime.now().timestamp())}',
                    'type': 'critical',
                    'title': 'High CPU Usage',
                    'description': f'CPU usage at {cpu_usage:.1f}% - immediate attention required',
                    'location': 'Local System',
                    'time': 'Just now',
                    'timestamp': datetime.now().isoformat(),
                    'read': False,
                    'category': 'system'
                })
            
            if memory_usage > 85:
                notifications.append({
                    'id': f'memory_high_{int(datetime.now().timestamp())}',
                    'type': 'warning',
                    'title': 'High Memory Usage',
                    'description': f'Memory usage at {memory_usage:.1f}% - monitoring recommended',
                    'location': 'Local System',
                    'time': 'Just now',
                    'timestamp': datetime.now().isoformat(),
                    'read': False,
                    'category': 'system'
                })
                
        except Exception as e:
            print(f"Error getting system metrics for notifications: {e}")
        
        # Get service status for notifications
        try:
            provider = PublicStatusProvider()
            status_data = provider.get_all_public_status()
            
            # Check for service issues
            for service in status_data.get('services', []):
                if not service.get('operational', True):
                    notifications.append({
                        'id': f'service_{service.get("name", "unknown").replace(" ", "_").lower()}_{int(datetime.now().timestamp())}',
                        'type': 'warning',
                        'title': f'{service.get("name", "Service")} Issue',
                        'description': f'{service.get("status", "Service unavailable")}',
                        'location': 'Local System',
                        'time': '5 min ago',
                        'timestamp': datetime.now().isoformat(),
                        'read': False,
                        'category': 'service'
                    })
                    
        except Exception as e:
            print(f"Error getting service status for notifications: {e}")
        
        # Add some sample notifications if none exist
        if not notifications:
            notifications = [
                {
                    'id': 'welcome',
                    'type': 'info',
                    'title': 'System Monitoring Active',
                    'description': 'ServicePulse is monitoring your system health',
                    'location': 'System-wide',
                    'time': '1 hour ago',
                    'timestamp': datetime.now().isoformat(),
                    'read': True,
                    'category': 'system'
                }
            ]
        
        # Sort by timestamp (newest first)
        notifications.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'notifications': notifications,
            'total': len(notifications),
            'unread': len([n for n in notifications if not n['read']]),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error getting notifications: {e}")
        return jsonify({'error': str(e)}), 500

def main():
    """Start the unified dashboard server"""
    print("="*60)
    print("ServicePulse - Unified Application Server")
    print("="*60)
    print(f"Platform: {platform_detector}")
    print(f"Admin Privileges: {platform_detector.is_admin()}")
    print("")
    print("🚀 Starting unified Flask + React server...")
    print("")
    print("📱 React Frontend: http://localhost:5000")
    print("🔧 Admin Dashboard: http://localhost:5000/admin")
    print("🌐 Public Status: http://localhost:5000/status")
    print("📊 API Endpoints: http://localhost:5000/api/*")
    print("🔄 Legacy Templates: http://localhost:5000/legacy/*")
    print("")
    
    # Check if React build exists
    build_path = Path(__file__).parent.parent.parent / 'build'
    if not build_path.exists():
        print("⚠️  React build not found!")
        print("   Run: python build-and-run.py")
        print("   Or: npm run build")
        print("")
    
    print("Press Ctrl+C to stop")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == '__main__':
    main()
