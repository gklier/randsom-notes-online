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
  // `isJudge` will now determine who can pick the winner
  const isJudge = socket.id === gameData.currentJudgeId; // <-- UPDATED
  
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

  const currentJudgeNickname = gameData.players.find(p => p.id === gameData.currentJudgeId)?.nickname || 'Nobody'; // <-- NEW

  return (
    <div>
      <h2>Time to Judge!</h2>
      <h3>The Prompt:</h3>
      <RansomText text={gameData.prompt} />
      <hr />

      <h4>Submissions:</h4>
      {/* Filter out the judge's own submission if they were allowed to submit (which they shouldn't be with the rotating judge) */}
      {submissions.filter(sub => sub.id !== gameData.currentJudgeId).map(sub => ( // <-- Filter out judge's own (if any)
        <div key={sub.id} style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
          <p><strong>{sub.nickname}'s answer:</strong></p>
          <RansomText text={sub.answer} />
          
          {isJudge && ( // Only the judge can click this button
            <button onClick={() => handleSelectWinner(sub.id)}>
              Make this the Winner
            </button>
          )}
        </div>
      ))}
      
      {!isJudge && (
        <h4>Waiting for the judge ({currentJudgeNickname}) to pick a winner...</h4>
      )}
    </div>
  );
}

export default JudgingScreen;