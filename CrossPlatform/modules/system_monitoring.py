#!/usr/bin/env python3
"""
System Monitoring Module
Real-time system metrics collection
"""

import psutil
import platform
import socket
from datetime import datetime
from typing import Dict, List, Any

class SystemMonitor:
    """Collects real-time system metrics"""
    
    def __init__(self):
        self.hostname = socket.gethostname()
        self.platform = platform.system()
    
    def get_cpu_info(self) -> Dict[str, Any]:
        """Get CPU usage and information"""
        return {
            'percent': psutil.cpu_percent(interval=1),
            'count': psutil.cpu_count(),
            'count_logical': psutil.cpu_count(logical=True),
            'frequency': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
            'per_cpu': psutil.cpu_percent(interval=1, percpu=True)
        }
    
    def get_memory_info(self) -> Dict[str, Any]:
        """Get memory usage information"""
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        return {
            'total': mem.total,
            'available': mem.available,
            'used': mem.used,
            'percent': mem.percent,
            'total_gb': round(mem.total / (1024**3), 2),
            'available_gb': round(mem.available / (1024**3), 2),
            'used_gb': round(mem.used / (1024**3), 2),
            'swap': {
                'total': swap.total,
                'used': swap.used,
                'percent': swap.percent,
                'total_gb': round(swap.total / (1024**3), 2),
                'used_gb': round(swap.used / (1024**3), 2)
            }
        }
    
    def get_disk_info(self) -> List[Dict[str, Any]]:
        """Get disk usage for all partitions"""
        disks = []
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disks.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total': usage.total,
                    'used': usage.used,
                    'free': usage.free,
                    'percent': usage.percent,
                    'total_gb': round(usage.total / (1024**3), 2),
                    'used_gb': round(usage.used / (1024**3), 2),
                    'free_gb': round(usage.free / (1024**3), 2)
                })
            except PermissionError:
                continue
        return disks
    
    def get_network_info(self) -> Dict[str, Any]:
        """Get network statistics"""
        net_io = psutil.net_io_counters()
        connections = len(psutil.net_connections())
        
        return {
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv,
            'bytes_sent_mb': round(net_io.bytes_sent / (1024**2), 2),
            'bytes_recv_mb': round(net_io.bytes_recv / (1024**2), 2),
            'connections': connections
        }
    
    def get_process_info(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top processes by CPU usage"""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        # Sort by CPU usage
        processes.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
        return processes[:limit]
    
    def get_boot_time(self) -> Dict[str, Any]:
        """Get system boot time and uptime"""
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        
        return {
            'boot_time': boot_time.isoformat(),
            'uptime_seconds': int(uptime.total_seconds()),
            'uptime_days': uptime.days,
            'uptime_hours': uptime.seconds // 3600,
            'uptime_minutes': (uptime.seconds % 3600) // 60
        }
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all system metrics"""
        return {
            'timestamp': datetime.now().isoformat(),
            'hostname': self.hostname,
            'platform': self.platform,
            'cpu': self.get_cpu_info(),
            'memory': self.get_memory_info(),
            'disks': self.get_disk_info(),
            'network': self.get_network_info(),
            'processes': self.get_process_info(),
            'boot': self.get_boot_time()
        }

if __name__ == '__main__':
    monitor = SystemMonitor()
    import json
    print(json.dumps(monitor.get_all_metrics(), indent=2))
