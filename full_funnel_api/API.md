# Full Funnel Analytics API Documentation

## Overview
The Full Funnel Analytics API provides comprehensive analytics across multiple channels including email, social, ads, web, CTV, P2P, and more. All endpoints support flexible querying and cross-channel analytics.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints require an API key passed in the `Authorization` header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Campaign Analytics

#### Get Campaign Overview
```
GET /campaigns/:id/analytics
```
Returns a complete analytics overview including all channels and metrics.

Response example:
```json
{
  "email": {
    "opened": 100,
    "clicked": 50,
    "converted": 25,
    "subject": "Test Campaign"
  },
  "social": {
    "reactions": 1000,
    "comments": 200,
    "shares": 300
  },
  "ads": {
    "impressions": 50000,
    "clicks": 2500,
    "costPerResult": 1.50,
    "spend": 7500
  },
  "web": {
    "sessions": 15000,
    "activeUsers": 12000,
    "newUsers": 3000,
    "avgEngagementTime": 180
  },
  "ctv": {
    "households": 25000,
    "impressionsPerHousehold": 2.5,
    "viewThroughRate": 0.75,
    "frequency": 3.2
  }
}
```

#### Query Campaigns
```
POST /campaigns/query
```
Query campaigns with flexible filters and analytics aggregation.

Request body:
```json
{
  "filters": {
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    },
    "channels": ["email", "social", "ads"],
    "metrics": {
      "sessions": { "gt": 1000 },
      "conversions": { "gt": 50 }
    }
  },
  "aggregations": ["channel", "campaign", "date"],
  "includeMetrics": ["all"]
}
```

### Meta/GA Integration (Coming Soon)

The following endpoints are planned for Meta and Google Analytics integration:

#### Meta Ads Data
```
GET /meta/campaigns
GET /meta/ads
GET /meta/insights
```

#### Google Analytics Data
```
GET /ga/realtime
GET /ga/events
GET /ga/conversions
```

## Error Handling
All endpoints follow standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

Error responses include a message and error code:
```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "Invalid filter parameter: date range required"
  }
}
```

## Rate Limiting
- 1000 requests per minute per API key
- Rate limit headers included in responses:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Best Practices
1. Use filters to limit data retrieval
2. Leverage aggregations for performance
3. Cache frequently accessed analytics
4. Monitor rate limits
5. Handle errors gracefully

## Next Steps
1. Meta Ads Integration
   - Real-time campaign data
   - Custom audience sync
   - Conversion tracking

2. Google Analytics Integration
   - Event tracking
   - Enhanced ecommerce
   - Custom dimensions
