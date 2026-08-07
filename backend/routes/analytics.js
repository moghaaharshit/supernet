const express = require('express');
const router = express.Router();
const { db, collection, getDocs, query, where } = require('../firebase');

// Get analytics counts only (no message text stored/returned)
router.get('/', async (req, res) => {
  try {
    const analyticsCol = collection(db, 'analytics');

    const receivedQuery = query(analyticsCol, where('type', '==', 'received'));
    const sentQuery = query(analyticsCol, where('type', '==', 'sent'));

    const [receivedSnap, sentSnap] = await Promise.all([
      getDocs(receivedQuery),
      getDocs(sentQuery)
    ]);

    res.json({
      totalReceived: receivedSnap.size,
      totalSent: sentSnap.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
