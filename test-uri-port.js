const mongoose = require('mongoose');

// Original URI
const originalUri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel';

// Test variations
const variations = {
    original: originalUri,
    noDatabase: originalUri.replace('/full_funnel', ''),
    simpleHost: 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.mongodb.net/full_funnel',
    withoutSrv: originalUri.replace('+srv', ''),
    encodedHost: originalUri.replace('@cluster0', '%40cluster0'),
};

async function testUri(label, uri) {
    console.log(`\nTesting ${label}:`);
    console.log('URI:', uri);
    console.log('Parts:', {
        protocol: uri.split('://')[0],
        host: uri.split('@')[1]?.split('/')[0],
        database: uri.split('/').pop()
    });
    
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connection successful');
        await mongoose.connection.close();
    } catch (error) {
        console.log('❌ Connection failed:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
    }
}

async function runTests() {
    for (const [label, uri] of Object.entries(variations)) {
        await testUri(label, uri);
    }
}

runTests().then(() => process.exit(0));
