// --- client/src/SubmissionScreen.jsx ---

import { useState, useEffect } from 'react';

function SubmissionScreen({ socket, gameData }) {
  const [myAnswer, setMyAnswer] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Initialize availableWords from gameData.wordPool
  // This ensures it resets every round
  const [availableWords, setAvailableWords] = useState(gameData.wordPool || []);

  // This effect runs if the gameData.wordPool changes (e.g., new round)
  useEffect(() => {
    setAvailableWords(gameData.wordPool || []);
    setMyAnswer([]);
    setIsSubmitted(false);
  }, [gameData.wordPool]);


  const addWord = (word, index) => {
    setMyAnswer([...myAnswer, word]);
    // Remove word from available pool to prevent reuse
    const newPool = [...availableWords];
    newPool.splice(index, 1);
    setAvailableWords(newPool);
  };

  const removeWord = (word, index) => {
    // Add word back to the available pool
    setAvailableWords([...availableWords, word]);
    // Remove from answer
    const newAnswer = [...myAnswer];
    newAnswer.splice(index, 1);
    setMyAnswer(newAnswer);
  };

  const handleSubmit = () => {
    const answerString = myAnswer.join(' ');
    socket.emit('submitAnswer', { pin: gameData.pin, answer: answerString });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="waiting-box">
        <h3>Submission sent!</h3>
        <p>Waiting for other players...</p>
        <hr />
        <h4>Random Fact:</h4>
        <p>{gameData.randomFact}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>The Prompt:</h2>
      <h3 style={{ color: 'blue' }}>{gameData.prompt}</h3>
      <hr />
      
      <h4>Your Answer:</h4>
      <div className="submission-area">
        {myAnswer.map((word, index) => (
          <button key={index} onClick={() => removeWord(word, index)}>
            {word}
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={myAnswer.length === 0}>
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