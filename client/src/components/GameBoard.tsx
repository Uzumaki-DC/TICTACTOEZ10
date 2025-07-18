import { GameSession } from "@shared/schema";

interface GameBoardProps {
  gameBoard: (string | null)[];
  currentPlayer: 'X' | 'O';
  gameStatus: 'playing' | 'finished';
  onCellClick: (index: number) => void;
  onReset: () => void;
  onExit: () => void;
  isMultiplayer: boolean;
  isHost: boolean;
  session: GameSession | null;
}

export function GameBoard({ 
  gameBoard, 
  currentPlayer, 
  gameStatus, 
  onCellClick, 
  onReset, 
  onExit, 
  isMultiplayer, 
  isHost, 
  session 
}: GameBoardProps) {
  const getPlayerName = (player: 'X' | 'O') => {
    if (!isMultiplayer) {
      return player === 'X' ? 'You' : 'AI';
    }
    
    if (isHost) {
      return player === 'X' ? 'You (Host)' : 'Opponent';
    } else {
      return player === 'X' ? 'Host' : 'You';
    }
  };

  const getStatusMessage = () => {
    if (gameStatus === 'finished') {
      return 'Game Over';
    }
    
    if (isMultiplayer) {
      if (session?.gameStatus === 'waiting') {
        return 'Waiting for opponent...';
      }
      
      const isMyTurn = (isHost && currentPlayer === 'X') || (!isHost && currentPlayer === 'O');
      return isMyTurn ? 'Your Turn' : 'Opponent\'s Turn';
    }
    
    return `Player ${currentPlayer}'s Turn`;
  };

  return (
    <div className="max-w-lg mx-auto mb-4">
      {/* Game Status */}
      <div className="text-center mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-center">
            <div className="text-xl font-orbitron font-bold text-cyber-cyan">PLAYER X</div>
            <div className="text-xs text-gray-400">{getPlayerName('X')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-orbitron text-cyber-yellow">VS</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-orbitron font-bold text-cyber-red">PLAYER O</div>
            <div className="text-xs text-gray-400">{getPlayerName('O')}</div>
          </div>
        </div>
        <div className="bg-dark-purple rounded-lg p-3 border border-cyber-cyan">
          <div className="text-base font-orbitron font-bold text-cyber-cyan neon-text">
            {getStatusMessage()}
          </div>
        </div>
      </div>

      {/* Tic Tac Toe Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {gameBoard.map((cell, index) => (
          <div 
            key={index}
            className={`grid-cell aspect-square rounded-lg cursor-pointer flex items-center justify-center text-4xl md:text-5xl font-orbitron font-black ${
              cell && gameStatus === 'finished' ? 'winning' : ''
            }`}
            onClick={() => onCellClick(index)}
          >
            {cell && (
              <span className={`neon-text ${cell === 'X' ? 'text-cyber-cyan' : 'text-cyber-red'}`}>
                {cell}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Game Controls */}
      <div className="flex justify-center space-x-4">
        <button 
          className="cyber-button px-4 py-2 rounded-lg font-inter font-semibold text-sm"
          onClick={onReset}
        >
          <i className="fas fa-redo mr-2"></i>New Game
        </button>
        <button 
          className="cyber-button px-4 py-2 rounded-lg font-inter font-semibold text-sm"
          onClick={onExit}
        >
          <i className="fas fa-home mr-2"></i>Main Menu
        </button>
      </div>
    </div>
  );
}
