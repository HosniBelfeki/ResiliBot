#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🚀 DEPLOYING RESILIBOT AGENT FIXES 🚀            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to infrastructure directory
cd infrastructure

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building CDK stack..."
npm run build

echo ""
echo "🚀 Deploying to AWS..."
npx cdk deploy --all --require-approval never

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOYMENT COMPLETE ✅                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🧪 Testing the agent..."
echo ""

# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ResiliBotStack \
    --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
    --output text 2>/dev/null)

if [ -n "$API_ENDPOINT" ]; then
    echo "API Endpoint: ${API_ENDPOINT}"
    echo ""
    echo "Creating test incident..."
    
    RESPONSE=$(curl -s -X POST ${API_ENDPOINT}incidents \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Agent Test - Post Deployment",
            "description": "Testing agent after fixes",
            "severity": "HIGH",
            "source": "deployment_test"
        }')
    
    echo "Response: $RESPONSE"
    
    INCIDENT_ID=$(echo $RESPONSE | grep -o '"incidentId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$INCIDENT_ID" ]; then
        echo ""
        echo "✅ Incident created: $INCIDENT_ID"
        echo ""
        echo "⏳ Waiting 30 seconds for agent to process..."
        sleep 30
        
        echo ""
        echo "📊 Checking incident status..."
        curl -s ${API_ENDPOINT}incidents/${INCIDENT_ID} | python3 -m json.tool
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🔍 Check agent logs:"
        echo "aws logs tail /aws/lambda/ResiliBotStack-AgentLambda --follow"
        echo ""
        echo "🎉 If you see 'diagnosis' field above, the agent is working!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
else
    echo "⚠️  Could not get API endpoint. Check AWS Console."
fi

echo ""
echo "✅ Deployment complete!"
