const { MongoMemoryServer } = require('mongodb-memory-server');

// Create MongoDB Memory Server instance
let mongod = null;
let uri = null;

module.exports = {
  // Start MongoDB Memory Server and get URI
  getMongodUri: async () => {
    if (!mongod) {
      mongod = await MongoMemoryServer.create();
      uri = await mongod.getUri();
    }
    return uri;
  },
  // Stop MongoDB Memory Server
  stopMongod: async () => {
    if (mongod) {
      await mongod.stop();
      mongod = null;
      uri = null;
    }
  },
  
  // Test environment variables
  NODE_ENV: 'test',
  
  // Sample campaign data for testing
  sampleCampaign: {
    name: 'Test Campaign',
    description: 'Integration test campaign',
    startDate: new Date('2025-07-01'),
    endDate: new Date('2025-07-31')
  }
};
