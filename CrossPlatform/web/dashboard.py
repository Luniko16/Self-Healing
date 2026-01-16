#!/usr/bin/env python3
"""
Self-Healing Agent - IT Admin Dashboard
Web-based control panel for IT administrators
"""

import sys
import os
import json
import threading
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, jsonify, request

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

app = Flask(__name__)
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
    """Main dashboard page"""
    return render_template('dashboard.html', 
                         platform=str(platform_detector),
                         is_admin=platform_detector.is_admin())

@app.route('/monitoring')
def monitoring():
    """System monitoring page"""
    return render_template('monitoring.html')

@app.route('/status')
def public_status():
    """Public status page for citizens"""
    return render_template('public_status.html')

@app.route('/public')
def public_simple():
    """Simple public status page"""
    return render_template('public_simple.html')

@app.route('/test')
def test_status():
    """Test page for debugging"""
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
    """Get public service status"""
    try:
        provider = PublicStatusProvider()
        return jsonify(provider.get_all_public_status())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/public/search')
def search_public_services():
    """Search public services"""
    try:
        query = request.args.get('q', '')
        provider = PublicStatusProvider()
        results = provider.search_services(query)
        return jsonify({'services': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def main():
    """Start the dashboard server"""
    print("="*60)
    print("Self-Healing Agent - IT Admin Dashboard")
    print("="*60)
    print(f"Platform: {platform_detector}")
    print(f"Admin Privileges: {platform_detector.is_admin()}")
    print("")
    print("Starting web server...")
    print("Dashboard URL: http://localhost:5000")
    print("")
    print("Press Ctrl+C to stop")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == '__main__':
    main()
