// CORS handler for preflight requests
exports.handler = async (event, context) => {
  // Always set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://sabbadoo32.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // For non-OPTIONS requests, return 404
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' })
  };
};
