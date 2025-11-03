// --- client/src/CreateGameScreen.jsx ---

import { useState } from 'react';

function CreateGameScreen({ socket, onBack }) {
  const [promptsText, setPromptsText] = useState('');
  const [wordsText, setWordsText] = useState('');

  const handleCreate = () => {
    // Convert text area content into arrays
    const customPrompts = promptsText.split('\n').filter(line => line.trim() !== '');
    const customWords = wordsText.split(' ').filter(word => word.trim() !== '');

    if (customPrompts.length < 5 || customWords.length < 100) {
      alert('Please enter at least 5 prompts and 100 words, or use the default game.');
      return;
    }
    
    socket.emit('createGame', { customPrompts, customWords, useDefault: false });
  };

  const handleCreateDefault = () => {
    // Tell server to use its default JSON files
    socket.emit('createGame', { useDefault: true });
  };

  return (
    <div>
      <button onClick={onBack}>&larr; Back</button>
      <h2>Create Your Game</h2>
      
      <p>Add your prompts (one per line):</p>
      <textarea
        placeholder="e.g.&#10;Tell your boss you're quitting&#10;A horrible pickup line"
        rows="10"
        style={{ width: '80%' }}
        value={promptsText}
        onChange={(e) => setPromptsText(e.target.value)}
      ></textarea>

      <p>Add your words (separated by a **space**):</p>
      <textarea
        placeholder="e.g. THE A CAT DOG JUMPED OVER MY BUTT IS HUNGRY FOR PIZZA..."
        rows="10"
        style={{ width: '80%' }}
        value={wordsText}
        onChange={(e) => setWordsText(e.target.value)}
      ></textarea>
      
      <div>
        <button onClick={handleCreate}>Create Custom Game</button>
      </div>
      
      <hr />
      
      <div>
        <p>Don't want to make your own?</p>
        <button onClick={handleCreateDefault}>Create with Default Words</button>
      </div>
    </div>
  );
}

export default CreateGameScreen;