// --- client/src/JudgingScreen.jsx ---
import React from 'react';

function JudgingScreen({ socket, gameData }) {
  const { prompt, submissions, players, currentJudgeId } = gameData;
  const isJudge = socket.id === currentJudgeId;

  const handleSelectWinner = (winnerId) => {
    if (!isJudge) return;
    if (window.confirm("Confirm this as the winner?")) {
      socket.emit('selectWinner', { pin: gameData.pin, winnerId });
    }
  };

  // Convert submissions object to array for mapping
  const submissionsList = Object.keys(submissions).map(playerId => {
    const player = players.find(p => p.id === playerId);
    return {
      playerId,
      nickname: player ? player.nickname : "Unknown",
      answer: submissions[playerId]
    };
  });

  return (
    <div className="judging-page">
      <h2>The Judge is Deciding... ⚖️</h2>
      
      <div className="card" style={{ background: '#eee' }}>
        <h3>Prompt:</h3>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{prompt}</p>
      </div>

      <div className="submissions-list">
        {submissionsList.map((sub, index) => (
          <div key={sub.playerId} className="card submission-card">
            {/* ANONYMITY FIX: Hide name if user is the Judge */}
            <h4 style={{ color: '#555' }}>
              {isJudge ? "???" : sub.nickname}
            </h4>
            
            <div className="answer-box">
              {sub.answer.map((word, i) => (
                <span key={i} className="word-magnet" style={{ transform: `rotate(${Math.random() * 4 - 2}deg)` }}>
                  {word}
                </span>
              ))}
            </div>

            {isJudge && (
              <button 
                className="primary" 
                style={{ marginTop: '1rem' }}
                onClick={() => handleSelectWinner(sub.playerId)}
              >
                🏆 Pick Winner
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default JudgingScreen;