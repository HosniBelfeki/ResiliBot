"""
Shared utilities for ResiliBot Lambda functions.
"""
import json
import logging
from datetime import datetime
from typing import Any, Dict

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def log_event(event_type: str, data: Dict[str, Any]) -> None:
    """Log structured event data."""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'eventType': event_type,
        'data': data
    }
    logger.info(json.dumps(log_entry))

def format_response(status_code: int, body: Any, headers: Dict[str, str] = None) -> Dict:
    """Format API Gateway response."""
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
    
    if headers:
        default_headers.update(headers)
    
    return {
        'statusCode': status_code,
        'headers': default_headers,
        'body': json.dumps(body) if not isinstance(body, str) else body
    }

def parse_event_body(event: Dict) -> Dict:
    """Parse API Gateway event body."""
    body = event.get('body', '{}')
    if isinstance(body, str):
        return json.loads(body)
    return body

def get_timestamp() -> int:
    """Get current timestamp in milliseconds."""
    return int(datetime.utcnow().timestamp() * 1000)

def sanitize_incident_data(data: Dict) -> Dict:
    """Sanitize incident data before storage."""
    allowed_fields = [
        'incidentId', 'title', 'description', 'severity', 
        'status', 'source', 'metadata', 'createdAt', 'updatedAt'
    ]
    return {k: v for k, v in data.items() if k in allowed_fields}
