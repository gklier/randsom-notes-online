// --- client/src/JudgingScreen.jsx ---
import React from 'react';

function JudgingScreen({ socket, gameData }) {
  const { prompt = "Wait, where did the prompt go?", submissions = {}, players = [], currentJudgeId, hostId } = gameData || {};
  
  const isJudge = socket.id === currentJudgeId;
  const isHost = socket.id === hostId; // Check if current user is the Host

  const handleSelectWinner = (winnerId) => {
    if (!isJudge) return;
    if (window.confirm("Confirm this as the winner?")) {
      socket.emit('selectWinner', { pin: gameData.pin, winnerId });
    }
  };

  const handleSkipRound = () => {
    if (window.confirm("Skip this round? No points will be awarded.")) {
      socket.emit('skipJudging', { pin: gameData.pin });
    }
  };

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
      
      {/* HOST EMERGENCY CONTROL */}
      {isHost && !isJudge && (
        <button className="secondary" style={{ backgroundColor: '#ffe6e6', color: '#cc0000', borderColor: '#cc0000' }} onClick={handleSkipRound}>
          🚨 Force Skip (Judge AFK)
        </button>
      )}
      
      <div className="card" style={{ background: '#eee', marginTop: '1rem' }}>
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