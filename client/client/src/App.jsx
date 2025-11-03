// --- client/src/App.jsx ---

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; 

// Import our new screen components
import HomeScreen from './HomeScreen';
import CreateGameScreen from './CreateGameScreen';
import LobbyScreen from './LobbyScreen';
import SubmissionScreen from './SubmissionScreen';
import JudgingScreen from './JudgingScreen';
import MusicPlayer from './MusicPlayer'; // <-- 1. IMPORT IT

// Connect to the server
const socket = io(import.meta.env.VITE_SERVER_URL);

function App() {
  // ... (all your useState and useEffect logic stays exactly the same) ...
  const [gameState, setGameState] = useState('HOME');
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // === CENTRAL LISTENERS ===
    socket.on('gameCreated', (game) => {
      setGameData(game);
      setGameState('LOBBY');
    });
    socket.on('joinSuccess', (game) => {
      setGameData(game);
      setGameState('LOBBY');
    });
    socket.on('playerListUpdate', (players) => {
      setGameData(prevData => ({ ...prevData, players }));
    });
    socket.on('newRound', ({ prompt, wordPool, randomJoke }) => {
      setGameData(prevData => ({ 
        ...prevData, 
        prompt, 
        wordPool, 
        randomJoke 
      }));
      setGameState('SUBMITTING');
    });
    socket.on('showSubmissions', ({ prompt, submissions, players }) => {
      setGameData(prevData => ({ ...prevData, prompt, submissions, players }));
      setGameState('JUDGING');
    });
    socket.on('roundOver', ({ scores, ...rest }) => {
      setGameData(prevData => ({ 
        ...prevData, 
        players: scores, 
        prompt: null, 
        wordPool: null, 
        ...rest 
      }));
      setGameState('LOBBY');
    });
    socket.on('joinError', (message) => {
      alert(message);
      setGameState('HOME');
    });
    return () => {
      socket.off('gameCreated');
      socket.off('joinSuccess');
      socket.off('playerListUpdate');
      socket.off('newRound');
      socket.off('showSubmissions');
      socket.off('roundOver');
      socket.off('joinError');
    };
  }, []);

  // === RENDER LOGIC (The "Router") ===
  const renderScene = () => {
    switch (gameState) {
      case 'HOME':
        return <HomeScreen 
                  socket={socket} 
                  onGoToCreate={() => setGameState('CREATE_GAME')} 
                />;
      case 'CREATE_GAME':
        return <CreateGameScreen 
                  socket={socket} 
                  onBack={() => setGameState('HOME')} 
                />;
      case 'LOBBY':
        return <LobbyScreen socket={socket} gameData={gameData} />;
      case 'SUBMITTING':
        return <SubmissionScreen socket={socket} gameData={gameData} />;
      case 'JUDGING':
        return <JudgingScreen socket={socket} gameData={gameData} />;
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="app-container">
      <MusicPlayer /> {/* <-- 2. ADD IT HERE */}
      {renderScene()}
    </div>
  );
}

export default App;