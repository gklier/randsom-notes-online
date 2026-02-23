// --- client/src/SubmissionScreen.jsx ---
import { useState, useEffect } from 'react';

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

function SubmissionScreen({ socket, gameData }) {
  const [myAnswer, setMyAnswer] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableWords, setAvailableWords] = useState(gameData.wordPool || []);

  const { pin, hostId, currentJudgeId, prompt, randomJoke, judgePlays } = gameData;
  
  const isJudge = socket.id === currentJudgeId;
  const isHostOrJudge = socket.id === hostId || socket.id === currentJudgeId;

  useEffect(() => {
    setAvailableWords(gameData.wordPool || []);
    setMyAnswer([]);
    setIsSubmitted(false);
  }, [gameData.wordPool, currentJudgeId]); 

  const addWord = (word, index) => {
    setMyAnswer([...myAnswer, word]);
    const newPool = [...availableWords];
    newPool.splice(index, 1);
    setAvailableWords(newPool);
  };

  const removeWord = (word, index) => {
    setAvailableWords([...availableWords, word]);
    const newAnswer = [...myAnswer];
    newAnswer.splice(index, 1);
    setMyAnswer(newAnswer);
  };

  const handleSubmit = () => {
    socket.emit('submitAnswer', { pin, answer: myAnswer });
    setIsSubmitted(true);
  };

  const handleForceEnd = () => {
    if (window.confirm("Force end submissions? Anyone who hasn't submitted will miss out this round!")) {
      socket.emit('forceEndSubmissions', { pin });
    }
  };

  const emergencyButton = isHostOrJudge && (
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <button 
        className="secondary" 
        style={{ backgroundColor: '#ffe6e6', color: '#cc0000', borderColor: '#cc0000' }} 
        onClick={handleForceEnd}
      >
        ⏱️ Time's Up! (Force End)
      </button>
    </div>
  );

  // If they are the judge AND the "Judge Plays" toggle is OFF, show the waiting screen
  if (isJudge && !judgePlays) { 
    return (
      <div className="waiting-box">
        {emergencyButton}
        <h3>You are the judge this round!</h3>
        <p>Waiting for other players to submit their answers...</p>
        <hr />
        <h4>Here's a Joke:</h4>
        <p>{randomJoke}</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="waiting-box">
        {emergencyButton}
        <h3>Submission sent!</h3>
        <p>Waiting for other players...</p>
        <hr />
        <h4>Here's a Joke:</h4>
        <p>{randomJoke}</p>
      </div>
    );
  }

  return (
    <div>
      {emergencyButton}
      <h2>The Prompt:</h2>
      <RansomText text={prompt} />
      <hr />
      
      <h4>Your Answer:</h4>
      <div className="submission-area">
        {myAnswer.map((word, index) => (
          <button key={index} onClick={() => removeWord(word, index)}>
            {word}
          </button>
        ))}
      </div>
      <button className="primary" onClick={handleSubmit} disabled={myAnswer.length === 0}>
        Submit Answer
      </button>

      <hr />

      <h4>Your Word Pool:</h4>
      <div className="word-pool">
        {availableWords.map((word, index) => (
          <button key={index} onClick={() => addWord(word, index)}>
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SubmissionScreen;