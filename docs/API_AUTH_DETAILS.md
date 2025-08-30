# API Authentication Details

## Overview
This document outlines the authentication mechanism used for the Full Funnel Analytics API and the recent improvements made to ensure consistent authentication across all endpoints.

## Authentication Methods
The API supports two authentication methods:

1. **Primary Method**: API Key in `x-api-key` header
2. **Alternative Method**: Bearer token in `Authorization: Bearer <token>` header

Both methods use the same API key value (typically your `OPENAI_API_KEY`).

## API Key Standard

The standard API key used across all environments is the `OPENAI_API_KEY`. This key is used for both OpenAI API calls and for authenticating requests to the Full Funnel Analytics API.

For backward compatibility, the following keys are also accepted:
- `API_KEY` (legacy, if set)
- `full-funnel-api-key-default` (default fallback)

## Implementation Details

### OpenAPI Schema
- Added top-level security definition to ensure the API key is always injected:
  ```yaml
  security:
    - ApiKeyAuth: []
  ```
- Defined response references for consistent error handling:
  ```yaml
  responses:
    "401":
      $ref: "#/components/responses/Unauthorized"
  ```
- Specified the security scheme in components:
  ```yaml
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
  ```

### Backend Implementation
- API key validation in the backend code with support for both authentication methods:
  ```javascript
  // Case-insensitive header checks
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'] || '';
  
  // Extract Bearer token if present
  let bearerToken = '';
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }
  
  // Environment variables and defaults
  const openaiApiKey = process.env.OPENAI_API_KEY || '';
  const legacyApiKey = process.env.API_KEY || '';
  const defaultApiKey = 'full-funnel-api-key-default';
  
  // Log authentication attempt (with partial key for security)
  console.log(`Auth attempt - x-api-key: ${apiKey ? '****' + apiKey.slice(-4) : 'not provided'}, bearer: ${bearerToken ? '****' + bearerToken.slice(-4) : 'not provided'}`);
  
  // Standardize on OPENAI_API_KEY as the primary authentication method
  // while maintaining backward compatibility with other keys
  const isValidKey = (
    // Primary authentication methods
    (openaiApiKey && (apiKey === openaiApiKey || bearerToken === openaiApiKey)) || 
    // Legacy authentication methods for backward compatibility
    (legacyApiKey && (apiKey === legacyApiKey || bearerToken === legacyApiKey)) || 
    apiKey === defaultApiKey || bearerToken === defaultApiKey
  );
  
  if ((!apiKey && !bearerToken) || !isValidKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
    };
  }
  ```

### CORS Configuration
- Updated CORS middleware to include both authentication headers:
  ```javascript
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  ```

> **IMPORTANT**: The `Authorization` header must be included in the CORS configuration to allow Bearer token authentication. Missing this header is a common cause of 401 Unauthorized errors in browser environments.

## Environment Variables
- The API key is stored in the following environment variable:
  - `OPENAI_API_KEY`: The primary environment variable for API authentication
  - Note: For backward compatibility, `API_KEY` is also checked as a fallback
- The same key must be configured in the CustomGPT Action UI

## Security Considerations
- The API key should be kept secure and not exposed in client-side code
- The key should be rotated periodically
- All API requests should be made over HTTPS
- Whitespace is trimmed from both the provided and expected keys to avoid common errors

## Testing Authentication

### Using x-api-key Header
```bash
curl -i -X POST "https://fullfunnelmu.netlify.app/.netlify/functions/api/chat/query" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_OPENAI_API_KEY" \
  -d '{
    "message": "Health check",
    "filters": { "city": "Chicago" }
  }'
```

### Using Authorization Bearer
```bash
curl -i -X POST "https://fullfunnelmu.netlify.app/.netlify/functions/api/chat/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -d '{
    "message": "Health check",
    "filters": { "city": "Chicago" }
  }'
```

## Error Handling
- The API returns a 401 status code for invalid or missing API keys
- The bot is configured to never report API errors to users
- If authentication fails, the bot will silently handle the error and provide analysis based on available knowledge

## Verification and Deployment

### Environment Variable Verification

We've created a script to verify that all required environment variables are correctly set in your Netlify deployment:

```bash
node scripts/verify-netlify-env.js
```

This script will:
1. Check if Netlify CLI is installed and you're logged in
2. Verify that `OPENAI_API_KEY` and other required variables are set in Netlify
3. Compare local and Netlify environment variables
4. Set missing variables in Netlify if they exist locally
5. Check CORS configuration for the `Authorization` header

### Deployment Process

To deploy the API with all fixes applied, use the deployment script:

```bash
./scripts/deploy-api-fix.sh
```

This script will:
1. Verify environment variables using the script above
2. Deploy the backend to Netlify
3. Test the API connection
4. Provide troubleshooting guidance if needed

## Common Issues and Solutions

### Ranked List of Potential Problems

When encountering a ClientResponseError with the API, here are the most likely causes, ranked by probability:

1. **Incorrect API Endpoint URL** (Highest Probability)
   - **Problem**: Using `/api/chat/query` instead of `/.netlify/functions/api/chat/query`
   - **Solution**: Always include the `/.netlify/functions` path prefix for Netlify-hosted functions

2. **Authentication Header Issues**
   - **Problem**: Using only one authentication method when the API expects another
   - **Solution**: Ensure you're using either `x-api-key` header or `Authorization: Bearer` with the correct API key

3. **Invalid API Key**
   - **Problem**: Using an incorrect or expired API key
   - **Solution**: Verify your `OPENAI_API_KEY` is correctly set in both the backend environment and client request

4. **CORS Configuration**
   - **Problem**: Missing CORS headers for `Authorization` or `x-api-key`
   - **Solution**: Update CORS configuration to include all necessary headers
   - **Fix**: Ensure the CORS middleware includes `Authorization` in the `Access-Control-Allow-Headers` list

5. **Environment Variable Mismatch**
   - **Problem**: Environment variables set locally but not in Netlify deployment
   - **Solution**: Use the verification script to check and sync environment variables

6. **Network Connectivity**
   - **Problem**: API server is unreachable
   - **Solution**: Verify the Netlify deployment is active and accessible

7. **Request Payload Format**
   - **Problem**: Malformed JSON or missing required fields
   - **Solution**: Ensure your request payload matches the expected format with all required fields

8. **Rate Limiting or Throttling** (Lowest Probability)
   - **Problem**: Too many requests in a short time period
   - **Solution**: Implement backoff strategy or reduce request frequency
