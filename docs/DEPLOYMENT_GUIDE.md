# Full Funnel Analytics API Deployment Guide

## API Authentication Update

This guide provides instructions for deploying the Full Funnel Analytics API with the updated authentication system that standardizes on `OPENAI_API_KEY`.

## Pre-Deployment Checklist

1. Ensure all code changes have been committed to your repository
2. Verify that your local environment has the correct API keys:
   - `OPENAI_API_KEY` is set and valid
   - Legacy `API_KEY` is set if needed for backward compatibility
3. Confirm all references to `FULLFUNNEL_API_KEY` have been removed from the codebase

## Deployment Steps

### 1. Set Environment Variables in Netlify

```bash
# Run the script to set OPENAI_API_KEY in Netlify
cd /Users/sebastianjames/CascadeProjects/full_funnel
chmod +x scripts/set-netlify-openai-key.sh
./scripts/set-netlify-openai-key.sh
```

If you prefer to set the environment variables manually:

1. Log in to your Netlify dashboard
2. Navigate to your site settings
3. Go to "Environment variables"
4. Add or update the following variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `API_KEY`: (Optional) Your legacy API key for backward compatibility
5. Remove any existing `FULLFUNNEL_API_KEY` environment variable

### 2. Deploy the Updated API

```bash
# Deploy the main API
cd /Users/sebastianjames/CascadeProjects/full_funnel
./deploy-to-netlify-auto.sh

# Or deploy the backend only
cd /Users/sebastianjames/CascadeProjects/full_funnel/backend-deploy
netlify deploy --prod
```

### 3. Verify Deployment

After deployment, verify that the API authentication is working correctly:

```bash
# Test the API authentication
node test-api-auth.js
```

You should see successful authentication using your `OPENAI_API_KEY`.

### 4. Update CustomGPT Configuration

If you're using CustomGPT with the Full Funnel Analytics API:

1. Log in to the OpenAI platform
2. Navigate to your CustomGPT settings
3. Update the API authentication to use your `OPENAI_API_KEY`
4. Save and publish the updated CustomGPT

## Troubleshooting

If you encounter authentication issues after deployment:

1. **Check Environment Variables**: Verify that `OPENAI_API_KEY` is correctly set in your Netlify environment
   ```bash
   netlify env:list
   ```

2. **Debug API Authentication**: Use the debug endpoint to check API key recognition
   ```bash
   curl -X GET "https://your-netlify-app.netlify.app/api/debug" \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_OPENAI_API_KEY"
   ```

3. **Review Server Logs**: Check Netlify function logs for any authentication errors
   ```bash
   netlify functions:logs
   ```

## Rollback Procedure

If necessary, you can roll back to a previous deployment:

1. In the Netlify dashboard, go to "Deploys"
2. Find your last working deployment
3. Click "Publish deploy" to revert to that version

## Support

For additional support or questions about the API authentication update, please contact the development team.
