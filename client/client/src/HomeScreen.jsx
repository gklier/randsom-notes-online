// --- client/src/HomeScreen.jsx ---

import { useState } from 'react';

function HomeScreen({ socket, onGoToCreate }) {
  const [pinInput, setPinInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');

  const handleJoinGame = () => {
    if (pinInput && nicknameInput) {
      socket.emit('joinGame', { pin: pinInput, nickname: nicknameInput });
    } else {
      alert('Please enter a nickname and PIN');
    }
  };

  return (
    <div>
      <h1>Ransom Notes Online</h1>
      
      {/* --- Section for Host --- */}
      <div>
        <h2>Host a Game</h2>
        <button onClick={onGoToCreate}>Create New Game</button>
      </div>

      <hr />

      {/* --- Section for Player --- */}
      <div>
        <h2>Join a Game</h2>
        <input 
          type="text" 
          placeholder="Nickname"
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Game PIN"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
        />
        <button onClick={handleJoinGame}>Join</button>
      </div>
    </div>
  );
}

export default HomeScreen;