const sqlite3 = require('sqlite3').verbose();
const config = require('./config/config'); // Adjust path if necessary

const db = new sqlite3.Database(config.databasePath);

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS approved_users (
    user_id TEXT PRIMARY KEY
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    reddit_username TEXT,
    api_keys TEXT,
    stats TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subreddits (
    name TEXT PRIMARY KEY,
    description TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS promotion_links (
    url TEXT PRIMARY KEY,
    keywords TEXT
  )`);
});

// Check if a user is approved
function isUserApproved(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT user_id FROM approved_users WHERE user_id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
}

// Approve a user
function approveUser(userId) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO approved_users (user_id) VALUES (?)', [userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Get all workers
function getAllWorkers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, reddit_username FROM workers', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Get worker details
function getWorkerDetails(workerId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM workers WHERE id = ?', [workerId], (err, row) => {
      if (err) reject(err);
      else resolve(row || {});
    });
  });
}

// Get all subreddits
function getAllSubreddits() {
  return new Promise((resolve, reject) => {
    db.all('SELECT name, description FROM subreddits', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Get all promotion links
function getAllPromotionLinks() {
  return new Promise((resolve, reject) => {
    db.all('SELECT url, keywords FROM promotion_links', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  isUserApproved,
  approveUser,
  getAllWorkers,
  getWorkerDetails,
  getAllSubreddits,
  getAllPromotionLinks,
};
