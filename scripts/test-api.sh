#!/bin/bash

# JogGPS AI Coaching Backend - API Testing Script
# Usage: ./scripts/test-api.sh [BASE_URL]

BASE_URL=${1:-"http://localhost:3000"}
echo "Testing JogGPS AI Coaching Backend API at: $BASE_URL"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo -e "\n${YELLOW}Testing: $method $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ Status: $http_code (Expected: $expected_status)${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}✗ Status: $http_code (Expected: $expected_status)${NC}"
        echo "Response: $body"
    fi
}

# 1. Health Check
echo -e "\n1. Health Check"
test_endpoint "GET" "/api/health" "" 200

# 2. Profile Management
echo -e "\n2. Profile Management"
profile_data='{
  "deviceId": "test-device-123",
  "trainingGoal": {
    "raceType": "10k",
    "targetTime": 2400,
    "raceDate": "2024-06-15"
  },
  "recentRuns": []
}'
test_endpoint "POST" "/api/profile" "$profile_data" 200

# 3. Get Profile
echo -e "\n3. Get Profile"
test_endpoint "GET" "/api/profile?deviceId=test-device-123" "" 200

# 4. Log Run
echo -e "\n4. Log Run"
run_data='{
  "deviceId": "test-device-123",
  "date": "2024-01-15T10:30:00Z",
  "distance": 5000,
  "duration": 1800,
  "avgPace": 360
}'
test_endpoint "POST" "/api/runs" "$run_data" 200

# 5. Get Run History
echo -e "\n5. Get Run History"
test_endpoint "GET" "/api/runs?deviceId=test-device-123&limit=10" "" 200

# 6. AI Coaching Request (This may take longer due to OpenRouter API call)
echo -e "\n6. AI Coaching Request"
coaching_data='{
  "deviceId": "test-device-123",
  "currentSegment": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": 1642261800000,
    "heartRate": 150,
    "speed": 3.5,
    "elevation": 10.0,
    "accuracy": 5.0,
    "bearing": 180.0
  },
  "runTotals": {
    "distance": 2500,
    "duration": 900000,
    "avgPace": 360,
    "avgHeartRate": 145
  },
  "intervalData": {
    "lastIntervalDistance": 500,
    "lastIntervalTime": 180000,
    "lastIntervalPace": 360,
    "recentPaces": [355, 360, 365],
    "pacePattern": "consistent"
  },
  "trainingGoal": {
    "raceType": "10k",
    "targetTime": 2400,
    "raceDate": "2024-06-15"
  },
  "model": "openai/gpt-4.1-nano"
}'

echo "Note: This test requires a valid OPENROUTER_API_KEY"
test_endpoint "POST" "/api/coaching" "$coaching_data" 200

echo -e "\n${GREEN}API testing completed!${NC}"
echo "Check the responses above for any errors or unexpected behavior."