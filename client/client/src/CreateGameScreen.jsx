// --- client/src/CreateGameScreen.jsx ---
import { useState } from 'react';

function CreateGameScreen({ socket, onBack }) {
  const [hostNickname, setHostNickname] = useState('');
  const [selectedPack, setSelectedPack] = useState('family'); 
  const [isCustom, setIsCustom] = useState(false);
  const [customPrompts, setCustomPrompts] = useState('');
  const [customWords, setCustomWords] = useState('');
  
  // NEW: Judge Plays mode state
  const [judgePlays, setJudgePlays] = useState(false);

  const handleCreate = () => {
    if (!hostNickname.trim()) return alert("Please enter a nickname!");
    
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
        defaultPack: null,
        judgePlays // Send the setting to the server
      });
    } else {
      socket.emit('createGame', {
        hostNickname,
        defaultPack: selectedPack,
        judgePlays // Send the setting to the server
      });
    }
  };

  // Helper style for chunky Ransom radio buttons
  const labelStyle = {
    display: 'block', 
    margin: '0.8rem 0', 
    padding: '10px', 
    background: '#fff', 
    border: '2px solid #111', 
    boxShadow: '3px 3px 0px #111', 
    cursor: 'pointer',
    transform: 'rotate(-0.5deg)',
    fontWeight: 'bold'
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
        style={{ transform: 'rotate(1deg)' }}
      />

      <div style={{ margin: '1.5rem 0', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.2rem', padding: '5px 10px' }}>Select Pack:</h3>
        
        {/* --- STANDARD PACKS --- */}
        <label style={labelStyle}>
          <input 
            type="radio" 
            name="pack" 
            value="family" 
            checked={!isCustom && selectedPack === 'family'} 
            onChange={() => { setIsCustom(false); setSelectedPack('family'); }}
            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
          />
          👨‍👩‍👧‍👦 Family Friendly (Standard)
        </label>

        <label style={{...labelStyle, transform: 'rotate(0.5deg)'}}>
          <input 
            type="radio" 
            name="pack" 
            value="nsfw" 
            checked={!isCustom && selectedPack === 'nsfw'} 
            onChange={() => { setIsCustom(false); setSelectedPack('nsfw'); }}
            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
          />
          🌶️ NSFW (Adults Only)
        </label>
        
        <label style={{...labelStyle, transform: 'rotate(-1deg)'}}>
            <input 
            type="radio" 
            name="pack" 
            value="research" 
            checked={!isCustom && selectedPack === 'research'} 
            onChange={() => { setIsCustom(false); setSelectedPack('research'); }}
            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
            />
            🔬 User Research (The Weird Stuff)
        </label>

        {/* --- CUSTOM PACK --- */}
        <label style={{...labelStyle, background: '#eee'}}>
          <input 
            type="radio" 
            name="pack" 
            value="custom" 
            checked={isCustom} 
            onChange={() => setIsCustom(true)}
            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
          />
          ✏️ Custom Game (Write your own!)
        </label>
      </div>

      {isCustom && (
        <div style={{ textAlign: 'left', fontSize: '0.9rem', background: '#fffef0', padding: '15px', border: '2px dashed #ccc' }}>
          <p><strong>Prompts (one per line):</strong></p>
          <textarea 
            rows={4} 
            style={{ width: '100%', marginBottom: '1rem' }} 
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

      {/* --- JUDGE PLAYS TOGGLE --- */}
      <div style={{ margin: '2rem 0', textAlign: 'center', background: '#e8f5e9', border: '2px solid #2f5b28', padding: '10px', transform: 'rotate(1deg)' }}>
        <label style={{ fontWeight: 'bold', cursor: 'pointer', color: '#2f5b28' }}>
          <input 
            type="checkbox" 
            checked={judgePlays} 
            onChange={(e) => setJudgePlays(e.target.checked)} 
            style={{ width: 'auto', marginRight: '10px', transform: 'scale(1.5)' }}
          />
          👑 Judge Also Plays (Great for 2-3 players!)
        </label>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button className="secondary" onClick={onBack}>Back</button>
        <button className="primary" onClick={handleCreate}>Create Room</button>
      </div>
    </div>
  );
}

export default CreateGameScreen;