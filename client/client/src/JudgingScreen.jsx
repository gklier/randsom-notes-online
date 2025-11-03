// --- client/src/JudgingScreen.jsx ---

function JudgingScreen({ socket, gameData }) {
  const isHost = socket.id === gameData.hostId;
  
  // Get an array of player objects who submitted
  const submissions = Object.keys(gameData.submissions).map(playerId => {
    const player = gameData.players.find(p => p.id === playerId);
    return {
      id: playerId,
      nickname: player ? player.nickname : 'Unknown',
      answer: gameData.submissions[playerId]
    };
  });

  const handleSelectWinner = (winnerId) => {
    socket.emit('selectWinner', { pin: gameData.pin, winnerId });
  };

  return (
    <div>
      <h2>Time to Judge!</h2>
      <h3>The Prompt: {gameData.prompt}</h3>

      <hr />

      <h4>Submissions:</h4>
      {submissions.map(sub => (
        <div key={sub.id} style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
          <p><strong>{sub.nickname}'s answer:</strong></p>
          {/* Apply the same ransom-note style to the answers */}
          <div className="submission-area">
            {sub.answer.split(' ').map((word, index) => (
              <button key={index} style={{ cursor: 'default' }}>{word}</button>
            ))}
          </div>
          
          {isHost && (
            <button onClick={() => handleSelectWinner(sub.id)}>
              Make this the Winner
            </button>
          )}
        </div>
      ))}
      
      {!isHost && (
        <h4>Waiting for the host to pick a winner...</h4>
      )}
    </div>
  );
}

export default JudgingScreen;