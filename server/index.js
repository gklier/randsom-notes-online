// --- server/index.js ---

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

// Load ALL our packs at the start
const promptsNSFW = require('./prompts-nsfw.json');
const wordsNSFW = require('./words-nsfw.json');
const promptsFamily = require('./prompts-family.json');
const wordsFamily = require('./words-family.json');
const jokesFamily = require('./jokes-family.json');
const jokesNSFW = require('./jokes-nsfw.json');

// --- DATABASE SETUP ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createSuggestionTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS suggestions (
      id SERIAL PRIMARY KEY,
      suggestion_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await pool.query(queryText);
    console.log('"suggestions" table is ready.');
  } catch (err) {
    console.error('Error creating suggestions table:', err);
  }
};
// --------------------------

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
  custom: jokesNSFW
};

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const games = {};

function getRandomWords(wordList, count) {
  const shuffled = wordList.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// --- SUGGESTION ENDPOINT ---
app.post('/submit-suggestion', async (req, res) => {
  const { suggestion } = req.body; 

  if (!suggestion) {
    return res.status(400).send({ message: "Suggestion text is required." });
  }

  const queryText = 'INSERT INTO suggestions(suggestion_text) VALUES($1)';
  
  try {
    await pool.query(queryText, [suggestion]);
    console.log('Suggestion saved to database');
    res.status(200).send({ message: "Suggestion sent successfully!" });
  } catch (error) {
    console.error('Error saving suggestion:', error);
    res.status(500).send({ message: "Error sending suggestion." });
  }
});
// -------------------------------


// --- ALL YOUR SOCKET.IO GAME LOGIC ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // --- NEW: LOBBY CHAT MESSAGE HANDLING ---
  socket.on('sendMessage', ({ pin, nickname, message }) => {
    // Only allow messages from players actually in the game room
    const game = games[pin];
    if (game && game.players.some(p => p.id === socket.id)) {
      console.log(`[${pin}] Chat from ${nickname}: ${message}`);
      io.to(pin).emit('newMessage', { nickname, message, timestamp: Date.now() });
    }
  });
  // -------------------------------------

  // 1. HOST CREATES A GAME
  socket.on('createGame', ({ customPrompts, customWords, defaultPack, hostNickname }) => {
    const roomPIN = Math.floor(1000 + Math.random() * 9000).toString();
    let gamePrompts, gameWords, packName;
    const nickname = hostNickname || 'Host';

    // Add initial chat messages for a new game
    const initialChatMessages = [{ nickname: 'System', message: `${nickname} created the game!`, timestamp: Date.now() }];

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
      players: [{ id: socket.id, nickname: nickname, score: 0 }],
      prompts: gamePrompts,
      words: gameWords,
      packName: packName,
      gameState: 'LOBBY',
      submissions: {},
      currentPrompt: '',
      chatMessages: initialChatMessages, // Store chat messages here
    };
    socket.join(roomPIN);
    socket.emit('gameCreated', games[roomPIN]);
  });

  // 2. PLAYER JOINS A GAME
  socket.on('joinGame', ({ pin, nickname }) => {
    const game = games[pin];
    if (game) {
      // Check if player with this nickname already exists in the room
      if (game.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
        socket.emit('joinError', 'Nickname already in use in this game.');
        return;
      }

      const newPlayer = { id: socket.id, nickname, score: 0 };
      game.players.push(newPlayer);
      socket.join(pin);

      // Add a system message for player joining
      game.chatMessages.push({ nickname: 'System', message: `${nickname} joined the game.`, timestamp: Date.now() });
      
      socket.emit('joinSuccess', game); // Send full game state including chat history
      io.to(pin).emit('playerListUpdate', game.players);
      io.to(pin).emit('chatHistory', game.chatMessages); // Send current chat history to all
    } else {
      socket.emit('joinError', 'Game not found');
    }
  });

  // 3. HOST STARTS A ROUND
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

  // 4. PLAYER SUBMITS ANSWER
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

  // 5. HOST PICKS WINNER
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

  // 6. PLAYER DISCONNECTS
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    Object.keys(games).forEach(pin => {
      const game = games[pin];
      if (!game || !game.players) return;
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex > -1) {
        const disconnectedPlayer = game.players[playerIndex];
        game.players.splice(playerIndex, 1);
        
        // Add system message for player leaving
        game.chatMessages.push({ nickname: 'System', message: `${disconnectedPlayer.nickname} left the game.`, timestamp: Date.now() });

        io.to(pin).emit('playerListUpdate', game.players);
        io.to(pin).emit('chatHistory', game.chatMessages); // Update chat history for others
      }
    });
  });
});
// ----------------------------------------------------


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  createSuggestionTable();
});