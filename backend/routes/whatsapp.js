const express = require('express');
const router = express.Router();
const { getStatus, logoutWhatsApp, initializeWhatsApp, sendMessage } = require('../controllers/whatsappClient');

router.get('/status', (req, res) => {
  const statusInfo = getStatus();
  res.json(statusInfo);
});

router.post('/disconnect', async (req, res) => {
  await logoutWhatsApp();
  res.json({ message: 'Disconnected successfully' });
});

router.post('/connect', (req, res) => {
  // Can be used to manually trigger init if disconnected
  const statusInfo = getStatus();
  if (statusInfo.status === 'DISCONNECTED') {
    initializeWhatsApp();
  }
  res.json({ message: 'Connection initialization triggered' });
});

// Send a custom message to a phone number
router.post('/send', async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ success: false, error: 'Phone number and message are required' });
  }

  const result = await sendMessage(phoneNumber, message);

  if (result.success) {
    res.json({ success: true, message: 'Message sent successfully' });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

module.exports = router;
