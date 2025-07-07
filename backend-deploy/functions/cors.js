// CORS middleware for Netlify Functions
exports.corsMiddleware = (handler) => async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://sabbadoo32.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    // Call the original handler
    const response = await handler(event, context);
    
    // Add CORS headers to the response
    return {
      ...response,
      headers: {
        ...response.headers,
        ...headers
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
