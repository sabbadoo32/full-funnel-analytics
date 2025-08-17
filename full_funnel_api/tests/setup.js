// Mock environment variables for testing
process.env.META_ACCESS_TOKEN = 'test_meta_token';
process.env.META_API_VERSION = 'v17.0';
process.env.GA_PROPERTY_ID = 'test_property_id';
process.env.GA_CLIENT_EMAIL = 'test@example.com';
process.env.GA_PRIVATE_KEY = 'test_private_key';

// Silence MongoDB connection warnings during tests
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Create a shared Map for caching between tests
const mockCache = new Map();

// Mock node-cache with a working implementation
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn((key) => {
      console.log('Cache GET:', key);
      const value = mockCache.get(key);
      console.log('Cache value:', value);
      return value;
    }),
    set: jest.fn((key, value) => {
      console.log('Cache SET:', key);
      console.log('Cache value:', value);
      mockCache.set(key, value);
      return true;
    }),
    del: jest.fn(key => mockCache.delete(key)),
    keys: jest.fn(() => Array.from(mockCache.keys())),
    clear: jest.fn(() => mockCache.clear())
  }));
});

// Export mockCache for test files to use
module.exports = { mockCache };
