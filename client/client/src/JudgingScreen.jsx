// --- client/src/JudgingScreen.jsx ---
import React from 'react';

function JudgingScreen({ socket, gameData }) {
  // Defensive fallback: If any of these are missing, default to safe empty values
  const { prompt = "Wait, where did the prompt go?", submissions = {}, players = [], currentJudgeId } = gameData || {};
  const isJudge = socket.id === currentJudgeId;

  const handleSelectWinner = (winnerId) => {
    if (!isJudge) return;
    if (window.confirm("Confirm this as the winner?")) {
      socket.emit('selectWinner', { pin: gameData.pin, winnerId });
    }
  };

  // Safely map over submissions without crashing if data is weird
  const submissionsList = Object.keys(submissions).map(playerId => {
    const player = players.find(p => p.id === playerId);
    return {
      playerId,
      nickname: player ? player.nickname : "A Ghost 👻",
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
        {submissionsList.length === 0 && <p>Waiting for answers to load...</p>}
        
        {submissionsList.map((sub, index) => (
          <div key={sub.playerId} className="card submission-card">
            <h4 style={{ color: '#555' }}>
              {isJudge ? "???" : sub.nickname}
            </h4>
            
            <div className="answer-box">
              {/* THE CRASH FIX: Check if answer is an array before mapping! */}
              {Array.isArray(sub.answer) ? (
                sub.answer.map((word, i) => (
                  <span key={i} className="word-magnet" style={{ transform: `rotate(${Math.random() * 4 - 2}deg)` }}>
                    {word}
                  </span>
                ))
              ) : (
                <span className="error-msg">Answer lost in the mail ✉️</span>
              )}
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