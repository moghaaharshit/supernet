const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const SYSTEM_PROMPT = `You are a helpful WhatsApp auto-reply assistant. 
Your job is to respond to incoming messages in a friendly, concise, and helpful manner.
Keep your responses short and natural, as if you're texting on WhatsApp.
Do not use markdown formatting. Keep it simple and conversational.
If you don't understand the message, respond politely asking for clarification.`;

/**
 * Generate an AI reply using Gemini API
 * @param {string} incomingMessage - The incoming WhatsApp message
 * @returns {Promise<string>} - The generated reply
 */
async function generateAIReply(incomingMessage) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT + '\n\nUser message: ' + incomingMessage }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Gemini] API Error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    throw new Error('Invalid response format from Gemini API');
  } catch (error) {
    console.error('[Gemini] Error generating reply:', error.message);
    return null; // Return null on error so caller can handle
  }
}

module.exports = { generateAIReply };
