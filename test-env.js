console.log('Environment Variable Test');
console.log('========================');

// Required environment variables
const requiredVars = [
  'MONGO_URI',
  'OPENAI_API_KEY',
  'FULLFUNNEL_API_KEY'
];

// Conditional environment variables (required in production)
const conditionalVars = [
  'GA_PROPERTY_ID',
  'GA_CLIENT_EMAIL',
  'GA_PRIVATE_KEY',
  'META_ACCESS_TOKEN'
];

// Optional environment variables with defaults
const optionalVars = {
  'PORT': 3000,
  'META_API_VERSION': 'v17.0',
  'NODE_ENV': 'production'
};

// Check required variables
console.log('\n🔍 Checking required environment variables:');
let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ ${varName} is not set`);
    allVarsPresent = false;
  } else {
    // Mask sensitive values
    const displayValue = isSensitive(varName) ? maskValue(value) : value;
    console.log(`✅ ${varName}=${displayValue}`);
  }
});

// Check conditional variables
console.log('\n🔍 Checking conditional environment variables (required in production):');
conditionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.warn(`⚠️  ${varName} is not set (required in production)`);
  } else {
    const displayValue = isSensitive(varName) ? maskValue(value) : value;
    console.log(`✅ ${varName}=${displayValue}`);
  }
});

// Check optional variables
console.log('\n🔍 Checking optional environment variables:');
Object.entries(optionalVars).forEach(([varName, defaultValue]) => {
  const value = process.env[varName] || `[using default: ${defaultValue}]`;
  const displayValue = isSensitive(varName) ? maskValue(value) : value;
  console.log(`ℹ️  ${varName}=${displayValue}`);
});

// Helper functions
function isSensitive(varName) {
  return varName.includes('KEY') || 
         varName.includes('TOKEN') || 
         varName.includes('SECRET') ||
         varName.includes('PASSWORD') ||
         varName.includes('PRIVATE');
}

function maskValue(value) {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

// Final check
if (!allVarsPresent) {
  console.error('\n❌ Error: Some required environment variables are missing');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present');

// Test MongoDB connection if MONGO_URI is set and looks valid
if (process.env.MONGO_URI && 
    (process.env.MONGO_URI.startsWith('mongodb://') || 
     process.env.MONGO_URI.startsWith('mongodb+srv://'))) {
  console.log('\nTesting MongoDB connection...');
  const mongoose = require('mongoose');
  
  // Set a timeout for the connection attempt
  const connectionTimeout = 5000; // 5 seconds
  const connectionPromise = mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: connectionTimeout
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Connection timed out after ${connectionTimeout}ms`));
    }, connectionTimeout);
  });

  Promise.race([connectionPromise, timeoutPromise])
    .then(() => {
      console.log('✅ Successfully connected to MongoDB');
      return mongoose.connection.close();
    })
    .catch(err => {
      console.warn('⚠️  Could not connect to MongoDB:', err.message);
      console.log('This is not critical for local development, but will be required in production');
    });
} else if (process.env.MONGO_URI) {
  console.warn('\n⚠️  MONGO_URI does not start with mongodb:// or mongodb+srv://');
}

// Test OpenAI API key if OPENAI_API_KEY is set
if (process.env.OPENAI_API_KEY) {
  console.log('\nTesting OpenAI API key...');
  const OpenAI = require('openai');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  openai.models.list()
    .then(() => {
      console.log('✅ OpenAI API key is valid');
    })
    .catch(err => {
      console.error('❌ OpenAI API error:', err.message);
      console.log('This could be due to an invalid API key or network issues');
      // Don't fail the test for OpenAI as it's not critical for local dev
    });
}
