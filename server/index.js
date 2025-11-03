// --- server/index.js ---

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Load ALL our packs at the start
const promptsNSFW = require('./prompts-nsfw.json');
const wordsNSFW = require('./words-nsfw.json');
const promptsFamily = require('./prompts-family.json');
const wordsFamily = require('./words-family.json');
const jokesFamily = require('./jokes-family.json');
const jokesNSFW = require('./jokes-nsfw.json');

// A helper object to find the right pack
const defaultPacks = {
  nsfw: {
    prompts: promptsNSFW.all,
    words: wordsNSFW
  },
  family: {
    prompts: promptsFamily.all,
    words: wordsFamily
  }
};

// A helper object for jokes
const jokePacks = {
  family: jokesFamily,
  nsfw: jokesNSFW,
  custom: jokesFamily // Default to nsfw jokes for custom games
};

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
  socket.on('createGame', ({ customPrompts, customWords, defaultPack, hostNickname }) => { // Added hostNickname
    const roomPIN = Math.floor(1000 + Math.random() * 9000).toString();
    
    let gamePrompts, gameWords, packName;
    const nickname = hostNickname || 'Host'; // Default if no name is given

    if (defaultPack && defaultPacks[defaultPack]) {
      gamePrompts = [...defaultPacks[defaultPack].prompts];
      gameWords = defaultPacks[defaultPack].words;
      packName = defaultPack;
    } else {
      gamePrompts = customPrompts;
      gameWords = customWords;
      packName = 'custom';
    }

    games[roomPIN] = {
      hostId: socket.id,
      pin: roomPIN,
      players: [{ id: socket.id, nickname: nickname, score: 0 }], // Use the host's nickname
      prompts: gamePrompts,
      words: gameWords,
      packName: packName,
      gameState: 'LOBBY',
      submissions: {},
      currentPrompt: '',
    };

    socket.join(roomPIN);
    console.log(`Game created by ${nickname}, PIN: ${roomPIN}`);
    
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

      socket.emit('joinSuccess', game);
      io.to(pin).emit('playerListUpdate', game.players);
    } else {
      socket.emit('joinError', 'Game not found');
    }
  });

  // --- 3. HOST STARTS A ROUND ---
  socket.on('startGame', ({ pin }) => {
    const game = games[pin];
    if (game && game.hostId === socket.id) {
      
      const promptIndex = Math.floor(Math.random() * game.prompts.length);
      const prompt = game.prompts.splice(promptIndex, 1)[0];
      game.currentPrompt = prompt;
      
      const jokeList = jokePacks[game.packName] || jokePacks.nsfw;
      const randomJoke = jokeList[Math.floor(Math.random() * jokeList.length)];

      game.players.forEach(player => {
        const wordPool = getRandomWords(game.words, 75);
        
        io.to(player.id).emit('newRound', {
          prompt: prompt,
          wordPool: wordPool,
          randomJoke: randomJoke
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
      
      io.to(game.hostId).emit('playerSubmitted', socket.id);
      
      if (Object.keys(game.submissions).length === game.players.length) {
        game.gameState = 'JUDGING';
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
    Object.keys(games).forEach(pin => {
      const game = games[pin];
      if (!game || !game.players) return;
      
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex > -1) {
        game.players.splice(playerIndex, 1);
        io.to(pin).emit('playerListUpdate', game.players);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});