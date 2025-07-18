import storage from './shared-storage.js';

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
      // Extract sessionCode from URL path
      const sessionCode = req.url.split('/').slice(-2)[0]; // Get session code from URL
      
      if (!sessionCode) {
        return res.status(400).json({ message: 'Session code is required' });
      }
      
      const session = storage.get(sessionCode);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const resetSession = {
        ...session,
        gameBoard: "null,null,null,null,null,null,null,null,null",
        currentPlayer: 'X',
        gameStatus: 'playing',
        winner: null,
        updatedAt: new Date()
      };
      
      storage.set(sessionCode, resetSession);
      
      res.json(resetSession);
    } catch (error) {
      console.error('Error resetting game:', error);
      res.status(500).json({ message: 'Failed to reset game' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}