interface MultiplayerOptionsProps {
  onHostSession: () => void;
  onJoinSession: () => void;
  onBack: () => void;
}

export function MultiplayerOptions({ onHostSession, onJoinSession, onBack }: MultiplayerOptionsProps) {
  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Host Session */}
        <div 
          className="cyber-button rounded-xl p-6 text-center cursor-pointer"
          onClick={onHostSession}
        >
          <div className="text-4xl mb-4">
            <i className="fas fa-broadcast-tower text-cyber-cyan"></i>
          </div>
          <h3 className="font-orbitron text-xl font-bold mb-3 text-cyber-cyan">HOST SESSION</h3>
          <p className="text-gray-300 font-inter text-sm">Create a new game session</p>
        </div>

        {/* Join Session */}
        <div 
          className="cyber-button rounded-xl p-6 text-center cursor-pointer"
          onClick={onJoinSession}
        >
          <div className="text-4xl mb-4">
            <i className="fas fa-plug text-cyber-green"></i>
          </div>
          <h3 className="font-orbitron text-xl font-bold mb-3 text-cyber-green">JOIN SESSION</h3>
          <p className="text-gray-300 font-inter text-sm">Enter session code to join</p>
        </div>
      </div>
      
      <div className="text-center">
        <button 
          className="cyber-button px-6 py-3 rounded-lg font-inter font-semibold"
          onClick={onBack}
        >
          <i className="fas fa-arrow-left mr-2"></i>Back to Menu
        </button>
      </div>
    </div>
  );
}
