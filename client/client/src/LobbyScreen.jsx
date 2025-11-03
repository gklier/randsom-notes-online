// --- client/src/LobbyScreen.jsx ---

// Helper component to render text in the ransom note style
const RansomText = ({ text }) => {
  if (!text) return null;
  const words = text.split(' ');
  return (
    <div className="ransom-note-text">
      {words.map((word, index) => (
        <span key={index}>{word}</span>
      ))}
    </div>
  );
};

function LobbyScreen({ socket, gameData }) {
  
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
          {/* Use the new RansomText component */}
          <RansomText text={gameData.winningAnswer} />
        </div>
      )}

      <h4>Players:</h4>
      <ul>
        {gameData.players.map(player => (
          <li key={player.id}>
            {player.nickname}
            {/* THIS IS THE NEW HOST LOGIC */}
            {player.id === gameData.hostId ? ' (Host)' : ''}
            {' - '}
            Score: {player.score}
          </li>
        ))}
      </ul>
      
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