
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const workerRoutes = require('./routes/worker');
const telegramRoutes = require('./routes/telegram');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Controller is running'));
app.use('/worker', workerRoutes);
app.use('/telegram', telegramRoutes);

app.listen(config.port, () => {
  console.log(`Controller running on port ${config.port}`);
});
