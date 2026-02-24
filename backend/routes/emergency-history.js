const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmergencyAlert = require('../models/EmergencyAlert');

// GET /emergency-history - Get all emergency alerts for user
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching emergency history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /emergency-history/:id - Get specific alert
router.get('/:id', auth, async (req, res) => {
  try {
    const alert = await EmergencyAlert.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
