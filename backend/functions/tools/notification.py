import json
import os
import time
import urllib3

http = urllib3.PoolManager()

# Environment variables
SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK_URL', '')
JIRA_URL = os.environ.get('JIRA_URL', '')
JIRA_USERNAME = os.environ.get('JIRA_USERNAME', '')
JIRA_API_TOKEN = os.environ.get('JIRA_API_TOKEN', '')
JIRA_PROJECT_KEY = os.environ.get('JIRA_PROJECT_KEY', 'INC')
PAGERDUTY_INTEGRATION_KEY = os.environ.get('PAGERDUTY_INTEGRATION_KEY', '')
TEAMS_WEBHOOK_URL = os.environ.get('TEAMS_WEBHOOK_URL', '')
SES_FROM_EMAIL = os.environ.get('SES_FROM_EMAIL', '')
SES_TO_EMAILS = os.environ.get('SES_TO_EMAILS', '').split(',')
ENABLE_SLACK = os.environ.get('ENABLE_SLACK_NOTIFICATIONS', 'true').lower() == 'true'
ENABLE_JIRA = os.environ.get('ENABLE_JIRA_INTEGRATION', 'false').lower() == 'true'
ENABLE_PAGERDUTY = os.environ.get('ENABLE_PAGERDUTY_INTEGRATION', 'false').lower() == 'true'
ENABLE_TEAMS = os.environ.get('ENABLE_TEAMS_NOTIFICATIONS', 'false').lower() == 'true'
ENABLE_EMAIL = os.environ.get('ENABLE_EMAIL_NOTIFICATIONS', 'false').lower() == 'true'

def handler(event, context):
    """
    Notification Tool: Send notifications to multiple channels.
    """
    channels = event.get('channels', ['slack'])  # Support multiple channels
    message = event.get('message', {})
    results = {}
    
    # Send to all enabled channels
    if 'slack' in channels and ENABLE_SLACK:
        results['slack'] = send_slack_notification(message)
    
    if 'jira' in channels and ENABLE_JIRA:
        results['jira'] = create_jira_ticket(message)
    
    if 'pagerduty' in channels and ENABLE_PAGERDUTY:
        results['pagerduty'] = trigger_pagerduty(message)
    
    if 'teams' in channels and ENABLE_TEAMS:
        results['teams'] = send_teams_notification(message)
    
    if 'email' in channels and ENABLE_EMAIL:
        results['email'] = send_email_notification(message)
    
    return {
        'status': 'SUCCESS',
        'results': results,
        'channels_processed': len(results)
    }

def send_slack_notification(message):
    """Send notification to Slack via webhook."""
    if not SLACK_WEBHOOK_URL:
        return {'status': 'SKIPPED', 'message': 'Slack webhook not configured'}
    
    incident_id = message.get('incidentId', 'Unknown')
    title = message.get('title', 'Incident Alert')
    severity = message.get('severity', 'MEDIUM')
    description = message.get('description', '')
    status = message.get('status', 'OPEN')
    diagnosis = message.get('diagnosis')
    confidence = message.get('confidence')
    requires_approval = message.get('requiresApproval', False)
    approval_buttons = message.get('approvalButtons', False)
    
    # Get severity color
    severity_colors = {
        'CRITICAL': '#DC2626',  # Red
        'HIGH': '#EA580C',      # Orange
        'MEDIUM': '#F59E0B',    # Amber
        'LOW': '#3B82F6'        # Blue
    }
    color = severity_colors.get(severity, '#6B7280')
    
    # Get status emoji and color
    status_info = {
        'OPEN': {'emoji': '🆕', 'color': '#3B82F6', 'text': 'New Incident'},
        'PENDING_APPROVAL': {'emoji': '⏳', 'color': '#F59E0B', 'text': 'Awaiting Approval'},
        'APPROVED': {'emoji': '✅', 'color': '#10B981', 'text': 'Approved'},
        'DENIED': {'emoji': '❌', 'color': '#DC2626', 'text': 'Denied'},
        'IN_PROGRESS': {'emoji': '⚙️', 'color': '#F59E0B', 'text': 'Agent Processing'},
        'RESOLVED': {'emoji': '✅', 'color': '#10B981', 'text': 'Resolved'},
        'CLOSED': {'emoji': '🔒', 'color': '#6B7280', 'text': 'Closed'}
    }
    status_data = status_info.get(status, status_info['OPEN'])
    
    # Build blocks
    blocks = [
        {
            'type': 'header',
            'text': {
                'type': 'plain_text',
                'text': f'{get_severity_emoji(severity)} {title}',
                'emoji': True
            }
        },
        {
            'type': 'section',
            'fields': [
                {
                    'type': 'mrkdwn',
                    'text': f'*Status:*\n{status_data["emoji"]} {status_data["text"]}'
                },
                {
                    'type': 'mrkdwn',
                    'text': f'*Severity:*\n{get_severity_emoji(severity)} `{severity}`'
                },
                {
                    'type': 'mrkdwn',
                    'text': f'*Incident ID:*\n`{incident_id[:20]}...`'
                },
                {
                    'type': 'mrkdwn',
                    'text': f'*Time:*\n<!date^{int(time.time())}^{{time}}|{time.strftime("%H:%M:%S")}>'
                }
            ]
        },
        {
            'type': 'section',
            'text': {
                'type': 'mrkdwn',
                'text': f'*Description:*\n{description[:500]}'
            }
        }
    ]
    
    # Add diagnosis if available
    if diagnosis:
        diagnosis_text = diagnosis if isinstance(diagnosis, str) else str(diagnosis)[:300]
        confidence_text = f' (Confidence: {confidence}%)' if confidence else ''
        blocks.append({
            'type': 'section',
            'text': {
                'type': 'mrkdwn',
                'text': f'*🤖 AI Diagnosis:*{confidence_text}\n```{diagnosis_text}```'
            }
        })
    
    # Add action buttons
    action_elements = []
    
    # Add approval buttons if required
    if approval_buttons and status == 'PENDING_APPROVAL':
        action_elements.extend([
            {
                'type': 'button',
                'text': {
                    'type': 'plain_text',
                    'text': '✅ Approve',
                    'emoji': True
                },
                'style': 'primary',
                'value': f'approve_{incident_id}',
                'action_id': 'approve_incident'
            },
            {
                'type': 'button',
                'text': {
                    'type': 'plain_text',
                    'text': '❌ Deny',
                    'emoji': True
                },
                'style': 'danger',
                'value': f'deny_{incident_id}',
                'action_id': 'deny_incident'
            }
        ])
    
    # Add standard navigation buttons
    action_elements.extend([
        {
            'type': 'button',
            'text': {
                'type': 'plain_text',
                'text': '📊 View Dashboard',
                'emoji': True
            },
            'url': f'http://localhost:3000',
            'style': 'primary' if not approval_buttons else None
        },
        {
            'type': 'button',
            'text': {
                'type': 'plain_text',
                'text': '📋 View Details',
                'emoji': True
            },
            'url': f'https://console.aws.amazon.com/cloudwatch'
        }
    ])
    
    blocks.append({
        'type': 'actions',
        'elements': action_elements
    })
    
    # Add divider and footer
    blocks.extend([
        {'type': 'divider'},
        {
            'type': 'context',
            'elements': [
                {
                    'type': 'mrkdwn',
                    'text': f'🤖 *ResiliBot* | Powered by Amazon Bedrock | {time.strftime("%Y-%m-%d %H:%M:%S UTC")}'
                }
            ]
        }
    ])
    
    # Format Slack message with attachments for color
    slack_payload = {
        'text': f'{get_severity_emoji(severity)} {title}',
        'blocks': blocks,
        'attachments': [
            {
                'color': color,
                'blocks': [
                    {
                        'type': 'section',
                        'text': {
                            'type': 'mrkdwn',
                            'text': f'*Status:* {status_data["emoji"]} {status_data["text"]}'
                        }
                    }
                ]
            }
        ]
    }
    
    try:
        response = http.request(
            'POST',
            SLACK_WEBHOOK_URL,
            body=json.dumps(slack_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status == 200:
            return {'status': 'SUCCESS', 'message': 'Slack notification sent'}
        else:
            return {'status': 'FAILED', 'error': f'HTTP {response.status}'}
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}

def create_jira_ticket(message):
    """Create Jira ticket via REST API."""
    if not all([JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN]):
        return {'status': 'SKIPPED', 'message': 'Jira credentials not configured'}
    
    incident_id = message.get('incidentId', 'Unknown')
    title = message.get('title', 'Incident Alert')
    severity = message.get('severity', 'MEDIUM')
    description = message.get('description', '')
    
    # Map severity to Jira priority
    priority_map = {
        'CRITICAL': 'Highest',
        'HIGH': 'High', 
        'MEDIUM': 'Medium',
        'LOW': 'Low'
    }
    priority = priority_map.get(severity, 'Medium')
    
    jira_payload = {
        'fields': {
            'project': {'key': JIRA_PROJECT_KEY},
            'summary': f'[ResiliBot] {title}',
            'description': f'''
*Incident ID:* {incident_id}
*Severity:* {severity}
*Source:* ResiliBot Autonomous Agent

*Description:*
{description}

*Dashboard:* http://localhost:3000
*AWS Console:* https://console.aws.amazon.com/cloudwatch

This incident was automatically detected and is being processed by ResiliBot.
            '''.strip(),
            'issuetype': {'name': 'Bug'},
            'priority': {'name': priority},
            'labels': ['resilibot', 'incident', severity.lower()]
        }
    }
    
    try:
        import base64
        auth_string = f"{JIRA_USERNAME}:{JIRA_API_TOKEN}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        response = http.request(
            'POST',
            f'{JIRA_URL}/rest/api/2/issue',
            body=json.dumps(jira_payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {auth_bytes}'
            }
        )
        
        if response.status == 201:
            response_data = json.loads(response.data.decode())
            ticket_key = response_data.get('key')
            return {
                'status': 'SUCCESS',
                'message': f'Jira ticket created: {ticket_key}',
                'ticketId': ticket_key,
                'url': f'{JIRA_URL}/browse/{ticket_key}'
            }
        else:
            return {'status': 'FAILED', 'error': f'HTTP {response.status}'}
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}

def trigger_pagerduty(message):
    """Trigger PagerDuty incident via Events API."""
    if not PAGERDUTY_INTEGRATION_KEY:
        return {'status': 'SKIPPED', 'message': 'PagerDuty integration key not configured'}
    
    incident_id = message.get('incidentId', 'Unknown')
    title = message.get('title', 'Incident Alert')
    severity = message.get('severity', 'MEDIUM')
    description = message.get('description', '')
    
    # Map severity to PagerDuty severity
    pd_severity_map = {
        'CRITICAL': 'critical',
        'HIGH': 'error',
        'MEDIUM': 'warning', 
        'LOW': 'info'
    }
    pd_severity = pd_severity_map.get(severity, 'warning')
    
    pd_payload = {
        'routing_key': PAGERDUTY_INTEGRATION_KEY,
        'event_action': 'trigger',
        'dedup_key': f'resilibot-{incident_id}',
        'payload': {
            'summary': f'[ResiliBot] {title}',
            'source': 'ResiliBot',
            'severity': pd_severity,
            'component': 'AWS Infrastructure',
            'group': 'DevOps',
            'class': 'Infrastructure',
            'custom_details': {
                'incident_id': incident_id,
                'severity': severity,
                'description': description,
                'dashboard_url': 'http://localhost:3000',
                'aws_console': 'https://console.aws.amazon.com/cloudwatch'
            }
        },
        'links': [
            {
                'href': 'http://localhost:3000',
                'text': 'ResiliBot Dashboard'
            }
        ]
    }
    
    try:
        response = http.request(
            'POST',
            'https://events.pagerduty.com/v2/enqueue',
            body=json.dumps(pd_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status == 202:
            response_data = json.loads(response.data.decode())
            return {
                'status': 'SUCCESS',
                'message': 'PagerDuty incident triggered',
                'incidentKey': response_data.get('dedup_key'),
                'status_url': response_data.get('status')
            }
        else:
            return {'status': 'FAILED', 'error': f'HTTP {response.status}'}
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}

def get_severity_emoji(severity):
    """Get emoji for severity level."""
    emoji_map = {
        'CRITICAL': ':fire:',
        'HIGH': ':rotating_light:',
        'MEDIUM': ':warning:',
        'LOW': ':information_source:'
    }
    return emoji_map.get(severity, ':question:')

def send_teams_notification(message):
    """Send notification to Microsoft Teams via webhook."""
    if not TEAMS_WEBHOOK_URL:
        return {'status': 'SKIPPED', 'message': 'Teams webhook not configured'}
    
    incident_id = message.get('incidentId', 'Unknown')
    title = message.get('title', 'Incident Alert')
    severity = message.get('severity', 'MEDIUM')
    description = message.get('description', '')
    status = message.get('status', 'OPEN')
    
    # Get theme color based on severity
    color_map = {
        'CRITICAL': 'FF0000',  # Red
        'HIGH': 'FF8C00',      # Orange
        'MEDIUM': 'FFD700',    # Gold
        'LOW': '0078D4'        # Blue
    }
    theme_color = color_map.get(severity, '808080')
    
    teams_payload = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        'summary': f'ResiliBot Alert: {title}',
        'themeColor': theme_color,
        'sections': [
            {
                'activityTitle': f'🤖 ResiliBot Alert',
                'activitySubtitle': f'{get_severity_emoji(severity)} {title}',
                'activityImage': 'https://raw.githubusercontent.com/aws/aws-icons/main/PNG%20Light/Arch_Amazon-Bedrock_64.png',
                'facts': [
                    {'name': 'Incident ID', 'value': incident_id[:20] + '...'},
                    {'name': 'Severity', 'value': severity},
                    {'name': 'Status', 'value': status},
                    {'name': 'Time', 'value': time.strftime('%Y-%m-%d %H:%M:%S UTC')}
                ],
                'text': description[:500]
            }
        ],
        'potentialAction': [
            {
                '@type': 'OpenUri',
                'name': 'View Dashboard',
                'targets': [
                    {'os': 'default', 'uri': 'http://localhost:3000'}
                ]
            },
            {
                '@type': 'OpenUri', 
                'name': 'AWS Console',
                'targets': [
                    {'os': 'default', 'uri': 'https://console.aws.amazon.com/cloudwatch'}
                ]
            }
        ]
    }
    
    try:
        response = http.request(
            'POST',
            TEAMS_WEBHOOK_URL,
            body=json.dumps(teams_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status == 200:
            return {'status': 'SUCCESS', 'message': 'Teams notification sent'}
        else:
            return {'status': 'FAILED', 'error': f'HTTP {response.status}'}
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}

def send_email_notification(message):
    """Send email notification via AWS SES."""
    if not SES_FROM_EMAIL or not SES_TO_EMAILS:
        return {'status': 'SKIPPED', 'message': 'Email configuration not complete'}
    
    try:
        import boto3
        ses_client = boto3.client('ses')
        
        incident_id = message.get('incidentId', 'Unknown')
        title = message.get('title', 'Incident Alert')
        severity = message.get('severity', 'MEDIUM')
        description = message.get('description', '')
        status = message.get('status', 'OPEN')
        diagnosis = message.get('diagnosis', '')
        
        # Create HTML email
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #232F3E; color: white; padding: 20px; border-radius: 5px; }}
                .content {{ padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 10px; }}
                .severity-{severity.lower()} {{ border-left: 5px solid {'#DC2626' if severity == 'CRITICAL' else '#EA580C' if severity == 'HIGH' else '#F59E0B' if severity == 'MEDIUM' else '#3B82F6'}; }}
                .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
                .button {{ background-color: #FF9900; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block; margin: 10px 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>🤖 ResiliBot Alert</h2>
                <h3>{get_severity_emoji(severity)} {title}</h3>
            </div>
            
            <div class="content severity-{severity.lower()}">
                <h4>Incident Details</h4>
                <p><strong>Incident ID:</strong> {incident_id}</p>
                <p><strong>Severity:</strong> {severity}</p>
                <p><strong>Status:</strong> {status}</p>
                <p><strong>Time:</strong> {time.strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                
                <h4>Description</h4>
                <p>{description}</p>
                
                {f'<h4>AI Diagnosis</h4><p>{diagnosis}</p>' if diagnosis else ''}
                
                <div style="margin-top: 20px;">
                    <a href="http://localhost:3000" class="button">View Dashboard</a>
                    <a href="https://console.aws.amazon.com/cloudwatch" class="button">AWS Console</a>
                </div>
            </div>
            
            <div class="footer">
                <p>This alert was automatically generated by ResiliBot - Autonomous Incident Response Agent</p>
                <p>Powered by Amazon Bedrock | Built by Hosni Belfeki</p>
            </div>
        </body>
        </html>
        """
        
        # Create text version
        text_body = f"""
ResiliBot Alert: {title}

Incident Details:
- Incident ID: {incident_id}
- Severity: {severity}
- Status: {status}
- Time: {time.strftime('%Y-%m-%d %H:%M:%S UTC')}

Description:
{description}

{f'AI Diagnosis: {diagnosis}' if diagnosis else ''}

Dashboard: http://localhost:3000
AWS Console: https://console.aws.amazon.com/cloudwatch

This alert was automatically generated by ResiliBot.
        """
        
        # Send email to all recipients
        for email in SES_TO_EMAILS:
            if email.strip():
                ses_client.send_email(
                    Source=SES_FROM_EMAIL,
                    Destination={'ToAddresses': [email.strip()]},
                    Message={
                        'Subject': {
                            'Data': f'[ResiliBot] {severity} - {title}',
                            'Charset': 'UTF-8'
                        },
                        'Body': {
                            'Text': {
                                'Data': text_body,
                                'Charset': 'UTF-8'
                            },
                            'Html': {
                                'Data': html_body,
                                'Charset': 'UTF-8'
                            }
                        }
                    }
                )
        
        return {
            'status': 'SUCCESS',
            'message': f'Email sent to {len([e for e in SES_TO_EMAILS if e.strip()])} recipients'
        }
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}