# CustomGPT API Action Setup Guide

This guide provides step-by-step instructions for configuring your CustomGPT to connect to the Full Funnel Analytics API for live data access.

## Prerequisites

1. Your backend API must be deployed and accessible via a public URL
2. You need admin access to the OpenAI platform to modify your CustomGPT
3. You need your `OPENAI_API_KEY` for API authentication

## Step 1: Deploy Your Backend API

Ensure your backend API is deployed to Netlify with the correct environment variables and CORS configuration:

```bash
# Verify environment variables and deploy to Netlify
./scripts/deploy-api-fix.sh
```

This script will:
1. Verify that all required environment variables are set in Netlify
2. Check that the CORS configuration includes the `Authorization` header
3. Deploy the backend to Netlify
4. Test the API connection

Alternatively, you can manually deploy:

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
   - API Key: Use your `OPENAI_API_KEY` value
   - Header Name: `x-api-key` (IMPORTANT: Use this exact header name, not `Authorization`)
   
   > **CRITICAL**: The API only accepts the `x-api-key` header for authentication, not the `Authorization: Bearer` header.

   **Schema:**
   ```yaml
   openapi: 3.1.0
   info:
     title: Full Funnel Analytics API
     description: API for querying campaign analytics data
     version: 1.0.0

   servers:
     - url: https://fullfunnelmu.netlify.app/.netlify/functions

   # CRITICAL: The server URL MUST include the '/.netlify/functions' path prefix
   # Incorrect: https://fullfunnelmu.netlify.app
   # Correct:   https://fullfunnelmu.netlify.app/.netlify/functions

   # Apply API key globally so the Action always injects it
   security:
     - ApiKeyAuth: []

   paths:
     /api/chat/query:
       post:
         summary: Query campaign analytics data
         operationId: queryCampaigns
         requestBody:
           required: true
           content:
             "application/json":
               schema:
                 type: object
                 required: [message]
                 properties:
                   message:
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
           "200":
             $ref: "#/components/responses/SuccessJSON"
           "400":
             $ref: "#/components/responses/BadRequest"
           "401":
             $ref: "#/components/responses/Unauthorized"
           "500":
             $ref: "#/components/responses/ServerError"

   components:
     securitySchemes:
       ApiKeyAuth:
         type: apiKey
         in: header
         name: x-api-key

     schemas:
       QueryResponse:
         type: object
         properties:
           message:
             type: string
           query:
             type: string
           collections:
             type: array
             items:
               type: string
           sampleData:
             type: array
             items:
               type: object
               additionalProperties: true
           status:
             type: string

     responses:
       SuccessJSON:
         description: Successful response
         content:
           "application/json":
             schema:
               $ref: "#/components/schemas/QueryResponse"
       BadRequest:
         description: Bad request
       Unauthorized:
         description: Unauthorized
       ServerError:
         description: Server error
   ```

3. Replace `https://your-deployed-api.netlify.app` with your actual deployed API URL
4. Click "Save" to add the action

## Step 4: Update the CustomGPT Instructions and Knowledge

1. Navigate to the "Instructions" tab
2. Upload or paste the contents of your `full_funnel_instructions.txt` file
3. Ensure the instructions include the API usage directives:

```
IMPORTANT: For analytical queries, use the Full Funnel Analytics API action to retrieve live data when available. This includes queries about personas, conversion rates, performance metrics, and other data-driven analysis.

When using the API:
1. Extract the user's query
2. Make an API call with the query
3. Use the returned data to provide insights
4. If the API connection fails, fall back to using the uploaded schema and instructions

When answering data analysis questions, you may use the uploaded schema and instructions to provide insights if live data is unavailable.
```

4. In the "Knowledge" section, upload the following files:
   - `full_funnel_all_columns_master_list.json` - The complete schema of all available data fields
   - Any other reference documents with campaign data, personas, or analytics information

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

### Fixing ClientResponseError

If you encounter a ClientResponseError when connecting to the API, follow these steps:

1. **Use the Correct API Endpoint Path**: The API is hosted on Netlify Functions, so the correct path includes `/.netlify/functions`
   ```bash
   # CORRECT URL FORMAT
   curl -X POST https://fullfunnelmu.netlify.app/.netlify/functions/api/chat/query \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_OPENAI_API_KEY" \
     -d '{"message":"Show me email performance metrics"}'
   ```

2. **Use the Correct Authentication Method**: The API supports both `x-api-key` header and `Authorization: Bearer` token
   ```bash
   # Option 1: Using x-api-key header
   curl -X POST https://fullfunnelmu.netlify.app/.netlify/functions/api/chat/query \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_OPENAI_API_KEY" \
     -d '{"message":"Show me email performance metrics"}'
   
   # Option 2: Using Authorization Bearer token
   curl -X POST https://fullfunnelmu.netlify.app/.netlify/functions/api/chat/query \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
     -d '{"message":"Show me email performance metrics"}'
   ```
   
3. **Verify API Key**: Ensure your `OPENAI_API_KEY` is correctly set in both the backend environment and CustomGPT configuration

4. **Check CORS Settings**: Make sure your API allows requests from the OpenAI domain with the correct headers
   ```javascript
   // In your Express app
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
   }));
   ```
   
   > **IMPORTANT**: The `Authorization` header MUST be included in the CORS configuration to allow Bearer token authentication. Missing this header is a common cause of 401 Unauthorized errors in browser environments.

5. **Review Server Logs**: Check your Netlify function logs for any errors

6. **Test with the Integration Test Script**: Use the provided test script to diagnose connection issues
   ```bash
   # Run the integration test script
   node test-customgpt-integration.js
   ```

7. **Test with Postman**: Use Postman to test the API directly

8. **Verify Request Format**: Ensure your request payload matches the expected format
   ```json
   {
     "message": "Show me email performance metrics for July 2025",
     "filters": {
       "dateRange": {
         "start": "2025-07-01",
         "end": "2025-07-31"
       }
     }
   }
   ```

## Next Steps

After successful setup:

1. Document the API endpoints and parameters for future reference
2. Set up monitoring for the API to track usage and errors
3. Consider implementing rate limiting to prevent abuse
4. Create a backup plan in case the API is temporarily unavailable

## CustomGPT Fallback Behavior

The CustomGPT is designed to handle API connection failures gracefully by using the uploaded schema and instructions as a fallback data source:

1. **Primary Data Source**: Live data from the Full Funnel Analytics API
2. **Fallback Data Source**: Structured data from uploaded files:
   - `full_funnel_instructions.txt` - Contains campaign structure, metrics definitions, and reporting formats
   - `full_funnel_all_columns_master_list.json` - Contains the complete schema of all available data fields

When the API connection fails, the CustomGPT will:
1. Inform the user that the API connection failed
2. Continue to provide analysis based on the uploaded schema and instructions
3. Generate responses using the structured data available in the uploaded files
4. Clearly indicate that it's using the uploaded files rather than live data

## Common Error Messages and Solutions

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `ClientResponseError` | Incorrect API endpoint URL or authentication | Use the correct URL with `/.netlify/functions` path and proper authentication headers |
| `401 Unauthorized` | Invalid API key | Verify your `OPENAI_API_KEY` is correct and properly formatted in the header |
| `404 Not Found` | Incorrect API path | Ensure you're using the full path including `/.netlify/functions` |
| `CORS error` | Missing CORS headers | Update your API to include proper CORS headers for `Authorization` |
| `Network error` | API server down or unreachable | Check if the Netlify deployment is active and accessible |

## Testing Your Fix

After implementing the fixes, you can verify the solution works by:

1. Running the verification script: `node scripts/verify-netlify-env.js`
2. Running the integration test script: `node test-customgpt-integration.js`
3. Using the API test interface: `http://localhost:3000/api-test`
4. Testing directly in your CustomGPT with a simple query

## Environment Variable Verification

To ensure your Netlify deployment has the correct environment variables:

```bash
node scripts/verify-netlify-env.js
```

This script will:
1. Check if Netlify CLI is installed and you're logged in
2. Verify that `OPENAI_API_KEY` and other required variables are set in Netlify
3. Compare local and Netlify environment variables
4. Set missing variables in Netlify if they exist locally
5. Check CORS configuration for the `Authorization` header

If any issues are found, the script will provide guidance on how to fix them.
