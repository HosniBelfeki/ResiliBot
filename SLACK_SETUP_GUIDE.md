# Slack Notifications Setup Guide

## 🔔 Configure Slack Notifications for ResiliBot

This guide will help you set up Slack notifications so your team gets alerted when incidents are detected and resolved.

---

## Step 1: Create Slack Webhook URL

### Option A: Using Slack Incoming Webhooks (Recommended)

1. **Go to Slack API**:
   - Visit: https://api.slack.com/apps
   - Click "Create New App"

2. **Create App**:
   - Choose "From scratch"
   - App Name: `ResiliBot`
   - Pick your workspace
   - Click "Create App"

3. **Enable Incoming Webhooks**:
   - In the left sidebar, click "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to **ON**
   - Click "Add New Webhook to Workspace"

4. **Select Channel**:
   - Choose the channel where you want notifications (e.g., `#incidents` or `#alerts`)
   - Click "Allow"

5. **Copy Webhook URL**:
   - You'll see a webhook URL like:
   ```
   https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   ```
   - **Copy this URL** - you'll need it in Step 2

### Option B: Using Slack Bot (Advanced)

If you want more control:
1. Create a Slack Bot in your app
2. Add OAuth scopes: `chat:write`, `chat:write.public`
3. Install to workspace
4. Use Bot Token instead of webhook

---

## Step 2: Configure AWS Environment Variable

### Method 1: Using AWS Console (Easiest)

1. **Go to Lambda Console**:
   - Open: https://console.aws.amazon.com/lambda
   - Search for: `ResiliBotStack-NotificationLambda`
   - Click on the function

2. **Add Environment Variable**:
   - Go to "Configuration" tab
   - Click "Environment variables"
   - Click "Edit"
   - Click "Add environment variable"
   - Key: `SLACK_WEBHOOK_URL`
   - Value: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
   - Click "Save"

### Method 2: Using AWS CLI

```bash
# Replace with your actual webhook URL
WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"

# Get the Lambda function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'NotificationLambda')].FunctionName" --output text)

# Update environment variable
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --environment "Variables={SLACK_WEBHOOK_URL=$WEBHOOK_URL}"
```

### Method 3: Using CDK (Permanent)

Update `infrastructure/lib/resilibot-stack.ts`:

```typescript
const notificationLambda = new lambda.Function(this, 'NotificationLambda', {
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: 'notification.handler',
  code: lambda.Code.fromAsset('../backend/functions/tools'),
  environment: {
    SLACK_WEBHOOK_URL: 'YOUR_WEBHOOK_URL_HERE', // Replace with actual URL
  },
  timeout: cdk.Duration.seconds(30),
  layers: [sharedLayer],
});
```

Then redeploy:
```bash
cd infrastructure
npx cdk deploy --all
```

---

## Step 3: Update Agent to Send Notifications

The agent needs to invoke the notification Lambda. Update `backend/functions/agent/agent.py`:

Add this function:

```python
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
        
        # Get notification lambda name
        lambda_list = lambda_client.list_functions()
        notification_function = None
        for func in lambda_list.get('Functions', []):
            if 'NotificationLambda' in func['FunctionName']:
                notification_function = func['FunctionName']
                break
        
        if notification_function:
            lambda_client.invoke(
                FunctionName=notification_function,
                InvocationType='Event',
                Payload=json.dumps(notification_payload)
            )
            print(f"Notification sent for incident {incident_id}")
        else:
            print("Warning: Notification Lambda not found")
    except Exception as e:
        print(f"Failed to send notification: {str(e)}")
```

Then call it in the `execute_agent_loop` function:

```python
def execute_agent_loop(incident_id):
    # ... existing code ...
    
    # Send notification after diagnosis
    send_notification(incident_id, incident, diagnosis, 'IN_PROGRESS')
    
    # ... rest of code ...
    
    # Send notification after resolution
    if plan.get('success'):
        send_notification(incident_id, incident, diagnosis, 'RESOLVED')
```

---

## Step 4: Test Slack Notifications

### Quick Test:

```bash
# Test notification Lambda directly
aws lambda invoke \
  --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'NotificationLambda')].FunctionName" --output text) \
  --payload '{
    "channel": "slack",
    "message": {
      "incidentId": "test-123",
      "title": "Test Notification",
      "severity": "HIGH",
      "description": "Testing Slack integration",
      "status": "OPEN"
    }
  }' \
  response.json

cat response.json
```

### Create Test Incident:

```bash
curl -X POST https://r7tdq3zfy8.execute-api.us-east-1.amazonaws.com/prod/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Slack Test - High CPU",
    "description": "Testing Slack notifications",
    "severity": "CRITICAL",
    "source": "slack_test"
  }'
```

**Expected Result**: You should see a message in your Slack channel!

---

## Step 5: Customize Slack Message Format

The notification Lambda (`backend/functions/tools/notification.py`) already has a nice format:

```python
slack_payload = {
    'text': f':rotating_light: *{title}*',
    'blocks': [
        {
            'type': 'header',
            'text': {
                'type': 'plain_text',
                'text': f'{get_severity_emoji(severity)} {title}'
            }
        },
        {
            'type': 'section',
            'fields': [
                {'type': 'mrkdwn', 'text': f'*Incident ID:*\n{incident_id}'},
                {'type': 'mrkdwn', 'text': f'*Severity:*\n{severity}'},
            ]
        },
        {
            'type': 'section',
            'text': {
                'type': 'mrkdwn',
                'text': f'*Description:*\n{description}'
            }
        }
    ]
}
```

### Customize Emojis:

Edit `backend/functions/tools/notification.py`:

```python
def get_severity_emoji(severity):
    emoji_map = {
        'CRITICAL': ':fire:',
        'HIGH': ':rotating_light:',
        'MEDIUM': ':warning:',
        'LOW': ':information_source:'
    }
    return emoji_map.get(severity, ':question:')
```

---

## Troubleshooting

### Issue: "Slack webhook not configured"

**Solution**: Make sure you set the `SLACK_WEBHOOK_URL` environment variable in the Notification Lambda.

```bash
# Check if variable is set
aws lambda get-function-configuration \
  --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'NotificationLambda')].FunctionName" --output text) \
  --query 'Environment.Variables.SLACK_WEBHOOK_URL'
```

### Issue: "Invalid webhook URL"

**Solution**: Verify your webhook URL is correct:
- Should start with `https://hooks.slack.com/services/`
- Should have 3 parts separated by `/`
- Test it with curl:

```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test from ResiliBot"}'
```

### Issue: "Notification Lambda not found"

**Solution**: Grant agent Lambda permission to invoke notification Lambda.

Already done in your CDK stack:
```typescript
notificationLambda.grantInvoke(agentLambda);
```

### Issue: Messages not appearing in Slack

**Check**:
1. Webhook URL is correct
2. Channel exists and bot has access
3. Check Lambda logs:
```bash
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'NotificationLambda')].FunctionName" --output text) --follow
```

---

## Advanced: Add Action Buttons

You can add interactive buttons to Slack messages:

```python
slack_payload = {
    'text': f':rotating_light: *{title}*',
    'blocks': [
        # ... existing blocks ...
        {
            'type': 'actions',
            'elements': [
                {
                    'type': 'button',
                    'text': {
                        'type': 'plain_text',
                        'text': 'View Details'
                    },
                    'url': f'https://your-dashboard.com/incidents/{incident_id}',
                    'style': 'primary'
                },
                {
                    'type': 'button',
                    'text': {
                        'type': 'plain_text',
                        'text': 'Acknowledge'
                    },
                    'value': incident_id,
                    'action_id': 'acknowledge_incident'
                }
            ]
        }
    ]
}
```

---

## Security Best Practices

### 1. Use AWS Secrets Manager (Recommended)

Instead of environment variables, store webhook URL in Secrets Manager:

```bash
# Store secret
aws secretsmanager create-secret \
  --name resilibot/slack-webhook \
  --secret-string "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Grant Lambda permission to read secret
# (Add to CDK stack)
```

### 2. Rotate Webhook URLs

Periodically regenerate your Slack webhook URL for security.

### 3. Restrict Lambda Permissions

Ensure notification Lambda only has necessary permissions.

---

## Testing Checklist

- [ ] Webhook URL created in Slack
- [ ] Environment variable set in Lambda
- [ ] Test notification sent successfully
- [ ] Message appears in correct Slack channel
- [ ] Message format looks good
- [ ] Emojis display correctly
- [ ] Create real incident and verify notification
- [ ] Check Lambda logs for errors

---

## Example Slack Message

When an incident is detected, you'll see:

```
🔥 CRITICAL: High CPU Alert

Incident ID: 54b9f67b-1a25-4fae-b265-1706c3f06403
Severity: CRITICAL

Description: CPU utilization exceeded 95% for 5 minutes

Status: IN_PROGRESS
Diagnosis: Memory leak causing GC thrashing
Confidence: 87%

[View Details] [Acknowledge]
```

---

## Next Steps

After Slack is working:
1. Add Jira integration (similar process)
2. Add PagerDuty integration
3. Add email notifications via SES
4. Add Microsoft Teams integration

---

## Support

If you need help:
- Check CloudWatch logs for notification Lambda
- Test webhook URL with curl
- Verify Slack app permissions
- Review `backend/functions/tools/notification.py`

---

**Your Slack notifications are ready to go!** 🎉

