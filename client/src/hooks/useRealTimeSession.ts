import { useState, useEffect, useCallback, useRef } from 'react';
import { GameSession } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

type RealtimeMessage = {
  type: 'session_state' | 'game_update' | 'player_joined' | 'player_left';
  session?: GameSession;
  playerId?: string;
};

export function useRealTimeSession(sessionCode: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'none'>('none');
  const lastUpdateRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for development
  const connectWebSocket = useCallback(() => {
    if (!sessionCode) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionType('websocket');
        console.log('WebSocket connected for session:', sessionCode);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        // Fallback to polling if WebSocket fails
        startPolling();
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        // Fallback to polling
        startPolling();
      };
      
      ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          if (message.session) {
            setSession(message.session);
            lastUpdateRef.current = message.session.updatedAt.toString();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      startPolling();
    }
  }, [sessionCode]);

  // HTTP polling for production
  const startPolling = useCallback(() => {
    if (!sessionCode || pollingIntervalRef.current) return;

    setConnectionType('polling');
    setIsConnected(true);
    console.log('Starting HTTP polling for session:', sessionCode);

    const poll = async () => {
      try {
        const url = `/api/sessions/${sessionCode}/poll${lastUpdateRef.current ? `?lastUpdate=${encodeURIComponent(lastUpdateRef.current)}` : ''}`;
        const response = await apiRequest('GET', url);
        const data = await response.json();
        
        if (data.hasUpdate && data.session) {
          setSession(data.session);
          lastUpdateRef.current = data.session.updatedAt.toString();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    poll();
    
    // Set up polling interval (2 seconds)
    pollingIntervalRef.current = setInterval(poll, 2000);
  }, [sessionCode]);

  // Join session function
  const joinSession = useCallback(async (playerId: string) => {
    if (!sessionCode) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Use WebSocket in development
      wsRef.current.send(JSON.stringify({
        type: 'join_session',
        sessionCode,
        playerId
      }));
    } else {
      // Use HTTP API in production
      try {
        console.log('Joining session via HTTP API:', sessionCode, playerId);
        const response = await apiRequest('POST', `/api/sessions/${sessionCode}/join`, {
          guestPlayerId: playerId
        });
        
        if (response.ok) {
          const data = await response.json();
          setSession(data);
          lastUpdateRef.current = data.updatedAt.toString();
          console.log('Successfully joined session via HTTP');
          // Start polling after successful join
          startPolling();
        } else {
          throw new Error('Failed to join session');
        }
      } catch (error) {
        console.error('HTTP join session error:', error);
        throw error;
      }
    }
  }, [sessionCode, startPolling]);

  // Make move function
  const makeMove = useCallback(async (position: number, playerId: string) => {
    if (!sessionCode) return;

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Use WebSocket in development
        wsRef.current.send(JSON.stringify({
          type: 'make_move',
          sessionCode,
          playerId,
          position
        }));
      } else {
        // Use HTTP API in production
        const response = await apiRequest('POST', `/api/sessions/${sessionCode}/move`, {
          position,
          playerId
        });
        const data = await response.json();
        if (data.session) {
          setSession(data.session);
          lastUpdateRef.current = data.session.updatedAt.toString();
        }
      }
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  }, [sessionCode]);

  // Reset game function
  const resetGame = useCallback(async () => {
    if (!sessionCode) return;

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Use WebSocket in development
        wsRef.current.send(JSON.stringify({
          type: 'reset_game',
          sessionCode
        }));
      } else {
        // Use HTTP API in production
        const response = await apiRequest('POST', `/api/sessions/${sessionCode}/reset`);
        const data = await response.json();
        if (data.session) {
          setSession(data.session);
          lastUpdateRef.current = data.session.updatedAt.toString();
        }
      }
    } catch (error) {
      console.error('Error resetting game:', error);
      throw error;
    }
  }, [sessionCode]);

  // Setup connection when session code changes
  useEffect(() => {
    if (!sessionCode) {
      setSession(null);
      setIsConnected(false);
      setConnectionType('none');
      return;
    }

    // Clean up previous connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Try WebSocket first (works in development)
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsConnected(false);
      setConnectionType('none');
    };
  }, [sessionCode, connectWebSocket]);

  return {
    session,
    isConnected,
    connectionType,
    joinSession,
    makeMove,
    resetGame
  };
}