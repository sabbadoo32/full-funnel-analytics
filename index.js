const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { OpenAI } = require('openai');
const campaignsRouter = require('./routes/campaigns');
const chatRouter = require('./routes/chat');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Initialize Express
const app = express();

// Set up OpenAI
const openai = new OpenAI({ apiKey: process.env.API_KEY });

// Read instructions and columns list
const instructions = fs.readFileSync(path.join(__dirname, 'full_funnel_instructions.txt'), 'utf8');
const columnsList = JSON.parse(fs.readFileSync(path.join(__dirname, 'full_funnel_all_columns_master_list.json'), 'utf8'));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3001',                         // Local development
    'https://sabbadoo32.github.io',                 // GitHub Pages
    /^https:\/\/.*\.sites\.google\.com$/,       // Any Google Sites subdomain
    /^https:\/\/sites\.google\.com$/            // Google Sites main domain
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true                                 // Allow credentials (if needed)
}));

// Middleware
app.use(express.json());
app.set('view engine', 'ejs');

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    // Start server after successful DB connection
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.render('chat');
});

app.use('/campaigns', campaignsRouter);
app.use('/chat', chatRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});