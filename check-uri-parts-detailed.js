// The complete URI from .env
const uri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel?retryWrites=true&w=majority&appName=Cluster0';

function analyzeUri(uri) {
  // Split into base and query parts
  const [baseUri, queryString] = uri.split('?');
  
  // Parse base URI parts
  const [protocol, rest] = baseUri.split('://');
  const [credentials, hostPart] = rest.split('@');
  const [username, password] = credentials.split(':');
  const [hostname, database] = hostPart.split('/');
  
  // Parse query parameters
  const queries = queryString ? queryString.split('&').reduce((acc, param) => {
    const [key, value] = param.split('=');
    acc[key] = value;
    return acc;
  }, {}) : {};

  // Detailed analysis
  console.log('=== MongoDB URI Detailed Analysis ===\n');
  
  console.log('1. Protocol:');
  console.log(`   Value: ${protocol}`);
  console.log(`   Length: ${protocol.length}`);
  console.log(`   Expected: mongodb+srv`);
  console.log(`   Matches: ${protocol === 'mongodb+srv'}\n`);
  
  console.log('2. Username:');
  console.log(`   Value: ${username}`);
  console.log(`   Length: ${username.length}`);
  console.log(`   Expected: sebastianjames`);
  console.log(`   Matches: ${username === 'sebastianjames'}\n`);
  
  console.log('3. Password:');
  console.log(`   Value: ${password}`);
  console.log(`   Length: ${password.length}`);
  console.log(`   Contains %40: ${password.includes('%40')}`);
  console.log(`   Position of %40: ${password.indexOf('%40')}`);
  console.log(`   No spaces: ${!password.includes(' ')}\n`);
  
  console.log('4. Hostname:');
  console.log(`   Value: ${hostname}`);
  console.log(`   Length: ${hostname.length}`);
  console.log(`   Parts: ${hostname.split('.')}`);
  console.log(`   Ends with .mongodb.net: ${hostname.endsWith('.mongodb.net')}\n`);
  
  console.log('5. Database:');
  console.log(`   Value: ${database}`);
  console.log(`   Length: ${database.length}`);
  console.log(`   Expected: full_funnel`);
  console.log(`   Matches: ${database === 'full_funnel'}\n`);
  
  console.log('6. Query Parameters:');
  console.log('   Required parameters:');
  console.log(`   - retryWrites: ${queries.retryWrites === 'true' ? '✅' : '❌'}`);
  console.log(`   - w: ${queries.w === 'majority' ? '✅' : '❌'}`);
  console.log(`   - appName: ${queries.appName === 'Cluster0' ? '✅' : '❌'}\n`);
  
  console.log('7. Overall Structure:');
  console.log(`   Total Length: ${uri.length}`);
  console.log(`   No spaces at start/end: ${uri.trim() === uri}`);
  console.log(`   Correct @ count: ${(uri.match(/@/g) || []).length === 1}`);
  console.log(`   Correct format: ${uri.startsWith('mongodb+srv://') && uri.includes('@') && uri.includes('/full_funnel')}`);
  
  // Return true if everything matches expected format
  return {
    protocolOk: protocol === 'mongodb+srv',
    usernameOk: username === 'sebastianjames',
    passwordOk: password.includes('%40') && !password.includes(' '),
    hostnameOk: hostname.endsWith('.mongodb.net'),
    databaseOk: database === 'full_funnel',
    queryParamsOk: queries.retryWrites === 'true' && queries.w === 'majority' && queries.appName === 'Cluster0',
    structureOk: uri.trim() === uri && (uri.match(/@/g) || []).length === 1
  };
}

const results = analyzeUri(uri);
console.log('\n=== Final Check ===');
for (const [key, value] of Object.entries(results)) {
  console.log(`${key}: ${value ? '✅' : '❌'}`);
}
