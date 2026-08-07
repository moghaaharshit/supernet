const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, isJidUser } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { db, collection, getDocs, addDoc, query, where, serverTimestamp, Timestamp, deleteDoc, doc, getDoc } = require('../firebase');
const { generateAIReply } = require('../services/gemini');
const { getAiModeCache, setAiModeCache } = require('../routes/settings');

let sock = null;
let qrCodeData = null;
let status = 'DISCONNECTED';
let userInfo = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const SESSION_DIR = path.join(__dirname, '..', 'auth_info_baileys');

const cleanStaleCache = () => {
  // Clean old wwebjs_cache if exists
  const oldCacheDir = path.join(__dirname, '..', '.wwebjs_cache');
  try {
    if (fs.existsSync(oldCacheDir)) {
      fs.rmSync(oldCacheDir, { recursive: true, force: true });
      console.log('[Session] Cleaned old wwebjs cache');
    }
  } catch (e) {
    console.error('[Session] Could not clean old cache:', e.message);
  }
};

const logAnalytics = async (type) => {
  try {
    const analyticsCol = collection(db, 'analytics');
    await addDoc(analyticsCol, { type, timestamp: serverTimestamp() });
    const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const q = query(analyticsCol, where('timestamp', '<', sevenDaysAgo));
    const oldDocs = await getDocs(q);
    await Promise.all(oldDocs.docs.map(d => deleteDoc(doc(db, 'analytics', d.id))));
  } catch (error) {
    console.error('[Analytics] Error:', error.message);
  }
};

const initializeWhatsApp = async () => {
  if (status === 'INITIALIZING' || status === 'QR_READY' || status === 'CONNECTED') {
    console.log('[WhatsApp] Already initializing/connected, skipping...');
    return;
  }

  cleanStaleCache();
  status = 'INITIALIZING';
  console.log('[WhatsApp] Initializing Baileys client...');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Super Net', 'Chrome', '120.0.0'],
      generateHighQualityLinkPreview: false,
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        status = 'QR_READY';
        reconnectAttempts = 0;
        try {
          qrCodeData = await qrcode.toDataURL(qr);
          console.log('[WhatsApp] QR Code generated');
        } catch (err) {
          console.error('[WhatsApp] QR error:', err.message);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log('[WhatsApp] Connection closed:', lastDisconnect?.error?.message || 'unknown');

        if (shouldReconnect) {
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            console.log(`[WhatsApp] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            status = 'DISCONNECTED';
            qrCodeData = null;
            userInfo = null;
            sock = null;
            setTimeout(() => {
              if (status === 'DISCONNECTED' && !sock) initializeWhatsApp();
            }, delay);
          } else {
            console.log('[WhatsApp] Max reconnect attempts reached');
            status = 'DISCONNECTED';
            reconnectAttempts = 0;
          }
        } else {
          console.log('[WhatsApp] Logged out. Session cleared.');
          status = 'DISCONNECTED';
          qrCodeData = null;
          userInfo = null;
          sock = null;
          reconnectAttempts = 0;
        }
      } else if (connection === 'open') {
        status = 'CONNECTED';
        qrCodeData = null;
        reconnectAttempts = 0;
        userInfo = {
          id: sock.user?.id,
          pushname: sock.user?.name || 'Unknown',
        };
        console.log('[WhatsApp] Connected as:', userInfo.pushname);
      }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const senderJid = msg.key.remoteJid;
        // Skip group messages - only handle DMs
        if (senderJid.endsWith('@g.us')) continue;

        // Extract message text
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.buttonsResponseMessage?.selectedButtonId ||
          msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
          '';

        if (!text || text.trim() === '') continue;

        console.log(`[Message] From ${senderJid}: "${text.substring(0, 50)}..."`);

        try {
          // Check if AI Mode is enabled (use cache if available)
          let aiModeEnabled = getAiModeCache();
          if (aiModeEnabled === null) {
            const settingsRef = doc(db, 'settings', 'aiMode');
            const settingsSnap = await getDoc(settingsRef);
            aiModeEnabled = settingsSnap.exists() && settingsSnap.data().aiModeEnabled === true;
            setAiModeCache(aiModeEnabled);
          }

          // Check for matching rules
          const q = query(collection(db, 'rules'), where('enabled', '==', true));
          const snapshot = await getDocs(q);
          const rules = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          let ruleMatched = false;

          for (const rule of rules) {
            if (!rule.keyword) continue;
            const keyword = rule.caseSensitive ? rule.keyword : rule.keyword.toLowerCase();
            const messageText = rule.caseSensitive ? text : text.toLowerCase();
            let match = false;

            switch (rule.matchType) {
              case 'exact': match = messageText === keyword; break;
              case 'contains': match = messageText.includes(keyword); break;
              case 'startsWith': match = messageText.startsWith(keyword); break;
              case 'endsWith': match = messageText.endsWith(keyword); break;
              default: match = messageText.includes(keyword);
            }

            if (match) {
              ruleMatched = true;
              await logAnalytics('received');
              const sendReply = async () => {
                try {
                  await sock.sendMessage(senderJid, { text: rule.reply });
                  console.log(`[Reply] Rule matched, sent to ${senderJid}`);
                  await logAnalytics('sent');
                } catch (e) {
                  console.error('[Reply] Error:', e.message);
                }
              };
              if (rule.delay > 0) setTimeout(sendReply, rule.delay * 1000);
              else await sendReply();
              break;
            }
          }

          // If no rule matched and AI Mode is enabled, use Gemini AI
          if (!ruleMatched && aiModeEnabled) {
            console.log(`[AI] No rule matched, generating AI reply for ${senderJid}`);
            await logAnalytics('received');

            const sendAIReply = async () => {
              try {
                const aiReply = await generateAIReply(text);
                if (aiReply) {
                  await sock.sendMessage(senderJid, { text: aiReply });
                  console.log(`[AI Reply] Sent to ${senderJid}`);
                  await logAnalytics('sent');
                } else {
                  console.log(`[AI] No reply generated for ${senderJid}`);
                }
              } catch (e) {
                console.error('[AI Reply] Error:', e.message);
              }
            };
            // Add a small delay for AI replies to seem more natural
            setTimeout(sendAIReply, 1000);
          }
        } catch (error) {
          console.error('[Message] Error:', error.message);
        }
      }
    });

    console.log('[WhatsApp] Baileys client initialized, waiting for QR...');
  } catch (err) {
    console.error('[WhatsApp] Init failed:', err.message || err);
    status = 'ERROR';
    sock = null;
  }
};

const getStatus = () => ({ status, qrCodeData, userInfo });

/**
 * Send a message to a WhatsApp number
 * @param {string} phoneNumber - The phone number to send to (with country code)
 * @param {string} message - The message to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendMessage = async (phoneNumber, message) => {
  if (!sock || status !== 'CONNECTED') {
    return { success: false, error: 'WhatsApp is not connected' };
  }

  try {
    // Format the phone number: remove spaces, dashes, parentheses
    let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Check if the number already includes country code (minimum 10 digits)
    if (formattedNumber.length < 10) {
      return { success: false, error: 'Phone number must include country code (e.g., 91XXXXXXXXXX for India)' };
    }

    // Auto-add country code for Indian numbers (10 digits without country code)
    if (formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber;
      console.log(`[SendMessage] Added country code 91 to number: ${formattedNumber}`);
    }

    // Baileys uses @s.whatsapp.net for DMs
    const jid = formattedNumber + '@s.whatsapp.net';

    // Send with retry logic
    let lastError = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await sock.sendMessage(jid, { text: message });
        console.log(`[SendMessage] Message sent to ${formattedNumber}`);
        return { success: true };
      } catch (sendError) {
        lastError = sendError;
        console.error(`[SendMessage] Attempt ${attempt + 1} failed:`, sendError.message);

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // All attempts failed
    return { success: false, error: `Failed to send message: ${lastError.message}` };
  } catch (error) {
    console.error('[SendMessage] Error:', error.message);
    return { success: false, error: error.message };
  }
};

const logoutWhatsApp = async () => {
  const sockToDestroy = sock;
  sock = null;
  status = 'DISCONNECTED';
  qrCodeData = null;
  userInfo = null;

  if (sockToDestroy) {
    try { sockToDestroy.end(undefined); } catch (e) {}
  }

  try {
    const snap = await getDocs(collection(db, 'analytics'));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'analytics', d.id))));
    console.log(`[Disconnect] Cleared ${snap.size} analytics records`);
  } catch (error) {
    console.error('[Disconnect] Analytics error:', error.message);
  }

  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      console.log('[Disconnect] Session cleared');
    }
  } catch (e) {
    console.error('[Disconnect] Session cleanup error:', e.message);
  }

  console.log('[Disconnect] Re-initializing in 5s...');
  setTimeout(() => initializeWhatsApp(), 5000);
};

module.exports = { initializeWhatsApp, getStatus, logoutWhatsApp, sendMessage };
