import storage from './shared-storage.js';

function checkWinner(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] !== 'null' && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return null;
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
      const { position, playerId } = req.body;
      
      // Extract sessionCode from URL path
      const sessionCode = req.url.split('/').slice(-2)[0]; // Get session code from URL
      
      const session = storage.get(sessionCode);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Validate it's the correct player's turn
      const isHost = session.hostPlayerId === playerId;
      const isGuest = session.guestPlayerId === playerId;
      
      if (!isHost && !isGuest) {
        return res.status(403).json({ message: 'Not a player in this session' });
      }

      const expectedPlayer = session.currentPlayer;
      const actualPlayer = isHost ? 'X' : 'O';
      
      if (expectedPlayer !== actualPlayer) {
        return res.status(400).json({ message: 'Not your turn' });
      }

      const gameBoard = session.gameBoard.split(',');
      
      // Validate move
      if (gameBoard[position] !== 'null') {
        return res.status(400).json({ message: 'Position already taken' });
      }

      gameBoard[position] = expectedPlayer;
      
      // Check for win/draw
      const winner = checkWinner(gameBoard);
      const isDraw = !winner && gameBoard.every(cell => cell !== 'null');
      
      const updates = {
        gameBoard: gameBoard.join(','),
        currentPlayer: expectedPlayer === 'X' ? 'O' : 'X',
        updatedAt: new Date()
      };
      
      if (winner || isDraw) {
        updates.gameStatus = 'finished';
        updates.winner = winner || 'draw';
        
        // Update scores
        if (winner === 'X') {
          updates.hostScore = session.hostScore + 1;
        } else if (winner === 'O') {
          updates.guestScore = session.guestScore + 1;
        } else {
          updates.draws = session.draws + 1;
        }
      }
      
      // Update session
      const updatedSession = { ...session, ...updates };
      storage.set(sessionCode, updatedSession);
      
      res.json(updatedSession);
    } catch (error) {
      console.error('Error making move:', error);
      res.status(500).json({ message: 'Failed to make move' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}