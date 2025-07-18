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
      const { guestPlayerId } = req.body;
      
      if (!guestPlayerId) {
        return res.status(400).json({ message: 'Guest player ID is required' });
      }
      
      // Extract sessionCode from URL path
      const sessionCode = req.url.split('/').slice(-2)[0]; // Get session code from URL
      
      if (!sessionCode) {
        return res.status(400).json({ message: 'Session code is required' });
      }
      
      console.log('Joining session:', sessionCode);
      console.log('All sessions:', storage.getAll());
      
      const session = storage.get(sessionCode);
      if (!session) {
        console.log('Session not found:', sessionCode);
        return res.status(404).json({ message: 'Session not found' });
      }
      
      if (session.guestPlayerId) {
        return res.status(400).json({ message: 'Session is full' });
      }
      
      session.guestPlayerId = guestPlayerId;
      session.gameStatus = 'playing';
      session.updatedAt = new Date();
      
      storage.set(sessionCode, session);
      console.log('Updated session:', session);
      
      res.json(session);
    } catch (error) {
      console.error('Error joining session:', error);
      res.status(500).json({ message: 'Failed to join session' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}