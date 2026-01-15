#!/usr/bin/env python3
"""
Self-Healing Agent - Cross-Platform Edition
Main orchestrator for automated IT issue detection and remediation
Supports: Windows, macOS, Linux
"""

import sys
import os
import argparse
import json
from pathlib import Path
from datetime import datetime

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from platform_detector import platform_detector
from logger import get_logger

# Add modules directory to path
sys.path.insert(0, str(Path(__file__).parent / 'modules'))

class SelfHealingAgent:
    """Main agent orchestrator"""
    
    def __init__(self, test_only=False, modules=None, config_file=None):
        self.platform = platform_detector
        self.logger = get_logger()
        self.test_only = test_only
        self.requested_modules = modules or ['network', 'disk', 'service', 'printer']
        self.config = self._load_config(config_file)
        self.results = []
        
        self.logger.info("="*50, component="Orchestrator", operation="Start")
        self.logger.info("SELF-HEALING AGENT STARTED", component="Orchestrator", operation="Start")
        self.logger.info(f"Platform: {self.platform}", component="Orchestrator", operation="Start")
        self.logger.info(f"Test Mode: {self.test_only}", component="Orchestrator", operation="Start")
        self.logger.info(f"Modules: {', '.join(self.requested_modules)}", component="Orchestrator", operation="Start")
        
        if not self.platform.is_admin() and not test_only:
            self.logger.warning("Not running with administrator/root privileges. Some operations may fail.", 
                              component="Orchestrator", operation="Start")
    
    def _load_config(self, config_file=None):
        """Load configuration file"""
        if config_file is None:
            config_file = Path(__file__).parent / 'config' / 'agent_config.json'
        
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                self.logger.info(f"Configuration loaded from {config_file}", 
                               component="Orchestrator", operation="Config")
                return config
        except FileNotFoundError:
            self.logger.warning(f"Config file not found: {config_file}. Using defaults.", 
                              component="Orchestrator", operation="Config")
            return self._get_default_config()
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in config file: {e}", 
                            component="Orchestrator", operation="Config")
            return self._get_default_config()
    
    def _get_default_config(self):
        """Get default configuration"""
        return {
            'check_interval_hours': 4,
            'business_hours_start': 9,
            'business_hours_end': 18,
            'disk_cleanup_threshold_gb': 10,
            'max_remediations_per_day': 5,
            'enabled_modules': ['network', 'disk', 'service', 'printer'],
            'enable_safety_checks': True,
            'log_level': 'INFO'
        }
    
    def run_module(self, module_name):
        """Run a specific module"""
        self.logger.info(f"Processing module: {module_name}", 
                        component="Orchestrator", operation=module_name)
        
        result = {
            'module': module_name,
            'timestamp': datetime.now().isoformat(),
            'detection': None,
            'remediation': None,
            'verification': None,
            'status': 'NOT_RUN'
        }
        
        try:
            # Import and run detection based on module
            if module_name == 'network':
                from network_detection import NetworkDetector
                detector = NetworkDetector()
                detection_result = detector.run_detection()
                result['detection'] = detection_result
                
                if detection_result['has_issues']:
                    if not self.test_only:
                        # Run remediation
                        from network_remediation import NetworkRemediator
                        remediator = NetworkRemediator()
                        remediation_result = remediator.run_remediation(detection_result['issues'])
                        result['remediation'] = remediation_result
                        
                        # Verify fix
                        import time
                        time.sleep(3)
                        verification_result = detector.run_detection()
                        result['verification'] = verification_result
                        
                        if verification_result['has_issues']:
                            result['status'] = 'REMEDIATION_PARTIAL'
                        else:
                            result['status'] = 'REMEDIATION_SUCCESS'
                    else:
                        result['status'] = 'TEST_ONLY'
                else:
                    result['status'] = 'NO_ISSUES'
            
            elif module_name == 'disk':
                from disk_detection import DiskDetector
                detector = DiskDetector(
                    warning_threshold_gb=self.config.get('disk_cleanup_threshold_gb', 10),
                    critical_threshold_gb=self.config.get('disk_cleanup_critical_gb', 5)
                )
                detection_result = detector.run_detection()
                result['detection'] = detection_result
                
                if detection_result['has_issues']:
                    if not self.test_only:
                        # Run remediation
                        from disk_remediation import DiskRemediator
                        remediator = DiskRemediator()
                        remediation_result = remediator.run_remediation(detection_result['issues'])
                        result['remediation'] = remediation_result
                        
                        # Verify fix
                        import time
                        time.sleep(2)
                        verification_result = detector.run_detection()
                        result['verification'] = verification_result
                        
                        if verification_result['has_issues']:
                            result['status'] = 'REMEDIATION_PARTIAL'
                        else:
                            result['status'] = 'REMEDIATION_SUCCESS'
                    else:
                        result['status'] = 'TEST_ONLY'
                else:
                    result['status'] = 'NO_ISSUES'
            
            elif module_name == 'service':
                from service_detection import ServiceDetector
                detector = ServiceDetector()
                detection_result = detector.run_detection()
                result['detection'] = detection_result
                
                if detection_result['has_issues']:
                    if not self.test_only:
                        # Run remediation
                        from service_remediation import ServiceRemediator
                        remediator = ServiceRemediator()
                        remediation_result = remediator.run_remediation(detection_result['issues'])
                        result['remediation'] = remediation_result
                        
                        # Verify fix
                        import time
                        time.sleep(3)
                        verification_result = detector.run_detection()
                        result['verification'] = verification_result
                        
                        if verification_result['has_issues']:
                            result['status'] = 'REMEDIATION_PARTIAL'
                        else:
                            result['status'] = 'REMEDIATION_SUCCESS'
                    else:
                        result['status'] = 'TEST_ONLY'
                else:
                    result['status'] = 'NO_ISSUES'
            
            elif module_name == 'printer':
                from printer_detection import PrinterDetector
                detector = PrinterDetector()
                detection_result = detector.run_detection()
                result['detection'] = detection_result
                
                if detection_result['has_issues']:
                    if not self.test_only:
                        # Run remediation
                        from printer_remediation import PrinterRemediator
                        remediator = PrinterRemediator()
                        remediation_result = remediator.run_remediation(detection_result['issues'])
                        result['remediation'] = remediation_result
                        
                        # Verify fix
                        import time
                        time.sleep(3)
                        verification_result = detector.run_detection()
                        result['verification'] = verification_result
                        
                        if verification_result['has_issues']:
                            result['status'] = 'REMEDIATION_PARTIAL'
                        else:
                            result['status'] = 'REMEDIATION_SUCCESS'
                    else:
                        result['status'] = 'TEST_ONLY'
                else:
                    result['status'] = 'NO_ISSUES'
            
            else:
                self.logger.warning(f"Module {module_name} not yet implemented", 
                                  component="Orchestrator", operation=module_name)
                result['status'] = 'NOT_IMPLEMENTED'
        
        except Exception as e:
            self.logger.error(f"Error in {module_name} module: {e}", 
                            component="Orchestrator", operation=module_name)
            result['status'] = 'ERROR'
            result['error'] = str(e)
        
        return result
    
    def run(self):
        """Run the agent"""
        self.logger.info("Starting agent execution", 
                        component="Orchestrator", operation="Run")
        
        # Run each requested module
        for module_name in self.requested_modules:
            if module_name in self.config.get('enabled_modules', []):
                result = self.run_module(module_name)
                self.results.append(result)
            else:
                self.logger.info(f"Module {module_name} is disabled in configuration", 
                               component="Orchestrator", operation="Run")
        
        # Summary
        self.logger.info("="*50, component="Orchestrator", operation="Complete")
        self.logger.info("EXECUTION SUMMARY", component="Orchestrator", operation="Complete")
        
        for result in self.results:
            self.logger.info(f"{result['module']}: {result['status']}", 
                           component="Orchestrator", operation="Complete")
        
        self.logger.info("="*50, component="Orchestrator", operation="Complete")
        self.logger.info("SELF-HEALING AGENT COMPLETED", 
                        component="Orchestrator", operation="Complete")
        
        return self.results

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Self-Healing Agent - Cross-Platform Edition',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 agent.py --test-only                    # Test mode (detection only)
  sudo python3 agent.py                           # Full run with remediation
  sudo python3 agent.py --modules network,disk    # Run specific modules
  python3 agent.py --verbose                      # Verbose output
        '''
    )
    
    parser.add_argument('--test-only', action='store_true',
                       help='Run detection only without remediation')
    parser.add_argument('--modules', type=str,
                       help='Comma-separated list of modules to run (network,disk,service,printer)')
    parser.add_argument('--config', type=str,
                       help='Path to configuration file')
    parser.add_argument('--verbose', action='store_true',
                       help='Enable verbose logging')
    parser.add_argument('--version', action='version', version='Self-Healing Agent 1.0.0 (Cross-Platform)')
    
    args = parser.parse_args()
    
    # Parse modules
    modules = None
    if args.modules:
        modules = [m.strip() for m in args.modules.split(',')]
    
    # Create and run agent
    agent = SelfHealingAgent(
        test_only=args.test_only,
        modules=modules,
        config_file=args.config
    )
    
    results = agent.run()
    
    # Exit with appropriate code
    has_errors = any(r['status'] == 'ERROR' for r in results)
    sys.exit(1 if has_errors else 0)

if __name__ == "__main__":
    main()
