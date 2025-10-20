import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime')
cloudwatch = boto3.client('cloudwatch')
logs_client = boto3.client('logs')
s3 = boto3.client('s3')
lambda_client = boto3.client('lambda')

INCIDENTS_TABLE = os.environ['INCIDENTS_TABLE']
BEDROCK_MODEL_ID = os.environ['BEDROCK_MODEL_ID']
RUNBOOKS_BUCKET = os.environ['RUNBOOKS_BUCKET']
POSTMORTEMS_BUCKET = os.environ['POSTMORTEMS_BUCKET']

table = dynamodb.Table(INCIDENTS_TABLE)

def handler(event, context):
    """
    Agent Orchestrator: Implements Observe-Reason-Plan-Act loop
    using Amazon Bedrock for intelligent decision making.
    """
    print(f"Agent triggered with event: {json.dumps(event)}")
    
    # Handle API Gateway requests
    if 'httpMethod' in event:
        return handle_api_request(event)
    
    # Handle approval actions
    if event.get('action') in ['approve', 'deny']:
        return handle_approval_action(event)
    
    # Handle direct invocation with incidentId
    incident_id = event.get('incidentId')
    if not incident_id:
        return {'error': 'Missing incidentId'}
    
    # Execute agent loop
    try:
        result = execute_agent_loop(incident_id)
        return {'statusCode': 200, 'body': json.dumps(result)}
    except Exception as e:
        print(f"Agent error: {str(e)}")
        return {'statusCode': 500, 'error': str(e)}

def handle_api_request(event):
    """Handle API Gateway requests for incident status."""
    path = event.get('path', '')
    method = event.get('httpMethod', 'GET')
    
    if '/approve' in path and method == 'POST':
        # Handle approval request
        incident_id = path.split('/')[-2]  # Extract incident ID from path like /incidents/{id}/approve
        
        try:
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')  # 'approve' or 'deny'
            user = body.get('user', 'Unknown')
            reason = body.get('reason')
            
            approval_event = {
                'action': action,
                'incidentId': incident_id,
                'user': user,
                'reason': reason
            }
            
            return handle_approval_action(approval_event)
            
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Invalid request: {str(e)}'})
            }
    
    elif '/incidents/' in path and method == 'GET':
        # Get specific incident
        incident_id = path.split('/')[-1]
        if incident_id == 'approve':  # Handle case where path ends with /approve
            incident_id = path.split('/')[-2]
        
        # Query using partition key only, get the latest entry
        response = table.query(
            KeyConditionExpression='incidentId = :id',
            ExpressionAttributeValues={':id': incident_id},
            ScanIndexForward=False,  # Sort descending by timestamp
            Limit=1
        )
        
        items = response.get('Items', [])
        incident = items[0] if items else {}
        
        return {
            'statusCode': 200 if incident else 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(incident if incident else {'error': 'Incident not found'}, default=str)
        }
    else:
        # List all incidents - get latest version of each
        response = table.scan(Limit=50)
        incidents = response.get('Items', [])
        
        # Group by incidentId and keep only the latest (highest timestamp)
        incident_map = {}
        for item in incidents:
            inc_id = item.get('incidentId')
            timestamp = item.get('timestamp', 0)
            if inc_id not in incident_map or timestamp > incident_map[inc_id].get('timestamp', 0):
                incident_map[inc_id] = item
        
        unique_incidents = list(incident_map.values())
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'incidents': unique_incidents}, default=str)
        }

def execute_agent_loop(incident_id):
    """Execute the Observe-Reason-Plan-Act agent loop."""
    
    # Check if incident requires approval and hasn't been approved yet
    incident = get_incident(incident_id)
    if incident.get('requiresApproval', True) and incident.get('status') == 'OPEN':
        # Send notification requesting approval
        send_approval_notification(incident_id, incident)
        
        # Update status to PENDING_APPROVAL
        update_incident(incident_id, {
            'status': 'PENDING_APPROVAL',
            'updatedAt': datetime.utcnow().isoformat(),
            'approvalRequested': True
        })
        
        return {
            'incidentId': incident_id,
            'status': 'PENDING_APPROVAL',
            'message': 'Waiting for user approval to proceed with incident analysis'
        }
    
    # Check if incident was denied
    if incident.get('status') == 'DENIED':
        return {
            'incidentId': incident_id,
            'status': 'DENIED',
            'message': 'Incident processing was denied by user'
        }
    
    # Proceed with normal agent loop if approved or auto-approved
    # 1. OBSERVE: Gather context
    print(f"[OBSERVE] Gathering data for incident {incident_id}")
    metrics = observe_metrics(incident)
    logs = observe_logs(incident)
    runbooks = retrieve_runbooks(incident)
    
    context = {
        'incident': incident,
        'metrics': metrics,
        'logs': logs,
        'runbooks': runbooks
    }
    
    # 2. REASON: Use Bedrock LLM for root cause analysis
    print(f"[REASON] Analyzing root cause")
    diagnosis = reason_with_bedrock(context)
    
    # Send notification after diagnosis
    send_notification(incident_id, incident, diagnosis, 'IN_PROGRESS')
    
    # 3. PLAN: Generate remediation strategy
    print(f"[PLAN] Creating remediation plan")
    plan = plan_remediation(diagnosis, context)
    
    # 4. ACT: Execute safe actions (with approval check for unsafe actions)
    print(f"[ACT] Executing remediation")
    actions_taken = execute_actions(plan, incident_id)
    
    # 5. Update incident status
    status = 'RESOLVED' if plan.get('success') else 'IN_PROGRESS'
    update_incident(incident_id, {
        'status': status,
        'diagnosis': diagnosis,
        'plan': plan,
        'actionsTaken': actions_taken,
        'updatedAt': datetime.utcnow().isoformat()
    })
    
    # Send notification after resolution
    if plan.get('success'):
        send_notification(incident_id, incident, diagnosis, 'RESOLVED')
        generate_postmortem(incident_id, context, diagnosis, actions_taken)
    
    return {
        'incidentId': incident_id,
        'diagnosis': diagnosis,
        'plan': plan,
        'actionsTaken': actions_taken
    }

def get_incident(incident_id):
    """Retrieve incident from DynamoDB."""
    # Query using partition key to get the latest entry
    response = table.query(
        KeyConditionExpression='incidentId = :id',
        ExpressionAttributeValues={':id': incident_id},
        ScanIndexForward=False,  # Sort descending by timestamp
        Limit=1
    )
    items = response.get('Items', [])
    return items[0] if items else {}

def observe_metrics(incident):
    """Fetch relevant CloudWatch metrics."""
    try:
        # Example: Get CPU utilization
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[],
            StartTime=datetime.utcnow().replace(hour=0, minute=0, second=0),
            EndTime=datetime.utcnow(),
            Period=300,
            Statistics=['Average', 'Maximum']
        )
        return response.get('Datapoints', [])
    except Exception as e:
        print(f"Error fetching metrics: {str(e)}")
        return []

def observe_logs(incident):
    """Fetch relevant CloudWatch Logs."""
    try:
        # Example: Query application logs
        response = logs_client.filter_log_events(
            logGroupName='/aws/lambda/application',
            limit=50,
            startTime=int((datetime.utcnow().timestamp() - 3600) * 1000)
        )
        return [event.get('message', '') for event in response.get('events', [])]
    except Exception as e:
        print(f"Error fetching logs: {str(e)}")
        return []

def retrieve_runbooks(incident):
    """Retrieve relevant runbooks from S3 for RAG."""
    try:
        response = s3.list_objects_v2(Bucket=RUNBOOKS_BUCKET, MaxKeys=5)
        runbooks = []
        
        for obj in response.get('Contents', []):
            content = s3.get_object(Bucket=RUNBOOKS_BUCKET, Key=obj['Key'])
            runbooks.append(content['Body'].read().decode('utf-8'))
        
        return runbooks
    except Exception as e:
        print(f"Error retrieving runbooks: {str(e)}")
        return []

def reason_with_bedrock(context):
    """Use Bedrock LLM for root cause analysis."""
    prompt = f"""You are an expert SRE analyzing an incident.

Incident: {context['incident'].get('title')}
Description: {context['incident'].get('description')}

Recent Metrics: {json.dumps(context['metrics'][:5])}
Recent Logs: {json.dumps(context['logs'][:10])}

Runbooks Available: {len(context['runbooks'])} runbooks

Analyze the root cause and provide:
1. Root cause diagnosis
2. Confidence level (0-100%)
3. Recommended actions

Respond in JSON format."""

    try:
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [{
                    "role": "user",
                    "content": prompt
                }]
            })
        )
        
        result = json.loads(response['body'].read())
        diagnosis_text = result['content'][0]['text']
        
        # Parse JSON from response
        try:
            return json.loads(diagnosis_text)
        except:
            return {'diagnosis': diagnosis_text, 'confidence': 75}
            
    except Exception as e:
        print(f"Bedrock error: {str(e)}")
        return {
            'diagnosis': 'Unable to determine root cause',
            'confidence': 0,
            'error': str(e)
        }

def plan_remediation(diagnosis, context):
    """Generate remediation plan based on diagnosis."""
    # Simple rule-based planning (can be enhanced with Bedrock)
    actions = []
    
    if 'cpu' in diagnosis.get('diagnosis', '').lower():
        actions.append({
            'type': 'restart_service',
            'target': 'application',
            'safe': True
        })
    
    if 'memory' in diagnosis.get('diagnosis', '').lower():
        actions.append({
            'type': 'scale_up',
            'target': 'auto_scaling_group',
            'safe': True
        })
    
    return {
        'actions': actions,
        'requiresApproval': any(not a.get('safe') for a in actions),
        'success': True
    }

def execute_actions(plan, incident_id):
    """Execute remediation actions."""
    actions_taken = []
    
    for action in plan.get('actions', []):
        if action.get('safe'):
            # Execute safe actions automatically
            result = execute_single_action(action)
            actions_taken.append({
                'action': action,
                'result': result,
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            # Queue for approval
            actions_taken.append({
                'action': action,
                'status': 'PENDING_APPROVAL',
                'timestamp': datetime.utcnow().isoformat()
            })
    
    return actions_taken

def execute_single_action(action):
    """Execute a single remediation action."""
    action_type = action.get('type')
    
    if action_type == 'restart_service':
        return {'status': 'SUCCESS', 'message': 'Service restarted (simulated)'}
    elif action_type == 'scale_up':
        return {'status': 'SUCCESS', 'message': 'Scaled up (simulated)'}
    else:
        return {'status': 'UNKNOWN', 'message': f'Unknown action type: {action_type}'}

def update_incident(incident_id, updates):
    """Update incident in DynamoDB."""
    # Get the current incident to get its timestamp
    incident = get_incident(incident_id)
    if not incident:
        print(f"Warning: Incident {incident_id} not found for update")
        return
    
    timestamp = incident.get('timestamp')
    
    update_expr = 'SET ' + ', '.join([f'#{k} = :{k}' for k in updates.keys()])
    expr_attr_names = {f'#{k}': k for k in updates.keys()}
    expr_attr_values = {f':{k}': v for k, v in updates.items()}
    
    table.update_item(
        Key={'incidentId': incident_id, 'timestamp': timestamp},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names,
        ExpressionAttributeValues=expr_attr_values
    )

def send_notification(incident_id, incident, diagnosis=None, status='OPEN'):
    """Send notification to Slack via notification Lambda."""
    try:
        notification_payload = {
            'channel': 'slack',
            'message': {
                'incidentId': incident_id,
                'title': incident.get('title', 'Unknown Incident'),
                'severity': incident.get('severity', 'MEDIUM'),
                'description': incident.get('description', ''),
                'status': status,
                'diagnosis': diagnosis.get('diagnosis') if diagnosis else None,
                'confidence': diagnosis.get('confidence') if diagnosis else None
            }
        }
        
        # Use environment variable or hardcoded function name
        notification_function = os.environ.get('NOTIFICATION_LAMBDA_NAME', 'ResiliBotStack-NotificationLambda0BF28E71-QzggFxr1DZA2')
        
        lambda_client.invoke(
            FunctionName=notification_function,
            InvocationType='Event',
            Payload=json.dumps(notification_payload)
        )
        print(f"Notification sent for incident {incident_id} (status: {status})")
    except Exception as e:
        print(f"Failed to send notification: {str(e)}")

def handle_approval_action(event):
    """Handle approval or denial of incident processing."""
    action = event.get('action')  # 'approve' or 'deny'
    incident_id = event.get('incidentId')
    user = event.get('user', 'Unknown')
    
    if not incident_id:
        return {'statusCode': 400, 'error': 'Missing incidentId'}
    
    try:
        incident = get_incident(incident_id)
        if not incident:
            return {'statusCode': 404, 'error': 'Incident not found'}
        
        if action == 'approve':
            # Update incident status to approved and trigger processing
            update_incident(incident_id, {
                'status': 'APPROVED',
                'approvedBy': user,
                'approvedAt': datetime.utcnow().isoformat(),
                'requiresApproval': False
            })
            
            # Trigger agent processing
            result = execute_agent_loop(incident_id)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Incident {incident_id} approved and processing started',
                    'result': result
                })
            }
            
        elif action == 'deny':
            # Update incident status to denied
            update_incident(incident_id, {
                'status': 'DENIED',
                'deniedBy': user,
                'deniedAt': datetime.utcnow().isoformat(),
                'denialReason': event.get('reason', 'No reason provided')
            })
            
            # Send notification about denial
            send_notification(incident_id, incident, None, 'DENIED')
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Incident {incident_id} denied by {user}'
                })
            }
        
        else:
            return {'statusCode': 400, 'error': 'Invalid action. Use "approve" or "deny"'}
            
    except Exception as e:
        print(f"Error handling approval action: {str(e)}")
        return {'statusCode': 500, 'error': str(e)}

def send_approval_notification(incident_id, incident):
    """Send notification requesting user approval for incident processing."""
    try:
        notification_payload = {
            'channel': 'slack',
            'message': {
                'incidentId': incident_id,
                'title': incident.get('title', 'Unknown Incident'),
                'severity': incident.get('severity', 'MEDIUM'),
                'description': incident.get('description', ''),
                'status': 'PENDING_APPROVAL',
                'requiresApproval': True,
                'approvalButtons': True
            }
        }
        
        # Use environment variable or hardcoded function name
        notification_function = os.environ.get('NOTIFICATION_LAMBDA_NAME', 'ResiliBotStack-NotificationLambda0BF28E71-QzggFxr1DZA2')
        
        lambda_client.invoke(
            FunctionName=notification_function,
            InvocationType='Event',
            Payload=json.dumps(notification_payload)
        )
        print(f"Approval notification sent for incident {incident_id}")
    except Exception as e:
        print(f"Failed to send approval notification: {str(e)}")

def generate_postmortem(incident_id, context, diagnosis, actions):
    """Generate and store postmortem report."""
    postmortem = f"""# Incident Postmortem: {incident_id}

## Summary
{context['incident'].get('title')}

## Timeline
- Detected: {context['incident'].get('createdAt')}
- Resolved: {datetime.utcnow().isoformat()}

## Root Cause
{diagnosis.get('diagnosis', 'Unknown')}

## Actions Taken
{json.dumps(actions, indent=2)}

## Prevention
- Review monitoring thresholds
- Update runbooks
- Implement additional safeguards
"""
    
    try:
        s3.put_object(
            Bucket=POSTMORTEMS_BUCKET,
            Key=f'{incident_id}/postmortem.md',
            Body=postmortem.encode('utf-8'),
            ContentType='text/markdown'
        )
        print(f"Postmortem saved for incident {incident_id}")
    except Exception as e:
        print(f"Error saving postmortem: {str(e)}")
