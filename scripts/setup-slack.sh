#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🔔 SLACK NOTIFICATIONS SETUP 🔔                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if webhook URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Slack webhook URL required"
    echo ""
    echo "Usage: ./setup-slack.sh <SLACK_WEBHOOK_URL>"
    echo ""
    echo "Example:"
    echo "  ./setup-slack.sh https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
    echo ""
    echo "📖 To get your webhook URL:"
    echo "  1. Go to https://api.slack.com/apps"
    echo "  2. Create a new app or select existing"
    echo "  3. Enable 'Incoming Webhooks'"
    echo "  4. Add webhook to workspace"
    echo "  5. Copy the webhook URL"
    echo ""
    exit 1
fi

WEBHOOK_URL="$1"

echo "🔍 Finding Notification Lambda..."
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'NotificationLambda')].FunctionName" --output text)

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Error: Notification Lambda not found"
    echo "   Make sure your infrastructure is deployed"
    exit 1
fi

echo "✅ Found: $FUNCTION_NAME"
echo ""

echo "🔧 Setting Slack webhook URL..."
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --environment "Variables={SLACK_WEBHOOK_URL=$WEBHOOK_URL}" \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Webhook URL configured successfully"
else
    echo "❌ Failed to configure webhook URL"
    exit 1
fi

echo ""
echo "🧪 Testing Slack notification..."

# Create test payload
TEST_PAYLOAD='{
  "channel": "slack",
  "message": {
    "incidentId": "test-'$(date +%s)'",
    "title": "🎉 ResiliBot Slack Integration Test",
    "severity": "LOW",
    "description": "If you see this message, Slack notifications are working!",
    "status": "OPEN"
  }
}'

# Invoke Lambda
aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --payload "$TEST_PAYLOAD" \
  --cli-binary-format raw-in-base64-out \
  response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Test notification sent"
    echo ""
    echo "📱 Check your Slack channel for the test message!"
    echo ""
    
    # Show response
    if [ -f response.json ]; then
        RESPONSE=$(cat response.json)
        if [[ $RESPONSE == *"SUCCESS"* ]]; then
            echo "✅ Notification delivered successfully"
        else
            echo "⚠️  Response: $RESPONSE"
        fi
        rm response.json
    fi
else
    echo "❌ Failed to send test notification"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ SLACK SETUP COMPLETE ✅                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next steps:"
echo "  1. Check your Slack channel for the test message"
echo "  2. Deploy updated agent code:"
echo "     cd infrastructure && npx cdk deploy --all"
echo "  3. Create a test incident to verify notifications"
echo ""
echo "📖 For more details, see: SLACK_SETUP_GUIDE.md"
echo ""
