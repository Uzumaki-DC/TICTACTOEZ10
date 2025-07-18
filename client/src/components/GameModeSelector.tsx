interface GameModeSelectorProps {
  onSelectSinglePlayer: () => void;
  onSelectMultiplayer: () => void;
}

export function GameModeSelector({ onSelectSinglePlayer, onSelectMultiplayer }: GameModeSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Single Player Mode */}
        <div 
          className="cyber-button rounded-xl p-8 text-center cursor-pointer animate-slide-in"
          onClick={onSelectSinglePlayer}
        >
          <div className="text-6xl mb-4">
            <i className="fas fa-robot text-cyber-green"></i>
          </div>
          <h3 className="font-orbitron text-2xl font-bold mb-4 text-cyber-green">SINGLE PLAYER</h3>
          <p className="text-gray-300 font-inter mb-6">Challenge our advanced AI opponent</p>
          <div className="flex items-center justify-center space-x-2">
            <i className="fas fa-microchip text-cyber-green"></i>
            <span className="font-fira text-sm">AI DIFFICULTY: ADAPTIVE</span>
          </div>
        </div>

        {/* Multiplayer Mode */}
        <div 
          className="cyber-button rounded-xl p-8 text-center cursor-pointer animate-slide-in"
          onClick={onSelectMultiplayer}
        >
          <div className="text-6xl mb-4">
            <i className="fas fa-users text-cyber-purple"></i>
          </div>
          <h3 className="font-orbitron text-2xl font-bold mb-4 text-cyber-purple">MULTIPLAYER</h3>
          <p className="text-gray-300 font-inter mb-6">Host or join a session with friends</p>
          <div className="flex items-center justify-center space-x-2">
            <i className="fas fa-wifi text-cyber-purple"></i>
            <span className="font-fira text-sm">REAL-TIME SYNC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
