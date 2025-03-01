require('dotenv').config();

module.exports = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramGroupId: process.env.TELEGRAM_GROUP_ID,
  renderApiKey: process.env.RENDER_API_KEY,
  databasePath: process.env.DATABASE_PATH || './database/sqlite.db',
  port: process.env.PORT || 3000,
  workerTimeout: 3600000, // 1 hour in milliseconds
  reportInterval: 604800000, // 7 days in milliseconds
};
