import json
import boto3

ssm = boto3.client('ssm')
ec2 = boto3.client('ec2')

def handler(event, context):
    """
    SSM Tool: Execute commands on EC2 instances via Systems Manager.
    Supports restart, run commands, and health checks.
    """
    action = event.get('action')
    target = event.get('target', {})
    
    if action == 'restart_service':
        return restart_service(target)
    elif action == 'run_command':
        return run_command(target)
    elif action == 'health_check':
        return health_check(target)
    else:
        return {'error': f'Unknown action: {action}'}

def restart_service(target):
    """Restart a service on target instances."""
    instance_ids = target.get('instanceIds', [])
    service_name = target.get('serviceName', 'application')
    
    if not instance_ids:
        return {'error': 'No instance IDs provided'}
    
    try:
        response = ssm.send_command(
            InstanceIds=instance_ids,
            DocumentName='AWS-RunShellScript',
            Parameters={
                'commands': [
                    f'sudo systemctl restart {service_name}',
                    f'sudo systemctl status {service_name}'
                ]
            },
            Comment=f'ResiliBot: Restart {service_name}'
        )
        
        command_id = response['Command']['CommandId']
        
        return {
            'status': 'SUCCESS',
            'commandId': command_id,
            'message': f'Restart command sent to {len(instance_ids)} instances'
        }
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}

def run_command(target):
    """Run arbitrary command on target instances."""
    instance_ids = target.get('instanceIds', [])
    commands = target.get('commands', [])
    
    if not instance_ids or not commands:
        return {'error': 'Missing instanceIds or commands'}
    
    try:
        response = ssm.send_command(
            InstanceIds=instance_ids,
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': commands},
            Comment='ResiliBot: Custom command'
        )
        
        return {
            'status': 'SUCCESS',
            'commandId': response['Command']['CommandId']
        }
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}

def health_check(target):
    """Check health status of target instances."""
    instance_ids = target.get('instanceIds', [])
    
    if not instance_ids:
        return {'error': 'No instance IDs provided'}
    
    try:
        response = ec2.describe_instance_status(InstanceIds=instance_ids)
        
        statuses = []
        for status in response['InstanceStatuses']:
            statuses.append({
                'instanceId': status['InstanceId'],
                'instanceState': status['InstanceState']['Name'],
                'systemStatus': status['SystemStatus']['Status'],
                'instanceStatus': status['InstanceStatus']['Status']
            })
        
        return {'status': 'SUCCESS', 'instances': statuses}
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}
