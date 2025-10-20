# ResiliBot CloudWatch Alarms Setup Script (PowerShell)

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          ⚡ CLOUDWATCH ALARMS SETUP ⚡                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify EventBridge Rule
Write-Host "[1/5] Verifying EventBridge Rule..." -ForegroundColor Yellow
$rule = aws events describe-rule --name "ResiliBotStack-AlarmRule" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ EventBridge rule exists" -ForegroundColor Green
} else {
    Write-Host "❌ EventBridge rule not found" -ForegroundColor Red
    Write-Host "   Make sure your CDK stack is deployed" -ForegroundColor Yellow
    exit 1
}

# Step 2: Create Demo Namespace Alarm
Write-Host "`n[2/5] Creating demo CloudWatch alarm..." -ForegroundColor Yellow

$alarmName = "ResiliBot-Demo-HighCPU"

aws cloudwatch put-metric-alarm `
  --alarm-name $alarmName `
  --alarm-description "Demo alarm for ResiliBot - High CPU test" `
  --metric-name CPUUtilization `
  --namespace "ResiliBot/Demo" `
  --statistic Average `
  --period 60 `
  --evaluation-periods 1 `
  --threshold 90.0 `
  --comparison-operator GreaterThanThreshold `
  --treat-missing-data notBreaching 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Alarm created: $alarmName" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create alarm" -ForegroundColor Red
    exit 1
}

# Step 3: Create API Gateway alarm
Write-Host "`n[3/5] Creating API Gateway 5XX alarm..." -ForegroundColor Yellow

aws cloudwatch put-metric-alarm `
  --alarm-name "ResiliBot-API-5XXErrors" `
  --alarm-description "ResiliBot - API Gateway 5XX errors" `
  --metric-name 5XXError `
  --namespace AWS/ApiGateway `
  --statistic Sum `
  --period 300 `
  --evaluation-periods 1 `
  --threshold 10.0 `
  --comparison-operator GreaterThanThreshold 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ API Gateway alarm created" -ForegroundColor Green
} else {
    Write-Host "⚠️  API Gateway alarm creation failed (may not have metrics yet)" -ForegroundColor Yellow
}

# Step 4: Test the alarm
Write-Host "`n[4/5] Testing alarm by sending high metric value..." -ForegroundColor Yellow

aws cloudwatch put-metric-data `
  --namespace "ResiliBot/Demo" `
  --metric-name CPUUtilization `
  --value 95.0 `
  --unit Percent 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test metric sent (value: 95%)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to send metric" -ForegroundColor Red
    exit 1
}

# Step 5: Wait and check alarm state
Write-Host "`n[5/5] Waiting for alarm to trigger (90 seconds)..." -ForegroundColor Yellow

for ($i = 90; $i -gt 0; $i -= 10) {
    Write-Host "  ⏳ $i seconds remaining..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Check alarm state
    $state = aws cloudwatch describe-alarms --alarm-names $alarmName --query 'MetricAlarms[0].StateValue' --output text 2>&1
    
    if ($state -eq "ALARM") {
        Write-Host "`n✅ Alarm triggered successfully!" -ForegroundColor Green
        break
    }
}

# Final check
Write-Host "`n📊 Checking alarm status..." -ForegroundColor Cyan
$finalState = aws cloudwatch describe-alarms --alarm-names $alarmName --query 'MetricAlarms[0].StateValue' --output text 2>&1

Write-Host "Alarm State: $finalState" -ForegroundColor $(if ($finalState -eq "ALARM") { "Red" } else { "Yellow" })

# Check for incidents
Write-Host "`n📋 Checking for created incidents..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$incidents = aws dynamodb scan --table-name "ResiliBotStack-IncidentsTable307EBBA6-1DV58PXXR3UP5" --max-items 3 --query 'Items[*].{ID:incidentId.S,Title:title.S,Status:status.S}' --output table 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $incidents
} else {
    Write-Host "⚠️  Could not check incidents" -ForegroundColor Yellow
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ SETUP COMPLETE ✅                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📋 What was created:" -ForegroundColor Cyan
Write-Host "  • Demo alarm: $alarmName" -ForegroundColor White
Write-Host "  • API Gateway 5XX alarm" -ForegroundColor White
Write-Host "  • Test metric sent to trigger alarm" -ForegroundColor White

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check your Slack channel for notifications" -ForegroundColor White
Write-Host "  2. View incidents in your dashboard" -ForegroundColor White
Write-Host "  3. Check CloudWatch console for alarm status" -ForegroundColor White
Write-Host "  4. Create more alarms for your resources" -ForegroundColor White

Write-Host "`n📖 For more details, see: CLOUDWATCH_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# List all ResiliBot alarms
Write-Host "📊 Your ResiliBot alarms:" -ForegroundColor Cyan
aws cloudwatch describe-alarms --query "MetricAlarms[?starts_with(AlarmName, 'ResiliBot')].{Name:AlarmName,State:StateValue}" --output table 2>&1

Write-Host "`n✨ CloudWatch alarms are now monitoring your system!" -ForegroundColor Green
Write-Host ""
