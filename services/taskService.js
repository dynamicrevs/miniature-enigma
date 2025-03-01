const sqlite3 = require('sqlite3').verbose();
const config = require('../config/config');

const db = new sqlite3.Database(config.databasePath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    workerId TEXT,
    status TEXT DEFAULT 'pending'
  )`);
});

const taskService = {
  addSubreddit: (subreddit) => {
    db.run(`INSERT INTO tasks (type, data) VALUES ('subreddit', ?)`, [subreddit]);
  },
  addLink: (link, keywords) => {
    const data = JSON.stringify({ link, keywords });
    db.run(`INSERT INTO tasks (type, data) VALUES ('link', ?)`, [data]);
  },
  getTasksForWorker: (workerId) => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, type, data FROM tasks WHERE status = 'pending' LIMIT 5`, (err, rows) => {
        if (err) reject(err);
        const tasks = rows.map(row => ({ id: row.id, type: row.type, data: JSON.parse(row.data) }));
        if (tasks.length) {
          const taskIds = tasks.map(t => t.id);
          db.run(`UPDATE tasks SET workerId = ?, status = 'assigned' WHERE id IN (${taskIds.join(',')})`, [workerId]);
        }
        resolve(tasks);
      });
    });
  },
};

module.exports = taskService;
