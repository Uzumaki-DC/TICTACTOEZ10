import storage from './shared-storage.js';

let sessionId = 1;

function generateSessionCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    try {
      console.log('Creating session with body:', req.body);
      const { hostPlayerId } = req.body;
      
      if (!hostPlayerId) {
        return res.status(400).json({ message: 'Host player ID is required' });
      }

      const sessionCode = generateSessionCode();
      const now = new Date();
      
      const session = {
        id: sessionId++,
        sessionCode,
        hostPlayerId,
        guestPlayerId: null,
        gameBoard: "null,null,null,null,null,null,null,null,null",
        currentPlayer: 'X',
        gameStatus: 'waiting',
        winner: null,
        hostScore: 0,
        guestScore: 0,
        draws: 0,
        createdAt: now,
        updatedAt: now,
      };
      
      storage.set(sessionCode, session);
      console.log('Created session:', session);
      console.log('All sessions:', storage.getAll());
      
      res.json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ message: 'Failed to create session', error: error.message });
    }
  } else if (req.method === 'GET') {
    // Return all sessions for debugging
    res.json(storage.getAll());
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}