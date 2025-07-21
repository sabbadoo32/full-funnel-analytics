// This code can be pasted into Netlify's Functions console to test the MONGO_URI
exports.handler = async function(event, context) {
  const uri = process.env.MONGO_URI;
  
  // Check if MONGO_URI is set
  if (!uri) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'MONGO_URI is not set',
        envVars: Object.keys(process.env)
      })
    };
  }

  // Basic validation
  const validation = {
    length: uri.length,
    startsWithProtocol: uri.startsWith('mongodb+srv://'),
    hasUsername: uri.includes('sebastianjames'),
    hasEncodedAt: uri.includes('%40'),
    hasHost: uri.includes('.mongodb.net'),
    hasDatabase: uri.endsWith('/full_funnel'),
    hasExtraSpaces: uri.trim() !== uri
  };

  // Compare with expected URI
  const expectedUri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel';
  const comparison = {
    sameLength: uri.length === expectedUri.length,
    exactMatch: uri === expectedUri,
    differences: uri === expectedUri ? 'None' : 
      [...uri].map((char, i) => 
        char !== expectedUri[i] ? 
          `Position ${i}: Expected '${expectedUri[i]}' but got '${char}'` : null
      ).filter(Boolean)
  };

  return {
    statusCode: 200,
    body: JSON.stringify({
      validation,
      comparison,
      uriStart: uri.substring(0, 20) + '...',  // Show just the start for safety
      uriEnd: '...' + uri.substring(uri.length - 20)  // Show just the end for safety
    }, null, 2)
  };
};
