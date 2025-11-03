// --- client/src/App.jsx ---

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; // <-- IMPORT THE NEW CSS FILE

// Import our new screen components
import HomeScreen from './HomeScreen';
import CreateGameScreen from './CreateGameScreen';
import LobbyScreen from './LobbyScreen';
import SubmissionScreen from './SubmissionScreen';
import JudgingScreen from './JudgingScreen';

// Connect to the server
const socket = io(import.meta.env.VITE_SERVER_URL);

function App() {
  // gameState controls which "scene" is visible
  const [gameState, setGameState] = useState('HOME');
  
  // gameData stores ALL information about the game
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // === CENTRAL LISTENERS ===

    // Host: Game is created
    socket.on('gameCreated', (game) => {
      setGameData(game);
      setGameState('LOBBY');
    });

    // Player: Joined game successfully
    socket.on('joinSuccess', (game) => {
      setGameData(game);
      setGameState('LOBBY');
    });

    // All: Player list updated
    socket.on('playerListUpdate', (players) => {
      setGameData(prevData => ({ ...prevData, players }));
    });
    
    // Player: A new round is starting
    socket.on('newRound', ({ prompt, wordPool, randomFact }) => {
      setGameData(prevData => ({ 
        ...prevData, 
        prompt, 
        wordPool, 
        randomFact 
      }));
      setGameState('SUBMITTING');
    });

    // All: Submissions are in, time to judge
    socket.on('showSubmissions', ({ prompt, submissions, players }) => {
      setGameData(prevData => ({ ...prevData, prompt, submissions, players }));
      setGameState('JUDGING');
    });
    
    // All: Round is over, back to lobby
    socket.on('roundOver', ({ scores, ...rest }) => {
      // We set 'prompt' and 'wordPool' to null to clean up
      setGameData(prevData => ({ 
        ...prevData, 
        players: scores, 
        prompt: null, 
        wordPool: null, 
        ...rest 
      }));
      setGameState('LOBBY');
    });

    // Handle errors
    socket.on('joinError', (message) => {
      alert(message);
      setGameState('HOME');
    });

    // Clean up listeners on unmount
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
      {renderScene()}
    </div>
  );
}

export default App;