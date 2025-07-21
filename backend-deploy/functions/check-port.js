exports.handler = async function(event, context) {
  console.log('Starting environment check...');
  
  try {
    // Get all environment variables
    const envVars = Object.keys(process.env).sort();
    const uri = process.env.MONGO_URI;

    if (!uri) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'MONGO_URI is not set',
          availableEnvVars: envVars
        })
      };
    }

    // Check for invisible characters
    const invisibleChars = [];
    for (let i = 0; i < uri.length; i++) {
      const code = uri.charCodeAt(i);
      if (code < 32 || code === 127) { // Control characters
        invisibleChars.push({ position: i, code: code });
      }
    }

    // Split URI into parts
    const [protocol, rest] = uri.split('://');
    const [credentials, hostPart] = rest.split('@');
    const [hostname, dbAndQuery] = hostPart ? hostPart.split('/') : ['', ''];

    // Check for any colons (potential port numbers)
    const colonPositions = [];
    let pos = -1;
    while ((pos = uri.indexOf(':', pos + 1)) !== -1) {
      colonPositions.push(pos);
    }

    // Check for URL-encoded characters in hostname
    const encodedChars = hostname.match(/%[0-9A-Fa-f]{2}/g) || [];

    const analysis = {
      // Environment
      availableEnvVars: envVars,
      hasPortVar: 'PORT' in process.env,
      portValue: process.env.PORT,

      // URI Structure
      protocol: protocol,
      hostname: hostname,
      uriLength: {
        total: uri.length,
        raw: uri.length,
        trimmed: uri.trim().length,
        hasExtraWhitespace: uri.trim() !== uri
      },

      // Detailed Checks
      colons: {
        count: colonPositions.length,
        positions: colonPositions,
        inHostname: hostname.includes(':'),
        encodedInHostname: hostname.includes('%3A')
      },
      encodedCharacters: {
        inHostname: encodedChars,
        count: encodedChars.length
      },
      invisibleCharacters: {
        found: invisibleChars,
        count: invisibleChars.length
      },

      // Query Parameters
      hasQueryParams: dbAndQuery && dbAndQuery.includes('?'),
      queryString: dbAndQuery ? dbAndQuery.split('?')[1] : null
    };

    return {
      statusCode: 200,
      body: JSON.stringify(analysis, null, 2)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
