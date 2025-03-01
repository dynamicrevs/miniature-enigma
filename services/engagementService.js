const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config');
const helpers = require('../utils/helpers');

const db = new sqlite3.Database(config.databasePath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS engagement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workerId TEXT NOT NULL,
    commentId TEXT NOT NULL,
    upvotes INTEGER,
    replies INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

const engagementService = {
  recordEngagement: (workerId, engagement) => {
    db.run(`INSERT INTO engagement (workerId, commentId, upvotes, replies) VALUES (?, ?, ?, ?)`, [workerId, engagement.commentId, engagement.upvotes, engagement.replies]);
  },
  generateWeeklyReport: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT workerId, COUNT(*) as comments, SUM(upvotes) as totalUpvotes, SUM(replies) as totalReplies FROM engagement WHERE timestamp >= datetime('now', '-7 days') GROUP BY workerId`, (err, rows) => {
        if (err) reject(err);
        const report = rows.map(row => `${row.workerId}: ${row.comments} comments, ${row.totalUpvotes} upvotes, ${row.totalReplies} replies`).join('\n');
        resolve(report || 'No engagement data for the past week.');
      });
    });
  },
};

module.exports = engagementService;
