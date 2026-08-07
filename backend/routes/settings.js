const express = require('express');
const router = express.Router();
const { db, collection, getDocs, doc, getDoc, setDoc } = require('../firebase');

const SETTINGS_COLLECTION = 'settings';
const AI_MODE_DOC_ID = 'aiMode';

// In-memory cache for AI mode status
let aiModeCache = null;

// Get AI Mode status
router.get('/ai-mode', async (req, res) => {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, AI_MODE_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      aiModeCache = false;
      return res.json({ aiModeEnabled: false });
    }
    
    const settingsData = settingsSnap.data();
    aiModeCache = settingsData.aiModeEnabled || false;
    res.json({ aiModeEnabled: aiModeCache });
  } catch (error) {
    console.error('[Settings] Error fetching AI mode:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle AI Mode
router.post('/ai-mode', async (req, res) => {
  try {
    const { aiModeEnabled } = req.body;
    const settingsRef = doc(db, SETTINGS_COLLECTION, AI_MODE_DOC_ID);
    
    await setDoc(settingsRef, { aiModeEnabled }, { merge: true });
    aiModeCache = aiModeEnabled;
    
    console.log(`[Settings] AI Mode ${aiModeEnabled ? 'enabled' : 'disabled'}`);
    res.json({ aiModeEnabled });
  } catch (error) {
    console.error('[Settings] Error toggling AI mode:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export cache getter for whatsappClient to use
const getAiModeCache = () => aiModeCache;
const setAiModeCache = (value) => { aiModeCache = value; };

module.exports = router;
module.exports.getAiModeCache = getAiModeCache;
module.exports.setAiModeCache = setAiModeCache;
