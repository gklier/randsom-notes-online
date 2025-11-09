// --- client/src/CreateGameScreen.jsx ---

import { useState } from 'react';

function CreateGameScreen({ socket, onBack }) {
  const [promptsText, setPromptsText] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [hostNickname, setHostNickname] = useState(''); // <-- NEW STATE

  const handleCreate = () => {
    if (!hostNickname) { // <-- NEW CHECK
      alert('Please enter your nickname');
      return;
    }
    const customPrompts = promptsText.split('\n').filter(line => line.trim() !== '');
    const customWords = wordsText.split(' ').filter(word => word.trim() !== '');

    if (customPrompts.length < 5 || customWords.length < 100) {
      alert('Please enter at least 5 prompts and 100 words.');
      return;
    }
    
    socket.emit('createGame', { customPrompts, customWords, hostNickname }); // <-- PASS NICKNAME
  };

  console.log('Creating game with pack:', packName);
  const handleCreateDefault = (packName) => {
    if (!hostNickname) { // <-- NEW CHECK
      alert('Please enter your nickname');
      return;
    }
    socket.emit('createGame', { defaultPack: packName, hostNickname }); // <-- PASS NICKNAME
  };

  return (
    <div>
      <button onClick={onBack}>&larr; Back</button>
      <h2>Create Your Game</h2>

      {/* --- NEW HOST NICKNAME INPUT --- */}
      <div>
        <h4>Your Nickname</h4>
        <input 
          type="text" 
          placeholder="Enter your nickname"
          value={hostNickname}
          onChange={(e) => setHostNickname(e.target.value)}
        />
      </div>
      <hr />

      <div className="custom-game-box">
        <h3>Make Your Own Pack</h3>
        <p>Add your prompts (one per line):</p>
        <textarea
          placeholder="e.g.&#10;Tell your boss you're quitting&#10;A horrible pickup line"
          rows="8"
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
        ></textarea>
        <p>Add your words (separated by a **space**):</p>
        <textarea
          placeholder="e.g. THE A CAT DOG JUMPED..."
          rows="8"
          value={wordsText}
          onChange={(e) => setWordsText(e.target.value)}
        ></textarea>
        <div>
          <button onClick={handleCreate}>Create Custom Game</button>
        </div>
      </div>
      
      <hr />
      
      <div className="default-game-box">
        <h3>...Or Use a Default Pack</h3>
        <button onClick={() => handleCreateDefault('family')}>
          Start Family-Friendly Game
        </button>
        <button onClick={() => handleCreateDefault('research')}>
          Start Research Game
        </button>
        <button onClick={() => handleCreateDefault('nsfw')}>
          Start NSFW (CAH-Style) Game
        </button>
      </div>
    </div>
  );
}

export default CreateGameScreen;