#!/usr/bin/env python3
"""
Event Log Analyzer Module
Parses and analyzes system event logs
"""

import subprocess
import platform
import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import Counter

class EventLogAnalyzer:
    """Analyzes system event logs"""
    
    def __init__(self):
        self.platform = platform.system()
    
    def get_windows_events(self, log_name: str = 'System', hours: int = 24, level: str = 'Error') -> List[Dict[str, Any]]:
        """Get Windows Event Log entries"""
        events = []
        
        try:
            # Calculate time filter
            start_time = datetime.now() - timedelta(hours=hours)
            time_filter = start_time.strftime('%Y-%m-%dT%H:%M:%S')
            
            # Build PowerShell command
            ps_cmd = f"""
            Get-WinEvent -FilterHashtable @{{
                LogName='{log_name}';
                Level=@(1,2,3);
                StartTime='{time_filter}'
            }} -MaxEvents 100 -ErrorAction SilentlyContinue | 
            Select-Object TimeCreated, Id, LevelDisplayName, ProviderName, Message | 
            ConvertTo-Json
            """
            
            result = subprocess.run(['powershell', '-Command', ps_cmd],
                                  capture_output=True, text=True, timeout=60)
            
            if result.stdout:
                data = json.loads(result.stdout)
                if isinstance(data, dict):
                    data = [data]
                
                for event in data:
                    events.append({
                        'timestamp': event.get('TimeCreated'),
                        'event_id': event.get('Id'),
                        'level': event.get('LevelDisplayName'),
                        'source': event.get('ProviderName'),
                        'message': event.get('Message', '')[:200]  # Truncate long messages
                    })
        
        except Exception as e:
            print(f"Error reading Windows events: {e}")
        
        return events
    
    def get_linux_events(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get Linux system log entries"""
        events = []
        
        try:
            # Use journalctl if available
            result = subprocess.run(
                ['journalctl', '--since', f'{hours} hours ago', '--priority=err', '--no-pager', '-o', 'json'],
                capture_output=True, text=True, timeout=60
            )
            
            for line in result.stdout.split('\n'):
                if line.strip():
                    try:
                        event = json.loads(line)
                        events.append({
                            'timestamp': event.get('__REALTIME_TIMESTAMP'),
                            'level': 'Error',
                            'source': event.get('SYSLOG_IDENTIFIER', 'Unknown'),
                            'message': event.get('MESSAGE', '')[:200]
                        })
                    except json.JSONDecodeError:
                        pass
        
        except FileNotFoundError:
            # Fallback to syslog
            try:
                result = subprocess.run(['tail', '-n', '100', '/var/log/syslog'],
                                      capture_output=True, text=True, timeout=30)
                for line in result.stdout.split('\n'):
                    if 'error' in line.lower() or 'fail' in line.lower():
                        events.append({
                            'timestamp': datetime.now().isoformat(),
                            'level': 'Error',
                            'source': 'syslog',
                            'message': line[:200]
                        })
            except Exception:
                pass
        
        return events
    
    def analyze_patterns(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze event patterns"""
        if not events:
            return {
                'total_events': 0,
                'top_sources': [],
                'top_event_ids': [],
                'recurring_issues': []
            }
        
        sources = Counter([e.get('source', 'Unknown') for e in events])
        event_ids = Counter([e.get('event_id', 0) for e in events if e.get('event_id')])
        
        # Find recurring issues (same event ID multiple times)
        recurring = []
        for event_id, count in event_ids.most_common(5):
            if count > 2:
                sample = next((e for e in events if e.get('event_id') == event_id), {})
                recurring.append({
                    'event_id': event_id,
                    'count': count,
                    'source': sample.get('source'),
                    'message': sample.get('message', '')[:100]
                })
        
        return {
            'total_events': len(events),
            'top_sources': [{'source': s, 'count': c} for s, c in sources.most_common(5)],
            'top_event_ids': [{'event_id': e, 'count': c} for e, c in event_ids.most_common(5)],
            'recurring_issues': recurring
        }
    
    def get_critical_events(self, hours: int = 24) -> Dict[str, Any]:
        """Get critical events and analysis"""
        if self.platform == 'Windows':
            system_events = self.get_windows_events('System', hours)
            app_events = self.get_windows_events('Application', hours)
            all_events = system_events + app_events
        else:
            all_events = self.get_linux_events(hours)
        
        analysis = self.analyze_patterns(all_events)
        
        return {
            'timestamp': datetime.now().isoformat(),
            'platform': self.platform,
            'time_range_hours': hours,
            'events': all_events[:50],  # Limit to 50 most recent
            'analysis': analysis
        }

if __name__ == '__main__':
    analyzer = EventLogAnalyzer()
    print(json.dumps(analyzer.get_critical_events(), indent=2))
