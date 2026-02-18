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

      {/* --- RESTORED SEO KEYWORD SECTION --- */}
      <div className="about-box" style={{marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee'}}>
        <h3 style={{textAlign: 'center'}}>About Ransom Notes Online</h3>
        <p style={{fontSize: '0.9rem', color: '#555', lineHeight: '1.5'}}>
          Welcome to Ransom Notes Online, a free party game for you and your friends! This game is inspired by the hilarious board game and games like Cards Against Humanity or Jackbox.
        </p>
        <p style={{fontSize: '0.9rem', color: '#555', lineHeight: '1.5'}}>
          The goal is simple: you get a silly prompt, and you have to answer it using a random bank of word magnets. Create the funniest, most ridiculous sentence to win the judge's favor. Our game is 100% free to play, works on your phone or computer, and is the perfect online word game for your next game night.
        </p>
      </div>

      {/* --- RESTORED SUPPORT & BUG BUTTONS --- */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <a href="https://www.buymeacoffee.com/gklier" target="_blank" rel="noreferrer">
          <button className="secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            ☕ Buy Me a Coffee
          </button>
        </a>
        <a href="mailto:bugs@ransomnotes.online">
          <button className="secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            🐛 Report a Bug
          </button>
        </a>
      </div>
      
      <p style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '2rem'}}>
        Made with ❤️ (and frantic typing)
      </p>
    </div>
  );
}

export default HomeScreen;