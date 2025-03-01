const express = require('express');
const router = express.Router();
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const taskService = require('../services/taskService');
const engagementService = require('../services/engagementService');
const axios = require('axios');

const bot = new TelegramBot(config.telegramBotToken, { polling: true });

// Command handlers
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (chatId != config.telegramGroupId) return;

  const text = msg.text.toLowerCase();

  if (text.startsWith('add subreddit:')) {
    const subreddit = text.split(':')[1].trim();
    taskService.addSubreddit(subreddit);
    bot.sendMessage(chatId, `Subreddit "${subreddit}" added.`);
  } else if (text.startsWith('add link:')) {
    const parts = text.split(':').slice(1).join(':').split(',').map(s => s.trim());
    const link = parts[0];
    const keywords = parts.slice(1).join(', ');
    taskService.addLink(link, keywords);
    bot.sendMessage(chatId, `Link "${link}" with keywords "${keywords}" added.`);
  } else if (text === 'status') {
    const status = await workerService.getAllWorkerStatus();
    bot.sendMessage(chatId, `Worker Status:\n${status.join('\n')}`);
  } else if (text === 'report') {
    const report = await engagementService.generateWeeklyReport();
    bot.sendMessage(chatId, report);
  } else if (text.startsWith('clone worker')) {
    const details = text.split('\n').slice(1);
    const newWorkerCreds = {};
    details.forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      newWorkerCreds[key] = value;
    });

    const required = ['Reddit_Username', 'Reddit_Password', 'Reddit_Client_ID', 'Reddit_Client_Secret', 'HuggingFace_API_Key'];
    if (!required.every(key => newWorkerCreds[key])) {
      bot.sendMessage(chatId, 'Please provide all required credentials!');
      return;
    }

    const workerId = `worker-${Date.now()}`;
    try {
      await deployNewWorker(workerId, newWorkerCreds);
      bot.sendMessage(chatId, `Worker ${workerId} cloned and deployed.`);
    } catch (error) {
      bot.sendMessage(chatId, `Failed to clone Worker: ${error.message}`);
    }
  } else {
    bot.sendMessage(chatId, 'Available commands:\n- Add subreddit: <name>\n- Add link: <url>, <keywords>\n- status\n- report\n- Clone Worker\n  Reddit_Username: <uname>\n  Reddit_Password: <pass>\n  Reddit_Client_ID: <id>\n  Reddit_Client_Secret: <secret>\n  HuggingFace_API_Key: <key>');
  }
});

async function deployNewWorker(workerId, creds) {
  const response = await axios.post('https://api.render.com/v1/services', {
    service: {
      type: 'web_service',
      name: workerId,
      repo: 'https://github.com/yourusername/worker-template.git', // Replace with your repo
      branch: 'main',
      envVars: [
        { key: 'REDDIT_USERNAME', value: creds['Reddit_Username'] },
        { key: 'REDDIT_PASSWORD', value: creds['Reddit_Password'] },
        { key: 'REDDIT_CLIENT_ID', value: creds['Reddit_Client_ID'] },
        { key: 'REDDIT_CLIENT_SECRET', value: creds['Reddit_Client_Secret'] },
        { key: 'HUGGINGFACE_API_KEY', value: creds['HuggingFace_API_Key'] },
        { key: 'WORKER_ID', value: workerId },
        { key: 'CONTROLLER_URL', value: process.env.CONTROLLER_URL || 'https://your-controller-url.com' },
      ],
    },
  }, {
    headers: { 'Authorization': `Bearer ${config.renderApiKey}` },
  });
  console.log(`Worker ${workerId} deployed: ${response.data.id}`);
}

// Weekly engagement report
setInterval(async () => {
  const report = await engagementService.generateWeeklyReport();
  bot.sendMessage(config.telegramGroupId, report);
}, config.reportInterval);

module.exports = router;
