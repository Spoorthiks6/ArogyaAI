const express = require('express');
const router = express.Router();
const { sendSMS } = require('../services/twilioService');

// Test SMS endpoint
router.post('/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'Missing phoneNumber or message' 
      });
    }

    console.log(`\n📤 TEST: Sending SMS to ${phoneNumber}`);
    console.log(`   Message: ${message}`);

    const result = await sendSMS(phoneNumber, message);

    console.log(`\n✅ TEST SMS Result:`, result);

    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      result
    });
  } catch (error) {
    console.error('❌ TEST SMS Error:', error.message);
    res.status(500).json({
      error: error.message,
      details: error
    });
  }
});

module.exports = router;
