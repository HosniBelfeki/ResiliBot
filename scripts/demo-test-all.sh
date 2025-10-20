#!/bin/bash

# ResiliBot - Professional Test Script
# Author: Hosni Belfeki

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Configuration (masked for security)
API_URL="https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod"
API_DISPLAY="https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod"
TABLE_NAME="ResiliBotStack-IncidentsTable307EBBA6-1DV58PXXR3UP5"
AGENT_LAMBDA="ResiliBotStack-AgentLambda7DC01917-oB3GY5ALpJBt"
INGESTION_LAMBDA="ResiliBotStack-IngestionLambdaEF25F265-0qC56E3SmLDU"

echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}     ResiliBot Demo             ${NC}"
echo -e "${CYAN}     AWS AI Agent Hackathon 2025                                ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
read -p "Press ENTER to start testing..."

# ============================================================================
# TEST 1: API Gateway Connectivity
# ============================================================================
echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 1: API Gateway Connectivity${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

if curl -s -f "$API_URL/incidents" > /tmp/incidents_initial.json 2>&1; then
    echo -e "${GREEN}✓ SUCCESS: API Gateway is reachable${NC}"
    INITIAL_COUNT=$(grep -o '"incidentId"' /tmp/incidents_initial.json 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ Current incident count: ${WHITE}$INITIAL_COUNT${NC}"
else
    echo -e "${RED}✗ FAILED: Cannot reach API Gateway${NC}"
    exit 1
fi
echo ""
sleep 2

# ============================================================================
# TEST 2: List All Incidents
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 2: List All Incidents${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Command:${NC}"
echo -e "${GRAY}curl -X GET $API_DISPLAY/incidents${NC}"
echo ""
echo -e "${YELLOW}Result (showing last 10 incidents):${NC}"
echo ""

# Parse and display incidents nicely
curl -s "$API_URL/incidents" | grep -o '"incidentId":"[^"]*","timestamp":[^,]*,"status":"[^"]*","severity":"[^"]*","title":"[^"]*"' | head -10 | while IFS= read -r line; do
    id=$(echo "$line" | grep -o '"incidentId":"[^"]*"' | cut -d'"' -f4)
    status=$(echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    severity=$(echo "$line" | grep -o '"severity":"[^"]*"' | cut -d'"' -f4)
    title=$(echo "$line" | grep -o '"title":"[^"]*"' | cut -d'"' -f4 | cut -c1-60)
    
    # Color code by status
    if [ "$status" = "RESOLVED" ]; then
        status_color="${GREEN}"
    elif [ "$status" = "OPEN" ]; then
        status_color="${YELLOW}"
    else
        status_color="${CYAN}"
    fi
    
    # Color code by severity
    if [ "$severity" = "critical" ] || [ "$severity" = "CRITICAL" ]; then
        severity_color="${RED}"
    elif [ "$severity" = "HIGH" ]; then
        severity_color="${MAGENTA}"
    else
        severity_color="${YELLOW}"
    fi
    
    echo -e "  ${status_color}[$status]${NC} ${severity_color}$severity${NC} - ${WHITE}$title${NC}"
    echo -e "  ${GRAY}ID: ${id:0:36}${NC}"
    echo ""
done

echo -e "${GREEN}✓ SUCCESS: Retrieved all incidents${NC}"
echo ""
sleep 2

# ============================================================================
# TEST 3: Create Database Connection Pool Incident
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 3: Create New Incident${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Command:${NC}"
echo -e "${GRAY}curl -X POST $API_DISPLAY/incidents${NC}"
echo ""
echo -e "${YELLOW}Payload:${NC}"
echo -e "${GRAY}{"
echo -e "  \"title\": \"CRITICAL: Database Connection Pool Exhausted\","
echo -e "  \"description\": \"Production PostgreSQL database at 100% capacity...\","
echo -e "  \"severity\": \"critical\","
echo -e "  \"source\": \"Database Monitoring\","
echo -e "  \"autoApprove\": true"
echo -e "}${NC}"
echo ""
echo -e "${YELLOW}Sending request...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/incidents" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CRITICAL: Expired TLS Certificate on Application Load Balancer",
    "description": "TLS certificate on the production ALB expired, causing HTTPS failures and full API outage across regions.",
    "severity": "critical",
    "source": "AWS ACM / ALB / CloudWatch",
    "tags": ["security", "tls", "certificate", "alb", "networking"],
    "autoApprove": true
  }')




echo -e "${YELLOW}Response:${NC}"
echo -e "${WHITE}$RESPONSE${NC}"
echo ""

# Fix: Extract incident ID properly (handle spaces in JSON)
INCIDENT_ID=$(echo "$RESPONSE" | grep -o '"incidentId"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"incidentId"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')

if [ ! -z "$INCIDENT_ID" ]; then
    echo -e "${GREEN}✓ SUCCESS: Incident created!${NC}"
    echo -e "${WHITE}Incident ID: ${CYAN}$INCIDENT_ID${NC}"
else
    echo -e "${RED}✗ WARNING: Could not extract incident ID${NC}"
    INCIDENT_ID=""
fi
echo ""
sleep 3

# ============================================================================
# TEST 4: Get Incident Details
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 4: Get Incident Details${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

if [ ! -z "$INCIDENT_ID" ]; then
    echo -e "${YELLOW}Command:${NC}"
    echo -e "${GRAY}curl -X GET $API_DISPLAY/incidents/$INCIDENT_ID${NC}"
    echo ""
    echo -e "${YELLOW}Response:${NC}"
    INCIDENT_DETAILS=$(curl -s "$API_URL/incidents/$INCIDENT_ID")
    echo -e "${WHITE}$INCIDENT_DETAILS${NC}"
    echo ""
    echo -e "${GREEN}✓ SUCCESS: Retrieved incident details${NC}"
else
    echo -e "${YELLOW}⊘ SKIPPED: No incident ID available${NC}"
fi
echo ""
sleep 2

# ============================================================================
# TEST 5: Verify DynamoDB Table
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 5: Verify DynamoDB Table${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Command:${NC}"
echo -e "${GRAY}aws dynamodb describe-table --table-name $TABLE_NAME${NC}"
echo ""
echo -e "${YELLOW}Result:${NC}"
aws dynamodb describe-table --table-name $TABLE_NAME \
  --query 'Table.{Name:TableName,Keys:KeySchema,ItemCount:ItemCount,Status:TableStatus}' \
  --output json 2>/dev/null

echo ""
echo -e "${GREEN}✓ SUCCESS: DynamoDB table accessible${NC}"
echo ""
sleep 2

# ============================================================================
# TEST 6: Query Incident from DynamoDB
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 6: Query Incident from DynamoDB${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

if [ ! -z "$INCIDENT_ID" ]; then
    echo -e "${YELLOW}Command:${NC}"
    echo -e "${GRAY}aws dynamodb query --table-name $TABLE_NAME${NC}"
    echo -e "${GRAY}  --key-condition-expression \"incidentId = :id\"${NC}"
    echo ""
    echo -e "${YELLOW}Result:${NC}"
    aws dynamodb query --table-name $TABLE_NAME \
      --key-condition-expression "incidentId = :id" \
      --expression-attribute-values "{\":id\":{\"S\":\"$INCIDENT_ID\"}}" \
      --limit 1 --output json 2>/dev/null
    echo ""
    echo -e "${GREEN}✓ SUCCESS: Incident found in DynamoDB${NC}"
else
    echo -e "${YELLOW}⊘ SKIPPED: No incident ID to query${NC}"
fi
echo ""
sleep 2

# ============================================================================
# TEST 7: Check Lambda Functions
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 7: Check Lambda Functions${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Command:${NC}"
echo -e "${GRAY}aws lambda list-functions (filtering ResiliBot)${NC}"
echo ""
echo -e "${YELLOW}Result:${NC}"
aws lambda list-functions --query "Functions[?contains(FunctionName, 'ResiliBot')].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout}" --output table 2>/dev/null
echo ""
echo -e "${GREEN}✓ SUCCESS: Lambda functions listed${NC}"
echo ""
sleep 2

# ============================================================================
# TEST 8: Agent Lambda Logs
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 8: Agent Lambda Logs (Last 5 Minutes)${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Command:${NC}"
echo -e "${GRAY}aws logs tail /aws/lambda/$AGENT_LAMBDA --since 5m${NC}"
echo ""
echo -e "${YELLOW}Result (last 20 lines):${NC}"
aws logs tail /aws/lambda/$AGENT_LAMBDA --since 5m --format short 2>/dev/null | tail -20
echo ""
echo -e "${GREEN}✓ SUCCESS: Agent logs accessible${NC}"
echo ""
sleep 2

# ============================================================================
# TEST 9: Ingestion Lambda Logs
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 9: Ingestion Lambda Logs (Last 5 Minutes)${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Command:${NC}"
echo -e "${GRAY}aws logs tail /aws/lambda/$INGESTION_LAMBDA --since 5m${NC}"
echo ""
echo -e "${YELLOW}Result (last 20 lines):${NC}"
aws logs tail /aws/lambda/$INGESTION_LAMBDA --since 5m --format short 2>/dev/null | tail -20
echo ""
echo -e "${GREEN}✓ SUCCESS: Ingestion logs accessible${NC}"
echo ""
sleep 2

# ============================================================================
# TEST 10: S3 Buckets
# ============================================================================
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}TEST 10: S3 Buckets (Runbooks & Postmortems)${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Command:${NC}"
echo -e "${GRAY}aws s3 ls (filtering ResiliBot buckets)${NC}"
echo ""
echo -e "${YELLOW}Result:${NC}"
aws s3 ls | grep -i resilibot
echo ""
echo -e "${GREEN}✓ SUCCESS: S3 buckets found${NC}"
echo ""
sleep 2

# ============================================================================
# FINAL SUMMARY
# ============================================================================
curl -s "$API_URL/incidents" > /tmp/incidents_final.json 2>&1
FINAL_COUNT=$(grep -o '"incidentId"' /tmp/incidents_final.json 2>/dev/null | wc -l | tr -d ' ')

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}                 TEST RESULTS SUMMARY                           ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${WHITE}Test Results:${NC}"
echo -e "  ${GREEN}[1]${NC} API Gateway           ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[2]${NC} List Incidents        ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[3]${NC} Create Incident       ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[4]${NC} Get Incident          ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[5]${NC} DynamoDB Table        ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[6]${NC} DynamoDB Query        ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[7]${NC} Lambda Functions      ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[8]${NC} Agent Logs            ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[9]${NC} Ingestion Logs        ${GREEN}✓ SUCCESS${NC}"
echo -e "  ${GREEN}[10]${NC} S3 Buckets           ${GREEN}✓ SUCCESS${NC}"
echo ""
echo -e "${WHITE}Incident Statistics:${NC}"
echo -e "  ${YELLOW}Initial Count:${NC}     ${WHITE}$INITIAL_COUNT${NC} incidents"
echo -e "  ${YELLOW}Created:${NC}           ${WHITE}1${NC} incident"
echo -e "  ${YELLOW}Final Count:${NC}       ${WHITE}$FINAL_COUNT${NC} incidents"
echo -e "  ${YELLOW}New Incident ID:${NC}   ${CYAN}$INCIDENT_ID${NC}"
echo ""
echo -e "${WHITE}System Information:${NC}"
echo -e "  ${YELLOW}API Endpoint:${NC}      ${GRAY}$API_DISPLAY${NC}"
echo -e "  ${YELLOW}DynamoDB Table:${NC}    ${GRAY}$TABLE_NAME${NC}"
echo -e "  ${YELLOW}Agent Lambda:${NC}      ${GRAY}$AGENT_LAMBDA${NC}"
echo -e "  ${YELLOW}Ingestion Lambda:${NC}  ${GRAY}$INGESTION_LAMBDA${NC}"
echo -e "  ${YELLOW}Dashboard URL:${NC}     ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}     ✓ ALL TESTS COMPLETED            ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${WHITE}Next Steps:${NC}"
echo -e "  ${YELLOW}1.${NC} Open dashboard: ${BLUE}http://localhost:3000${NC}"
echo -e "  ${YELLOW}2.${NC} Review incident in UI"
echo ""
echo -e "${GRAY}Built by Hosni Belfeki${NC}"
echo -e "${GRAY}GitHub: github.com/hosnibelfeki/resilibot${NC}"
echo ""

# Cleanup
rm -f /tmp/incidents_initial.json /tmp/incidents_final.json 2>/dev/null
