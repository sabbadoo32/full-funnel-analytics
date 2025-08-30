/**
 * Credential Manager
 * 
 * A centralized system for managing credentials across the application.
 * This module provides consistent access to credentials for:
 * - OpenAI API
 * - MongoDB
 * - GitHub
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Paths to check for environment files
const ENV_PATHS = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];

// Cache for credentials
let credentialCache = {};

/**
 * Initialize the credential manager
 * Loads environment variables from the first available .env file
 */
function initialize() {
  // Try to load from each potential path
  for (const envPath of ENV_PATHS) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading credentials from ${envPath}`);
      dotenv.config({ path: envPath });
      break;
    }
  }

  // Cache credentials for faster access
  cacheCredentials();
}

/**
 * Cache credentials in memory
 */
function cacheCredentials() {
  credentialCache = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    api: {
      key: process.env.OPENAI_API_KEY || process.env.API_KEY || 'full-funnel-api-key-default'
    },
    mongodb: {
      uri: process.env.MONGO_URI
    },
    github: {
      token: process.env.GITHUB_TOKEN
    }
  };

  // Log credential availability (not the actual values)
  console.log('Credential availability:', {
    openai: credentialCache.openai.apiKey ? 'Available' : 'Missing',
    api: credentialCache.api.key ? 'Available' : 'Missing',
    mongodb: credentialCache.mongodb.uri ? 'Available' : 'Missing',
    github: credentialCache.github.token ? 'Available' : 'Missing'
  });
}

/**
 * Get OpenAI credentials
 * @returns {Object} OpenAI credentials
 */
function getOpenAICredentials() {
  if (!credentialCache.openai.apiKey) {
    console.error('ERROR: OpenAI API key not found. Please set OPENAI_API_KEY in your .env file');
  }
  return credentialCache.openai;
}

/**
 * Get MongoDB credentials
 * @returns {Object} MongoDB credentials
 */
function getMongoDBCredentials() {
  if (!credentialCache.mongodb.uri) {
    console.error('ERROR: MongoDB URI not found. Please set MONGO_URI in your .env file');
  }
  return credentialCache.mongodb;
}

/**
 * Get GitHub credentials
 * @returns {Object} GitHub credentials
 */
function getGitHubCredentials() {
  if (!credentialCache.github.token) {
    console.error('ERROR: GitHub token not found. Please set GITHUB_TOKEN in your .env file');
  }
  return credentialCache.github;
}

// Initialize on module load
initialize();

/**
 * Get API credentials
 * @returns {Object} API credentials
 */
function getAPICredentials() {
  return credentialCache.api;
}

module.exports = {
  getOpenAICredentials,
  getMongoDBCredentials,
  getGitHubCredentials,
  getAPICredentials,
  initialize // Exposed for testing or manual reinitialization
};
