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

  useEffect(() => {
    setAvailableWords(gameData.wordPool || []);
    setMyAnswer([]);
    setIsSubmitted(false);
  }, [gameData.wordPool]);


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
        <h4>Here's a Joke:</h4>
        <p>{gameData.randomJoke}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>The Prompt:</h2>
      {/* Use the new RansomText component for the prompt */}
      <RansomText text={gameData.prompt} />
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