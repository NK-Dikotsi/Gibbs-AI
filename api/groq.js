// /api/groq.js - UPDATED VERSION
// Add this line at the top if not already present
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const keyIndex = parseInt(req.query.keyIndex || '0');
    
    // Get API keys from environment
    const API_KEYS = [
      process.env.GROQ_API1,
      process.env.GROQ_API2,
      process.env.GROQ_API3
    ].filter(Boolean);
    
    const apiKey = API_KEYS[keyIndex % API_KEYS.length];
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Using API key index:', keyIndex, 'Model:', req.body?.model);
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Pass through rate limit/unauthorized errors
    if (groqResponse.status === 429 || groqResponse.status === 401) {
      return res.status(groqResponse.status).json({ 
        error: 'Rate limit or auth error' 
      });
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const data = await groqResponse.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};