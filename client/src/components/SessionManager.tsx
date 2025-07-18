import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GameMode } from "@/pages/game";

interface SessionManagerProps {
  mode: GameMode;
  sessionCode: string;
  playerId: string;
  onSessionCreated: (code: string) => void;
  onSessionJoined: (code: string) => void;
  onBack: () => void;
  setIsLoading: (loading: boolean) => void;
}

export function SessionManager({ 
  mode, 
  sessionCode, 
  playerId, 
  onSessionCreated, 
  onSessionJoined, 
  onBack, 
  setIsLoading 
}: SessionManagerProps) {
  const [inputCode, setInputCode] = useState('');
  const { toast } = useToast();

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating session with playerId:', playerId);
      const response = await apiRequest('POST', '/api/sessions', {
        hostPlayerId: playerId
      });
      const data = await response.json();
      console.log('Session creation response:', data);
      return data;
    },
    onSuccess: (data) => {
      setIsLoading(false);
      onSessionCreated(data.sessionCode);
      toast({
        title: "Session Created",
        description: `Session code: ${data.sessionCode}`,
      });
    },
    onError: (error) => {
      console.error('Session creation error:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to create session: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', `/api/sessions/${code}/join`, {
        guestPlayerId: playerId
      });
      return response.json();
    },
    onSuccess: () => {
      setIsLoading(false);
      onSessionJoined(inputCode);
      toast({
        title: "Session Joined",
        description: "Successfully joined the game session",
      });
    },
    onError: () => {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to join session. Please check the code.",
        variant: "destructive"
      });
    }
  });

  const handleCreateSession = () => {
    setIsLoading(true);
    createSessionMutation.mutate();
  };

  const handleJoinSession = () => {
    if (inputCode.length !== 9) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid session code",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    joinSessionMutation.mutate(inputCode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    setInputCode(value);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(sessionCode);
    toast({
      title: "Copied!",
      description: "Session code copied to clipboard",
    });
  };

  if (mode === 'multiplayer-host') {
    if (sessionCode) {
      return (
        <div className="max-w-md mx-auto mb-8">
          <div className="text-center mb-8">
            <h3 className="font-orbitron text-xl font-bold mb-4 text-cyber-cyan">SESSION CODE</h3>
            <div className="code-display rounded-lg p-6 text-center animate-pulse-glow">
              <span className="font-fira text-3xl font-bold text-cyber-cyan neon-text">
                {sessionCode}
              </span>
            </div>
            <p className="text-gray-400 font-inter text-sm mt-4">Share this code with your opponent</p>
            <p className="text-cyber-yellow font-inter text-xs mt-2">Waiting for opponent to join...</p>
            <div className="mt-6 flex justify-center space-x-4">
              <button 
                className="cyber-button px-6 py-3 rounded-lg font-inter font-semibold"
                onClick={copyToClipboard}
              >
                <i className="fas fa-copy mr-2"></i>Copy Code
              </button>
              <button 
                className="cyber-button px-6 py-3 rounded-lg font-inter font-semibold"
                onClick={onBack}
              >
                <i className="fas fa-times mr-2"></i>Cancel
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="max-w-md mx-auto mb-8">
          <div className="text-center">
            <h3 className="font-orbitron text-xl font-bold mb-4 text-cyber-cyan">CREATE SESSION</h3>
            <button 
              className="cyber-button px-6 py-3 rounded-lg font-inter font-semibold mb-4"
              onClick={handleCreateSession}
              disabled={createSessionMutation.isPending}
            >
              <i className="fas fa-plus mr-2"></i>Create Session
            </button>
            <div className="mt-4">
              <button 
                className="cyber-button px-4 py-2 rounded-lg font-inter text-sm"
                onClick={onBack}
              >
                <i className="fas fa-arrow-left mr-2"></i>Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (mode === 'multiplayer-join') {
    return (
      <div className="max-w-md mx-auto mb-8">
        <div className="text-center">
          <h3 className="font-orbitron text-xl font-bold mb-4 text-cyber-green">ENTER SESSION CODE</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              className="w-full bg-dark-purple border border-cyber-green rounded-lg p-4 text-center font-fira text-lg tracking-widest text-cyber-green focus:outline-none focus:ring-2 focus:ring-cyber-green"
              placeholder="XXXX-XXXX"
              value={inputCode}
              onChange={handleInputChange}
              maxLength={9}
            />
            <div className="flex space-x-4">
              <button 
                className="flex-1 cyber-button py-3 rounded-lg font-inter font-semibold"
                onClick={handleJoinSession}
                disabled={joinSessionMutation.isPending}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>Join Session
              </button>
              <button 
                className="flex-1 cyber-button py-3 rounded-lg font-inter font-semibold"
                onClick={onBack}
              >
                <i className="fas fa-arrow-left mr-2"></i>Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
