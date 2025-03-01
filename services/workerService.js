const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config');

const db = new sqlite3.Database(config.databasePath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    lastUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

const workerService = {
  registerWorker: (workerId) => {
    db.run(`INSERT OR REPLACE INTO workers (id, status) VALUES (?, 'active')`, [workerId]);
  },
  updateStatus: (workerId, status, data) => {
    db.run(`UPDATE workers SET status = ?, lastUpdate = CURRENT_TIMESTAMP WHERE id = ?`, [status, workerId]);
    console.log(`Worker ${workerId} status: ${status}`, data);
  },
  getAllWorkerStatus: async () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, status, lastUpdate FROM workers`, (err, rows) => {
        if (err) reject(err);
        const status = rows.map(row => `${row.id}: ${row.status} (Last update: ${row.lastUpdate})`);
        resolve(status.length ? status : ['No workers registered']);
      });
    });
  },
};

module.exports = workerService;
