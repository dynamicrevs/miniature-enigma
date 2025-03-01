const express = require('express');
const router = express.Router();
const workerService = require('../services/workerService');
const taskService = require('../services/taskService');
const engagementService = require('../services/engagementService');

// Register a new Worker
router.post('/register', (req, res) => {
  const { workerId } = req.body;
  if (!workerId) return res.status(400).send('Worker ID required');
  workerService.registerWorker(workerId);
  res.status(200).send('Worker registered successfully');
});

// Fetch tasks for a Worker
router.get('/tasks', (req, res) => {
  const { workerId } = req.query;
  if (!workerId) return res.status(400).send('Worker ID required');
  const tasks = taskService.getTasksForWorker(workerId);
  res.json(tasks);
});

// Report Worker status
router.post('/status', (req, res) => {
  const { workerId, status, data } = req.body;
  if (!workerId || !status) return res.status(400).send('Worker ID and status required');
  workerService.updateStatus(workerId, status, data);
  res.status(200).send('Status updated successfully');
});

// Report engagement data
router.post('/engagement', (req, res) => {
  const { workerId, engagement } = req.body;
  if (!workerId || !engagement) return res.status(400).send('Worker ID and engagement data required');
  engagementService.recordEngagement(workerId, engagement);
  res.status(200).send('Engagement recorded successfully');
});

module.exports = router;
