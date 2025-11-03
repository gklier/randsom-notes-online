// --- client/src/LobbyScreen.jsx ---

function LobbyScreen({ socket, gameData }) {
  
  // Check if the current user is the host
  const isHost = socket.id === gameData.hostId;

  const handleStartGame = () => {
    socket.emit('startGame', { pin: gameData.pin });
  };

  return (
    <div>
      <h2>Game Lobby</h2>
      <h3>Game PIN: {gameData.pin}</h3>
      
      {gameData.winnerNickname && (
        <div className="winner-box">
          <h4>Last Round's Winner: {gameData.winnerNickname}</h4>
          <p>"{gameData.winningAnswer}"</p>
        </div>
      )}

      <h4>Players:</h4>
      <ul>
        {gameData.players.map(player => (
          <li key={player.id}>
            {player.nickname} - Score: {player.score}
            {player.id === gameData.hostId && ' (Host)'}
          </li>
        ))}
      </ul>
      
      {/* Only show "Start Game" button to the host */}
      {isHost && (
        <button onClick={handleStartGame}>Start Next Round</button>
      )}
      {!isHost && (
        <p>Waiting for the host to start the game...</p>
      )}
    </div>
  );
}

export default LobbyScreen;