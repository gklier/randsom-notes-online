// --- client/src/JudgingScreen.jsx ---

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

function JudgingScreen({ socket, gameData }) {
  const isHost = socket.id === gameData.hostId;
  
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
      <h3>The Prompt:</h3>
      {/* Use the new RansomText component for the prompt */}
      <RansomText text={gameData.prompt} />
      <hr />

      <h4>Submissions:</h4>
      {submissions.map(sub => (
        <div key={sub.id} style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
          <p><strong>{sub.nickname}'s answer:</strong></p>
          
          {/* Use the new RansomText component for the answer */}
          <RansomText text={sub.answer} />
          
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