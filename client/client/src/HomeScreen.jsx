// --- client/src/HomeScreen.jsx ---
import { useState } from 'react';

function HomeScreen({ socket, onGoToCreate }) {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');

  const handleJoin = () => {
    if (!pin || !nickname) return alert("Enter a PIN and Nickname!");
    socket.emit('joinGame', { pin, nickname });
  };

  return (
    <div className="home-screen">
      <h1>Ransom Notes ✂️</h1>
      
      <div className="card">
        <h3>Join a Game</h3>
        <input 
          placeholder="Game PIN" 
          value={pin} 
          onChange={e => setPin(e.target.value)} 
          type="number"
        />
        <input 
          placeholder="Nickname" 
          value={nickname} 
          onChange={e => setNickname(e.target.value)} 
          maxLength={12}
        />
        <br />
        <button className="primary" onClick={handleJoin}>Join Game</button>
      </div>

      <div className="card">
        <h3>Or Start One</h3>
        <button className="secondary" onClick={onGoToCreate}>Host New Game</button>
      </div>

      <div className="card" style={{ textAlign: 'left', fontSize: '0.9rem' }}>
        <h4>How to Play:</h4>
        <ol>
          <li><strong>Join:</strong> One person hosts, everyone else joins with the PIN.</li>
          <li><strong>The Goal:</strong> Use your magnetic words to answer weird prompts.</li>
          <li><strong>Roles:</strong> One player is the <strong>Judge</strong>. Everyone else submits answers.</li>
          <li><strong>Answer:</strong> When the <strong>Judge</strong> starts the round, drag words to build your answer.</li>
          <li><strong>Win:</strong> The <strong>Judge</strong> picks their favorite. First to 5 points wins! (Judge role rotates).</li>
        </ol>
      </div>
      
      <p style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '2rem'}}>
        Made with ❤️ (and frantic typing)
      </p>
    </div>
  );
}

export default HomeScreen;