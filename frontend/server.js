const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the API test page
app.get('/api-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-test.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`
🚀 Frontend server running at http://localhost:${PORT}
📝 API Test Interface: http://localhost:${PORT}/api-test
`);
});
