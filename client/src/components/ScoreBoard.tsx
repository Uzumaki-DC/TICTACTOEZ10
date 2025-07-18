interface ScoreBoardProps {
  scores: {
    player1: number;
    player2: number;
    draws: number;
  };
}

export function ScoreBoard({ scores }: ScoreBoardProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-dark-purple rounded-xl p-4 border border-cyber-cyan">
        <h3 className="font-orbitron text-lg font-bold text-center mb-4 text-cyber-cyan">SCORE BOARD</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-dark-navy rounded-lg p-3 border border-cyber-green">
            <div className="text-xl font-orbitron font-bold text-cyber-green neon-text">
              {scores.player1}
            </div>
            <div className="text-xs text-gray-400 font-inter">Player X</div>
          </div>
          <div className="bg-dark-navy rounded-lg p-3 border border-cyber-yellow">
            <div className="text-xl font-orbitron font-bold text-cyber-yellow neon-text">
              {scores.draws}
            </div>
            <div className="text-xs text-gray-400 font-inter">Draws</div>
          </div>
          <div className="bg-dark-navy rounded-lg p-3 border border-cyber-red">
            <div className="text-xl font-orbitron font-bold text-cyber-red neon-text">
              {scores.player2}
            </div>
            <div className="text-xs text-gray-400 font-inter">Player O</div>
          </div>
        </div>
      </div>
    </div>
  );
}
