exports.handler = async function(event, context) {
  console.log('Starting simple debug...');
  
  try {
    // Basic environment info
    const info = {
      timestamp: new Date().toISOString(),
      function: {
        name: context.functionName,
        version: context.functionVersion
      },
      environment: {
        vars: Object.keys(process.env).sort(),
        nodeEnv: process.env.NODE_ENV
      },
      request: {
        method: event.httpMethod,
        path: event.path,
        headers: event.headers
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify(info, null, 2)
    };

  } catch (error) {
    console.error('Debug Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Debug Error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
