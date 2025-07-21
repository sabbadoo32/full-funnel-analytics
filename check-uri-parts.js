const uri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel';

// Break down the URI into parts
const [protocol, rest] = uri.split('://');
const [credentials, host] = rest.split('@');
const [username, password] = credentials.split(':');
const [hostname, database] = host.split('/');

console.log('=== MongoDB URI Parts Check ===\n');

console.log('1. Protocol:');
console.log(`   ${protocol}`);
console.log(`   Length: ${protocol.length}`);
console.log(`   Correct: ${protocol === 'mongodb+srv'}\n`);

console.log('2. Username:');
console.log(`   ${username}`);
console.log(`   Length: ${username.length}`);
console.log(`   Correct: ${username === 'sebastianjames'}\n`);

console.log('3. Password:');
console.log(`   ${password}`);
console.log(`   Length: ${password.length}`);
console.log(`   Contains %40: ${password.includes('%40')}`);
console.log(`   No spaces: ${!password.includes(' ')}\n`);

console.log('4. Hostname:');
console.log(`   ${hostname}`);
console.log(`   Length: ${hostname.length}`);
console.log(`   Correct format: ${hostname.endsWith('.mongodb.net')}\n`);

console.log('5. Database:');
console.log(`   ${database}`);
console.log(`   Length: ${database.length}`);
console.log(`   Correct: ${database === 'full_funnel'}\n`);

console.log('=== Total URI Check ===');
console.log(`Total length: ${uri.length} characters`);
console.log(`No extra spaces: ${!uri.includes(' ')}`);
console.log(`Correct structure: ${uri.startsWith('mongodb+srv://') && uri.includes('@') && uri.endsWith('/full_funnel')}`);
