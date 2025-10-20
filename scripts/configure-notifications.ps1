# ResiliBot Notification Configuration Script (PowerShell)
# This script helps you configure all notification channels

Write-Host "🤖 ResiliBot Notification Configuration" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Get Lambda function names
Write-Host "📡 Finding Lambda functions..." -ForegroundColor Yellow
$NotificationFunction = aws lambda list-functions --query "Functions[?contains(FunctionName, 'NotificationLambda')].FunctionName" --output text

if (-not $NotificationFunction) {
    Write-Host "❌ Notification Lambda function not found. Please deploy infrastructure first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Notification Lambda: $NotificationFunction" -ForegroundColor Green
Write-Host ""

# Function to update Lambda environment variables
function Update-LambdaEnv {
    param($EnvVars)
    Write-Host "🔧 Updating Lambda environment variables..." -ForegroundColor Yellow
    
    aws lambda update-function-configuration --function-name $NotificationFunction --environment "Variables={$EnvVars}" | Out-Null
    
    Write-Host "✅ Lambda environment updated" -ForegroundColor Green
}

# Build environment variables string
$EnvVars = ""

# Slack Configuration
Write-Host "🔔 Slack Configuration" -ForegroundColor Blue
Write-Host "======================"
$EnableSlack = Read-Host "Enable Slack notifications? (y/n) [y]"
if (-not $EnableSlack) { $EnableSlack = "y" }

if ($EnableSlack -match "^[Yy]$") {
    Write-Host ""
    Write-Host "To get your Slack webhook URL:"
    Write-Host "1. Go to https://api.slack.com/apps"
    Write-Host "2. Create new app or select existing"
    Write-Host "3. Go to 'Incoming Webhooks' and enable"
    Write-Host "4. Add webhook to workspace"
    Write-Host "5. Copy the webhook URL"
    Write-Host ""
    
    $SlackWebhook = Read-Host "Enter Slack webhook URL"
    $SlackChannel = Read-Host "Enter Slack channel (e.g., #incidents) [#incidents]"
    if (-not $SlackChannel) { $SlackChannel = "#incidents" }
    
    $EnvVars = "SLACK_WEBHOOK_URL=$SlackWebhook,SLACK_CHANNEL=$SlackChannel,ENABLE_SLACK_NOTIFICATIONS=true"
    Write-Host "✅ Slack configured" -ForegroundColor Green
} else {
    $EnvVars = "ENABLE_SLACK_NOTIFICATIONS=false"
    Write-Host "⏭️  Slack notifications disabled" -ForegroundColor Yellow
}

Write-Host ""

# Jira Configuration
Write-Host "🎫 Jira Configuration" -ForegroundColor Blue
Write-Host "===================="
$EnableJira = Read-Host "Enable Jira integration? (y/n) [n]"
if (-not $EnableJira) { $EnableJira = "n" }

if ($EnableJira -match "^[Yy]$") {
    Write-Host ""
    Write-Host "To get your Jira API token:"
    Write-Host "1. Go to https://id.atlassian.com/manage-profile/security/api-tokens"
    Write-Host "2. Create API token"
    Write-Host "3. Copy the token"
    Write-Host ""
    
    $JiraUrl = Read-Host "Enter Jira URL (e.g., https://company.atlassian.net)"
    $JiraUsername = Read-Host "Enter Jira username/email"
    $JiraApiToken = Read-Host "Enter Jira API token"
    $JiraProjectKey = Read-Host "Enter Jira project key (e.g., INC) [INC]"
    if (-not $JiraProjectKey) { $JiraProjectKey = "INC" }
    
    $EnvVars = "$EnvVars,JIRA_URL=$JiraUrl,JIRA_USERNAME=$JiraUsername,JIRA_API_TOKEN=$JiraApiToken,JIRA_PROJECT_KEY=$JiraProjectKey,ENABLE_JIRA_INTEGRATION=true"
    Write-Host "✅ Jira configured" -ForegroundColor Green
} else {
    $EnvVars = "$EnvVars,ENABLE_JIRA_INTEGRATION=false"
    Write-Host "⏭️  Jira integration disabled" -ForegroundColor Yellow
}

Write-Host ""

# PagerDuty Configuration
Write-Host "📟 PagerDuty Configuration" -ForegroundColor Blue
Write-Host "========================="
$EnablePagerDuty = Read-Host "Enable PagerDuty integration? (y/n) [n]"
if (-not $EnablePagerDuty) { $EnablePagerDuty = "n" }

if ($EnablePagerDuty -match "^[Yy]$") {
    Write-Host ""
    Write-Host "To get your PagerDuty integration key:"
    Write-Host "1. Go to PagerDuty web app"
    Write-Host "2. Go to Services → Your Service"
    Write-Host "3. Go to Integrations tab"
    Write-Host "4. Add integration → Events API v2"
    Write-Host "5. Copy the Integration Key"
    Write-Host ""
    
    $PagerDutyKey = Read-Host "Enter PagerDuty integration key"
    
    $EnvVars = "$EnvVars,PAGERDUTY_INTEGRATION_KEY=$PagerDutyKey,ENABLE_PAGERDUTY_INTEGRATION=true"
    Write-Host "✅ PagerDuty configured" -ForegroundColor Green
} else {
    $EnvVars = "$EnvVars,ENABLE_PAGERDUTY_INTEGRATION=false"
    Write-Host "⏭️  PagerDuty integration disabled" -ForegroundColor Yellow
}

Write-Host ""

# Microsoft Teams Configuration
Write-Host "💬 Microsoft Teams Configuration" -ForegroundColor Blue
Write-Host "==============================="
$EnableTeams = Read-Host "Enable Teams notifications? (y/n) [n]"
if (-not $EnableTeams) { $EnableTeams = "n" }

if ($EnableTeams -match "^[Yy]$") {
    Write-Host ""
    Write-Host "To get your Teams webhook URL:"
    Write-Host "1. Go to your Teams channel"
    Write-Host "2. Click '...' → Connectors"
    Write-Host "3. Add 'Incoming Webhook'"
    Write-Host "4. Configure and copy URL"
    Write-Host ""
    
    $TeamsWebhook = Read-Host "Enter Teams webhook URL"
    
    $EnvVars = "$EnvVars,TEAMS_WEBHOOK_URL=$TeamsWebhook,ENABLE_TEAMS_NOTIFICATIONS=true"
    Write-Host "✅ Teams configured" -ForegroundColor Green
} else {
    $EnvVars = "$EnvVars,ENABLE_TEAMS_NOTIFICATIONS=false"
    Write-Host "⏭️  Teams notifications disabled" -ForegroundColor Yellow
}

Write-Host ""

# Email Configuration
Write-Host "📧 Email Configuration" -ForegroundColor Blue
Write-Host "====================="
$EnableEmail = Read-Host "Enable email notifications? (y/n) [n]"
if (-not $EnableEmail) { $EnableEmail = "n" }

if ($EnableEmail -match "^[Yy]$") {
    Write-Host ""
    Write-Host "Note: This requires AWS SES to be configured in your account"
    Write-Host ""
    
    $SesFromEmail = Read-Host "Enter 'From' email address"
    $SesToEmails = Read-Host "Enter 'To' email addresses (comma-separated)"
    
    $EnvVars = "$EnvVars,SES_FROM_EMAIL=$SesFromEmail,SES_TO_EMAILS=$SesToEmails,ENABLE_EMAIL_NOTIFICATIONS=true"
    Write-Host "✅ Email configured" -ForegroundColor Green
} else {
    $EnvVars = "$EnvVars,ENABLE_EMAIL_NOTIFICATIONS=false"
    Write-Host "⏭️  Email notifications disabled" -ForegroundColor Yellow
}

Write-Host ""

# Update Lambda function
Write-Host "🚀 Applying configuration..." -ForegroundColor Yellow
Update-LambdaEnv $EnvVars

Write-Host ""
Write-Host "🎉 Configuration complete!" -ForegroundColor Green
Write-Host ""

# Test notifications
Write-Host "🧪 Testing Notifications" -ForegroundColor Blue
Write-Host "======================="
$SendTest = Read-Host "Send test notification? (y/n) [y]"
if (-not $SendTest) { $SendTest = "y" }

if ($SendTest -match "^[Yy]$") {
    Write-Host "📤 Sending test notification..." -ForegroundColor Yellow
    
    $TestPayload = @{
        channels = @("slack", "jira", "pagerduty", "teams", "email")
        message = @{
            incidentId = "test-$(Get-Date -UFormat %s)"
            title = "ResiliBot Configuration Test"
            severity = "MEDIUM"
            description = "This is a test notification to verify your ResiliBot configuration is working correctly."
            status = "OPEN"
            diagnosis = "Configuration test - all systems operational"
        }
    } | ConvertTo-Json -Depth 3
    
    $TestPayload | Out-File -FilePath "test-payload.json" -Encoding UTF8
    
    aws lambda invoke --function-name $NotificationFunction --payload file://test-payload.json response.json | Out-Null
    
    Write-Host "📋 Test results:" -ForegroundColor Yellow
    Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 3
    
    Remove-Item test-payload.json, response.json -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "✅ Test notification sent!" -ForegroundColor Green
    Write-Host "Check your configured channels for the test message."
}

Write-Host ""
Write-Host "📚 Next Steps" -ForegroundColor Blue
Write-Host "============="
Write-Host "1. Check your notification channels for test messages"
Write-Host "2. Create a real incident to test end-to-end flow:"
Write-Host "   .\scripts\test-incident.sh"
Write-Host "3. View notification logs:"
Write-Host "   aws logs tail /aws/lambda/$NotificationFunction --follow"
Write-Host ""
Write-Host "🎯 Your ResiliBot notifications are ready!" -ForegroundColor Green