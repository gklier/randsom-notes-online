// --- client/src/JudgingScreen.jsx ---
import React from 'react';

function JudgingScreen({ socket, gameData }) {
  const { prompt = "Wait, where did the prompt go?", submissions = {}, players = [], currentJudgeId, hostId } = gameData || {};
  
  const isJudge = socket.id === currentJudgeId;
  const isHost = socket.id === hostId;

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
        <button className="secondary" style={{ backgroundColor: '#ffe6e6', color: '#cc0000', borderColor: '#cc0000', marginBottom: '1rem' }} onClick={handleSkipRound}>
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
            <h4 style={{ color: '#555', marginBottom: '1rem' }}>
              {isJudge ? "???" : sub.nickname}
            </h4>
            
            {/* THE MAGNET FORMATTING FIX */}
            <div className="answer-box ransom-note-text" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', minHeight: '120px', alignItems: 'center' }}>
              {Array.isArray(sub.answer) ? (
                // If it's a new array payload, map it into magnets
                sub.answer.map((word, i) => (
                  <span key={i} className="word-magnet" style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
                    {word}
                  </span>
                ))
              ) : typeof sub.answer === 'string' ? (
                // Fallback: If it's an old string payload, split it and make magnets
                sub.answer.split(' ').map((word, i) => (
                  <span key={i} className="word-magnet" style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
                    {word}
                  </span>
                ))
              ) : (
                <span className="word-magnet">Data lost in the void 🌌</span>
              )}
            </div>

            {isJudge && (
              <button 
                className="primary" 
                style={{ marginTop: '1.5rem', width: '100%' }}
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