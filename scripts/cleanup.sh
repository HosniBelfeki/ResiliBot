#!/bin/bash
set -e

echo "🧹 ResiliBot Cleanup Script"
echo "==========================="
echo ""
echo "⚠️  WARNING: This will delete all ResiliBot resources!"
echo ""
read -p "Are you sure? (type 'yes' to confirm) " -r
echo

if [[ ! $REPLY = "yes" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Empty S3 buckets first
echo "Emptying S3 buckets..."
RUNBOOKS_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name ResiliBotStack \
    --query 'Stacks[0].Outputs[?OutputKey==`RunbooksBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$RUNBOOKS_BUCKET" ]; then
    echo "Emptying ${RUNBOOKS_BUCKET}..."
    aws s3 rm s3://${RUNBOOKS_BUCKET} --recursive || true
fi

# Delete CDK stack
echo "Deleting CDK stack..."
cd infrastructure
npx cdk destroy --all --force
cd ..

echo "✅ Cleanup complete!"
