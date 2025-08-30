# API Authentication Details

## Overview
This document outlines the authentication mechanism used for the Full Funnel Analytics API and the recent improvements made to ensure consistent authentication across all endpoints.

## Authentication Method
The API uses API Key authentication. The key must be included in the header of each request as `x-api-key`.

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
- API key validation in the backend code:
  ```javascript
  // Case-insensitive header check
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'] || '';
  const openaiApiKey = process.env.OPENAI_API_KEY || '';
  const legacyApiKey = process.env.API_KEY || '';
  const defaultApiKey = 'full-funnel-api-key-default';
  
  // Standardize on OPENAI_API_KEY as the primary authentication method
  // while maintaining backward compatibility with other keys
  const isValidKey = (
    // Primary authentication method
    (openaiApiKey && apiKey === openaiApiKey) || 
    // Legacy authentication methods for backward compatibility
    (legacyApiKey && apiKey === legacyApiKey) || 
    apiKey === defaultApiKey
  );
  
  if (!apiKey || !isValidKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
    };
  }
  ```

### CORS Configuration
- Updated CORS middleware to include the API key header:
  ```javascript
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  ```

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
```bash
curl -i -X POST "https://fullfunnelmu.netlify.app/api/chat/query" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "message": "Health check",
    "filters": { "city": "Chicago" }
  }'
```

## Error Handling
- The API returns a 401 status code for invalid or missing API keys
- The bot is configured to never report API errors to users
- If authentication fails, the bot will silently handle the error and provide analysis based on available knowledge
