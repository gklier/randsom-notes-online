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
const promptsResearch = require('./prompts-research.json')
const wordsResearch = require('./words-research.json')
const jokesResearch = require('./jokes-research.json')

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
  },
  research: {
    prompts: promptsResearch.all,
    words: wordsResearch
  }
};

// A helper object for jokes
const jokePacks = {
  family: jokesFamily,
  nsfw: jokesNSFW,
  research: jokesResearch,
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

  // --- LOBBY CHAT MESSAGE HANDLING ---
  socket.on('sendMessage', ({ pin, nickname, message }) => {
    const game = games[pin];
    if (game && game.players.some(p => p.id === socket.id)) {
      console.log(`[${pin}] Chat from ${nickname}: ${message}`);
      const chatMsg = { nickname, message, timestamp: Date.now() };
      game.chatMessages.push(chatMsg);
      io.to(pin).emit('newMessage', chatMsg); // Send single new message
    }
  });
  // -------------------------------------

  // 1. HOST CREATES A GAME
  socket.on('createGame', ({ customPrompts, customWords, defaultPack, hostNickname }) => {
    const roomPIN = Math.floor(1000 + Math.random() * 9000).toString();
    let gamePrompts, gameWords, packName;
    const nickname = hostNickname || 'Host';

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
      hostId: socket.id, // The host of the game initially is the creator
      pin: roomPIN,
      players: [{ id: socket.id, nickname: nickname, score: 0 }],
      prompts: gamePrompts,
      words: gameWords,
      packName: packName,
      gameState: 'LOBBY',
      submissions: {},
      currentPrompt: '',
      chatMessages: initialChatMessages,
      judgeIndex: 0, // <-- NEW: Start judge at the first player
      currentJudgeId: socket.id, // <-- NEW: Initial judge is the host
    };
    socket.join(roomPIN);
    socket.emit('gameCreated', games[roomPIN]);
  });

  // 2. PLAYER JOINS A GAME
  socket.on('joinGame', ({ pin, nickname }) => {
    const game = games[pin];
    if (game) {
      if (game.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
        socket.emit('joinError', 'Nickname already in use in this game.');
        return;
      }

      const newPlayer = { id: socket.id, nickname, score: 0 };
      game.players.push(newPlayer);
      socket.join(pin);

      // Add a system message for player joining
      const joinMsg = { nickname: 'System', message: `${nickname} joined the game.`, timestamp: Date.now() };
      game.chatMessages.push(joinMsg);
      
      socket.emit('joinSuccess', game); 
      io.to(pin).emit('playerListUpdate', game.players);
      io.to(pin).emit('newMessage', joinMsg); // Send join message to everyone
    } else {
      socket.emit('joinError', 'Game not found');
    }
  });

  // 3. HOST (JUDGE) STARTS A ROUND
  socket.on('startGame', ({ pin }) => {
    const game = games[pin];
    // Check if the current socket is the current judge
    if (game && game.currentJudgeId === socket.id) { // <-- UPDATED CHECK
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
      // Only notify the current judge, not the original host
      io.to(game.currentJudgeId).emit('playerSubmitted', socket.id); // <-- UPDATED TARGET
      
      // Check if all players (excluding the judge) have submitted
      const playersSubmitting = game.players.filter(p => p.id !== game.currentJudgeId);
      if (Object.keys(game.submissions).length === playersSubmitting.length) {
        game.gameState = 'JUDGING';
        io.to(pin).emit('showSubmissions', {
          prompt: game.currentPrompt,
          submissions: game.submissions,
          players: game.players,
          currentJudgeId: game.currentJudgeId // <-- Send judge ID to frontend
        });
      }
    }
  });

  // 5. HOST (JUDGE) PICKS WINNER
  socket.on('selectWinner', ({ pin, winnerId }) => {
    const game = games[pin];
    // Check if the current socket is the current judge
    if (game && game.currentJudgeId === socket.id && game.gameState === 'JUDGING') { // <-- UPDATED CHECK
      const winner = game.players.find(p => p.id === winnerId);
      if (winner) winner.score++;
      
      // --- NEW: Rotate the Judge ---
      game.judgeIndex = (game.judgeIndex + 1) % game.players.length;
      game.currentJudgeId = game.players[game.judgeIndex].id;
      // -----------------------------

      // Send the updated game state to all players
      io.to(pin).emit('roundOver', {
        winnerNickname: winner.nickname,
        winningAnswer: game.submissions[winnerId],
        scores: game.players,
        currentJudgeId: game.currentJudgeId, // <-- Send new judge ID
        nextJudgeNickname: game.players.find(p => p.id === game.currentJudgeId).nickname
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
        const leaveMsg = { nickname: 'System', message: `${disconnectedPlayer.nickname} left the game.`, timestamp: Date.now() };
        game.chatMessages.push(leaveMsg);

        // --- NEW: Handle judge leaving ---
        // If the disconnected player was the judge, rotate the judge
        if (disconnectedPlayer.id === game.currentJudgeId) {
          game.judgeIndex = game.judgeIndex % game.players.length; // Ensure index is valid after splice
          if (game.players.length > 0) {
            game.currentJudgeId = game.players[game.judgeIndex].id;
            game.chatMessages.push({ nickname: 'System', message: `The new judge is ${game.players[game.judgeIndex].nickname}.`, timestamp: Date.now() });
          } else {
            // No players left, clear judge
            game.currentJudgeId = null;
            game.judgeIndex = 0;
          }
        } else if (game.players.length > 0 && game.judgeIndex >= game.players.length) {
            // If judge index is now out of bounds due to someone leaving (but not the judge)
            game.judgeIndex = (game.judgeIndex - 1 + game.players.length) % game.players.length;
            game.currentJudgeId = game.players[game.judgeIndex].id;
        }
        // ---------------------------------

        io.to(pin).emit('playerListUpdate', game.players);
        io.to(pin).emit('newMessage', leaveMsg); // Send leave message
        io.to(pin).emit('judgeUpdate', game.currentJudgeId); // Let everyone know who the new judge is
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