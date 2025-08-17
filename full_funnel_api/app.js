const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const metaRoutes = require('./routes/meta');
const gaRoutes = require('./routes/ga');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/meta', metaRoutes);
app.use('/api/v1/ga', gaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  });
});

module.exports = app;
