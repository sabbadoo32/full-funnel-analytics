const mongoose = require('mongoose');

// Test with and without PORT in environment
async function testConnection(env) {
    console.log('\nTesting with environment:', env);
    
    try {
        // Set environment variables
        Object.assign(process.env, env);
        
        const uri = process.env.MONGO_URI;
        console.log('MONGO_URI length:', uri.length);
        console.log('Has PORT env:', 'PORT' in process.env);
        
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

// Test both scenarios
async function runTests() {
    const uri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/full_funnel?retryWrites=true&w=majority&appName=Cluster0';
    
    // Test without PORT
    await testConnection({
        MONGO_URI: uri
    });
    
    // Test with PORT
    await testConnection({
        MONGO_URI: uri,
        PORT: '3000'
    });
}

runTests();
