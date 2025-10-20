"""
Unit tests for agent Lambda function.
"""
import json
import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../functions/agent'))

@pytest.fixture
def mock_env(monkeypatch):
    """Mock environment variables."""
    monkeypatch.setenv('INCIDENTS_TABLE', 'test-incidents-table')
    monkeypatch.setenv('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0')
    monkeypatch.setenv('RUNBOOKS_BUCKET', 'test-runbooks-bucket')
    monkeypatch.setenv('POSTMORTEMS_BUCKET', 'test-postmortems-bucket')

@pytest.fixture
def sample_incident():
    """Sample incident data."""
    return {
        'incidentId': 'test-incident-123',
        'title': 'High CPU Alert',
        'description': 'CPU utilization exceeded 90%',
        'severity': 'HIGH',
        'status': 'OPEN',
        'source': 'cloudwatch',
        'createdAt': '2025-01-15T10:00:00Z'
    }

def test_parse_cloudwatch_alarm():
    """Test CloudWatch alarm parsing."""
    from ingestion import parse_cloudwatch_alarm
    
    event = {
        'detail': {
            'alarmName': 'HighCPUAlarm',
            'state': {
                'value': 'ALARM',
                'reason': 'CPU exceeded threshold'
            },
            'alarmArn': 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:HighCPUAlarm'
        },
        'region': 'us-east-1',
        'account': '123456789012'
    }
    
    result = parse_cloudwatch_alarm(event)
    
    assert result['title'] == 'CloudWatch Alarm: HighCPUAlarm'
    assert result['severity'] == 'HIGH'
    assert result['source'] == 'cloudwatch'

def test_observe_metrics(mock_env, sample_incident):
    """Test metrics observation."""
    # This would require mocking boto3 clients
    # Placeholder for actual implementation
    pass

def test_reason_with_bedrock(mock_env):
    """Test Bedrock reasoning."""
    # This would require mocking Bedrock client
    # Placeholder for actual implementation
    pass

def test_plan_remediation():
    """Test remediation planning."""
    diagnosis = {
        'diagnosis': 'High CPU due to memory leak',
        'confidence': 85
    }
    
    # Would test plan_remediation function
    # Placeholder for actual implementation
    pass

def test_execute_actions():
    """Test action execution."""
    plan = {
        'actions': [
            {'type': 'restart_service', 'target': 'app', 'safe': True},
            {'type': 'terminate_instance', 'target': 'i-123', 'safe': False}
        ]
    }
    
    # Would test execute_actions function
    # Placeholder for actual implementation
    pass

if __name__ == '__main__':
    pytest.main([__file__])
