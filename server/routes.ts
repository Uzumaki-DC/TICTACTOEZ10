import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertGameSessionSchema, updateGameSessionSchema } from "@shared/schema";
import { z } from "zod";

interface WebSocketClient extends WebSocket {
  sessionCode?: string;
  playerId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Only setup WebSocket in development environment
  // Vercel serverless functions don't support persistent WebSocket connections
  if (process.env.NODE_ENV === 'development') {
    console.log('Setting up WebSocket server for development...');
    
    // WebSocket server for real-time multiplayer
    const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    
    // Store active connections
    const connections = new Map<string, WebSocketClient[]>();

    // Helper function to broadcast to session
    function broadcastToSession(sessionCode: string, message: any, excludeClient?: WebSocketClient) {
      const clients = connections.get(sessionCode) || [];
      clients.forEach(client => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }

    // WebSocket connection handling
    wss.on('connection', (ws: WebSocketClient) => {
      console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_session':
            const { sessionCode, playerId } = message;
            ws.sessionCode = sessionCode;
            ws.playerId = playerId;
            
            // Add to connections
            if (!connections.has(sessionCode)) {
              connections.set(sessionCode, []);
            }
            connections.get(sessionCode)?.push(ws);
            
            // Get current session state
            const session = await storage.getGameSession(sessionCode);
            if (session) {
              ws.send(JSON.stringify({
                type: 'session_state',
                session
              }));
              
              // Notify other players
              broadcastToSession(sessionCode, {
                type: 'player_joined',
                playerId
              }, ws);
            }
            break;

          case 'make_move':
            const { position } = message;
            const currentSession = await storage.getGameSession(ws.sessionCode!);
            
            if (currentSession) {
              const gameBoard = currentSession.gameBoard.split(',');
              
              // Validate move
              if (gameBoard[position] === 'null') {
                gameBoard[position] = currentSession.currentPlayer;
                
                // Check for win/draw
                const winner = checkWinner(gameBoard);
                const isDraw = !winner && gameBoard.every(cell => cell !== 'null');
                
                const updates: any = {
                  gameBoard: gameBoard.join(','),
                  currentPlayer: currentSession.currentPlayer === 'X' ? 'O' : 'X',
                };
                
                if (winner || isDraw) {
                  updates.gameStatus = 'finished';
                  updates.winner = winner || 'draw';
                  
                  // Update scores
                  if (winner === 'X') {
                    updates.hostScore = currentSession.hostScore + 1;
                  } else if (winner === 'O') {
                    updates.guestScore = currentSession.guestScore + 1;
                  } else {
                    updates.draws = currentSession.draws + 1;
                  }
                }
                
                const updatedSession = await storage.updateGameSession(ws.sessionCode!, updates);
                
                // Broadcast move to all players
                broadcastToSession(ws.sessionCode!, {
                  type: 'game_update',
                  session: updatedSession
                });
              }
            }
            break;

          case 'reset_game':
            const resetSession = await storage.updateGameSession(ws.sessionCode!, {
              gameBoard: "null,null,null,null,null,null,null,null,null",
              currentPlayer: 'X',
              gameStatus: 'playing',
              winner: null
            });
            
            broadcastToSession(ws.sessionCode!, {
              type: 'game_update',
              session: resetSession
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove from connections
      if (ws.sessionCode) {
        const clients = connections.get(ws.sessionCode);
        if (clients) {
          const index = clients.indexOf(ws);
          if (index !== -1) {
            clients.splice(index, 1);
          }
          
          // Notify other players
          broadcastToSession(ws.sessionCode, {
            type: 'player_left',
            playerId: ws.playerId
          }, ws);
        }
      }
    });
  });
  } else {
    console.log('WebSocket disabled in production environment');
    console.log('Using HTTP polling for multiplayer in production');
  }

  // HTTP polling endpoints for production multiplayer
  // Get session updates for real-time polling
  app.get('/api/sessions/:sessionCode/poll', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const { lastUpdate } = req.query;
      
      const session = await storage.getGameSession(sessionCode);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check if session was updated since last poll
      const sessionUpdateTime = new Date(session.updatedAt).getTime();
      const lastUpdateTime = lastUpdate ? new Date(lastUpdate as string).getTime() : 0;
      
      if (sessionUpdateTime > lastUpdateTime) {
        res.json({ 
          session,
          hasUpdate: true 
        });
      } else {
        res.json({ 
          hasUpdate: false,
          lastChecked: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Polling error:', error);
      res.status(500).json({ error: 'Failed to poll session' });
    }
  });

  // Update session state (replaces WebSocket message handling)
  app.post('/api/sessions/:sessionCode/update', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const updates = req.body;
      
      const session = await storage.updateGameSession(sessionCode, updates);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json({ session });
    } catch (error) {
      console.error('Session update error:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  });

  // Make a move in the game
  app.post('/api/sessions/:sessionCode/move', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const { position, playerId } = req.body;
      
      const session = await storage.getGameSession(sessionCode);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Parse the game board
      const board = session.gameBoard.split(',');
      
      // Validate the move
      if (board[position] !== 'null') {
        return res.status(400).json({ error: 'Position already taken' });
      }

      // Check if it's the player's turn
      const isHost = session.hostPlayerId === playerId;
      const expectedPlayer = session.currentPlayer;
      const playerSymbol = isHost ? 'X' : 'O';
      
      if (playerSymbol !== expectedPlayer) {
        return res.status(400).json({ error: 'Not your turn' });
      }

      // Make the move
      board[position] = playerSymbol;
      const newBoard = board.join(',');
      
      // Check for winner
      const winner = checkWinner(board);
      const isDraw = !winner && board.every(cell => cell !== 'null');
      
      let updates: any = {
        gameBoard: newBoard,
        currentPlayer: playerSymbol === 'X' ? 'O' : 'X'
      };

      if (winner) {
        updates.gameStatus = 'finished';
        updates.winner = winner;
        if (winner === 'X') {
          updates.hostScore = session.hostScore + 1;
        } else {
          updates.guestScore = session.guestScore + 1;
        }
      } else if (isDraw) {
        updates.gameStatus = 'finished';
        updates.winner = 'draw';
        updates.draws = session.draws + 1;
      }

      const updatedSession = await storage.updateGameSession(sessionCode, updates);
      res.json({ session: updatedSession });
      
    } catch (error) {
      console.error('Move error:', error);
      res.status(500).json({ error: 'Failed to make move' });
    }
  });

  // Reset game
  app.post('/api/sessions/:sessionCode/reset', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      
      const updates = {
        gameBoard: "null,null,null,null,null,null,null,null,null",
        currentPlayer: 'X',
        gameStatus: 'playing',
        winner: null
      };
      
      const session = await storage.updateGameSession(sessionCode, updates);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json({ session });
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({ error: 'Failed to reset game' });
    }
  });

  // Helper function to check winner
  function checkWinner(board: string[]): string | null {
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

  // Generate unique session code
  function generateSessionCode(): string {
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

  // Test endpoint to check if server is working
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post('/api/sessions', async (req, res) => {
    try {
      console.log('Creating session with body:', req.body);
      const { hostPlayerId } = req.body;
      
      if (!hostPlayerId) {
        console.error('No hostPlayerId provided');
        return res.status(400).json({ message: 'Host player ID is required' });
      }

      const sessionCode = generateSessionCode();
      console.log('Generated session code:', sessionCode);
      
      // Directly create the session without schema validation for now
      const sessionData = {
        sessionCode,
        hostPlayerId,
        gameBoard: "null,null,null,null,null,null,null,null,null",
        currentPlayer: 'X',
        gameStatus: 'waiting',
        hostScore: 0,
        guestScore: 0,
        draws: 0
      };
      
      console.log('Session data to create:', sessionData);
      const session = await storage.createGameSession(sessionData);
      console.log('Created session:', session);
      res.json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        message: 'Failed to create session', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.post('/api/sessions/:sessionCode/join', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const { guestPlayerId } = req.body;

      if (!guestPlayerId) {
        return res.status(400).json({ message: 'Guest player ID is required' });
      }

      const session = await storage.getGameSession(sessionCode);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      if (session.guestPlayerId) {
        return res.status(400).json({ message: 'Session is full' });
      }

      // Update the session with guest player ID and set status to playing
      const currentSession = await storage.getGameSession(sessionCode);
      if (currentSession) {
        currentSession.guestPlayerId = guestPlayerId;
        currentSession.gameStatus = 'playing';
        const updatedSession = await storage.updateGameSession(sessionCode, currentSession);
        res.json(updatedSession);
      } else {
        return res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to join session' });
    }
  });

  app.get('/api/sessions/:sessionCode', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const session = await storage.getGameSession(sessionCode);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({ message: 'Failed to get session' });
    }
  });

  // HTTP polling endpoint for production
  app.post('/api/sessions/:sessionCode/move', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const { position, playerId } = req.body;
      
      const session = await storage.getGameSession(sessionCode);
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
      
      const updates: any = {
        gameBoard: gameBoard.join(','),
        currentPlayer: expectedPlayer === 'X' ? 'O' : 'X',
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
      
      const updatedSession = await storage.updateGameSession(sessionCode, updates);
      res.json(updatedSession);
    } catch (error) {
      console.error('Error making move:', error);
      res.status(500).json({ message: 'Failed to make move' });
    }
  });

  // Reset game endpoint
  app.post('/api/sessions/:sessionCode/reset', async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const resetSession = await storage.updateGameSession(sessionCode, {
        gameBoard: "null,null,null,null,null,null,null,null,null",
        currentPlayer: 'X',
        gameStatus: 'playing',
        winner: null
      });
      
      if (!resetSession) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      res.json(resetSession);
    } catch (error) {
      console.error('Error resetting game:', error);
      res.status(500).json({ message: 'Failed to reset game' });
    }
  });

  return httpServer;
}
