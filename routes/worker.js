const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

// Maintenance mode flag (in-memory)
let maintenanceMode = false;

// Enable maintenance mode
router.post('/maintenance/enable', (req, res) => {
  maintenanceMode = true;
  res.send('Maintenance mode enabled');
});

// Disable maintenance mode
router.post('/maintenance/disable', (req, res) => {
  maintenanceMode = false;
  res.send('Maintenance mode disabled');
});

// Check maintenance status
router.get('/maintenance/status', (req, res) => {
  res.json({ maintenance: maintenanceMode });
});

// Fetch tasks for a Worker
router.get('/tasks', (req, res) => {
  const { workerId } = req.query;
  if (!workerId) return res.status(400).send('Worker ID required');
  if (maintenanceMode) {
    return res.json([]); // No tasks during maintenance
  }
  const tasks = taskService.getTasksForWorker(workerId);
  res.json(tasks);
});

// Report Worker status
router.post('/status', (req, res) => {
  const { workerId, status, data } = req.body;
  if (!workerId || !status) return res.status(400).send('Worker ID and status required');
  // Add your status update logic here if needed
  res.status(200).send('Status updated successfully');
});

// Report engagement data
router.post('/engagement', (req, res) => {
  const { workerId, engagement } = req.body;
  if (!workerId || !engagement) return res.status(400).send('Worker ID and engagement data required');
  // Add your engagement recording logic here if needed
  res.status(200).send('Engagement recorded successfully');
});

module.exports = router;
