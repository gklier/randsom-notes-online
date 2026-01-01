// --- client/src/App.jsx ---

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; 

import HomeScreen from './HomeScreen';
import CreateGameScreen from './CreateGameScreen';
import LobbyScreen from './LobbyScreen';
import SubmissionScreen from './SubmissionScreen';
import JudgingScreen from './JudgingScreen';
import MusicPlayer from './MusicPlayer';

const socket = io(import.meta.env.VITE_SERVER_URL);

function App() {
  const [gameState, setGameState] = useState('HOME');
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // === AUTO-REJOIN LOGIC ===
    // Check if we have a saved session in browser storage
    const savedSession = sessionStorage.getItem('ransom_session');
    if (savedSession) {
      try {
        const { pin, nickname } = JSON.parse(savedSession);
        console.log("Attempting auto-rejoin:", pin, nickname);
        socket.emit('joinGame', { pin, nickname });
      } catch (e) {
        console.error("Invalid session data", e);
        sessionStorage.removeItem('ransom_session');
      }
    }
    // ==========================

    socket.on('gameCreated', (game) => {
      setGameData(game);
      setGameState('LOBBY');
      // Save session for host too
      const myNick = game.players.find(p => p.id === socket.id)?.nickname;
      if (myNick) sessionStorage.setItem('ransom_session', JSON.stringify({ pin: game.pin, nickname: myNick }));
    });

    socket.on('joinSuccess', (game) => {
      setGameData(game);
      // If game is in progress, we might want to show lobby (waiting) instead of breaking
      setGameState('LOBBY'); 
      
      // Save session so if they refresh, they come back here
      const myNick = game.players.find(p => p.id === socket.id)?.nickname;
      if (myNick) sessionStorage.setItem('ransom_session', JSON.stringify({ pin: game.pin, nickname: myNick }));
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
      // If auto-join fails, clear the session so we don't loop forever
      sessionStorage.removeItem('ransom_session');
      
      // Only alert if we aren't just loading the page (avoids annoying popups if session expired)
      if (gameState !== 'HOME') alert(message); 
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
      <MusicPlayer />
      {renderScene()}
    </div>
  );
}

export default App;