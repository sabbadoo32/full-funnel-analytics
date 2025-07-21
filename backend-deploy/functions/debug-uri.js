exports.handler = async function(event, context) {
  const uri = process.env.MONGO_URI || 'not set';
  
  if (!uri || uri === 'not set') {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'MONGO_URI is not set',
        envVars: Object.keys(process.env)
      })
    };
  }

  // Split URI into parts for analysis
  const [protocol, rest] = uri.split('://');
  const [credentials, hostPart] = rest.split('@');
  const [hostname, dbAndQuery] = hostPart ? hostPart.split('/') : ['', ''];

  const analysis = {
    // Basic structure
    length: uri.length,
    trimmedLength: uri.trim().length,
    hasExtraSpaces: uri.trim() !== uri,
    
    // Protocol check
    protocol: protocol,
    isValidProtocol: protocol === 'mongodb+srv',
    
    // Hostname checks
    hostname: hostname,
    containsPort: hostname.includes(':'),
    colonCount: (hostname.match(/:/g) || []).length,
    containsPercent: hostname.includes('%'),
    
    // @ symbol checks
    atSymbolCount: (uri.match(/@/g) || []).length,
    atSymbolPosition: uri.indexOf('@'),
    
    // Database and query
    hasDatabase: dbAndQuery && dbAndQuery.length > 0,
    hasQueryParams: dbAndQuery && dbAndQuery.includes('?'),
    
    // Specific port number warnings
    possiblePortWarnings: [
      hostname.includes(':') ? 'Hostname contains colon' : null,
      hostname.includes('%3A') ? 'Hostname contains encoded colon' : null,
      (uri.match(/:/g) || []).length > 1 ? 'Multiple colons found' : null
    ].filter(Boolean)
  };

  return {
    statusCode: 200,
    body: JSON.stringify(analysis, null, 2)
  };
};
