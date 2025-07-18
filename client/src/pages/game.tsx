import { useState, useEffect } from "react";
import { GameModeSelector } from "@/components/GameModeSelector";
import { MultiplayerOptions } from "@/components/MultiplayerOptions";
import { SessionManager } from "@/components/SessionManager";
import { GameBoard } from "@/components/GameBoard";
import { ScoreBoard } from "@/components/ScoreBoard";
import { GameResultModal } from "@/components/GameResultModal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

import { useSound } from "@/hooks/useSound";
import { generateAIMove } from "@/lib/aiPlayer";
import { checkWinner, isDraw } from "@/lib/gameLogic";
import { GameSession } from "@shared/schema";

export type GameMode = 'menu' | 'single-player' | 'multiplayer-menu' | 'multiplayer-host' | 'multiplayer-join' | 'multiplayer-game';

export default function GamePage() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [gameBoard, setGameBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0, draws: 0 });
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [playerId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [session, setSession] = useState<GameSession | null>(null);
  
  const { session: realtimeSession, isConnected, connectionType, joinSession, makeMove: realtimeMakeMove, resetGame: realtimeResetGame } = useSupabaseRealtime(sessionCode);
  const { playSound } = useSound();

  // Update game state from session data (used by both WebSocket and HTTP polling)
  const updateGameFromSession = (sessionData: GameSession) => {
    setSession(sessionData);
    
    // Update game board
    const board = sessionData.gameBoard.split(',').map((cell: string) => cell === 'null' ? null : cell);
    setGameBoard(board);
    setCurrentPlayer(sessionData.currentPlayer as 'X' | 'O');
    setGameStatus(sessionData.gameStatus as 'playing' | 'finished');
    setWinner(sessionData.winner as 'X' | 'O' | 'draw' | null);
    
    // Update scores
    setScores({
      player1: sessionData.hostScore,
      player2: sessionData.guestScore,
      draws: sessionData.draws
    });
    
    if (sessionData.gameStatus === 'finished') {
      setShowResult(true);
      playSound(sessionData.winner === 'draw' ? 'draw' : 'win');
    }
  };

  // Handle real-time session updates
  useEffect(() => {
    if (realtimeSession) {
      updateGameFromSession(realtimeSession);
    }
  }, [realtimeSession, playSound]);

  const handleCellClick = (index: number) => {
    if (gameBoard[index] || gameStatus === 'finished') return;
    
    playSound('move');
    
    if (gameMode === 'single-player') {
      // Single player mode
      const newBoard = [...gameBoard];
      newBoard[index] = currentPlayer;
      setGameBoard(newBoard);
      
      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        setGameStatus('finished');
        setShowResult(true);
        setScores(prev => ({
          ...prev,
          [gameWinner === 'X' ? 'player1' : 'player2']: prev[gameWinner === 'X' ? 'player1' : 'player2'] + 1
        }));
        playSound(gameWinner === 'X' ? 'win' : 'lose');
      } else if (isDraw(newBoard)) {
        setWinner('draw');
        setGameStatus('finished');
        setShowResult(true);
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        playSound('draw');
      } else {
        setCurrentPlayer('O');
        
        // AI move
        setTimeout(() => {
          const aiMove = generateAIMove(newBoard);
          if (aiMove !== -1) {
            const aiBoard = [...newBoard];
            aiBoard[aiMove] = 'O';
            setGameBoard(aiBoard);
            
            const aiWinner = checkWinner(aiBoard);
            if (aiWinner) {
              setWinner(aiWinner);
              setGameStatus('finished');
              setShowResult(true);
              setScores(prev => ({
                ...prev,
                [aiWinner === 'X' ? 'player1' : 'player2']: prev[aiWinner === 'X' ? 'player1' : 'player2'] + 1
              }));
              playSound(aiWinner === 'X' ? 'win' : 'lose');
            } else if (isDraw(aiBoard)) {
              setWinner('draw');
              setGameStatus('finished');
              setShowResult(true);
              setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
              playSound('draw');
            } else {
              setCurrentPlayer('X');
            }
          }
        }, 500);
      }
    } else if (gameMode === 'multiplayer-game') {
      // Multiplayer mode - use real-time system
      try {
        realtimeMakeMove(index, playerId);
      } catch (error) {
        console.error('Failed to make move:', error);
        // You could show an error toast here
      }
    }
  };

  const resetGameLocal = () => {
    if (gameMode === 'multiplayer-game') {
      try {
        realtimeResetGame();
      } catch (error) {
        console.error('Failed to reset game:', error);
      }
    } else {
      setGameBoard(Array(9).fill(null));
      setCurrentPlayer('X');
      setGameStatus('playing');
      setWinner(null);
      setShowResult(false);
    }
    playSound('click');
  };

  const exitGame = () => {
    setGameMode('menu');
    setGameBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameStatus('playing');
    setWinner(null);
    setShowResult(false);
    setSessionCode('');
    setSession(null);
    playSound('click');
  };

  return (
    <div className="particle-bg min-h-screen overflow-hidden">
      <div className="container mx-auto px-4 py-4 max-h-screen">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="font-orbitron text-4xl md:text-5xl font-black text-cyber-cyan neon-text mb-2 animate-float">
            <i className="fas fa-gamepad mr-2"></i>
            TIC TAC TOE
          </h1>
          <p className="text-lg text-gray-300 font-inter">Enter the Digital Arena</p>
          <div className="w-24 h-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple mx-auto mt-2 rounded-full"></div>
        </header>

        {/* Game Mode Selection */}
        {gameMode === 'menu' && (
          <GameModeSelector
            onSelectSinglePlayer={() => {
              setGameMode('single-player');
              playSound('click');
            }}
            onSelectMultiplayer={() => {
              setGameMode('multiplayer-menu');
              playSound('click');
            }}
          />
        )}

        {/* Multiplayer Options */}
        {gameMode === 'multiplayer-menu' && (
          <MultiplayerOptions
            onHostSession={() => {
              setGameMode('multiplayer-host');
              setIsHost(true);
              playSound('click');
            }}
            onJoinSession={() => {
              setGameMode('multiplayer-join');
              setIsHost(false);
              playSound('click');
            }}
            onBack={() => {
              setGameMode('menu');
              playSound('click');
            }}
          />
        )}

        {/* Session Manager */}
        {(gameMode === 'multiplayer-host' || gameMode === 'multiplayer-join') && (
          <SessionManager
            mode={gameMode}
            sessionCode={sessionCode}
            playerId={playerId}
            onSessionCreated={async (code) => {
              setSessionCode(code);
              setGameMode('multiplayer-game');
              // Join the real-time session
              try {
                await joinSession(playerId);
              } catch (error) {
                console.error('Failed to join created session:', error);
                // Reset back to host mode if failed
                setGameMode('multiplayer-host');
                setSessionCode('');
              }
            }}
            onSessionJoined={async (code) => {
              setSessionCode(code);
              setGameMode('multiplayer-game');
              // Join the real-time session
              try {
                await joinSession(playerId);
              } catch (error) {
                console.error('Failed to join session:', error);
                // Reset back to join mode if failed
                setGameMode('multiplayer-join');
                setSessionCode('');
              }
            }}
            onBack={() => {
              setGameMode('multiplayer-menu');
              playSound('click');
            }}
            setIsLoading={setIsLoading}
          />
        )}

        {/* Game Board */}
        {(gameMode === 'single-player' || gameMode === 'multiplayer-game') && (
          <div className="flex flex-col items-center space-y-4">
            <GameBoard
              gameBoard={gameBoard}
              currentPlayer={currentPlayer}
              gameStatus={gameStatus}
              onCellClick={handleCellClick}
              onReset={resetGameLocal}
              onExit={exitGame}
              isMultiplayer={gameMode === 'multiplayer-game'}
              isHost={isHost}
              session={session}
            />
            <ScoreBoard scores={scores} />
          </div>
        )}

        {/* Modals and Status */}
        {showResult && (
          <GameResultModal
            winner={winner}
            onPlayAgain={resetGameLocal}
            onBackToMenu={exitGame}
          />
        )}

        {isLoading && <LoadingScreen />}
        
        {gameMode === 'multiplayer-game' && (
          <ConnectionStatus isConnected={isConnected} connectionType={connectionType} />
        )}
      </div>
    </div>
  );
}
