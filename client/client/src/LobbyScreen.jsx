// --- client/src/LobbyScreen.jsx ---

import { useState, useEffect, useRef } from 'react';

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
  // `isJudge` will now determine who can start the round
  const isJudge = socket.id === gameData.currentJudgeId; // <-- UPDATED
  const [chatMessages, setChatMessages] = useState(gameData.chatMessages || []);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef(null);

  // Derive current player nickname from gameData.players
  const currentPlayerNickname = gameData.players.find(p => p.id === socket.id)?.nickname || 'Guest';
  const currentJudgeNickname = gameData.players.find(p => p.id === gameData.currentJudgeId)?.nickname || 'Nobody'; // <-- NEW

  useEffect(() => {
    socket.on('newMessage', (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
    });

    // The server will send a full `gameCreated` or `joinSuccess` with initial chat
    // and `roundOver` will update gameData, which will have new chat messages.

    return () => {
      socket.off('newMessage');
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
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* Left Column: Game Info */}
      <div style={{ flex: 2 }}>
        <h2>Game Lobby</h2>
        <h3>Game PIN: {gameData.pin}</h3>
        
        {gameData.winnerNickname && (
          <div className="winner-box">
            <h4>Last Round's Winner: {gameData.winnerNickname}!</h4>
            <RansomText text={gameData.winningAnswer} />
          </div>
        )}

        {/* --- NEW: Display Current Judge --- */}
        <h3>👑 Current Judge: {currentJudgeNickname}</h3>

        <h4>Players:</h4>
        <ul>
          {gameData.players.map(player => (
            <li key={player.id}>
              {player.nickname}
              {player.id === gameData.hostId ? ' (Original Host)' : ''} {/* Clarify who the original host is */}
              {player.id === gameData.currentJudgeId ? ' (Judge)' : ''} {/* Show who the current judge is */}
              {' - '}
              Score: {player.score}
            </li>
          ))}
        </ul>
        
        {isJudge && ( // Only the judge can start
          <button onClick={handleStartGame}>Start Next Round</button>
        )}
        {!isJudge && (
          <p>Waiting for the judge ({currentJudgeNickname}) to start the game...</p>
        )}
      </div>

      {/* Right Column: Chat Box */}
      <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '1rem' }}>
        <h3>Lobby Chat</h3>
        <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px', marginBottom: '10px', background: '#fdfdfd' }}>
          {chatMessages.map((msg, index) => (
            <p key={index} style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: msg.nickname === 'System' ? 'bold' : 'normal', color: msg.nickname === 'System' ? '#777' : '#333' }}>
                {msg.nickname}:
              </span> {msg.message}
            </p>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>
        <form onSubmit={handleSendChat}>
          <input
            type="text"
            placeholder="Type your message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ width: 'calc(100% - 70px)', marginRight: '5px' }}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default LobbyScreen;