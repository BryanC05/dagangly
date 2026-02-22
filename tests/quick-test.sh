#!/bin/bash

# Driver Marketplace Quick Test Script
# Tests basic driver functionality using curl commands

API_URL="${API_URL:-http://localhost:5000/api}"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}         DRIVER MARKETPLACE QUICK TEST${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# Check if server is running
echo -e "${BLUE}[1] Checking server health...${NC}"
HEALTH=$(curl -s "$API_URL/health")
if [ -z "$HEALTH" ]; then
    echo -e "${RED}Server is not running at $API_URL${NC}"
    echo "Please start the server first: cd go-backend && go run cmd/server/main.go"
    exit 1
fi
echo -e "${GREEN}Server is running: $HEALTH${NC}"
echo ""

# Prompt for credentials
read -p "Enter test user email: " EMAIL
read -s -p "Enter password: " PASSWORD
echo ""

echo ""
echo -e "${BLUE}[2] Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Login failed: $LOGIN_RESPONSE${NC}"
    exit 1
fi
echo -e "${GREEN}Logged in successfully${NC}"
echo ""

# Enable driver mode
echo -e "${BLUE}[3] Enabling driver mode...${NC}"
DRIVER_MODE=$(curl -s -X POST "$API_URL/driver/toggle" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"isActive":true}')
echo -e "${GREEN}$DRIVER_MODE${NC}"
echo ""

# Update location
echo -e "${BLUE}[4] Updating driver location...${NC}"
LOCATION=$(curl -s -X PUT "$API_URL/driver/location" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"latitude":-6.2088,"longitude":106.8456}')
echo -e "${GREEN}$LOCATION${NC}"
echo ""

# Get driver stats
echo -e "${BLUE}[5] Getting driver stats...${NC}"
STATS=$(curl -s -X GET "$API_URL/driver/stats" \
    -H "Authorization: Bearer $TOKEN")
echo -e "${GREEN}$STATS${NC}" | python3 -m json.tool 2>/dev/null || echo -e "${GREEN}$STATS${NC}"
echo ""

# Get available orders
echo -e "${BLUE}[6] Getting available orders...${NC}"
ORDERS=$(curl -s -X GET "$API_URL/driver/available-orders?lat=-6.2088&lng=106.8456" \
    -H "Authorization: Bearer $TOKEN")
echo -e "${GREEN}$ORDERS${NC}" | python3 -m json.tool 2>/dev/null || echo -e "${GREEN}$ORDERS${NC}"
echo ""

# Get active delivery
echo -e "${BLUE}[7] Checking active delivery...${NC}"
ACTIVE=$(curl -s -X GET "$API_URL/driver/active-delivery" \
    -H "Authorization: Bearer $TOKEN")
echo -e "${GREEN}$ACTIVE${NC}" | python3 -m json.tool 2>/dev/null || echo -e "${GREEN}$ACTIVE${NC}"
echo ""

# Get delivery history
echo -e "${BLUE}[8] Getting delivery history...${NC}"
HISTORY=$(curl -s -X GET "$API_URL/driver/history" \
    -H "Authorization: Bearer $TOKEN")
echo -e "${GREEN}$HISTORY${NC}" | python3 -m json.tool 2>/dev/null || echo -e "${GREEN}$HISTORY${NC}"
echo ""

# Get earnings
echo -e "${BLUE}[9] Getting earnings...${NC}"
EARNINGS=$(curl -s -X GET "$API_URL/driver/earnings?period=week" \
    -H "Authorization: Bearer $TOKEN")
echo -e "${GREEN}$EARNINGS${NC}" | python3 -m json.tool 2>/dev/null || echo -e "${GREEN}$EARNINGS${NC}"
echo ""

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}         TEST COMPLETE${NC}"
echo -e "${BLUE}============================================================${NC}"
