const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// https://socket.io/docs/v4/server-initialization/
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));

const TOPICS = Object.keys(require('./topic-words.json'));
const CODE_LENGTH = 6;

function shuffler(arr) {
    const a = [...arr];
    for (let b = a.length - 1; b > 0; b--) {
        const c = Math.floor(Math.random() * (b + 1));
        [a[b], a[c]] = [a[c], a[b]];
    }
    return a;
}
function createCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

const rooms = {};
// If we were using TS, room interface would be:
// Side note: The word room no longer looks real after staring at it for so long.
/*
interface Room {
    code: string;
    hostId: string;
    phase: 'lobby' | 'game' | 'voting' | 'results';
    topic: string;
    players: { id: string; name: string }[];
    readyIds: Set<string>;
    wordGrid: string[][];
    secretWord: string;
    chameleonId: string | null;
    clues: { playerId: string; playerName: string; clue: string }[];
    votes: { [voterId: string]: targetId };
}
*/

io.on('connection', (socket) => {
    socket.on('createRoom', ({ name }) => {
        if (!name || !name.trim()) {
            return socket.emit('error', 'Enter your name.');
        }
        let code;
        // Ensure there is a unique code for the room
        do {
            code = createCode();
        } while (rooms[code]);

        rooms[code] = {
            code,
            hostId: socket.id,
            phase: 'lobby',
            topic: TOPICS[0],
            players: [{ id: socket.id, name: name.trim() }],
            readyIds: new Set(),
            wordGrid: [],
            secretWord: '',
            chameleonId: null,
            clues: [],
            votes: {}
        };

        socket.join(code);
        socket.emit('roomCreated', {
            code,
            players: rooms[code].players,
            topics: TOPICS,
            topic: rooms[code].topic
        });
    });

    socket.on('joinRoom', ({ name, code }) => {
        if (!name || !name.trim()) {
            return socket.emit('error', 'Enter your name.');
        }
        if (!code || !code.trim()) {
            return socket.emit('error', 'Enter your room code.');
        }
        const room = rooms[code];
        if (!room) {
            return socket.emit('error', 'Room not found.');
        }
        if (room.players.some((p) => p.id === socket.id)) {
            return socket.emit('error', 'You are already in this room.');
        }
        if (room.phase !== 'lobby') {
            return socket.emit('error', 'Game in progress.');
        }
        room.players.push({ id: socket.id, name: name.trim() });
        socket.join(code);
        // https://socket.io/docs/v4/server-api/#servertoroom
        io.to(code).emit('playerJoined', { players: room.players });
    });

    socket.on('startGame', ({ code }) => {
        const room = rooms[code];
        if (!room) {
            return socket.emit('error', 'Room not found.');
        }
        if (room.hostId !== socket.id) {
            return socket.emit('error', 'Only the host can start the game.');
        }
        if (room.players.length < 3) {
            return socket.emit('error', 'At least 3 players required.');
        }

        const words = shuffler(require('./topic-words.json')[room.topic]);
        room.wordGrid = words.slice(0, 16);
        room.secretWord = room.wordGrid[Math.floor(Math.random() * room.wordGrid.length)];
        room.chameleonId = room.players[Math.floor(Math.random() * room.players.length)].id;
        room.clues = [];
        room.votes = {};
        room.phase = 'reveal';

        room.players.forEach(({ id }) => {
            const isChameleon = id === room.chameleonId;
            io.to(id).emit('gameStarted', {
                topic: room.topic,
                wordGrid: room.wordGrid,
                secretWord: isChameleon ? null : room.secretWord,
                isChameleon,
                players: room.players
            });
        });
    });

    socket.on('selectTopic', ({ code, topic }) => {
        const room = rooms[code];
        if (!room || room.hostId !== socket.id || !TOPICS.includes(topic)) {
            return;
        }
        room.topic = topic;
        io.to(code).emit('topicSelected', { topic });
    });

    socket.on('playerReady', ({ code }) => {
        const room = rooms[code];
        if (!room) {
            return;
        }

        room.readyIds.add(socket.id);

        if (room.readyIds.size === room.players.length) {
            room.phase = 'game';
            room.idReadyIds.clear();
            io.to(code).emit('allPlayersReady');
        }
    });

    /*
  The method does the following:
  - verify the room exists
  - gets the current player from socket.id
  - validates the clue
  - saves the clue in room.clues
  - broadcasts new clues
  - when all clues are submitted by each player, emits allCluesIn
  */
    socket.on('submitClue', ({ code, clue }) => {
        const room = rooms[code];
        if (!room || room.phase !== 'game') {
            return;
        }

        const player = room.players.find((p) => p.id === socket.id);
        if (!player) {
            return;
        }

        const trimmedClue = (clue || '').trim();
        if (!trimmedClue) {
            return socket.emit('clueError', 'Enter a clue.');
        }

        if (trimmedClue.split(/\s+/).length > 1) {
            return socket.emit('clueError', 'One word only.');
        }

        if (room.clues.find((c) => c.playerId === socket.id)) {
            return socket.emit('clueError', 'Already submitted.');
        }

        room.clues.push({
            playerId: socket.id,
            playerName: player.Name,
            clue: trimmedClue
        });

        io.to(code).emit('clueAdded', { clues: room.clues });

        if (room.clues.length === room.players.length) {
            io.to(code).emit('allCluesIn');
        }
    });

    /*
  The method does the following:
  - determines if the room is initialized
  - switches the phase of the room to the voting phase
  - creates a collection of votes that will store who each person
    is voting for
  - finally emits 'votingStarted' to start votes
  */
    socket.on('goVoting', ({ code }) => {
        const room = rooms[code];
        if (!room || room.hostId != socket.id) return;
        room.phase = 'voting';
        room.votes = {};
        io.to(code).emit('votingStarted', { players: room.players });
    });

    /*
  - checks room exists
  - validates that the target player exists
  - stores the vote
  - once all players votes, tallies votes
  - finds the accused player through sorting
  - builds voteList
  - broadcasts the results event to the whole room
  */
    socket.on('submitVote', ({ code }) => {
        const room = rooms[code];
        if (!room || room.hostId != socket.id) return;
        if (!room.players.find((p) => p.id === targetId)) return;
        room.votes[socket.id] = targetId;

        if (Object.keys(room.votes).length === room.players.length) {
            const tally = {};
            for (const v of Object.values(room.votes))
                tally[v] = (tally[v] || 0) + 1;
            const accused = Object.entries(tally).sort(
                (a, b) => b[1] - a[1]
            )[0][0];
            room.phase = 'results';

            const voteList = room.players.map((p) => ({
                voterName: p.name,
                targetName:
                    room.players.find((x) => x.id === room.votes[p.id])?.name ||
                    '?'
            }));

            /*
      This handles the broadcasting of the results to the room
      */
            io.to(code).emit('results', {
                chameleonId: room.chameleonId,
                chameleonName: room.players.find((p) => p.id === room.chameleon)
                    ?.name,
                secretWord: room.secretWord,
                chameleonCaught: accused === room.chameleonId,
                voteList
            });
        }
    });

    /*
  The method does the following:
  - checks if the player is the host
  - resets the round-specific data
  - keeps the room and players
  - sends everyone back to the lobby state with backToLobby
  */
    socket.on('playAgain', ({ code }) => {
        const room = rooms[code];
        if (!room || room.hostId !== socket.id) return;
        room.phase = 'lobby';
        room.clues = [];
        room.votes = {};
        room.chameleonId = null;
        room.wordGrid = [];
        room.secretWord = '';
        io.to(code).emit('backToLobby', {
            players: room.players,
            topics: TOPICS,
            topic: room.topic
        });
    });

    socket.on('disconnect', () => {
        for (const code of Object.keys(rooms)) {
            const room = rooms[code];
            // If the player was not in this room then skip
            const playerIndex = room.players.findIndex((p) => p.id === socket.id);
            if (playerIndex !== -1) {
                continue;
            }
            room.players.splice(playerIndex, 1);

            // If no players are left then delete the room
            if (room.players.length === 0) {
                delete rooms[code];
                break;
            }

            // If the host left then assign a new host
            if (room.hostId === socket.id) {
                room.hostId = room.players[0].id;
                io.to(room.hostId).emit('hostChanged');
            }
            // Broadcast that the player left
            io.to(code).emit('playerLeft', { players: room.players, leftId: socket.id });
            break;
        }
    });
});
