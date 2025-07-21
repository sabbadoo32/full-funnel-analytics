# ChatGPT Web Interface Integration Guide

This guide explains how to use our campaign analytics API with the ChatGPT web interface at chatgpt.com.

## API Endpoint

Our API exposes a `/chatgpt/query` endpoint that accepts campaign-related queries and returns analyzed data. The endpoint is designed to work with both our custom frontend and the ChatGPT web interface.

## Using with ChatGPT Web Interface

1. **API Request Format**
   ```json
   POST /chatgpt/query
   {
     "query": "Your analysis question here",
     "filters": {
       "dateRange": {
         "start": "2025-01-01",
         "end": "2025-12-31"
       },
       "eventType": "optional event type",
       "city": "optional city filter"
     }
   }
   ```

2. **Response Format**
   ```json
   {
     "analysis": "Detailed analysis from GPT-4",
     "aggregateMetrics": {
       "totalEmails": {
         "sent": 1000,
         "opened": 500,
         "clicked": 200,
         "converted": 50
       },
       "totalAnalytics": {
         "gaSessions": 1500,
         "pageViews": 3000
       }
     },
     "campaigns": [/* Array of campaign details */]
   }
   ```

## Example Queries

Here are some effective queries to use in the ChatGPT web interface:

1. "Analyze email performance trends for campaigns in Q2 2025"
2. "Compare conversion rates across different cities"
3. "What event types show the highest engagement rates?"
4. "Show me the correlation between GA sessions and email conversions"

## Best Practices

1. Be specific with date ranges in your queries
2. Use the filters parameter to narrow down analysis scope
3. Request specific metrics when needed
4. Consider geographic patterns in your analysis

## Data Fields Available

Our campaign data includes:
- Event details (name, date, type)
- Geographic information (city, congressional district, state districts)
- Email metrics (sent, opened, clicked, converted, bounced, unsubscribed)
- Analytics (GA sessions, page views)
- Subject line and variant information

## Performance Notes

- The API aggregates metrics automatically
- Response times may vary based on data volume
- Complex queries may take longer to process
- All responses are formatted in markdown for readability
