#!/bin/bash

# Test script for Folder and Tag CRUD APIs using curl

BASE_URL="http://localhost:4051"
COOKIE_FILE="/tmp/vidlyx-test-cookies.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "  Folder & Tag CRUD API Test Suite"
echo -e "========================================${NC}\n"

# Clean up cookies file
rm -f "$COOKIE_FILE"

# Test 1: Login
echo -e "${BLUE}=== Test 1: Login ===${NC}"
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

if echo "$LOGIN_RESPONSE" | grep -q "user"; then
  echo -e "${GREEN}Login successful${NC}"
else
  echo -e "${RED}Login failed: $LOGIN_RESPONSE${NC}"
  exit 1
fi

# Test 2: Create Folder
echo -e "\n${BLUE}=== Test 2: Create Folder ===${NC}"
CREATE_FOLDER_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/folders" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Test Folder","color":"#3b82f6"}')

echo "$CREATE_FOLDER_RESPONSE" | jq '.'
FOLDER_ID=$(echo "$CREATE_FOLDER_RESPONSE" | jq -r '.folder.id')

if [ "$FOLDER_ID" != "null" ] && [ -n "$FOLDER_ID" ]; then
  echo -e "${GREEN}Folder created successfully: $FOLDER_ID${NC}"
else
  echo -e "${RED}Failed to create folder${NC}"
fi

# Test 3: Get All Folders
echo -e "\n${BLUE}=== Test 3: Get All Folders ===${NC}"
GET_FOLDERS_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X GET "$BASE_URL/api/folders")
echo "$GET_FOLDERS_RESPONSE" | jq '.'

FOLDER_COUNT=$(echo "$GET_FOLDERS_RESPONSE" | jq '.count')
echo -e "${GREEN}Found $FOLDER_COUNT folder(s)${NC}"

# Test 4: Get Folder by ID
if [ -n "$FOLDER_ID" ]; then
  echo -e "\n${BLUE}=== Test 4: Get Folder by ID ===${NC}"
  GET_FOLDER_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X GET "$BASE_URL/api/folders/$FOLDER_ID")
  echo "$GET_FOLDER_RESPONSE" | jq '.'
fi

# Test 5: Update Folder
if [ -n "$FOLDER_ID" ]; then
  echo -e "\n${BLUE}=== Test 5: Update Folder ===${NC}"
  UPDATE_FOLDER_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PUT "$BASE_URL/api/folders/$FOLDER_ID" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Folder Name","color":"#ef4444"}')
  echo "$UPDATE_FOLDER_RESPONSE" | jq '.'
  echo -e "${GREEN}Folder updated${NC}"
fi

# Test 6: Create Tag
echo -e "\n${BLUE}=== Test 6: Create Tag ===${NC}"
CREATE_TAG_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/tags" \
  -H "Content-Type: application/json" \
  -d '{"name":"Important","color":"#ef4444"}')

echo "$CREATE_TAG_RESPONSE" | jq '.'
TAG_ID=$(echo "$CREATE_TAG_RESPONSE" | jq -r '.tag.id')

if [ "$TAG_ID" != "null" ] && [ -n "$TAG_ID" ]; then
  echo -e "${GREEN}Tag created successfully: $TAG_ID${NC}"
else
  echo -e "${RED}Failed to create tag${NC}"
fi

# Test 7: Get All Tags
echo -e "\n${BLUE}=== Test 7: Get All Tags ===${NC}"
GET_TAGS_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X GET "$BASE_URL/api/tags")
echo "$GET_TAGS_RESPONSE" | jq '.'

TAG_COUNT=$(echo "$GET_TAGS_RESPONSE" | jq '.count')
echo -e "${GREEN}Found $TAG_COUNT tag(s)${NC}"

# Test 8: Get Tag by ID
if [ -n "$TAG_ID" ]; then
  echo -e "\n${BLUE}=== Test 8: Get Tag by ID ===${NC}"
  GET_TAG_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X GET "$BASE_URL/api/tags/$TAG_ID")
  echo "$GET_TAG_RESPONSE" | jq '.'
fi

# Test 9: Test Duplicate Folder Name Validation
echo -e "\n${BLUE}=== Test 9: Duplicate Folder Name Validation ===${NC}"
DUPLICATE_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/folders" \
  -H "Content-Type: application/json" \
  -d '{"name":"Duplicate Test Folder","color":"#3b82f6"}')

DUPLICATE_ID=$(echo "$DUPLICATE_RESPONSE" | jq -r '.folder.id')

# Try to create duplicate
DUPLICATE_TEST=$(curl -s -b "$COOKIE_FILE" -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/folders" \
  -H "Content-Type: application/json" \
  -d '{"name":"Duplicate Test Folder","color":"#ef4444"}')

HTTP_STATUS=$(echo "$DUPLICATE_TEST" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$HTTP_STATUS" = "409" ]; then
  echo -e "${GREEN}Duplicate validation working correctly (409 Conflict)${NC}"
else
  echo -e "${RED}Duplicate validation failed (Expected 409, got $HTTP_STATUS)${NC}"
fi

# Test 10: Delete Tag
if [ -n "$TAG_ID" ]; then
  echo -e "\n${BLUE}=== Test 10: Delete Tag ===${NC}"
  DELETE_TAG_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X DELETE "$BASE_URL/api/tags/$TAG_ID")
  echo "$DELETE_TAG_RESPONSE" | jq '.'
  echo -e "${GREEN}Tag deleted${NC}"
fi

# Test 11: Delete Folder
if [ -n "$FOLDER_ID" ]; then
  echo -e "\n${BLUE}=== Test 11: Delete Folder ===${NC}"
  DELETE_FOLDER_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X DELETE "$BASE_URL/api/folders/$FOLDER_ID")
  echo "$DELETE_FOLDER_RESPONSE" | jq '.'
  echo -e "${GREEN}Folder deleted${NC}"
fi

# Cleanup duplicate folder
if [ -n "$DUPLICATE_ID" ]; then
  curl -s -b "$COOKIE_FILE" -X DELETE "$BASE_URL/api/folders/$DUPLICATE_ID" > /dev/null
fi

# Clean up cookies file
rm -f "$COOKIE_FILE"

echo -e "\n${BLUE}========================================"
echo -e "  All Tests Completed!"
echo -e "========================================${NC}\n"
