# ResiliBot Quick Start Guide

Get ResiliBot running in under 10 minutes! ⚡

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] AWS CLI configured (`aws configure`)
## 5-Minute Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/hosnibelfeki/resilibot.git
cd resilibot
```

### Step 2: Enable Bedrock Models
1. Go to [AWS Console → Bedrock → Model Access](https://console.aws.amazon.com/bedrock/home#/modelaccess)
2. Click "Enable specific models"
3. Select: **Claude 3 Sonnet** (or Llama 3)
4. Click "Save changes"
5. Wait for status: "Access granted" ✅

### Step 3: Run Setup Script
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
- Install all dependencies
- Bootstrap AWS CDK
- Deploy infrastructure
- Upload sample runbooks

**Time**: ~5 minutes

### Step 4: Configure Frontend
```bash
# Get API endpoint from CDK output
API_ENDPOINT="https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"

# Create frontend config
echo "REACT_APP_API_ENDPOINT=${API_ENDPOINT}" > frontend/.env

# Build and run
cd frontend
npm start
```

Open http://localhost:3000 🎉

## Test Your Setup

### Option 1: Quick Test Script
```bash
chmod +x scripts/test-incident.sh
./scripts/test-incident.sh
```

### Option 2: Manual Test
```bash
# Get your API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ResiliBotStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text)

# Create test incident
curl -X POST ${API_ENDPOINT}/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test High CPU Alert",
    "description": "Testing ResiliBot",
    "severity": "HIGH",
    "source": "manual"
  }'
```

### Option 3: CloudWatch Alarm
```bash
# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name resilibot-test-alarm \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# Trigger it
aws cloudwatch put-metric-data \
  --namespace "ResiliBot/Demo" \
  --metric-name CPUUtilization \
  --value 95.0
```

## Verify It's Working

### Check Dashboard
1. Open http://localhost:3000
2. You should see your test incident
3. Click on it to view details
4. Watch the agent reasoning and actions

### Check Logs
```bash
# Agent execution logs
aws logs tail /aws/lambda/ResiliBotStack-AgentLambda --follow

# Look for:
# [OBSERVE] Gathering data...
# [REASON] Analyzing root cause...
# [PLAN] Creating remediation plan...
# [ACT] Executing remediation...
```

### Check DynamoDB
```bash
# List incidents
aws dynamodb scan \
  --table-name $(aws cloudformation describe-stacks \
    --stack-name ResiliBotStack \
    --query 'Stacks[0].Outputs[?OutputKey==`IncidentsTableName`].OutputValue' \
    --output text)
```

## Optional: Slack Integration

### Setup Slack Webhook
1. Go to https://api.slack.com/apps
2. Create new app → "From scratch"
3. Enable "Incoming Webhooks"
4. Add webhook to workspace
5. Copy webhook URL

### Configure ResiliBot
```bash
# Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name ResiliBotStack-NotificationLambda-XXXXX \
  --environment Variables={SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK}
```

### Test Notification
```bash
# Create incident (will trigger Slack notification)
curl -X POST ${API_ENDPOINT}/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Slack Test Alert",
    "severity": "CRITICAL",
    "source": "manual"
  }'
```

Check your Slack channel! 📢

## Troubleshooting

### "Bedrock Access Denied"
**Solution**: Enable model access in AWS Console (Step 2 above)

### "CDK Bootstrap Failed"
**Solution**: 
```bash
aws sts get-caller-identity  # Verify AWS credentials
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### "Lambda Timeout"
**Solution**: Check CloudWatch Logs for errors
```bash
aws logs tail /aws/lambda/ResiliBotStack-AgentLambda --follow
```

### "Frontend Not Loading"
**Solution**: Check API endpoint in `.env`
```bash
cat frontend/.env
# Should show: REACT_APP_API_ENDPOINT=https://...
```

## Next Steps

### For Development
- [ ] Read [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [ ] Review [API.md](docs/API.md)
- [ ] Add custom runbooks to `runbooks/`
- [ ] Customize agent logic in `backend/functions/agent/agent.py`

### For Demo
- [ ] Follow [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)
- [ ] Record 3-minute video
- [ ] Deploy frontend to Amplify
- [ ] Prepare architecture diagram

### For Production
- [ ] Add API authentication
- [ ] Enable VPC for Lambdas
- [ ] Set up monitoring dashboards
- [ ] Configure backup policies
- [ ] Implement approval workflow

## Cleanup

When you're done testing:
```bash
chmod +x scripts/cleanup.sh
./scripts/cleanup.sh
```

This deletes all AWS resources to avoid charges.


## Get Help

- **Issues**: [GitHub Issues](https://github.com/hosnibelfeki/resilibot/issues)
- **Email**: belfkihosni@gmail.com
- **LinkedIn**: [Hosni Belfeki](https://linkedin.com/in/hosnibelfeki/)
- **Docs**: Check `docs/` folder
- **Logs**: `aws logs tail /aws/lambda/ResiliBotStack-AgentLambda --follow`

## Success Checklist

- [ ] Infrastructure deployed ✅
- [ ] Bedrock models enabled ✅
- [ ] Test incident created ✅
- [ ] Agent processed incident ✅
- [ ] Dashboard showing results ✅
- [ ] Logs showing ORPA loop ✅

---

Built for AWS AI Agent Hackathon 2025 🏆
