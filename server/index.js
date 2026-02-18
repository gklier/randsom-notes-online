// --- server/index.js ---

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

// --- LOAD PACK FILES ---
const promptsNSFW = require('./prompts-nsfw.json');
const wordsNSFW = require('./words-nsfw.json');
const promptsFamily = require('./prompts-family.json');
const wordsFamily = require('./words-family.json');
const jokesFamily = require('./jokes-family.json');
const jokesNSFW = require('./jokes-nsfw.json');
const promptsResearch = require('./prompts-research.json');
const wordsResearch = require('./words-research.json');
const jokesResearch = require('./jokes-research.json');

// --- DATABASE SETUP ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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

// --- DEFAULT PACKS ---
const defaultPacks = {
  nsfw: {
    prompts: Array.isArray(promptsNSFW) ? promptsNSFW : promptsNSFW.all,
    words: Array.isArray(wordsNSFW) ? wordsNSFW : (wordsNSFW.all || wordsNSFW)
  },
  family: {
    prompts: Array.isArray(promptsFamily) ? promptsFamily : promptsFamily.all,
    words: Array.isArray(wordsFamily) ? wordsFamily : (wordsFamily.all || wordsFamily)
  },
  research: {
    prompts: Array.isArray(promptsResearch) ? promptsResearch : (promptsResearch.all || []),
    words: Array.isArray(wordsResearch) ? wordsResearch : (wordsResearch.all || wordsResearch || [])
  }
};

const jokePacks = {
  family: jokesFamily,
  nsfw: jokesNSFW,
  research: jokesResearch,
  custom: jokesFamily
};

// --- EXPRESS + SOCKET.IO SERVER ---
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const games = {};

function getRandomWords(wordList, count) {
  if (!Array.isArray(wordList)) return [];
  const shuffled = [...wordList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// --- HELPER: CHECK IF ROUND IS COMPLETE ---
function checkRoundComplete(game, io) {
    if (game.gameState !== 'SUBMITTING') return;

    const playersSubmitting = game.players.filter(p => 
        p.id !== game.currentJudgeId && p.connected !== false
    );
    
    const activeSubmissions = playersSubmitting.filter(p => game.submissions[p.id]);

    if (activeSubmissions.length === playersSubmitting.length && playersSubmitting.length > 0) {
      game.gameState = 'JUDGING';
      io.to(game.pin).emit('showSubmissions', {
        prompt: game.currentPrompt,
        submissions: game.submissions,
        players: game.players,
        currentJudgeId: game.currentJudgeId
      });
    }
}

app.post('/submit-suggestion', async (req, res) => {
  const { suggestion } = req.body;
  if (!suggestion) return res.status(400).send({ message: 'Suggestion text is required.' });
  try {
    await pool.query('INSERT INTO suggestions(suggestion_text) VALUES($1)', [suggestion]);
    res.status(200).send({ message: 'Suggestion sent successfully!' });
  } catch (error) {
    console.error('Error saving suggestion:', error);
    res.status(500).send({ message: 'Error sending suggestion.' });
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('sendMessage', ({ pin, nickname, message }) => {
    const game = games[pin];
    if (game && game.players.some(p => p.id === socket.id)) {
      const chatMsg = { nickname, message, timestamp: Date.now() };
      game.chatMessages.push(chatMsg);
      io.to(pin).emit('newMessage', chatMsg);
    }
  });

  socket.on('createGame', ({ customPrompts, customWords, defaultPack, hostNickname }) => {
    const roomPIN = Math.floor(1000 + Math.random() * 9000).toString();
    let gamePrompts, gameWords, packName;
    const nickname = hostNickname || 'Host';

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
      players: [{ id: socket.id, nickname, score: 0, connected: true }],
      prompts: gamePrompts,
      words: gameWords,
      packName,
      gameState: 'LOBBY',
      submissions: {},
      currentPrompt: '',
      currentJoke: '',
      chatMessages: [{ nickname: 'System', message: `${nickname} created the game!`, timestamp: Date.now() }],
      judgeIndex: 0,
      currentJudgeId: socket.id
    };

    socket.join(roomPIN);
    socket.emit('gameCreated', games[roomPIN]);
  });

  socket.on('joinGame', ({ pin, nickname }) => {
    const game = games[pin];
    if (!game) return socket.emit('joinError', 'Game not found');

    const existingPlayerIndex = game.players.findIndex(p => p.nickname.toLowerCase() === nickname.toLowerCase());
    
    if (existingPlayerIndex !== -1) {
      const oldSocketId = game.players[existingPlayerIndex].id;
      game.players[existingPlayerIndex].id = socket.id;
      game.players[existingPlayerIndex].connected = true;

      if (game.hostId === oldSocketId) game.hostId = socket.id;
      if (game.currentJudgeId === oldSocketId) game.currentJudgeId = socket.id;
      
      if (game.submissions[oldSocketId]) {
        game.submissions[socket.id] = game.submissions[oldSocketId];
        delete game.submissions[oldSocketId];
      }

      socket.join(pin);

      const responseData = { ...game };
      
      if (game.gameState === 'SUBMITTING') {
         responseData.wordPool = game.players[existingPlayerIndex].currentWordPool || [];
         responseData.prompt = game.currentPrompt; 
         responseData.randomJoke = game.currentJoke;
      } 
      else if (game.gameState === 'JUDGING') {
         responseData.prompt = game.currentPrompt;
      }

      socket.emit('joinSuccess', responseData);

      io.to(pin).emit('playerListUpdate', game.players);
      io.to(pin).emit('judgeUpdate', game.currentJudgeId);
      
      checkRoundComplete(game, io);
      return; 
    }

    const newPlayer = { id: socket.id, nickname, score: 0, connected: true };
    game.players.push(newPlayer);
    socket.join(pin);

    const joinMsg = { nickname: 'System', message: `${nickname} joined the game.`, timestamp: Date.now() };
    game.chatMessages.push(joinMsg);

    socket.emit('joinSuccess', game);
    io.to(pin).emit('playerListUpdate', game.players);
    io.to(pin).emit('newMessage', joinMsg);
  });

  socket.on('startGame', ({ pin }) => {
    const game = games[pin];
    if (!game || game.currentJudgeId !== socket.id) return;

    if (!game.prompts || game.prompts.length === 0) {
      io.to(socket.id).emit('errorMessage', 'No prompts available for this pack.');
      return;
    }

    const promptIndex = Math.floor(Math.random() * game.prompts.length);
    const prompt = game.prompts.splice(promptIndex, 1)[0];
    game.currentPrompt = prompt;

    const jokeList = jokePacks[game.packName] || jokePacks.family;
    const safeJokeList = Array.isArray(jokeList) ? jokeList : ["Why did the chicken cross the road?"];
    const randomJoke = safeJokeList[Math.floor(Math.random() * safeJokeList.length)];
    game.currentJoke = randomJoke;

    game.players.forEach(player => {
      const wordPool = getRandomWords(game.words, 75);
      player.currentWordPool = wordPool;
      io.to(player.id).emit('newRound', { prompt, wordPool, randomJoke });
    });

    game.gameState = 'SUBMITTING';
    game.submissions = {};
  });

  socket.on('submitAnswer', ({ pin, answer }) => {
    const game = games[pin];
    if (!game || game.gameState !== 'SUBMITTING') return;

    game.submissions[socket.id] = answer;
    io.to(game.currentJudgeId).emit('playerSubmitted', socket.id);
    checkRoundComplete(game, io);
  });

  socket.on('selectWinner', ({ pin, winnerId }) => {
    const game = games[pin];
    if (!game || game.currentJudgeId !== socket.id || game.gameState !== 'JUDGING') return;

    const winner = game.players.find(p => p.id === winnerId);
    if (winner) winner.score++;
    
    const winnerName = winner ? winner.nickname : "A Ghost 👻";

    game.judgeIndex = (game.judgeIndex + 1) % game.players.length;
    game.currentJudgeId = game.players[game.judgeIndex].id;

    io.to(pin).emit('roundOver', {
      winnerNickname: winnerName,
      winningAnswer: game.submissions[winnerId],
      scores: game.players,
      currentJudgeId: game.currentJudgeId,
      nextJudgeNickname: game.players.find(p => p.id === game.currentJudgeId).nickname
    });

    game.gameState = 'LOBBY';
    game.submissions = {};
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    Object.keys(games).forEach(pin => {
      const game = games[pin];
      if (!game || !game.players) return;

      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex === -1) return;

      const player = game.players[playerIndex];
      player.connected = false; 

      const leaveMsg = { nickname: 'System', message: `${player.nickname} disconnected (waiting for reconnect).`, timestamp: Date.now() };
      game.chatMessages.push(leaveMsg);

      if (player.id === game.currentJudgeId) {
        game.judgeIndex = (game.judgeIndex + 1) % game.players.length;
        game.currentJudgeId = game.players[game.judgeIndex].id;
        io.to(pin).emit('judgeUpdate', game.currentJudgeId);
      }

      checkRoundComplete(game, io);
      io.to(pin).emit('playerListUpdate', game.players);
      io.to(pin).emit('newMessage', leaveMsg);
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  createSuggestionTable();
});