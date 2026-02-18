// --- client/src/CreateGameScreen.jsx ---
import { useState } from 'react';

function CreateGameScreen({ socket, onBack }) {
  const [hostNickname, setHostNickname] = useState('');
  const [selectedPack, setSelectedPack] = useState('family'); // Default to Family
  const [isCustom, setIsCustom] = useState(false);
  const [customPrompts, setCustomPrompts] = useState('');
  const [customWords, setCustomWords] = useState('');

  const handleCreate = () => {
    if (!hostNickname.trim()) return alert("Please enter a nickname!");
    
    // If Custom is selected, parse the text inputs
    if (isCustom) {
      const pList = customPrompts.split('\n').filter(p => p.trim() !== '');
      const wList = customWords.split(/[ ,]+/).filter(w => w.trim() !== '');
      
      if (pList.length === 0 || wList.length === 0) {
        return alert("Please add at least one prompt and some words for a custom game.");
      }

      socket.emit('createGame', {
        hostNickname,
        customPrompts: pList,
        customWords: wList,
        defaultPack: null
      });
    } else {
      // Standard Pack
      socket.emit('createGame', {
        hostNickname,
        defaultPack: selectedPack
      });
    }
  };

  return (
    <div className="card">
      <h2>Host a Game</h2>
      
      <input 
        type="text" 
        placeholder="Your Nickname" 
        value={hostNickname}
        onChange={e => setHostNickname(e.target.value)}
        maxLength={12}
      />

      <div style={{ margin: '1rem 0', textAlign: 'left' }}>
        <h3>Select Pack:</h3>
        
        {/* --- STANDARD PACKS --- */}
        <label style={{ display: 'block', margin: '0.5rem 0' }}>
          <input 
            type="radio" 
            name="pack" 
            value="family" 
            checked={!isCustom && selectedPack === 'family'} 
            onChange={() => { setIsCustom(false); setSelectedPack('family'); }}
          />
          👨‍👩‍👧‍👦 Family Friendly (Standard)
        </label>

        <label style={{ display: 'block', margin: '0.5rem 0' }}>
          <input 
            type="radio" 
            name="pack" 
            value="nsfw" 
            checked={!isCustom && selectedPack === 'nsfw'} 
            onChange={() => { setIsCustom(false); setSelectedPack('nsfw'); }}
          />
          🌶️ NSFW (Adults Only)
        </label>
        
        <label style={{ display: 'block', margin: '0.5rem 0' }}>
            <input 
            type="radio" 
            name="pack" 
            value="research" 
            checked={!isCustom && selectedPack === 'research'} 
            onChange={() => { setIsCustom(false); setSelectedPack('research'); }}
            />
            🔬 User Research (The Weird Stuff)
        </label>

        {/* --- CUSTOM PACK --- */}
        <label style={{ display: 'block', margin: '0.5rem 0', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
          <input 
            type="radio" 
            name="pack" 
            value="custom" 
            checked={isCustom} 
            onChange={() => setIsCustom(true)}
          />
          ✏️ Custom Game (Write your own!)
        </label>
      </div>

      {isCustom && (
        <div style={{ textAlign: 'left', fontSize: '0.9rem' }}>
          <p><strong>Prompts (one per line):</strong></p>
          <textarea 
            rows={4} 
            style={{ width: '100%' }} 
            placeholder="e.g. Things you shouldn't say at a funeral..."
            value={customPrompts}
            onChange={e => setCustomPrompts(e.target.value)}
          />
          
          <p><strong>Words (separate by space/comma):</strong></p>
          <textarea 
            rows={4} 
            style={{ width: '100%' }} 
            placeholder="e.g. moist, grandma, explosion, oops"
            value={customWords}
            onChange={e => setCustomWords(e.target.value)}
          />
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button className="secondary" onClick={onBack}>Back</button>
        <button className="primary" onClick={handleCreate}>Create Room</button>
      </div>
    </div>
  );
}

export default CreateGameScreen;