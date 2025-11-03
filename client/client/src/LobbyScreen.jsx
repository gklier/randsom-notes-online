// --- client/src/LobbyScreen.jsx ---

import { useState, useEffect, useRef } from 'react'; // ADD useRef

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
  const [chatMessages, setChatMessages] = useState(gameData.chatMessages || []); // Initialize with existing messages
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef(null); // Ref for auto-scrolling chat

  const currentPlayerNickname = gameData.players.find(p => p.id === socket.id)?.nickname || 'Guest';

  useEffect(() => {
    // Listener for new chat messages
    socket.on('newMessage', (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listener for full chat history update (e.g., when a player joins/leaves)
    socket.on('chatHistory', (history) => {
      setChatMessages(history);
    });

    // Clean up event listeners on unmount
    return () => {
      socket.off('newMessage');
      socket.off('chatHistory');
    };
  }, [socket]);

  // Auto-scroll chat messages to the bottom
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
            <h4>Last Round's Winner: {gameData.winnerNickname}</h4>
            <RansomText text={gameData.winningAnswer} />
          </div>
        )}

        <h4>Players:</h4>
        <ul>
          {gameData.players.map(player => (
            <li key={player.id}>
              {player.nickname}
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
          <div ref={chatMessagesEndRef} /> {/* For auto-scrolling */}
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