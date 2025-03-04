const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config'); // Adjust path to your config

const db = new sqlite3.Database(config.databasePath);

// Create the engagement table if it doesn’t exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS engagement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workerId TEXT NOT NULL,
      commentId TEXT NOT NULL,
      upvotes INTEGER,
      replies INTEGER,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Function to record engagement data
function recordEngagement(workerId, engagement) {
  const { commentId, upvotes, replies } = engagement;
  db.run(
    `INSERT INTO engagement (workerId, commentId, upvotes, replies) VALUES (?, ?, ?, ?)`,
    [workerId, commentId, upvotes, replies],
    (err) => {
      if (err) console.error(`Error recording engagement for ${workerId}: ${err}`);
    }
  );
}

// --- NEW TABLES AND FUNCTIONS BELOW ---

// Create approved_users table
db.run('CREATE TABLE IF NOT EXISTS approved_users (user_id TEXT PRIMARY KEY)');

// Create workers table
db.run(`CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  reddit_username TEXT,
  api_keys TEXT,  -- Store as JSON string
  stats TEXT      -- Store as JSON string
)`);

// Create subreddits table
db.run(`CREATE TABLE IF NOT EXISTS subreddits (
  name TEXT PRIMARY KEY,
  description TEXT
)`);

// Create promotion_links table
db.run(`CREATE TABLE IF NOT EXISTS promotion_links (
  url TEXT PRIMARY KEY,
  keywords TEXT
)`);

// Function to check if a user is approved
function isUserApproved(userId) {
  return new Promise((resolve) => {
    db.get('SELECT user_id FROM approved_users WHERE user_id = ?', [userId], (err, row) => {
      resolve(!!row);
    });
  });
}

// Function to approve a user
function approveUser(userId) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO approved_users (user_id) VALUES (?)', [userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Function to get all workers
function getAllWorkers() {
  return new Promise((resolve) => {
    db.all('SELECT id, reddit_username FROM workers', (err, rows) => {
      resolve(rows || []);
    });
  });
}

// Function to get detailed worker info
function getWorkerDetails(workerId) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM workers WHERE id = ?', [workerId], (err, row) => {
      resolve(row || {});
    });
  });
}

// Function to get all subreddits
function getAllSubreddits() {
  return new Promise((resolve) => {
    db.all('SELECT name, description FROM subreddits', (err, rows) => {
      resolve(rows || []);
    });
  });
}

// Function to get all promotion links
function getAllPromotionLinks() {
  return new Promise((resolve) => {
    db.all('SELECT url, keywords FROM promotion_links', (err, rows) => {
      resolve(rows || []);
    });
  });
}

// Export all functions
module.exports = {
  recordEngagement,
  isUserApproved,
  approveUser,
  getAllWorkers,
  getWorkerDetails,
  getAllSubreddits,
  getAllPromotionLinks,
};
