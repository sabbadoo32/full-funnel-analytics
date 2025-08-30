// Load credential manager (handles environment variables)
const credentialManager = require('./helpers/credentialManager');

// Require dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Require routes
const campaignRoutes = require('./routes/campaigns');
const chatgptRoutes = require('./routes/chatgpt');

// Log application startup
console.log('Starting Full Funnel API server...');

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const { uri: MONGO_URI } = credentialManager.getMongoDBCredentials();

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Log successful startup
console.log('All credentials loaded successfully');
console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`API available at http://localhost:${PORT}`);
console.log('Routes: /campaigns, /chatgpt');

app.use('/campaigns', campaignRoutes);
app.use('/chatgpt', chatgptRoutes);
