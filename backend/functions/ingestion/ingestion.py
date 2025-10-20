import json
import os
import time
import uuid
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['INCIDENTS_TABLE'])
lambda_client = boto3.client('lambda')

def handler(event, context):
    """
    Ingestion Lambda: Receives CloudWatch alarms and API requests,
    stores incidents in DynamoDB, and triggers agent orchestrator.
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Parse incident from CloudWatch alarm or API Gateway
        if 'detail' in event and 'alarmName' in event['detail']:
            # CloudWatch alarm via EventBridge
            incident = parse_cloudwatch_alarm(event)
        elif 'body' in event:
            # API Gateway request
            try:
                incident = json.loads(event['body'])
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {str(e)}")
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Invalid JSON format',
                        'message': str(e)
                    })
                }
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid event format'})
            }
    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
    
    try:
        # Generate incident ID
        incident_id = incident.get('incidentId', str(uuid.uuid4()))
        timestamp = int(time.time() * 1000)
        
        # Determine if approval is required
        requires_approval = determine_approval_requirement(incident)
        
        # Store in DynamoDB
        item = {
            'incidentId': incident_id,
            'timestamp': timestamp,
            'status': 'OPEN',
            'severity': incident.get('severity', 'MEDIUM').upper(),
            'title': incident.get('title', 'Unknown Incident'),
            'description': incident.get('description', ''),
            'source': incident.get('source', 'manual'),
            'metadata': incident.get('metadata', {}),
            'createdAt': datetime.utcnow().isoformat(),
            'requiresApproval': requires_approval,
            'autoApprove': incident.get('autoApprove', False)
        }
        
        table.put_item(Item=item)
        print(f"Stored incident {incident_id} in DynamoDB")
        
        # Trigger agent orchestrator asynchronously
        try:
            # Get the actual agent lambda function name from environment or discover it
            agent_function_name = os.environ.get('AGENT_LAMBDA_NAME')
            
            if not agent_function_name:
                # Try to discover the agent lambda name
                lambda_list = lambda_client.list_functions()
                for func in lambda_list.get('Functions', []):
                    if 'AgentLambda' in func['FunctionName']:
                        agent_function_name = func['FunctionName']
                        break
            
            if agent_function_name:
                lambda_client.invoke(
                    FunctionName=agent_function_name,
                    InvocationType='Event',
                    Payload=json.dumps({'incidentId': incident_id})
                )
                print(f"Triggered agent for incident {incident_id} using function {agent_function_name}")
            else:
                print(f"Warning: Could not find agent lambda function name")
        except Exception as e:
            print(f"Failed to trigger agent: {str(e)}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'incidentId': incident_id,
                'status': 'OPEN',
                'message': 'Incident created successfully'
            })
        }
    except Exception as e:
        print(f"Error creating incident: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Failed to create incident',
                'message': str(e)
            })
        }

def determine_approval_requirement(incident):
    """Determine if incident requires user approval based on rules."""
    # Get approval settings from environment or use defaults
    auto_approve_low = os.environ.get('AUTO_APPROVE_LOW_SEVERITY', 'true').lower() == 'true'
    auto_approve_medium = os.environ.get('AUTO_APPROVE_MEDIUM_SEVERITY', 'false').lower() == 'true'
    auto_approve_high = os.environ.get('AUTO_APPROVE_HIGH_SEVERITY', 'false').lower() == 'true'
    auto_approve_critical = os.environ.get('AUTO_APPROVE_CRITICAL_SEVERITY', 'false').lower() == 'true'
    
    # Check if incident has explicit auto-approve flag
    if incident.get('autoApprove'):
        return False
    
    # Check severity-based rules
    severity = incident.get('severity', 'MEDIUM')
    
    if severity == 'LOW' and auto_approve_low:
        return False
    elif severity == 'MEDIUM' and auto_approve_medium:
        return False
    elif severity == 'HIGH' and auto_approve_high:
        return False
    elif severity == 'CRITICAL' and auto_approve_critical:
        return False
    
    # Check source-based rules
    source = incident.get('source', 'manual')
    auto_approve_sources = os.environ.get('AUTO_APPROVE_SOURCES', '').split(',')
    
    if source in auto_approve_sources:
        return False
    
    # Default: require approval
    return True

def parse_cloudwatch_alarm(event):
    """Parse CloudWatch alarm event into incident format."""
    detail = event['detail']
    alarm_name = detail.get('alarmName', 'Unknown Alarm')
    
    # Determine severity based on alarm state
    severity_map = {
        'ALARM': 'HIGH',
        'INSUFFICIENT_DATA': 'MEDIUM',
        'OK': 'LOW'
    }
    
    return {
        'title': f"CloudWatch Alarm: {alarm_name}",
        'description': detail.get('state', {}).get('reason', 'Alarm triggered'),
        'severity': severity_map.get(detail.get('state', {}).get('value'), 'MEDIUM'),
        'source': 'cloudwatch',
        'metadata': {
            'alarmName': alarm_name,
            'alarmArn': detail.get('alarmArn', ''),
            'region': event.get('region', ''),
            'accountId': event.get('account', ''),
        }
    }
