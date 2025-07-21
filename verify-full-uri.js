const mongoose = require('mongoose');

// The complete URI from .env
const uri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel?retryWrites=true&w=majority&appName=Cluster0';

// Parse and validate URI parts
const [baseUri, queryString] = uri.split('?');
const queries = queryString.split('&').reduce((acc, query) => {
  const [key, value] = query.split('=');
  acc[key] = value;
  return acc;
}, {});

console.log('=== MongoDB URI Verification ===\n');

console.log('1. Base URI:');
console.log(`   ${baseUri}`);
console.log(`   Length: ${baseUri.length}`);
console.log(`   Has encoded @: ${baseUri.includes('%40')}`);
console.log(`   Database name: ${baseUri.split('/').pop()}\n`);

console.log('2. Query Parameters:');
for (const [key, value] of Object.entries(queries)) {
  console.log(`   ${key}: ${value}`);
}
console.log();

console.log('3. Connection Test:');
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000
}).then(() => {
  console.log('✅ Connection successful');
  console.log('Available collections:', 
    Object.keys(mongoose.connection.collections));
  mongoose.connection.close();
}).catch(error => {
  console.log('❌ Connection failed:', {
    name: error.name,
    message: error.message,
    code: error.code
  });
  process.exit(1);
});
