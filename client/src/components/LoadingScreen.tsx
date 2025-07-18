export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-dark-navy flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-6xl mb-8">
          <i className="fas fa-satellite-dish text-cyber-cyan animate-spin"></i>
        </div>
        <h2 className="font-orbitron text-2xl font-bold mb-4 text-cyber-cyan neon-text">
          ESTABLISHING CONNECTION
        </h2>
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="text-gray-400 font-inter">Please wait while we sync with your opponent...</p>
      </div>
    </div>
  );
}
