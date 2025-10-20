# ResiliBot API Documentation

Complete REST API reference for ResiliBot incident management system.

## Base URL

```
https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

This is the base URL for all API endpoints. For display purposes, you can use:
```
https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

## Authentication

**Current**: No authentication required (development/demo mode)

**Production Recommendations**:
- API Gateway API Keys for service-to-service communication
- AWS IAM authentication with SigV4 signing
- Amazon Cognito User Pools for user authentication
- Custom Lambda authorizers for advanced scenarios

---

## Endpoints

### Create Incident
Create a new incident manually.

**Endpoint**: `POST /incidents`

**Request Body**:
```json
{
  "title": "CRITICAL: Expired TLS Certificate on Application Load Balancer",
  "description": "TLS certificate on the production ALB expired, causing HTTPS failures and full API outage across regions.",
  "severity": "critical",
  "source": "AWS ACM / ALB / CloudWatch",
  "tags": ["security", "tls", "certificate", "alb", "networking"],
  "autoApprove": true
}
```

**Response**: `200 OK`
```json
{
  "incidentId": "inc-a1b2c3d4",
  "status": "OPEN",
  "message": "Incident created successfully"
}
```

**Severity Levels**: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`

---

### List Incidents
Retrieve all incidents.

**Endpoint**: `GET /incidents`

**Query Parameters**:
- `status` (optional): Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- `limit` (optional): Maximum number of results (default: 50)

**Response**: `200 OK`
```json
{
  "incidents": [
    {
      "incidentId": "inc-a1b2c3d4",
      "timestamp": 1705315200000,
      "title": "High CPU Alert",
      "description": "CPU utilization exceeded 90%",
      "severity": "HIGH",
      "status": "RESOLVED",
      "source": "cloudwatch",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:05:00Z"
    }
  ]
}
```

---

### Get Incident Details
Retrieve detailed information about a specific incident.

**Endpoint**: `GET /incidents/{incidentId}`

**Response**: `200 OK`
```json
{
  "incidentId": "inc-a1b2c3d4",
  "timestamp": 1705315200000,
  "title": "High CPU Alert",
  "description": "CPU utilization exceeded 90%",
  "severity": "HIGH",
  "status": "RESOLVED",
  "source": "cloudwatch",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:05:00Z",
  "diagnosis": {
    "diagnosis": "Memory leak causing GC thrashing",
    "confidence": 87,
    "recommendedActions": ["restart_service", "scale_up"]
  },
  "plan": {
    "actions": [
      {
        "type": "restart_service",
        "target": "application",
        "safe": true
      }
    ],
    "requiresApproval": false,
    "success": true
  },
  "actionsTaken": [
    {
      "action": {
        "type": "restart_service",
        "target": "application"
      },
      "result": {
        "status": "SUCCESS",
        "message": "Service restarted successfully"
      },
      "timestamp": "2025-01-15T10:03:00Z"
    }
  ],
  "metadata": {
    "alarmName": "HighCPUAlarm",
    "region": "us-east-1"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request format",
  "message": "Missing required field: title"
}
```

### 404 Not Found
```json
{
  "error": "Incident not found",
  "incidentId": "inc-invalid"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to process request"
}
```

---

## WebSocket API (Future)
Real-time incident updates via WebSocket connection.

**Endpoint**: `wss://{websocket-api-id}.execute-api.{region}.amazonaws.com/prod`

**Message Format**:
```json
{
  "action": "subscribe",
  "incidentId": "inc-a1b2c3d4"
}
```

**Update Notification**:
```json
{
  "type": "incident_update",
  "incidentId": "inc-a1b2c3d4",
  "status": "IN_PROGRESS",
  "timestamp": "2025-01-15T10:03:00Z"
}
```

---

## Rate Limits
- 100 requests per minute per IP
- 1000 requests per hour per IP

Exceeding limits returns `429 Too Many Requests`.

---

## Examples

### cURL
```bash
# Create incident
curl -X POST https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CRITICAL: Expired TLS Certificate on Application Load Balancer",
    "description": "TLS certificate on the production ALB expired, causing HTTPS failures and full API outage across regions.",
    "severity": "critical",
    "source": "AWS ACM / ALB / CloudWatch",
    "tags": ["security", "tls", "certificate", "alb", "networking"],
    "autoApprove": true
  }'

# List incidents
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod/incidents

# Get incident details (replace {incident-id} with actual ID)
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod/incidents/{incident-id}
```

### Python
```python
import requests

# Create incident
response = requests.post(
    'https://api.resilibot.com/prod/incidents',
    json={
        'title': 'High Memory Usage',
        'severity': 'HIGH',
        'source': 'manual'
    }
)
incident = response.json()
print(f"Created incident: {incident['incidentId']}")

# Get incident details
response = requests.get(
    f"https://api.resilibot.com/prod/incidents/{incident['incidentId']}"
)
details = response.json()
print(f"Status: {details['status']}")
```

### JavaScript
```javascript
// Create incident
const response = await fetch('https://api.resilibot.com/prod/incidents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'API Latency Spike',
    severity: 'MEDIUM',
    source: 'manual'
  })
});
const incident = await response.json();
console.log(`Created incident: ${incident.incidentId}`);
```

---

---

## Best Practices

### Error Handling

Always check the response status code and handle errors appropriately:

```javascript
try {
  const response = await fetch(`${API_URL}/incidents/${incidentId}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const incident = await response.json();
  // Process incident
} catch (error) {
  console.error('Failed to fetch incident:', error);
  // Handle error
}
```

### Pagination

For large result sets, use pagination parameters:

```bash
curl "https://api.resilibot.com/prod/incidents?limit=20&offset=0"
```

### Filtering

Filter incidents by status:

```bash
curl "https://api.resilibot.com/prod/incidents?status=OPEN"
```

### Idempotency

For incident creation, consider using idempotency keys to prevent duplicate incidents:

```json
{
  "title": "High CPU Alert",
  "severity": "HIGH",
  "idempotencyKey": "unique-key-123"
}
```

---

## Changelog

### v1.0.0 (January 2025)
- ✅ Initial API release
- ✅ CRUD operations for incidents
- ✅ CloudWatch alarm integration
- ✅ Real-time incident status updates
- ✅ Multi-channel notification support

### Planned Features (v1.1.0)
- 🔄 WebSocket API for real-time updates
- 🔐 API authentication and authorization
- 📊 Advanced filtering and search
- 📈 Metrics and analytics endpoints
- 🔔 Webhook subscriptions

---

## Support

For API issues or questions:

- **Documentation**: [Main README](../README.md)
- **GitHub Issues**: [github.com/hosnibelfeki/resilibot/issues](https://github.com/hosnibelfeki/resilibot/issues)
- **Email**: belfkihosni@gmail.com

---

**Last Updated**: October 18, 2025  
**API Version**: 1.0.0  
**Author**: Hosni Belfeki  
**GitHub**: github.com/hosnibelfeki/resilibot
