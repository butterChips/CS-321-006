let state = {
  playerName: '',
  roomCode: '',
  myId: '',
  players: [],
  topic: '',
  wordGrid: [],
  secretWord: '',
  chameleonId: '',
  myRole: '',
  clues: [],
  selectedTopic: '',
  votedFor: null,
};

const TOPICS = {
  Animals:     ['Lion','Tiger','Bear','Eagle','Shark','Wolf','Dolphin','Elephant','Penguin','Fox','Deer','Rabbit','Owl','Cobra','Gorilla','Cheetah'],
  Food:        ['Pizza','Sushi','Burger','Pasta','Tacos','Ramen','Steak','Salad','Curry','Sandwich','Pancakes','Lobster','Dumplings','Ice Cream','Waffles','Soup'],
  Sports:      ['Soccer','Basketball','Tennis','Baseball','Swimming','Golf','Boxing','Hockey','Volleyball','Cycling','Gymnastics','Rugby','Skiing','Wrestling','Archery','Rowing'],
  Countries:   ['France','Japan','Brazil','Canada','Egypt','India','Mexico','Australia','Italy','Germany','China','Russia','Spain','Nigeria','Argentina','Thailand'],
  Movies:      ['Avatar','Titanic','Inception','Jaws','Rocky','Alien','Grease','Shrek','Gladiator','Frozen','Interstellar','Joker','Parasite','Matrix','Clueless','Top Gun'],
  Instruments: ['Guitar','Piano','Drums','Violin','Trumpet','Flute','Cello','Saxophone','Harp','Banjo','Clarinet','Ukulele','Trombone','Accordion','Oboe','Mandolin'],
  Colors:      ['Red','Blue','Green','Yellow','Purple','Orange','Pink','Black','White','Brown','Gray','Cyan','Magenta','Indigo','Teal','Gold'],
  Vegetables:  ['Carrot','Broccoli','Spinach','Potato','Tomato','Cucumber','Onion','Pepper','Corn','Celery','Asparagus','Zucchini','Kale','Beet','Artichoke','Pumpkin'],
};

const demoState = {
  playerName: 'Joe',
  roomCode: 'AB12CD',
  players: [
    { id: 'p1', name: 'Joe' },
    { id: 'p2', name: 'Mia' },
    { id: 'p3', name: 'Alex' },
    { id: 'p4', name: 'Sam' }
  ],
  topic: 'Animals',
  selectedTopic: 'Animals',
  topics: ['Animals', 'Food', 'Sports', 'Countries'],
  myId: 'p1',
  myRole: 'player',
  secretWord: 'Tiger',
  wordGrid: [
    'Lion', 'Tiger', 'Bear', 'Eagle',
    'Shark', 'Wolf', 'Dolphin', 'Elephant',
    'Penguin', 'Fox', 'Deer', 'Rabbit',
    'Owl', 'Cobra', 'Gorilla', 'Cheetah'
  ],
  clues: [
    { playerId: 'p1', playerName: 'Joe', clue: 'Striped' },
    { playerId: 'p2', playerName: 'Mia', clue: 'Wild' },
    { playerId: 'p3', playerName: 'Alex', clue: 'Fast' }
  ],
  votedFor: null,
  chameleonId: 'p4'
};

function show(sectionId) {
  document.querySelectorAll('section').forEach(section => {section.classList.remove('active');});
  document.getElementById(sectionId).classList.add('active');
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
  }
}

function renderHome() {
  setError('home-err', '');
}

function createLobby() {
  demoState.playerName = document.getElementById('home-name').value.trim() || 'Joe';
  renderLobby();
  show('s-lobby');
}

function joinLobby() {
  demoState.playerName = document.getElementById('home-name').value.trim() || 'Guest';
  renderLobby();
  show('s-lobby');
}

function renderLobby() {
  document.getElementById('lobby-code').textContent = demoState.roomCode;

  document.getElementById('lobby-players').innerHTML = demoState.players
    .map(player => `<li>${player.name}${player.id === demoState.myId ? ' <span class="muted">(you)</span>' : ''}</li>`)
    .join('');

  document.getElementById('topic-btns').innerHTML = demoState.topics
    .map(topic => `
      <button class="topic-btn ${demoState.selectedTopic === topic ? 'selected' : ''}" onclick="selectTopic('${topic}')">
        ${topic}
      </button>
    `)
    .join('');

  setError('lobby-err', '');
}

function selectTopic(topic) {
  demoState.selectedTopic = topic;
  renderLobby();
}

function startGame() {
  demoState.topic = demoState.selectedTopic;
  renderReveal();
  show('s-reveal');
}

function renderReveal() {
  const isChameleon = demoState.myRole === 'chameleon';

  document.getElementById('reveal-role').textContent =
    isChameleon ? 'You are the Chameleon' : 'You are a Player';

  document.getElementById('reveal-word').textContent =
    isChameleon ? "You don't know the secret word — blend in." : 'Secret word: ' + demoState.secretWord;

  document.getElementById('reveal-topic').textContent = 'Topic: ' + demoState.topic;
}

function goGame() {
  renderGame();
  show('s-game');
}

function renderGame() {
  const isChameleon = demoState.myRole === 'chameleon';

  document.getElementById('game-topic').textContent = demoState.topic;
  document.getElementById('game-info').textContent =
    isChameleon ? 'You are the Chameleon — try to blend in!' : 'Secret word: ' + demoState.secretWord;

  let tableHTML = '';

  for (let row = 0; row < 4; row++) {
    tableHTML += '<tr>';
    for (let col = 0; col < 4; col++) {
      const word = demoState.wordGrid[row * 4 + col];
      const isSecret = !isChameleon && word === demoState.secretWord;
      tableHTML += `<td class="${isSecret ? 'secret' : ''}">${word}</td>`;
    }
    tableHTML += '</tr>';
  }

  document.getElementById('word-table').innerHTML = tableHTML;
  document.getElementById('clue-input').value = '';
  document.getElementById('proceed-btn').style.display = '';
  renderClueList();
  setError('clue-err', '');
}

function submitClue() {
  const input = document.getElementById('clue-input');
  const clue = input.value.trim();

  if (!clue) {
    setError('clue-err', 'Enter a clue.');
    return;
  }

  demoState.clues.push({
    playerId: 'me',
    playerName: 'You',
    clue: clue
  });

  input.value = '';
  setError('clue-err', '');
  renderClueList();
}

function renderClueList() {
  document.getElementById('clue-list').innerHTML = demoState.clues
    .map(clue => `<div class="clue-row"><span>${clue.playerName}:</span><em>${clue.clue}</em></div>`)
    .join('');
}

function goVoting() {
  renderVoting();
  show('s-voting');
}

function renderVoting() {
  demoState.votedFor = null;

  document.getElementById('vote-players').innerHTML = demoState.players
    .map(player => `
      <div class="vote-row">
        <button class="vote-btn" id="vote-${player.id}" onclick="selectVote('${player.id}')">
          ${player.name}
        </button>
      </div>
    `)
    .join('');

  setError('vote-err', '');
}

function selectVote(playerId) {
  demoState.votedFor = playerId;

  document.querySelectorAll('.vote-btn').forEach(button => {
    button.classList.remove('selected');
  });

  const selectedBtn = document.getElementById('vote-' + playerId);
  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }
}

function submitVote() {
  if (!demoState.votedFor) {
    setError('vote-err', 'Select a player first.');
    return;
  }

  renderResults();
  show('s-results');
}

function renderResults() {
  const chameleonCaught = demoState.votedFor === demoState.chameleonId;
  const chameleonName = demoState.players.find(player => player.id === demoState.chameleonId)?.name || 'Sam';
  const votedForName = demoState.players.find(player => player.id === demoState.votedFor)?.name || 'Unknown';

  document.getElementById('result-banner').textContent =
    chameleonCaught ? 'Players Win!' : 'Chameleon Wins!';

  document.getElementById('result-chameleon').textContent = 'Chameleon: ' + chameleonName;
  document.getElementById('result-word').textContent = 'Secret word: ' + demoState.secretWord;
  document.getElementById('result-outcome').textContent =
    chameleonCaught ? 'The chameleon was caught.' : 'The chameleon escaped.';

  document.getElementById('result-votes').innerHTML = `
    <li>You → ${votedForName}</li>
    <li>Mia → Sam</li>
    <li>Alex → Sam</li>
    <li>Sam → Joe</li>
  `;
}

function playAgain() {
  demoState.votedFor = null;
  renderLobby();
  show('s-lobby');
}

function goHome() {
  renderHome();
  show('s-home');
}

window.onload = function () {
  renderHome();
  show('s-home');
};
