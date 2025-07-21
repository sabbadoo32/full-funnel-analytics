const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const campaignRoutes = require('./routes/campaigns');
const chatgptRoutes = require('./routes/chatgpt');

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.use('/campaigns', campaignRoutes);
app.use('/chatgpt', chatgptRoutes);
