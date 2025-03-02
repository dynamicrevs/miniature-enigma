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

module.exports = { recordEngagement };
