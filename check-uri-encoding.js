const mongoose = require('mongoose');

// Original URI with %40
const originalUri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel';

// Different encoding variations to test
const variations = {
    original: originalUri,
    decoded: decodeURIComponent(originalUri),
    doubleEncoded: encodeURIComponent(originalUri),
    atSymbol: originalUri.replace('%40', '@'),
    fullyEncoded: originalUri.replace('@', '%40'),
};

async function testConnection(uri, label) {
    console.log(`\nTesting ${label}:`);
    console.log('URI:', uri);
    console.log('Length:', uri.length);
    console.log('Special chars:', {
        hasPercent: uri.includes('%'),
        hasAt: uri.includes('@'),
        hasSlash: uri.includes('/'),
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

async function testAll() {
    for (const [label, uri] of Object.entries(variations)) {
        await testConnection(uri, label);
    }
}

testAll().then(() => process.exit(0));
