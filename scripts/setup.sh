#!/bin/bash
set -e

echo "🤖 ResiliBot Setup Script"
echo "=========================="

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11+"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo ""
echo "Installing dependencies..."

echo "📦 Installing infrastructure dependencies..."
cd infrastructure
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "📦 Installing Python dependencies..."
cd backend
pip3 install -r functions/agent/requirements.txt
pip3 install -r functions/ingestion/requirements.txt
pip3 install -r functions/tools/requirements.txt
cd ..

echo "✅ Dependencies installed"

# Bootstrap CDK
echo ""
echo "Bootstrapping AWS CDK..."
cd infrastructure
npx cdk bootstrap
cd ..

echo "✅ CDK bootstrapped"

# Deploy infrastructure
echo ""
read -p "Deploy infrastructure now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying infrastructure..."
    cd infrastructure
    npx cdk deploy --all
    cd ..
    echo "✅ Infrastructure deployed"
fi

# Upload runbooks
echo ""
read -p "Upload sample runbooks? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📚 Uploading runbooks..."
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name ResiliBotStack \
        --query 'Stacks[0].Outputs[?OutputKey==`RunbooksBucketName`].OutputValue' \
        --output text)
    
    if [ -n "$BUCKET_NAME" ]; then
        aws s3 sync runbooks/ s3://${BUCKET_NAME}/
        echo "✅ Runbooks uploaded to ${BUCKET_NAME}"
    else
        echo "⚠️  Could not find runbooks bucket. Please upload manually."
    fi
fi

# Get API endpoint
echo ""
echo "📋 Deployment Summary"
echo "===================="

API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ResiliBotStack \
    --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
    --output text)

if [ -n "$API_ENDPOINT" ]; then
    echo "API Endpoint: ${API_ENDPOINT}"
    echo ""
    echo "Update frontend/.env with:"
    echo "REACT_APP_API_ENDPOINT=${API_ENDPOINT}"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Slack webhook (optional)"
echo "2. Enable Bedrock model access in AWS Console"
echo "3. Deploy frontend: cd frontend && npm run build"
echo "4. Test with: curl -X POST ${API_ENDPOINT}/incidents -d '{\"title\":\"Test\",\"severity\":\"HIGH\"}'"
