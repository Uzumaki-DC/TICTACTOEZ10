import { useEffect, useState, useCallback } from 'react';

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new MessageEvent('message', { data: event.data }));
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  const joinSession = useCallback((sessionCode: string, playerId: string) => {
    sendMessage({
      type: 'join_session',
      sessionCode,
      playerId
    });
  }, [sendMessage]);

  return {
    isConnected,
    sendMessage,
    joinSession
  };
}
