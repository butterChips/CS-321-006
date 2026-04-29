const express = require('express');
const path    = require('path');

const app  = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));

io.on('connection', socket => {

  /*
  The method does the following:
  - verify the room exists
  - gets the current player from socket.id
  - validates the clue
  - saves the clue in room.clues
  - broadcasts new clues
  - when all clues are submitted by each player, emits allCluesIn
  */
  socket.on('submitClue', ({code, clue}) => {
    const room = rooms[code];
    if (!room || room.phase !== 'game'){
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player){
      return;
    }

    const trimmedClue = (clue || '').trim()
    if (!trimmedClue) {
      return socket.emit('clueError', 'Enter a clue.');
    }

    if (trimmedClue.split(/\s+/).length > 1) {
      return socket.emit('clueError', 'One word only.');
    }

    if (room.clues.find(c => c.playerId === socket.id)) {
      return socket.emit('clueError', 'Already submitted.');
    }

    room.clues.push({
      playerId: socket.id, playerName: player.Name, clue: trimmedClue
    });

    io.to(code).emit('clueAdded', {clues: room.clues });
    
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
    if (!room.players.find(p => p.id === targetId)) return;
    room.votes[socket.id] = targetId;

    if (Object.keys(room.votes).length === room.players.length) {
      const tally = {};
      for (const v of Object.values(room.votes)) tally[v] = (tally[v] || 0) + 1;
      const accused = Object.entries(tally).sort((a,b) => b[1] - a[1])[0][0];
      room.phase = 'results';

      const voteList = room.players.map( p => ({
        voterName:   p.name,
        targetName:  room.players.find(x => x.id === room.votes[p.id])?.name || '?',
      }));

      /*
      This handles the broadcasting of the results to the room
      */
      io.to(code).emit('results', {
        chameleonId: room.chameleonId,
        chameleonName: room.players.find(p => p.id === room.chameleon)?.name,
        secretWord: room.secretWord,
        chameleonCaught: accused === room.chameleonId,
        voteList,
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
  
});


  
