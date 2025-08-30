# Full Funnel Analytics API Standard Configuration

This document defines the standard configuration for the Full Funnel Analytics API endpoints. All integrations and clients should follow these standards.

## API Endpoints

### Primary Endpoint

- **Base URL:** `https://fullfunnelmu.netlify.app`
- **Endpoint Path:** `/api/chat/query`
- **Full URL:** `https://fullfunnelmu.netlify.app/api/chat/query`

### Authentication

- **Authentication Type:** API Key
- **API Key Header:** `x-api-key`
- **API Key Value:** `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`

## Request Format

```json
{
  "message": "Your natural language query here"
}
```

## Response Format

```json
{
  "message": "API connection successful",
  "query": "Your original query",
  "collections": ["collection_names_here"],
  "sampleData": [],
  "status": "success"
}
```

## Implementation Details

### Netlify Configuration

The API uses Netlify redirects to map external endpoints to internal functions:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
  force = true
```

### Function Implementation

The API function checks for paths ending with `/chat/query` after the Netlify redirect:

```javascript
if (!requestPath.endsWith('/chat/query')) {
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Endpoint not found' })
  };
}
```

## Testing the API

Use this curl command to test the API:

```bash
curl -X POST https://fullfunnelmu.netlify.app/api/chat/query \
  -H "Content-Type: application/json" \
  -H "x-api-key: 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" \
  -d '{"message":"Show me email performance metrics"}'
```

## Integration Guidelines

1. Always use the `/api/chat/query` endpoint for external requests
2. Include the `x-api-key` header with every request
3. Send queries in the `message` field of the JSON body
4. Handle both success and error responses appropriately
