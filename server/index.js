// --- server/index.js ---

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Load our default words and prompts
const defaultPrompts = require('./prompts.json');
const defaultWords = require('./words.json');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const games = {}; // Stores all active game rooms

function getRandomWords(wordList, count) {
  const shuffled = wordList.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // --- 1. HOST CREATES A GAME ---
  // Host sends custom words and prompts
  socket.on('createGame', ({ customPrompts, customWords, useDefault }) => {
    const roomPIN = Math.floor(1000 + Math.random() * 9000).toString();
    
    let gamePrompts = customPrompts;
    let gameWords = customWords;

    // If the host wants to use defaults (or sent empty lists)
    if (useDefault || (!customPrompts?.length) || (!customWords?.length)) {
      gamePrompts = defaultPrompts.all; // Use the 'all' category from your JSON
      gameWords = defaultWords;
    }

    games[roomPIN] = {
      hostId: socket.id,
      pin: roomPIN,
      players: [{ id: socket.id, nickname: 'Host', score: 0 }],
      prompts: gamePrompts, // Store the custom prompts
      words: gameWords,     // Store the custom words
      gameState: 'LOBBY',
      submissions: {},
      currentPrompt: '',
    };

    socket.join(roomPIN);
    console.log(`Game created by ${socket.id}, PIN: ${roomPIN}`);
    
    // Send game data back to host
    socket.emit('gameCreated', games[roomPIN]);
  });

  // --- 2. PLAYER JOINS A GAME ---
  socket.on('joinGame', ({ pin, nickname }) => {
    const game = games[pin];
    if (game) {
      const newPlayer = { id: socket.id, nickname, score: 0 };
      game.players.push(newPlayer);
      socket.join(pin);
      console.log(`Player ${nickname} joined room ${pin}`);

      // Send success to the joining player
      socket.emit('joinSuccess', game);
      
      // Send update to everyone else in the room
      io.to(pin).emit('playerListUpdate', game.players);
    } else {
      socket.emit('joinError', 'Game not found');
    }
  });

  // --- 3. HOST STARTS A ROUND ---
  socket.on('startGame', ({ pin }) => {
    const game = games[pin];
    if (game && game.hostId === socket.id) {
      
      // 1. Pick a random prompt from the game's stored list
      const promptIndex = Math.floor(Math.random() * game.prompts.length);
      const prompt = game.prompts.splice(promptIndex, 1)[0]; // Pick and remove prompt
      game.currentPrompt = prompt;

      // 2. For each player, generate a random word pool from the game's stored list
      game.players.forEach(player => {
        const wordPool = getRandomWords(game.words, 75);
        
        // 3. Emit the prompt to everyone, and the unique words to each player
        io.to(player.id).emit('newRound', {
          prompt: prompt,
          wordPool: wordPool,
        });
      });
      
      game.gameState = 'SUBMITTING';
      game.submissions = {};
    }
  });

  // --- 4. PLAYER SUBMITS ANSWER ---
  socket.on('submitAnswer', ({ pin, answer }) => {
    const game = games[pin];
    if (game && game.gameState === 'SUBMITTING') {
      game.submissions[socket.id] = answer;
      
      // Tell host someone submitted
      io.to(game.hostId).emit('playerSubmitted', socket.id);
      
      // Check if all players have submitted
      if (Object.keys(game.submissions).length === game.players.length) {
        game.gameState = 'JUDGING';
        // Send all submissions to everyone
        io.to(pin).emit('showSubmissions', {
          prompt: game.currentPrompt,
          submissions: game.submissions,
          players: game.players
        });
      }
    }
  });

  // --- 5. HOST PICKS WINNER ---
  socket.on('selectWinner', ({ pin, winnerId }) => {
    const game = games[pin];
    if (game && game.hostId === socket.id && game.gameState === 'JUDGING') {
      
      const winner = game.players.find(p => p.id === winnerId);
      if (winner) winner.score++;
      
      io.to(pin).emit('roundOver', {
        winnerNickname: winner.nickname,
        winningAnswer: game.submissions[winnerId],
        scores: game.players
      });
      
      game.gameState = 'LOBBY';
      game.submissions = {};
    }
  });

  // --- 6. PLAYER DISCONNECTS ---
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Find which game the player was in and remove them
    Object.keys(games).forEach(pin => {
      const game = games[pin];
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex > -1) {
        game.players.splice(playerIndex, 1);
        // If host disconnects, you could end the game
        // For now, just update the player list
        io.to(pin).emit('playerListUpdate', game.players);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});