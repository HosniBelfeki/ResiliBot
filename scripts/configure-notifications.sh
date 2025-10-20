#!/bin/bash

# ResiliBot Notification Configuration Script
# This script helps you configure all notification channels

set -e

echo "🤖 ResiliBot Notification Configuration"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get Lambda function names
echo "📡 Finding Lambda functions..."
NOTIFICATION_FUNCTION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'NotificationLambda')].FunctionName" --output text)

if [ -z "$NOTIFICATION_FUNCTION" ]; then
    echo -e "${RED}❌ Notification Lambda function not found. Please deploy infrastructure first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found Notification Lambda: $NOTIFICATION_FUNCTION${NC}"
echo ""

# Function to update Lambda environment variables
update_lambda_env() {
    local env_vars="$1"
    echo "🔧 Updating Lambda environment variables..."
    
    aws lambda update-function-configuration \
        --function-name "$NOTIFICATION_FUNCTION" \
        --environment "Variables={$env_vars}" > /dev/null
    
    echo -e "${GREEN}✅ Lambda environment updated${NC}"
}

# Function to get current environment variables
get_current_env() {
    aws lambda get-function-configuration \
        --function-name "$NOTIFICATION_FUNCTION" \
        --query 'Environment.Variables' \
        --output json 2>/dev/null || echo "{}"
}

# Parse current environment
CURRENT_ENV=$(get_current_env)

# Build environment variables string
ENV_VARS=""

# Slack Configuration
echo -e "${BLUE}🔔 Slack Configuration${NC}"
echo "======================"
read -p "Enable Slack notifications? (y/n) [y]: " ENABLE_SLACK
ENABLE_SLACK=${ENABLE_SLACK:-y}

if [[ $ENABLE_SLACK =~ ^[Yy]$ ]]; then
    echo ""
    echo "To get your Slack webhook URL:"
    echo "1. Go to https://api.slack.com/apps"
    echo "2. Create new app or select existing"
    echo "3. Go to 'Incoming Webhooks' and enable"
    echo "4. Add webhook to workspace"
    echo "5. Copy the webhook URL"
    echo ""
    
    read -p "Enter Slack webhook URL: " SLACK_WEBHOOK
    read -p "Enter Slack channel (e.g., #incidents) [#incidents]: " SLACK_CHANNEL
    SLACK_CHANNEL=${SLACK_CHANNEL:-#incidents}
    
    ENV_VARS="SLACK_WEBHOOK_URL=$SLACK_WEBHOOK,SLACK_CHANNEL=$SLACK_CHANNEL,ENABLE_SLACK_NOTIFICATIONS=true"
    echo -e "${GREEN}✅ Slack configured${NC}"
else
    ENV_VARS="ENABLE_SLACK_NOTIFICATIONS=false"
    echo -e "${YELLOW}⏭️  Slack notifications disabled${NC}"
fi

echo ""

# Jira Configuration
echo -e "${BLUE}🎫 Jira Configuration${NC}"
echo "===================="
read -p "Enable Jira integration? (y/n) [n]: " ENABLE_JIRA
ENABLE_JIRA=${ENABLE_JIRA:-n}

if [[ $ENABLE_JIRA =~ ^[Yy]$ ]]; then
    echo ""
    echo "To get your Jira API token:"
    echo "1. Go to https://id.atlassian.com/manage-profile/security/api-tokens"
    echo "2. Create API token"
    echo "3. Copy the token"
    echo ""
    
    read -p "Enter Jira URL (e.g., https://company.atlassian.net): " JIRA_URL
    read -p "Enter Jira username/email: " JIRA_USERNAME
    read -p "Enter Jira API token: " JIRA_API_TOKEN
    read -p "Enter Jira project key (e.g., INC) [INC]: " JIRA_PROJECT_KEY
    JIRA_PROJECT_KEY=${JIRA_PROJECT_KEY:-INC}
    
    ENV_VARS="$ENV_VARS,JIRA_URL=$JIRA_URL,JIRA_USERNAME=$JIRA_USERNAME,JIRA_API_TOKEN=$JIRA_API_TOKEN,JIRA_PROJECT_KEY=$JIRA_PROJECT_KEY,ENABLE_JIRA_INTEGRATION=true"
    echo -e "${GREEN}✅ Jira configured${NC}"
else
    ENV_VARS="$ENV_VARS,ENABLE_JIRA_INTEGRATION=false"
    echo -e "${YELLOW}⏭️  Jira integration disabled${NC}"
fi

echo ""

# PagerDuty Configuration
echo -e "${BLUE}📟 PagerDuty Configuration${NC}"
echo "========================="
read -p "Enable PagerDuty integration? (y/n) [n]: " ENABLE_PAGERDUTY
ENABLE_PAGERDUTY=${ENABLE_PAGERDUTY:-n}

if [[ $ENABLE_PAGERDUTY =~ ^[Yy]$ ]]; then
    echo ""
    echo "To get your PagerDuty integration key:"
    echo "1. Go to PagerDuty web app"
    echo "2. Go to Services → Your Service"
    echo "3. Go to Integrations tab"
    echo "4. Add integration → Events API v2"
    echo "5. Copy the Integration Key"
    echo ""
    
    read -p "Enter PagerDuty integration key: " PAGERDUTY_KEY
    
    ENV_VARS="$ENV_VARS,PAGERDUTY_INTEGRATION_KEY=$PAGERDUTY_KEY,ENABLE_PAGERDUTY_INTEGRATION=true"
    echo -e "${GREEN}✅ PagerDuty configured${NC}"
else
    ENV_VARS="$ENV_VARS,ENABLE_PAGERDUTY_INTEGRATION=false"
    echo -e "${YELLOW}⏭️  PagerDuty integration disabled${NC}"
fi

echo ""

# Microsoft Teams Configuration
echo -e "${BLUE}💬 Microsoft Teams Configuration${NC}"
echo "==============================="
read -p "Enable Teams notifications? (y/n) [n]: " ENABLE_TEAMS
ENABLE_TEAMS=${ENABLE_TEAMS:-n}

if [[ $ENABLE_TEAMS =~ ^[Yy]$ ]]; then
    echo ""
    echo "To get your Teams webhook URL:"
    echo "1. Go to your Teams channel"
    echo "2. Click '...' → Connectors"
    echo "3. Add 'Incoming Webhook'"
    echo "4. Configure and copy URL"
    echo ""
    
    read -p "Enter Teams webhook URL: " TEAMS_WEBHOOK
    
    ENV_VARS="$ENV_VARS,TEAMS_WEBHOOK_URL=$TEAMS_WEBHOOK,ENABLE_TEAMS_NOTIFICATIONS=true"
    echo -e "${GREEN}✅ Teams configured${NC}"
else
    ENV_VARS="$ENV_VARS,ENABLE_TEAMS_NOTIFICATIONS=false"
    echo -e "${YELLOW}⏭️  Teams notifications disabled${NC}"
fi

echo ""

# Email Configuration
echo -e "${BLUE}📧 Email Configuration${NC}"
echo "====================="
read -p "Enable email notifications? (y/n) [n]: " ENABLE_EMAIL
ENABLE_EMAIL=${ENABLE_EMAIL:-n}

if [[ $ENABLE_EMAIL =~ ^[Yy]$ ]]; then
    echo ""
    echo "Note: This requires AWS SES to be configured in your account"
    echo ""
    
    read -p "Enter 'From' email address: " SES_FROM_EMAIL
    read -p "Enter 'To' email addresses (comma-separated): " SES_TO_EMAILS
    
    ENV_VARS="$ENV_VARS,SES_FROM_EMAIL=$SES_FROM_EMAIL,SES_TO_EMAILS=$SES_TO_EMAILS,ENABLE_EMAIL_NOTIFICATIONS=true"
    echo -e "${GREEN}✅ Email configured${NC}"
else
    ENV_VARS="$ENV_VARS,ENABLE_EMAIL_NOTIFICATIONS=false"
    echo -e "${YELLOW}⏭️  Email notifications disabled${NC}"
fi

echo ""

# Update Lambda function
echo "🚀 Applying configuration..."
update_lambda_env "$ENV_VARS"

echo ""
echo -e "${GREEN}🎉 Configuration complete!${NC}"
echo ""

# Test notifications
echo -e "${BLUE}🧪 Testing Notifications${NC}"
echo "======================="
read -p "Send test notification? (y/n) [y]: " SEND_TEST
SEND_TEST=${SEND_TEST:-y}

if [[ $SEND_TEST =~ ^[Yy]$ ]]; then
    echo "📤 Sending test notification..."
    
    TEST_PAYLOAD='{
        "channels": ["slack", "jira", "pagerduty", "teams", "email"],
        "message": {
            "incidentId": "test-'$(date +%s)'",
            "title": "ResiliBot Configuration Test",
            "severity": "MEDIUM",
            "description": "This is a test notification to verify your ResiliBot configuration is working correctly.",
            "status": "OPEN",
            "diagnosis": "Configuration test - all systems operational"
        }
    }'
    
    aws lambda invoke \
        --function-name "$NOTIFICATION_FUNCTION" \
        --payload "$TEST_PAYLOAD" \
        response.json > /dev/null
    
    echo "📋 Test results:"
    cat response.json | python3 -m json.tool
    rm -f response.json
    
    echo ""
    echo -e "${GREEN}✅ Test notification sent!${NC}"
    echo "Check your configured channels for the test message."
fi

echo ""
echo -e "${BLUE}📚 Next Steps${NC}"
echo "============="
echo "1. Check your notification channels for test messages"
echo "2. Create a real incident to test end-to-end flow:"
echo "   ./scripts/test-incident.sh"
echo "3. View notification logs:"
echo "   aws logs tail /aws/lambda/$NOTIFICATION_FUNCTION --follow"
echo ""
echo -e "${GREEN}🎯 Your ResiliBot notifications are ready!${NC}"