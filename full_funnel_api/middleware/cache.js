const NodeCache = require('node-cache');

// Initialize cache with default TTL of 5 minutes and deep cloning
const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: true,
  clone: true
});

const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Generate cache key from URL and query params
    const queryString = Object.keys(req.query)
      .sort()
      .map(k => `${k}=${req.query[k]}`)
      .join('&');
    const key = `${req.path}?${queryString}`;

    // Check cache
    const cachedData = cache.get(key);
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;
    res.json = function(data) {
      // Cache successful responses
      if (res.statusCode === 200) {
        // Deep clone the data to prevent reference issues
        const clonedData = JSON.parse(JSON.stringify(data));
        cache.set(key, clonedData, ttl);
        res.set('X-Cache', 'MISS');
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Utility to clear cache for specific patterns
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = pattern ? 
    keys.filter(key => key.includes(pattern)) : 
    keys;
  
  matchingKeys.forEach(key => cache.del(key));
  return matchingKeys.length;
};

module.exports = {
  cacheMiddleware,
  clearCache
};
