# CustomGPT API Connection Guide

This document provides clear instructions for connecting the CustomGPT to the Full Funnel Analytics backend API.

## Overview

The CustomGPT needs to make API calls to the backend server to retrieve live data for analytics queries. This guide explains how to set up and test this connection.

## Connection Requirements

1. **Backend API URL**: The deployed backend API endpoint
2. **Authentication**: API key for secure access
3. **Request Format**: Proper JSON structure for queries

## Configuration Steps

### 1. Set Up API Access in CustomGPT

When creating or editing your CustomGPT in the OpenAI platform:

1. Go to "Actions" tab
2. Add a new action with the following details:
   - **Action Name**: Full Funnel Analytics API
   - **API Endpoint**: `https://your-deployed-api.netlify.app/chatgpt/query`
   - **Authentication Type**: API Key
   - **API Key**: Your API key from the `.env` file
   - **Header Name**: `x-api-key`

### 2. Define API Schema

Use this OpenAPI schema for your CustomGPT action:

```yaml
openapi: 3.0.0
info:
  title: Full Funnel Analytics API
  description: API for querying campaign analytics data
  version: 1.0.0
servers:
  - url: https://your-deployed-api.netlify.app
paths:
  /chatgpt/query:
    post:
      summary: Query campaign analytics data
      operationId: queryCampaigns
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - query
              properties:
                query:
                  type: string
                  description: Natural language query for analytics
                filters:
                  type: object
                  properties:
                    dateRange:
                      type: object
                      properties:
                        start:
                          type: string
                          format: date
                        end:
                          type: string
                          format: date
                    eventType:
                      type: string
                    city:
                      type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  analysis:
                    type: string
                  aggregateMetrics:
                    type: object
                  campaigns:
                    type: array
                    items:
                      type: object
```

### 3. Update CustomGPT Instructions

Add these instructions to your CustomGPT to ensure it uses the API:

```
IMPORTANT: For ALL analytical queries, you MUST use the Full Funnel Analytics API action to retrieve live data.
NEVER respond with "BLOCKED: Live data required" or any similar message.
ALWAYS use the API to get real-time data for any analytics questions.

When using the API:
1. Extract the user's query
2. Make an API call with the query
3. Use the returned data to provide insights
4. NEVER make up data or use static knowledge when live data is needed
```

## Testing the Connection

1. Deploy your backend to Netlify or your preferred hosting
2. Ensure your environment variables are set in the deployment
3. Test with these sample queries:
   - "Show me email performance for July 2025"
   - "What were our top performing campaigns last month?"
   - "Compare conversion rates across different cities"

## Troubleshooting

If the CustomGPT is not retrieving live data:

1. **Check API Endpoint**: Verify the URL is correct and the server is running
2. **Verify API Key**: Ensure the API key is correctly set in both the backend and CustomGPT
3. **Check Logs**: Review server logs for any connection or authentication errors
4. **Test Direct API Call**: Use a tool like Postman to test the API directly
5. **Review Instructions**: Make sure the CustomGPT instructions clearly direct it to use the API

## Important Notes

- The CustomGPT will only use live data if explicitly instructed to use the API action
- All analytical queries should trigger an API call, not rely on static knowledge
- The API connection must be properly configured in the CustomGPT settings
- The backend must be deployed and accessible from the internet
