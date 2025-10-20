# ResiliBot Deployment Guide

Complete guide for deploying ResiliBot to AWS in development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Steps](#deployment-steps)
- [Configuration](#configuration)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)
- [Security](#security)

---

## Prerequisites

### AWS Account Requirements

1. **AWS Account**: Active AWS account with admin access
2. **Amazon Bedrock Access**: 
   - Navigate to AWS Console → Bedrock → Model Access
   - Enable: **Claude 3 Sonnet** (anthropic.claude-3-sonnet-20240229-v1:0)
   - Alternative models: Llama 3, Amazon Titan
   - Wait for approval (typically instant)
3. **AWS Region**: Bedrock-enabled region (us-east-1, us-west-2, etc.)

### Local Development Tools

Verify you have the required tools installed:

```bash
# Node.js 18 or higher
node --version  # Should show v18.x.x or higher

# Python 3.11 or higher
python --version  # Should show Python 3.11.x or higher

# AWS CLI v2
aws --version  # Should show aws-cli/2.x.x

# AWS CDK CLI
cdk --version  # Should show 2.x.x
```

### Install Missing Tools

```bash
# Install AWS CLI (if needed)
# macOS
brew install awscli

# Windows
# Download from: https://aws.amazon.com/cli/

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install AWS CDK CLI
npm install -g aws-cdk

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format
```

## Deployment Steps

### 1. Clone and Setup
```bash
git clone https://github.com/yourusername/resilibot.git
cd resilibot
```

### 2. Deploy Infrastructure
```bash
cd infrastructure
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy all stacks
cdk deploy --all

# Note the outputs:
# - APIEndpoint: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
# - IncidentsTableName: ResiliBotStack-IncidentsTable-XXXXX
# - RunbooksBucketName: resilibotstack-runbooksbucket-XXXXX
```

### 3. Upload Runbooks
```bash
cd ../runbooks

# Get bucket name from CDK output
BUCKET_NAME="resilibotstack-runbooksbucket-xxxxx"

# Upload runbooks
aws s3 sync . s3://${BUCKET_NAME}/
```

### 4. Configure Environment Variables
```bash
# Set Slack webhook (optional)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name ResiliBotStack-NotificationLambda-XXXXX \
  --environment Variables={SLACK_WEBHOOK_URL=$SLACK_WEBHOOK_URL}
```

### 5. Deploy Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Set API endpoint
echo "REACT_APP_API_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod" > .env

# Build
npm run build

# Deploy to Amplify (or S3 + CloudFront)
# Option A: AWS Amplify Console
# - Connect GitHub repo
# - Set build settings
# - Deploy

# Option B: S3 Static Hosting
aws s3 mb s3://resilibot-frontend-${ACCOUNT_ID}
aws s3 sync build/ s3://resilibot-frontend-${ACCOUNT_ID}/
aws s3 website s3://resilibot-frontend-${ACCOUNT_ID}/ \
  --index-document index.html
```

## Testing

### Test Incident Creation
```bash
# Create test incident via API
curl -X POST https://your-api-gateway-url/prod/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test High CPU Alert",
    "description": "CPU utilization exceeded 90%",
    "severity": "HIGH",
    "source": "manual"
  }'
```

### Simulate CloudWatch Alarm
```bash
# Create test alarm
aws cloudwatch put-metric-alarm \
  --alarm-name resilibot-test-cpu-alarm \
  --alarm-description "Test alarm for ResiliBot" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# Trigger alarm by publishing high metric
aws cloudwatch put-metric-data \
  --namespace "ResiliBot/Demo" \
  --metric-name CPUUtilization \
  --value 95.0
```

### View Logs
```bash
# Agent logs
aws logs tail /aws/lambda/ResiliBotStack-AgentLambda-XXXXX --follow

# Ingestion logs
aws logs tail /aws/lambda/ResiliBotStack-IngestionLambda-XXXXX --follow
```

## Configuration

### Bedrock Model Selection
Edit `infrastructure/lib/resilibot-stack.ts`:
```typescript
environment: {
  BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
  // Or use: 'meta.llama3-70b-instruct-v1:0'
  // Or use: 'amazon.titan-text-express-v1'
}
```

### Safety Controls
Edit `backend/functions/agent/agent.py`:
```python
# Define safe actions
SAFE_ACTIONS = ['restart_service', 'scale_up', 'clear_cache']

# Actions requiring approval
RISKY_ACTIONS = ['terminate_instance', 'rollback_deployment']
```

## Monitoring

### CloudWatch Dashboards
```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ResiliBot \
  --dashboard-body file://dashboard.json
```

### Metrics to Monitor
- Lambda invocation count
- Lambda error rate
- DynamoDB read/write capacity
- API Gateway latency
- Bedrock API calls

## Troubleshooting

### Bedrock Access Denied
```bash
# Check IAM permissions
aws iam get-role-policy \
  --role-name ResiliBotStack-AgentRole-XXXXX \
  --policy-name BedrockPolicy

# Verify model access
aws bedrock list-foundation-models --region us-east-1
```

### Lambda Timeout
- Increase timeout in CDK stack
- Check CloudWatch Logs for bottlenecks
- Optimize Bedrock prompt size

### DynamoDB Throttling
- Switch to on-demand billing mode
- Increase provisioned capacity
- Add GSI for query patterns

## Cost Optimization

### Estimated Monthly Costs
- Lambda: $5-20 (depending on incidents)
- DynamoDB: $1-5 (on-demand)
- S3: <$1
- Bedrock: $10-50 (based on usage)
- API Gateway: $1-5
- **Total: ~$20-80/month**

### Cost Reduction Tips
- Use Lambda reserved concurrency
- Enable S3 lifecycle policies
- Use Bedrock batch inference
- Implement caching for repeated queries

## Security Best Practices

1. **IAM Least Privilege**: Grant minimal permissions
2. **Secrets Management**: Use AWS Secrets Manager for API keys
3. **VPC Isolation**: Deploy Lambdas in private subnets
4. **Encryption**: Enable encryption at rest for DynamoDB and S3
5. **API Authentication**: Add API Gateway authorizer
6. **Audit Logging**: Enable CloudTrail

## Cleanup

```bash
# Delete all resources
cd infrastructure
cdk destroy --all

# Delete S3 buckets (if not auto-deleted)
aws s3 rb s3://resilibot-runbooks-xxxxx --force
aws s3 rb s3://resilibot-postmortems-xxxxx --force
```

## Post-Deployment Steps

### 1. Verify Deployment

```bash
# Check all Lambda functions are deployed
aws lambda list-functions --query "Functions[?contains(FunctionName, 'ResiliBot')].FunctionName"

# Verify DynamoDB table
aws dynamodb describe-table --table-name $(aws cloudformation describe-stacks \
  --stack-name ResiliBotStack \
  --query 'Stacks[0].Outputs[?OutputKey==`IncidentsTableName`].OutputValue' \
  --output text)

# Test API endpoint
curl $(aws cloudformation describe-stacks \
  --stack-name ResiliBotStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text)/incidents
```

### 2. Configure Integrations

- **Slack**: Follow [SLACK_SETUP_GUIDE.md](../SLACK_SETUP_GUIDE.md)
- **Jira**: Configure Jira webhook in notification Lambda
- **PagerDuty**: Add PagerDuty integration key
- **Email**: Set up SES for email notifications

### 3. Add Custom Runbooks

```bash
# Create runbooks for your infrastructure
cd runbooks
echo "# Custom Runbook" > custom-runbook.md

# Upload to S3
aws s3 cp custom-runbook.md s3://$(aws cloudformation describe-stacks \
  --stack-name ResiliBotStack \
  --query 'Stacks[0].Outputs[?OutputKey==`RunbooksBucketName`].OutputValue' \
  --output text)/
```

### 4. Set Up Monitoring

- Create CloudWatch dashboards
- Configure CloudWatch alarms for Lambda errors
- Set up log insights queries
- Enable X-Ray tracing for distributed tracing

### 5. Production Hardening

- Enable API Gateway authentication
- Implement rate limiting
- Configure VPC for Lambdas
- Enable encryption at rest
- Set up backup policies
- Implement disaster recovery plan

---

## Next Steps

1. ✅ Review [Architecture Documentation](ARCHITECTURE.md)
2. ✅ Test with sample incidents
3. ✅ Configure notification channels
4. ✅ Add custom runbooks
5. ✅ Set up monitoring and alerts
6. ✅ Review security best practices
7. ✅ Plan for production rollout

---

## Support

For deployment issues:

- **Documentation**: [Main README](../README.md)
- **GitHub Issues**: [github.com/hosnibelfeki/resilibot/issues](https://github.com/hosnibelfeki/resilibot/issues)
- **Email**: belfkihosni@gmail.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0
