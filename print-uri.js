const uri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel';
console.log('=== MongoDB URI (copy everything between the lines) ===');
console.log('---BEGIN URI---');
console.log(uri);
console.log('---END URI---');
console.log('\nLength:', uri.length);
console.log('Contains @:', uri.includes('@'));
console.log('Contains %40:', uri.includes('%40'));
console.log('Ends with /full_funnel:', uri.endsWith('/full_funnel'));
