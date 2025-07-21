exports.handler = async function(event, context) {
  console.log('Starting environment debug...');
  
  try {
    // Get all environment variables
    const envVars = Object.keys(process.env).sort();
    const uri = process.env.MONGO_URI;

    // Basic environment info
    const envInfo = {
      availableEnvVars: envVars,
      nodeEnv: process.env.NODE_ENV,
      hasPort: 'PORT' in process.env,
      portValue: process.env.PORT,
      functionName: context.functionName,
      functionVersion: context.functionVersion,
    };

    // If no MONGO_URI, return early with env info
    if (!uri) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          error: 'MONGO_URI is not set',
          environment: envInfo
        }, null, 2)
      };
    }

    // URI Analysis (without connecting)
    const [protocol, rest] = uri.split('://');
    const [credentials, hostPart] = rest.split('@');
    const [hostname, dbAndQuery] = hostPart ? hostPart.split('/') : ['', ''];

    // Analyze URI structure
    const analysis = {
      environment: envInfo,
      uri: {
        length: uri.length,
        trimmedLength: uri.trim().length,
        hasExtraSpaces: uri.trim() !== uri,
        protocol: protocol,
        isValidProtocol: protocol === 'mongodb+srv',
        hostname: hostname,
        containsPort: hostname.includes(':'),
        colonCount: (uri.match(/:/g) || []).length,
        atSymbolCount: (uri.match(/@/g) || []).length,
        hasDatabase: dbAndQuery && dbAndQuery.length > 0,
        hasQueryParams: dbAndQuery && dbAndQuery.includes('?'),
      },
      warnings: []
    };

    // Add specific warnings
    if (hostname.includes(':')) analysis.warnings.push('Hostname contains colon');
    if (hostname.includes('%3A')) analysis.warnings.push('Hostname contains encoded colon');
    if ((uri.match(/:/g) || []).length > 1) analysis.warnings.push('Multiple colons found');
    if (uri.trim() !== uri) analysis.warnings.push('URI contains leading/trailing whitespace');
    if (!protocol.startsWith('mongodb')) analysis.warnings.push('Invalid protocol');

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
