// --- client/src/LobbyScreen.jsx ---

import { useState, useEffect, useRef } from 'react';

function LobbyScreen({ socket, gameData }) {
  // `isJudge` will now determine who can start the round
  const isJudge = socket.id === gameData.currentJudgeId;
  const [chatMessages, setChatMessages] = useState(gameData.chatMessages || []);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef(null);

  // Derive current player nickname from gameData.players
  const currentPlayerNickname = gameData.players.find(p => p.id === socket.id)?.nickname || 'Guest';
  const currentJudgeNickname = gameData.players.find(p => p.id === gameData.currentJudgeId)?.nickname || 'Nobody';

  useEffect(() => {
    socket.on('newMessage', (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for error messages from server
    socket.on('errorMessage', (msg) => {
      alert(msg); 
    });

    return () => {
      socket.off('newMessage');
      socket.off('errorMessage');
    };
  }, [socket]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleStartGame = () => {
    socket.emit('startGame', { pin: gameData.pin });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socket.emit('sendMessage', { pin: gameData.pin, nickname: currentPlayerNickname, message: chatInput });
      setChatInput('');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }} className="lobby-container">
      {/* Left Column: Game Info */}
      <div style={{ flex: 2, minWidth: '300px' }}>
        <h2>Game Lobby</h2>
        <h3>Game PIN: {gameData.pin}</h3>
        
        {/* --- CRASH FIX & MAGNET FORMATTING --- */}
        {gameData.winnerNickname && (
          <div className="winner-box card" style={{ background: '#e8f5e9', borderColor: '#2f5b28' }}>
            <h4 style={{ color: '#2f5b28', marginBottom: '1rem' }}>
              Last Round's Winner: {gameData.winnerNickname}!
            </h4>
            
            <div className="ransom-note-text" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.isArray(gameData.winningAnswer) ? (
                gameData.winningAnswer.map((word, i) => (
                  <span key={i} className="word-magnet" style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
                    {word}
                  </span>
                ))
              ) : (
                <span className="word-magnet">Data lost in the void 🌌</span>
              )}
            </div>
          </div>
        )}

        {/* --- Display Current Judge --- */}
        <h3>👑 Current Judge: {currentJudgeNickname}</h3>

        <div className="card" style={{ padding: '1rem', marginTop: '1rem' }}>
          <h4>Players:</h4>
          <ul style={{ listStyleType: 'none', padding: 0, textAlign: 'left' }}>
            {gameData.players.map(player => (
              <li key={player.id} style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
                {player.nickname}
                {player.id === gameData.hostId ? ' 🏠 (Host)' : ''}
                {player.id === gameData.currentJudgeId ? ' ⚖️ (Judge)' : ''}
                {' — '}
                <span style={{ color: '#d42426' }}>Score: {player.score}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {isJudge ? ( 
          <button className="primary" onClick={handleStartGame} style={{ fontSize: '1.2rem', padding: '1rem 2rem', marginTop: '1rem' }}>
            Start Next Round
          </button>
        ) : (
          <div className="card" style={{ background: '#fffef0' }}>
            <p>Waiting for the judge (<strong>{currentJudgeNickname}</strong>) to start the game...</p>
          </div>
        )}
      </div>

      {/* Right Column: Chat Box */}
      <div style={{ flex: 1, minWidth: '250px' }}>
        <h3>Lobby Chat</h3>
        <div style={{ border: '2px solid #111', height: '350px', overflowY: 'scroll', padding: '10px', marginBottom: '10px', background: '#fff', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1)' }}>
          {chatMessages.map((msg, index) => (
            <p key={index} style={{ margin: '0 0 8px 0', fontSize: '0.9rem', textAlign: 'left' }}>
              <span style={{ fontWeight: 'bold', color: msg.nickname === 'System' ? '#d42426' : '#111' }}>
                {msg.nickname}:
              </span> {msg.message}
            </p>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>
        <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '5px' }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" style={{ margin: 0, padding: '0.5rem' }}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default LobbyScreen;