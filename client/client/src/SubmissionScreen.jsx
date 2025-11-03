// --- client/src/SubmissionScreen.jsx ---

import { useState } from 'react';

function SubmissionScreen({ socket, gameData }) {
  const [myAnswer, setMyAnswer] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableWords, setAvailableWords] = useState(gameData.wordPool);

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
    return <div><h3>Submission sent!</h3><p>Waiting for other players...</p></div>;
  }

  return (
    <div>
      <h2>The Prompt:</h2>
      <h3 style={{ color: 'blue' }}>{gameData.prompt}</h3>

      <hr />
      
      <h4>Your Answer:</h4>
      <div style={{ border: '1px solid #ccc', minHeight: '50px', padding: '10px' }}>
        {myAnswer.map((word, index) => (
          <button key={index} onClick={() => removeWord(word, index)} style={{ margin: '2px', background: 'lightgreen' }}>
            {word}
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={myAnswer.length === 0}>
        Submit Answer
      </button>

      <hr />

      <h4>Your Word Pool:</h4>
      <div style={{ background: '#f4f4f4', padding: '10px' }}>
        {availableWords.map((word, index) => (
          <button key={index} onClick={() => addWord(word, index)} style={{ margin: '2px' }}>
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SubmissionScreen;