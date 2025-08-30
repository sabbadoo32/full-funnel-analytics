#!/bin/bash
# Script to deploy API fixes to Netlify
# This script applies the CORS fixes and verifies environment variables

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Full Funnel API Fix Deployment ===${NC}\n"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
NETLIFY_STATUS=$(netlify status 2>&1)
if [[ $NETLIFY_STATUS == *"Not logged in"* ]]; then
    echo -e "${RED}Not logged in to Netlify. Please log in first:${NC}"
    echo -e "${YELLOW}netlify login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Netlify CLI is ready${NC}"

# Verify environment variables
echo -e "\n${BLUE}Verifying environment variables...${NC}"
node scripts/verify-netlify-env.js

# Check if the verification was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Environment variable verification failed. Please fix the issues before deploying.${NC}"
    exit 1
fi

# Deploy the backend to Netlify
echo -e "\n${BLUE}Deploying backend to Netlify...${NC}"
cd backend-deploy
netlify deploy --prod

# Check if the deployment was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "\n${BLUE}Testing API connection...${NC}"

# Run the API test script
cd ..
node test-customgpt-integration.js

echo -e "\n${BLUE}=== Deployment Complete ===${NC}"
echo -e "${YELLOW}If the API tests failed, please check the following:${NC}"
echo -e "1. Verify that the OPENAI_API_KEY is correctly set in Netlify"
echo -e "2. Ensure that the API endpoint URL is correct"
echo -e "3. Check that the CORS configuration includes the Authorization header"
echo -e "4. Verify that the MongoDB connection is working"
echo -e "\n${YELLOW}For more detailed troubleshooting, check the API_AUTH_DETAILS.md file in the docs directory.${NC}"
