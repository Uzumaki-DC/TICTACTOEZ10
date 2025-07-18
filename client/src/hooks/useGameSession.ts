import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { GameSession } from '@shared/schema';

export function useGameSession(sessionCode: string, playerId: string) {
  const [isWebSocketMode, setIsWebSocketMode] = useState(false);
  const queryClient = useQueryClient();

  // Check if WebSocket is available (development mode)
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const testSocket = new WebSocket(wsUrl);
      testSocket.onopen = () => {
        setIsWebSocketMode(true);
        testSocket.close();
      };
      testSocket.onerror = () => {
        setIsWebSocketMode(false);
      };
      
      // Cleanup if component unmounts quickly
      return () => {
        if (testSocket.readyState === WebSocket.CONNECTING) {
          testSocket.close();
        }
      };
    } catch (error) {
      setIsWebSocketMode(false);
    }
  }, []);

  // HTTP polling for production
  const { data: session, refetch } = useQuery<GameSession>({
    queryKey: ['/api/sessions', sessionCode],
    enabled: sessionCode !== '' && !isWebSocketMode,
    refetchInterval: isWebSocketMode ? false : 2000, // Poll every 2 seconds
    staleTime: 0, // Always fetch fresh data
  });

  // Make move mutation
  const makeMoveMutation = useMutation({
    mutationFn: async (position: number) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionCode}/move`, {
        position,
        playerId
      });
      return response.json();
    },
    onSuccess: () => {
      if (!isWebSocketMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionCode] });
      }
    }
  });

  // Reset game mutation
  const resetGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/sessions/${sessionCode}/reset`, {});
      return response.json();
    },
    onSuccess: () => {
      if (!isWebSocketMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionCode] });
      }
    }
  });

  return {
    session,
    makeMove: makeMoveMutation.mutate,
    resetGame: resetGameMutation.mutate,
    isWebSocketMode,
    refetch
  };
}