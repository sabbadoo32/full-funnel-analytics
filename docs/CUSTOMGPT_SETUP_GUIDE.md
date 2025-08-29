# CustomGPT API Action Setup Guide

This guide provides step-by-step instructions for configuring your CustomGPT to connect to the Full Funnel Analytics API for live data access.

## Prerequisites

1. Your backend API must be deployed and accessible via a public URL
2. You need admin access to the OpenAI platform to modify your CustomGPT
3. You need your API key from the Full Funnel Analytics system

## Step 1: Deploy Your Backend API

Ensure your backend API is deployed to Netlify or another hosting service:

```bash
# Deploy to Netlify using the Netlify CLI
cd /Users/sebastianjames/CascadeProjects/full_funnel/backend-deploy
netlify deploy --prod
```

Note the URL of your deployed API (e.g., `https://full-funnel-analytics.netlify.app`).

## Step 2: Access the CustomGPT Configuration

1. Log in to the OpenAI platform at [https://chat.openai.com/](https://chat.openai.com/)
2. Go to "My GPTs" or "Explore" section
3. Find your Full Funnel Analytics CustomGPT and select "Edit"
4. Navigate to the "Configure" tab

## Step 3: Set Up the API Action

1. In the "Actions" section, click "Add action"
2. Fill in the following details:

   **Authentication:**
   - Authentication Type: API Key
   - API Key: `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`
   - Header Name: `x-api-key`

   **Schema:**
   ```yaml
   openapi: 3.0.0
   info:
     title: Full Funnel Analytics API
     description: API for querying campaign analytics data
     version: 1.0.0
   servers:
     - url: https://fullfunnelmu.netlify.app
   paths:
     /api/chat/query:
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

3. Replace `https://your-deployed-api.netlify.app` with your actual deployed API URL
4. Click "Save" to add the action

## Step 4: Update the CustomGPT Instructions

1. Navigate to the "Instructions" tab
2. Upload or paste the contents of your `condensed_instructions.txt` file
3. Ensure the instructions include the API usage directives:

```
IMPORTANT: For ALL analytical queries, you MUST use the Full Funnel Analytics API action to retrieve live data. This includes queries about personas, conversion rates, performance metrics, and any other data-driven analysis.

When using the API:
1. Extract the user's query
2. Make an API call with the query
3. Use the returned data to provide insights
4. NEVER make up data or use static knowledge when live data is needed.
```

4. Click "Save" to update the instructions

## Step 5: Test the API Connection

1. Click "Preview" to test your CustomGPT
2. Try a simple analytical query like: "Show me email performance for July 2025"
3. Verify that the CustomGPT makes an API call and returns live data
4. Check the response format and ensure it's using actual data from your database

## Step 6: Publish the Updated CustomGPT

1. Once testing is successful, click "Publish" to make your changes live
2. Confirm the publication when prompted

## Troubleshooting

If the CustomGPT is not connecting to the API:

1. **Check API Endpoint**: Verify the URL is correct and the server is running
   ```bash
   curl -X POST https://your-deployed-api.netlify.app/api/chat/query \
     -H "Content-Type: application/json" \
     -H "x-api-key: your_api_key_here" \
     -d '{"message":"Show me email performance"}'
   ```

2. **Verify API Key**: Ensure the API key is correctly set in both the backend and CustomGPT

3. **Check CORS Settings**: Make sure your API allows requests from the OpenAI domain
   ```javascript
   // In your Express app
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST'],
     allowedHeaders: ['Content-Type', 'x-api-key']
   }));
   ```

4. **Review Server Logs**: Check your Netlify function logs for any errors

5. **Test with Postman**: Use Postman to test the API directly

## Next Steps

After successful setup:

1. Document the API endpoints and parameters for future reference
2. Set up monitoring for the API to track usage and errors
3. Consider implementing rate limiting to prevent abuse
4. Create a backup plan in case the API is temporarily unavailable
