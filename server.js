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

  
});


  
