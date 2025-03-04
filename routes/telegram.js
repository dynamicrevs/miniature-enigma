const express = require('express');
const router = express.Router();
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const taskService = require('../services/taskService');
const engagementService = require('../services/engagementService');
const workerService = require('../services/workerService');
const axios = require('axios');
const database = require('../database');


// Handle callback queries (e.g., button presses)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('approve_')) {
    const targetUserId = data.split('_')[1];
    await database.approveUser(targetUserId);
    bot.sendMessage(chatId, `User ${targetUserId} has been approved.`);
    bot.sendMessage(targetUserId, 'You have been granted access to the bot.');
  } else if (data.startsWith('deny_')) {
    const targetUserId = data.split('_')[1];
    bot.sendMessage(chatId, `User ${targetUserId} access request denied.`);
    bot.sendMessage(targetUserId, 'Your access request has been denied.');
  } else if (data.startsWith('worker_')) {
    const workerId = data.split('_')[1];
    const worker = await database.getWorkerDetails(workerId);
    bot.sendMessage(chatId, formatWorkerDetails(worker));
  }
});


const bot = new TelegramBot(config.telegramBotToken, { polling: true, cancelation: true });
const admins = ['@Unknownrats', '@Bharathbhushanc'];

let cloningState = {}; // Track users in the cloning process

// Helper function to ask for the next credential during cloning
const askNextCredential = (chatId, userId, currentStep) => {
  const steps = [
    { key: 'Reddit_Username', question: 'Please provide the Reddit username:' },
    { key: 'Reddit_Password', question: 'Now, provide the Reddit password:' },
    { key: 'Reddit_Client_ID', question: 'Next, provide the Reddit Client ID:' },
    { key: 'Reddit_Client_Secret', question: 'Then, provide the Reddit Client Secret:' },
    { key: 'HuggingFace_API_Key', question: 'Please provide the Hugging Face API key:' },
    { key: 'Capmonster_API_Key', question: 'Now, provide the Capmonster API key:' },
    { key: 'Twocaptcha_API_Key', question: 'Next, provide the 2Captcha API key:' },
    { key: 'Anticaptcha_API_Key', question: 'Then, provide the AntiCaptcha API key:' },
    { key: 'Deathbycaptcha_API_Key', question: 'Now, provide the DeathByCaptcha API key:' },
    { key: 'Solvecaptcha_API_Key', question: 'Next, provide the SolveCaptcha API key:' },
    { key: 'Azcaptcha_API_Key', question: 'Then, provide the AZCaptcha API key:' },
    { key: 'Render_API_Key', question: 'Finally, provide the Render API key for this Worker:' },
  ];

  if (currentStep < steps.length) {
    bot.sendMessage(chatId, steps[currentStep].question);
    cloningState[userId].step = currentStep + 1;
  } else {
    // All credentials collected, deploy the Worker
    const creds = cloningState[userId].creds;
    const workerId = `worker-${Date.now()}`;
    try {
      deployNewWorker(workerId, creds);
      bot.sendMessage(chatId, `Worker ${workerId} has been cloned and deployed successfully!`);
    } catch (error) {
      bot.sendMessage(chatId, `Failed to deploy Worker: ${error.message}`);
    }
    delete cloningState[userId]; // Clear the cloning state
  }
};

// Handle all incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Skip non-text messages
  if (!msg.text) {
    console.log('Received non-text message:', msg); // Optional debug log
    return;
  }

  const text = msg.text.trim();

  // Handle private messages (PMs)
  if (msg.chat.type === 'private') {
    if (await database.isUserApproved(userId)) {
      handleCommand(msg); // Process commands if approved
    } else {
      const requestMessage = `User ${msg.from.username || userId} requested access to the bot.`;
      bot.sendMessage(config.telegramGroupId, requestMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Approve', callback_data: `approve_${userId}` }],
            [{ text: 'Deny', callback_data: `deny_${userId}` }],
          ],
        },
      });
      bot.sendMessage(chatId, 'Your access request has been sent to the admin group. Please wait.');
    }
    return;
  }

  // Handle group messages
  if (chatId != config.telegramGroupId) return; // Restrict to specific group

  // Handle cloning process if user is in the middle of it
  if (cloningState[userId]) {
    const currentStep = cloningState[userId].step;
    const steps = [
      'Reddit_Username', 'Reddit_Password', 'Reddit_Client_ID', 'Reddit_Client_Secret',
      'HuggingFace_API_Key', 'Capmonster_API_Key', 'Twocaptcha_API_Key', 'Anticaptcha_API_Key',
      'Deathbycaptcha_API_Key', 'Solvecaptcha_API_Key', 'Azcaptcha_API_Key', 'Render_API_Key'
    ];
    cloningState[userId].creds[steps[currentStep - 1]] = text;
    askNextCredential(chatId, userId, currentStep);
    return;
  }

  // Command handling for group messages
  handleCommand(msg);
});

// Command handler function
async function handleCommand(msg) {
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const command = text.split(' ')[0].toLowerCase().split('@')[0]; // Remove @botname if present

  switch (command) {
    case '/add_sub':
      bot.sendMessage(chatId, 'Please provide the subreddit name and description in this format: "subreddit: description"');
      break;

    case '/add_sub': // This case is redundant but kept for clarity; handled by text.startsWith below
      if (text.startsWith('/add_sub ')) {
        const subParts = text.split(' ').slice(1).join(' ').split(':').map(s => s.trim());
        const subreddit = subParts[0];
        const description = subParts[1];
        if (!subreddit || !description) {
          bot.sendMessage(chatId, 'Invalid format. Use: "/add_sub subreddit: description"');
        } else {
          taskService.addSubreddit(subreddit, description);
          bot.sendMessage(chatId, `Subreddit "${subreddit}" added with description: "${description}"`);
        }
      }
      break;

    case '/start':
      bot.sendMessage(chatId, "Hey there! I'm your friendly Reddit Super Manager Bot, ready to help you manage your Reddit activities. What can I do for you?");
      break;

    case '/add_link':
      bot.sendMessage(chatId, 'Please provide the link and keywords in this format: "https://example.com, keyword1, keyword2"');
      break;

    case '/add_link': // Redundant but kept; handled by text.startsWith below
      if (text.startsWith('/add_link ')) {
        const linkParts = text.split(' ').slice(1).join(' ').split(',').map(s => s.trim());
        const link = linkParts[0];
        const keywords = linkParts.slice(1).join(', ');
        if (!link || !keywords) {
          bot.sendMessage(chatId, 'Invalid format. Use: "/add_link https://example.com, keyword1, keyword2"');
        } else {
          taskService.addLink(link, keywords);
          bot.sendMessage(chatId, `Link "${link}" added with keywords: "${keywords}"`);
        }
      }
      break;

    case '/add_worker':
    case '/clone_worker':
      cloningState[msg.from.id] = { step: 0, creds: {} };
      askNextCredential(chatId, msg.from.id, 0);
      break;

    case '/delete_worker':
      bot.sendMessage(chatId, 'Please provide the Worker ID to delete, e.g., "/delete_worker worker-123"');
      break;

    case '/delete_worker': // Redundant but kept; handled by text.startsWith below
      if (text.startsWith('/delete_worker ')) {
        const workerId = text.split(' ')[1];
        if (!workerId) {
          bot.sendMessage(chatId, 'Please provide a Worker ID, e.g., "/delete_worker worker-123"');
        } else {
          try {
            await deleteWorker(workerId);
            bot.sendMessage(chatId, `Worker ${workerId} has been deleted.`);
          } catch (error) {
            bot.sendMessage(chatId, `Failed to delete Worker: ${error.message}`);
          }
        }
      }
      break;

    case '/status':
      const status = await workerService.getAllWorkerStatus();
      bot.sendMessage(chatId, `Worker Status:\n${status.join('\n') || 'No workers registered'}`);
      break;

    case '/report':
      const report = await engagementService.generateWeeklyReport();
      bot.sendMessage(chatId, report);
      break;

    case '/maintenance':
      if (!admins.includes(msg.from.username)) {
        bot.sendMessage(chatId, 'You are not authorized');
        return;
      }
      const action = text.split(' ')[1]?.toLowerCase();
      if (action === 'enable') {
        config.maintenanceMode = true; // Update to use config if your app uses it globally
        bot.sendMessage(chatId, 'Maintenance mode enabled');
      } else if (action === 'disable') {
        config.maintenanceMode = false;
        bot.sendMessage(chatId, 'Maintenance mode disabled');
      } else {
        bot.sendMessage(chatId, 'Usage: /maintenance [enable|disable]');
      }
      break;

    case '/get_worker':
      const workers = await database.getAllWorkers();
      if (workers.length === 0) {
        bot.sendMessage(chatId, 'No workers found.');
        return;
      }
      const keyboard = workers.map(worker => [{
        text: `${worker.reddit_username} (ID: ${worker.id})`,
        callback_data: `worker_${worker.id}`,
      }]);
      bot.sendMessage(chatId, 'Select a worker to view details:', {
        reply_markup: { inline_keyboard: keyboard },
      });
      break;

    case '/get_sub':
      const subreddits = await database.getAllSubreddits();
      if (subreddits.length === 0) {
        bot.sendMessage(chatId, 'No subreddits found.');
        return;
      }
      let subMessage = 'Subreddits:\n';
      subreddits.forEach(sub => {
        const shortDesc = sub.description.substring(0, 50) + (sub.description.length > 50 ? '...' : '');
        subMessage += `- /r/${sub.name}: ${shortDesc}\n`;
      });
      bot.sendMessage(chatId, subMessage);
      break;

    case '/get_promo_links':
      const links = await database.getAllPromotionLinks();
      if (links.length === 0) {
        bot.sendMessage(chatId, 'No promotion links found.');
        return;
      }
      let linkMessage = 'Promotion Links:\n';
      links.forEach(link => {
        linkMessage += `- ${link.url} (Keywords: ${link.keywords})\n`;
      });
      bot.sendMessage(chatId, linkMessage);
      break;

    default:
      bot.sendMessage(chatId, `Available commands:\n` +
        `/add_sub - Add a subreddit with description\n` +
        `/add_link - Add a promotion link with keywords\n` +
        `/add_worker - Clone a new Worker (same as /clone_worker)\n` +
        `/clone_worker - Clone a new Worker\n` +
        `/delete_worker - Delete a Worker by ID\n` +
        `/status - Check all Worker statuses\n` +
        `/maintenance - authorised only for admins\n` +
        `/report - Get weekly engagement report\n` +
        `/get_worker - Get complete list of workers\n` +
        `/get_sub - Get all the subreddits\n` +
        `/get_promo_links - Get the links being promoted\n`
      );
      break;
  }
}

// Function to deploy a new Worker
async function deployNewWorker(workerId, creds) {
  const envVars = [
    { key: 'REDDIT_USERNAME', value: creds['Reddit_Username'] },
    { key: 'REDDIT_PASSWORD', value: creds['Reddit_Password'] },
    { key: 'REDDIT_CLIENT_ID', value: creds['Reddit_Client_ID'] },
    { key: 'REDDIT_CLIENT_SECRET', value: creds['Reddit_Client_Secret'] },
    { key: 'HUGGINGFACE_API_KEY', value: creds['HuggingFace_API_Key'] },
    { key: 'CAPMONSTER_API_KEY', value: creds['Capmonster_API_Key'] },
    { key: 'TWOCAPTCHA_API_KEY', value: creds['Twocaptcha_API_Key'] },
    { key: 'ANTICAPTCHA_API_KEY', value: creds['Anticaptcha_API_Key'] },
    { key: 'DEATHBYCAPTCHA_API_KEY', value: creds['Deathbycaptcha_API_Key'] },
    { key: 'SOLVECAPTCHA_API_KEY', value: creds['Solvecaptcha_API_Key'] },
    { key: 'AZCAPTCHA_API_KEY', value: creds['Azcaptcha_API_Key'] },
    { key: 'WORKER_ID', value: workerId },
    { key: 'CONTROLLER_URL', value: 'https://miniature-enigma.onrender.com' },
  ];

  const response = await axios.post('https://api.render.com/v1/services', {
    service: {
      type: 'web_service',
      name: workerId,
      repo: 'https://github.com/dynamicrevs/worker-template', // Assuming this is the correct repo
      branch: 'main',
      envVars: envVars,
    },
  }, {
    headers: { 'Authorization': `Bearer ${creds['Render_API_Key']}` }, // Use Worker-specific Render API key
  });
  console.log(`Worker ${workerId} deployed: ${response.data.id}`);
}

bot.on('polling_error', (error) => {
  console.error('Telegram polling error:', error);
});

function formatWorkerDetails(worker) {
  return `Worker ID: ${worker.id}\n` +
         `Reddit Username: ${worker.reddit_username}\n` +
         `API Keys: ${JSON.stringify(worker.api_keys)}\n` +
         `Stats: ${JSON.stringify(worker.stats)}`;
}

// Function to delete a Worker
async function deleteWorker(workerId) {
  await axios.delete(`https://api.render.com/v1/services/${workerId}`, {
    headers: { 'Authorization': `Bearer ${config.renderApiKey}` }, // Controller’s key for deletion
  });
  console.log(`Worker ${workerId} deleted`);
}

module.exports = router;
