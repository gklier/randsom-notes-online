// --- client/src/HomeScreen.jsx ---

import { useState } from 'react';
import SuggestionBox from './SuggestionBox';

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

      <hr /> 

      {/* --- INSTRUCTIONS SECTION --- */}
      <div className="instructions-box">
        <h2>How to Play</h2>
        <p><strong>1. Host a Game:</strong> One person (the Host) clicks "Create New Game," enters their nickname, and chooses a game pack (or creates their own!).</p>
        <p><strong>2. Get a PIN:</strong> The Host will get a 4-digit Game PIN.</p>
        <p><strong>3. Join the Game:</strong> Everyone else enters their nickname and the 4-digit PIN to join the lobby.</p>
        <p><strong>4. Answer the Prompt:</strong> When the Host starts the round, everyone will get a random prompt. Use the "word pool" at the bottom to build your funniest answer!</p>
        <p><strong>5. Judge the Answers:</strong> All answers are shown anonymously. The Host picks their favorite, and that player gets a point!</p>
        <p><strong>6. Repeat:</strong> The first player to 5 points (or however many you decide) wins!</p>
      </div>

      {/* --- NEW SEO KEYWORD SECTION --- */}
      <div className="about-box" style={{marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee'}}>
        <h3 style={{textAlign: 'center'}}>About Ransom Notes Online</h3>
        <p style={{fontSize: '0.9rem', color: '#555', lineHeight: '1.5'}}>
          Welcome to Ransom Notes Online, a free party game for you and your friends! This game is inspired by the hilarious board game and games like Cards Against Humanity or Jackbox. 
          The goal is simple: you get a silly prompt, and you have to answer it using a random bank of word magnets. 
          Create the funniest, most ridiculous sentence to win the judge's favor. Our game is 100% free to play, works on your phone or computer, and is the perfect online word game for your next game night.
        </p>
      </div>

      {/* --- DONATION SECTION --- */}
      <div className="donation-box" style={{textAlign: 'center', marginTop: '2rem', padding: '1.5rem', background: '#f9f9f9', border: '2px dashed #ccc'}}>
        <h4>Enjoying the game?</h4>
        <p style={{fontSize: '0.95rem', lineHeight: '1.6'}}>This project is free to play and ad-free. If you'd like to support the server costs, you can buy me a (virtual) coffee!</p>
        <a 
          href="https://buymeacoffee.com/YourName" // <-- ⚠️ REPLACE 'YourName' WITH YOUR LINK
          target="_blank" 
          rel="noopener noreferrer"
        >
          <button style={{backgroundColor: '#FFDD00', color: '#000', border: 'none', fontSize: '1rem'}}>
            ☕ Buy Me a Coffee
          </button>
        </a>
      </div>

      {/* <SuggestionBox />  This was also temporarily commented out, uncomment if you want it back */}

    </div>
  );
}

export default HomeScreen;