interface ConnectionStatusProps {
  isConnected: boolean;
  connectionType?: 'websocket' | 'polling' | 'none';
}

export function ConnectionStatus({ isConnected, connectionType = 'none' }: ConnectionStatusProps) {
  const getConnectionText = () => {
    if (!isConnected) return 'Disconnected';
    
    switch (connectionType) {
      case 'websocket':
        return 'WebSocket Connected';
      case 'polling':
        return 'HTTP Polling Active';
      default:
        return 'Connected';
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      <div className={`bg-dark-purple rounded-lg p-3 border ${isConnected ? 'border-cyber-green' : 'border-cyber-red'} flex items-center space-x-2`}>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`}></div>
        <span className={`font-inter text-sm ${isConnected ? 'text-cyber-green' : 'text-cyber-red'}`}>
          {getConnectionText()}
        </span>
      </div>
    </div>
  );
}
