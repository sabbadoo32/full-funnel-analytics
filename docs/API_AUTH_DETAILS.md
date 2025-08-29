# API Authentication Details

When configuring the CustomGPT API action, use these exact authentication details:

## Authentication
- **Authentication Type:** API Key
- **API Key:** `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`
- **Header Name:** `x-api-key`

## API URL
- **Base URL:** `https://fullfunnelmu.netlify.app`
- **Endpoint:** `/api/chat/query`
- **Full URL:** `https://fullfunnelmu.netlify.app/api/chat/query`

## Testing the API
You can test the API connection with this curl command:

```bash
curl -X POST https://fullfunnelmu.netlify.app/api/chat/query \
  -H "Content-Type: application/json" \
  -H "x-api-key: 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" \
  -d '{"message":"Show me email performance metrics"}'
```
