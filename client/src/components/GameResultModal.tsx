interface GameResultModalProps {
  winner: 'X' | 'O' | 'draw' | null;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameResultModal({ winner, onPlayAgain, onBackToMenu }: GameResultModalProps) {
  const getResultMessage = () => {
    if (winner === 'draw') {
      return { title: 'DRAW!', description: 'It\'s a tie! Well played by both sides.' };
    }
    if (winner === 'X') {
      return { title: 'PLAYER X WINS!', description: 'Congratulations to the winner!' };
    }
    if (winner === 'O') {
      return { title: 'PLAYER O WINS!', description: 'Congratulations to the winner!' };
    }
    return { title: 'GAME OVER', description: 'Thanks for playing!' };
  };

  const { title, description } = getResultMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-purple rounded-xl p-8 border border-cyber-cyan max-w-md w-full mx-4 text-center animate-bounce-in">
        <div className="text-6xl mb-6">
          <i className={`fas ${winner === 'draw' ? 'fa-handshake' : 'fa-trophy'} text-cyber-yellow neon-text animate-pulse-glow`}></i>
        </div>
        <h2 className="font-orbitron text-3xl font-bold mb-4 text-cyber-cyan neon-text">
          {title}
        </h2>
        <p className="text-gray-300 font-inter mb-6">
          {description}
        </p>
        <div className="flex justify-center space-x-4">
          <button 
            className="cyber-button px-6 py-3 rounded-lg font-inter font-semibold"
            onClick={onPlayAgain}
          >
            <i className="fas fa-play mr-2"></i>Play Again
          </button>
          <button 
            className="cyber-button px-6 py-3 rounded-lg font-inter font-semibold"
            onClick={onBackToMenu}
          >
            <i className="fas fa-home mr-2"></i>Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
