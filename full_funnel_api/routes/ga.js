const express = require('express');
const router = express.Router();
const GAConnector = require('../connectors/ga');
const { validateDateRange } = require('../middleware/validation');
const { cacheMiddleware } = require('../middleware/cache');

// Initialize GA connector with config from environment
const gaConnector = new GAConnector({
  propertyId: process.env.GA_PROPERTY_ID,
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n')
  }
});

/**
 * Get real-time analytics data
 * GET /ga/realtime
 */
router.get('/realtime',
  cacheMiddleware(60), // Cache for 1 minute only since it's real-time
  async (req, res) => {
    try {
      const { metrics, dimensions } = req.query;
      
      const data = await gaConnector.getRealTimeData(
        metrics ? metrics.split(',') : undefined,
        dimensions ? dimensions.split(',') : undefined
      );
      
      res.json(data);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

/**
 * Get analytics report data
 * GET /ga/report
 */
router.get('/report',
  cacheMiddleware(300),
  validateDateRange,
  async (req, res) => {
    // Debug logging for cache test
    console.log('Request query:', req.query);
    console.log('Request path:', req.path);
    try {
      const {
        start_date,
        end_date,
        metrics,
        dimensions,
        orderBy,
        limit
      } = req.query;
      
      const data = await gaConnector.getReport({
        startDate: start_date,
        endDate: end_date,
        metrics: metrics ? metrics.split(',') : undefined,
        dimensions: dimensions ? dimensions.split(',') : undefined,
        orderBy: orderBy ? JSON.parse(orderBy) : undefined,
        limit: limit ? parseInt(limit) : undefined
      });
      
      res.json(data);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

/**
 * Get event data
 * GET /ga/events
 */
router.get('/events',
  validateDateRange,
  cacheMiddleware(300),
  async (req, res) => {
    try {
      const {
        start_date,
        end_date,
        event_names,
        dimensions
      } = req.query;
      
      const data = await gaConnector.getEvents({
        startDate: start_date,
        endDate: end_date,
        eventNames: event_names ? event_names.split(',') : undefined,
        dimensions: dimensions ? dimensions.split(',') : undefined
      });
      
      res.json(data);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

/**
 * Get conversion data
 * GET /ga/conversions
 */
router.get('/conversions',
  validateDateRange,
  cacheMiddleware(300),
  async (req, res) => {
    try {
      const {
        start_date,
        end_date,
        conversion_events,
        dimensions
      } = req.query;
      
      const data = await gaConnector.getConversions({
        startDate: start_date,
        endDate: end_date,
        conversionEvents: conversion_events ? conversion_events.split(',') : undefined,
        dimensions: dimensions ? dimensions.split(',') : undefined
      });
      
      res.json(data);
    } catch (error) {
      res.status(error.status || 500).json({ error });
    }
});

module.exports = router;
