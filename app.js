const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config/config');
const workerRoutes = require('../routes/worker');
const telegramRoutes = require('../routes/telegram');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => res.send('Controller is running'));

// Mount routes
app.use('/worker', workerRoutes);
app.use('/telegram', telegramRoutes);

// Keep-alive function to prevent inactivity shutdown
const keepAlive = () => {
  setInterval(() => {
    axios.get('https://miniature-enigma.onrender.com/')
      .then(() => console.log('Keep-alive ping sent successfully'))
      .catch(err => console.error('Keep-alive ping failed:', err.message));
  }, 600000); // Every 10 minutes (600,000 ms)
};

// Start keep-alive
keepAlive();

// Start the server
app.listen(config.port, () => {
  console.log(`Controller running on port ${config.port}`);
});
