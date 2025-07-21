const uri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel?retryWrites=true&w=majority&appName=Cluster0';

// Split URI into parts
const [protocol, rest] = uri.split('://');
const [credentials, hostPart] = rest.split('@');
const [hostname, dbAndQuery] = hostPart.split('/');

console.log('=== URI Port Check ===\n');

// Check for port numbers in hostname
const hasPort = hostname.includes(':');
const colonCount = (hostname.match(/:/g) || []).length;
console.log('Hostname:', hostname);
console.log('Contains port (has :):', hasPort);
console.log('Number of colons:', colonCount);

// Check @ symbol placement
const atCount = (uri.match(/@/g) || []).length;
console.log('\n@ Symbol Check:');
console.log('Number of @ symbols:', atCount);
console.log('Position of @:', uri.indexOf('@'));

// Check for encoded characters in hostname
console.log('\nHostname Encoding Check:');
console.log('Contains %:', hostname.includes('%'));
console.log('Contains encoded @:', hostname.includes('%40'));
console.log('Contains encoded colon:', hostname.includes('%3A'));

// Check query parameters
console.log('\nQuery Parameters:');
if (dbAndQuery.includes('?')) {
    const [db, query] = dbAndQuery.split('?');
    console.log('Database:', db);
    const params = query.split('&');
    params.forEach(param => console.log('Parameter:', param));
} else {
    console.log('No query parameters found');
}

// Final validation
console.log('\nValidation Summary:');
console.log('1. Protocol is correct:', protocol === 'mongodb+srv');
console.log('2. No port in hostname:', !hasPort);
console.log('3. Single @ symbol:', atCount === 1);
console.log('4. No encoded chars in hostname:', !hostname.includes('%'));
console.log('5. Valid mongodb.net domain:', hostname.endsWith('.mongodb.net'));
