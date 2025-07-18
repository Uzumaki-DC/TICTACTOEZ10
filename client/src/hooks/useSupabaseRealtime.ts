import { useState, useEffect, useCallback, useRef } from "react";
import { GameSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Import supabase lazily to avoid initialization issues
let supabase: any = null;

const getSupabase = async () => {
  if (!supabase) {
    try {
      const { supabase: sb } = await import("@/lib/supabase");
      supabase = sb;
    } catch (error) {
      console.error("Failed to load Supabase:", error);
    }
  }
  return supabase;
};

export function useSupabaseRealtime(sessionCode: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<
    "realtime" | "polling" | "none"
  >("none");
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // HTTP polling fallback
  const startPolling = useCallback(() => {
    if (!sessionCode || pollingIntervalRef.current) return;

    setConnectionType("polling");
    setIsConnected(true);
    console.log("Starting HTTP polling for session:", sessionCode);

    const poll = async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/sessions/${sessionCode}/poll`
        );
        const data = await response.json();

        if (data.session) {
          setSession(data.session);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval (2 seconds)
    pollingIntervalRef.current = setInterval(poll, 2000);
  }, [sessionCode]);

  // Supabase Realtime connection
  const connectRealtime = useCallback(async () => {
    if (!sessionCode) return;

    console.log("Connecting to Supabase Realtime for session:", sessionCode);

    try {
      const sb = await getSupabase();
      if (!sb) {
        console.log("Supabase not available, falling back to polling");
        startPolling();
        return;
      }

      // Create a channel for this session
      const channel = sb.channel(`session_${sessionCode}`, {
        config: {
          broadcast: { self: true },
        },
      });

      channelRef.current = channel;

      // Listen for session updates
      channel
        .on("broadcast", { event: "session_update" }, (payload) => {
          console.log("Received session update:", payload);
          if (payload.payload.session) {
            setSession(payload.payload.session);
          }
        })
        .on("broadcast", { event: "player_joined" }, (payload) => {
          console.log("Player joined:", payload);
        })
        .on("broadcast", { event: "player_left" }, (payload) => {
          console.log("Player left:", payload);
        })
        .subscribe((status) => {
          console.log("Realtime subscription status:", status);
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setConnectionType("realtime");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setIsConnected(false);
            console.log("Realtime failed, falling back to polling");
            startPolling();
          }
        });
    } catch (error) {
      console.error("Failed to connect to Supabase Realtime:", error);
      startPolling();
    }
  }, [sessionCode, startPolling]);

  // Join session function
  const joinSession = useCallback(
    async (playerId: string, code?: string) => {
      const codeToUse = code || sessionCode;
      if (!codeToUse) return;

      try {
        console.log("Joining session:", codeToUse, playerId);
        const response = await apiRequest(
          "POST",
          `/api/sessions/${codeToUse}/join`,
          {
            guestPlayerId: playerId,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSession(data);
          console.log("Successfully joined session");

          // Try to connect to realtime after successful join
          connectRealtime();
        } else {
          throw new Error("Failed to join session");
        }
      } catch (error) {
        console.error("Join session error:", error);
        throw error;
      }
    },
    [sessionCode, connectRealtime]
  );

  // Make move function
  const makeMove = useCallback(
    async (position: number, playerId: string) => {
      if (!sessionCode) return;

      try {
        const response = await apiRequest(
          "POST",
          `/api/sessions/${sessionCode}/move`,
          {
            position,
            playerId,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSession(data.session);

          // Broadcast the update via Supabase Realtime
          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "session_update",
              payload: { session: data.session },
            });
          }
        } else {
          throw new Error("Failed to make move");
        }
      } catch (error) {
        console.error("Make move error:", error);
        throw error;
      }
    },
    [sessionCode]
  );

  // Reset game function
  const resetGame = useCallback(async () => {
    if (!sessionCode) return;

    try {
      const response = await apiRequest(
        "POST",
        `/api/sessions/${sessionCode}/reset`
      );

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);

        // Broadcast the update via Supabase Realtime
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "session_update",
            payload: { session: data.session },
          });
        }
      } else {
        throw new Error("Failed to reset game");
      }
    } catch (error) {
      console.error("Reset game error:", error);
      throw error;
    }
  }, [sessionCode]);

  // Setup connection when session code changes
  useEffect(() => {
    if (!sessionCode) {
      setSession(null);
      setIsConnected(false);
      setConnectionType("none");
      return;
    }

    // Clean up previous connections
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Try Supabase Realtime first
    connectRealtime();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsConnected(false);
      setConnectionType("none");
    };
  }, [sessionCode, connectRealtime]);

  return {
    session,
    isConnected,
    connectionType,
    joinSession,
    makeMove,
    resetGame,
  };
}
