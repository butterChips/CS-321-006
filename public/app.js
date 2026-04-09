// Easier to replace the element id if we change it.
const dom = {
    home_name: () => document.getElementById('home-name'),
    join_code: () => document.getElementById('join-code'),
    home_err: () => document.getElementById('home-err'),
    lobby_code: () => document.getElementById('lobby-code'),
    lobby_players: () => document.getElementById('lobby-players'),
    lobby_topic_btns: () => document.getElementById('topic-btns'),
    lobby_err: () => document.getElementById('lobby-err'),
    reveal_role: () => document.getElementById('reveal-role'),
    reveal_word: () => document.getElementById('reveal-word'),
    reveal_topic: () => document.getElementById('reveal-topic'),
    game_topic: () => document.getElementById('game-topic'),
    game_info: () => document.getElementById('game-info'),
    word_table: () => document.getElementById('word-table'),
    clue_area: () => document.getElementById('clue-area'),
    clue_input: () => document.getElementById('clue-input'),
    clue_err: () => document.getElementById('clue-err'),
    clue_list: () => document.getElementById('clue-list'),
    proceed_btn: () => document.getElementById('proceed-btn'),
    vote_players: () => document.getElementById('vote-players'),
    vote_err: () => document.getElementById('vote-err'),
    result_banner: () => document.getElementById('result-banner'),
    result_chameleon: () => document.getElementById('result-chameleon'),
    result_word: () => document.getElementById('result-word'),
    result_outcome: () => document.getElementById('result-outcome'),
    result_votes: () => document.getElementById('result-votes')
};

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
    votedFor: null
};

const TOPICS = {
    Animals: [
        'Lion',
        'Tiger',
        'Bear',
        'Eagle',
        'Shark',
        'Wolf',
        'Dolphin',
        'Elephant',
        'Penguin',
        'Fox',
        'Deer',
        'Rabbit',
        'Owl',
        'Cobra',
        'Gorilla',
        'Cheetah'
    ],
    Food: [
        'Pizza',
        'Sushi',
        'Burger',
        'Pasta',
        'Tacos',
        'Ramen',
        'Steak',
        'Salad',
        'Curry',
        'Sandwich',
        'Pancakes',
        'Lobster',
        'Dumplings',
        'Ice Cream',
        'Waffles',
        'Soup'
    ],
    Sports: [
        'Soccer',
        'Basketball',
        'Tennis',
        'Baseball',
        'Swimming',
        'Golf',
        'Boxing',
        'Hockey',
        'Volleyball',
        'Cycling',
        'Gymnastics',
        'Rugby',
        'Skiing',
        'Wrestling',
        'Archery',
        'Rowing'
    ],
    Countries: [
        'France',
        'Japan',
        'Brazil',
        'Canada',
        'Egypt',
        'India',
        'Mexico',
        'Australia',
        'Italy',
        'Germany',
        'China',
        'Russia',
        'Spain',
        'Nigeria',
        'Argentina',
        'Thailand'
    ],
    Movies: [
        'Avatar',
        'Titanic',
        'Inception',
        'Jaws',
        'Rocky',
        'Alien',
        'Grease',
        'Shrek',
        'Gladiator',
        'Frozen',
        'Interstellar',
        'Joker',
        'Parasite',
        'Matrix',
        'Clueless',
        'Top Gun'
    ],
    Instruments: [
        'Guitar',
        'Piano',
        'Drums',
        'Violin',
        'Trumpet',
        'Flute',
        'Cello',
        'Saxophone',
        'Harp',
        'Banjo',
        'Clarinet',
        'Ukulele',
        'Trombone',
        'Accordion',
        'Oboe',
        'Mandolin'
    ],
    Colors: [
        'Red',
        'Blue',
        'Green',
        'Yellow',
        'Purple',
        'Orange',
        'Pink',
        'Black',
        'White',
        'Brown',
        'Gray',
        'Cyan',
        'Magenta',
        'Indigo',
        'Teal',
        'Gold'
    ],
    Vegetables: [
        'Carrot',
        'Broccoli',
        'Spinach',
        'Potato',
        'Tomato',
        'Cucumber',
        'Onion',
        'Pepper',
        'Corn',
        'Celery',
        'Asparagus',
        'Zucchini',
        'Kale',
        'Beet',
        'Artichoke',
        'Pumpkin'
    ]
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
        'Lion',
        'Tiger',
        'Bear',
        'Eagle',
        'Shark',
        'Wolf',
        'Dolphin',
        'Elephant',
        'Penguin',
        'Fox',
        'Deer',
        'Rabbit',
        'Owl',
        'Cobra',
        'Gorilla',
        'Cheetah'
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
    document.querySelectorAll('section').forEach((section) => {
        section.classList.remove('active');
    });
    const section = document.querySelector(`section#${sectionId}`);
    if (section) {
        section.classList.add('active');
    }
}

function setError(id, msg) {
    const errorMap = {
        'home-err': dom.home_err,
        'lobby-err': dom.lobby_err,
        'clue-err': dom.clue_err,
        'vote-err': dom.vote_err
    };
    const accessor = errorMap[id];
    const el = accessor ? accessor() : null;
    if (el) {
        el.textContent = msg;
    }
}

function renderHome() {
    setError('home-err', '');
}

function createLobby() {
    demoState.playerName = dom.home_name().value.trim() || 'Joe';
    renderLobby();
    show('s-lobby');
}

function joinLobby() {
    demoState.playerName = dom.home_name().value.trim() || 'Guest';
    renderLobby();
    show('s-lobby');
}

function renderLobby() {
    dom.lobby_code().textContent = demoState.roomCode;

    dom.lobby_players().innerHTML = demoState.players
        .map(
            (player) =>
                `<li>${player.name}${player.id === demoState.myId ? ' <span class="muted">(you)</span>' : ''}</li>`
        )
        .join('');

    dom.lobby_topic_btns().innerHTML = demoState.topics
        .map(
            (topic) => `
      <button class="topic-btn ${demoState.selectedTopic === topic ? 'selected' : ''}" onclick="selectTopic('${topic}')">
        ${topic}
      </button>
    `
        )
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

    dom.reveal_role().textContent = isChameleon
        ? 'You are the Chameleon'
        : 'You are a Player';

    dom.reveal_word().textContent = isChameleon
        ? "You don't know the secret word — blend in."
        : 'Secret word: ' + demoState.secretWord;

    dom.reveal_topic().textContent = 'Topic: ' + demoState.topic;
}

function goGame() {
    renderGame();
    show('s-game');
}

function renderGame() {
    const isChameleon = demoState.myRole === 'chameleon';

    dom.game_topic().textContent = demoState.topic;
    dom.game_info().textContent = isChameleon
        ? 'You are the Chameleon — try to blend in!'
        : 'Secret word: ' + demoState.secretWord;

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

    dom.word_table().innerHTML = tableHTML;
    dom.clue_input().value = '';
    dom.proceed_btn().style.display = '';
    renderClueList();
    setError('clue-err', '');
}

function submitClue() {
    const input = dom.clue_input();
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
    dom.clue_list().innerHTML = demoState.clues
        .map(
            (clue) =>
                `<div class="clue-row"><span>${clue.playerName}:</span><em>${clue.clue}</em></div>`
        )
        .join('');
}

function goVoting() {
    renderVoting();
    show('s-voting');
}

function renderVoting() {
    demoState.votedFor = null;

    dom.vote_players().innerHTML = demoState.players
        .map(
            (player) => `
      <div class="vote-row">
        <button class="vote-btn" id="vote-${player.id}" onclick="selectVote('${player.id}')">
          ${player.name}
        </button>
      </div>
    `
        )
        .join('');

    setError('vote-err', '');
}

function selectVote(playerId) {
    demoState.votedFor = playerId;

    document.querySelectorAll('.vote-btn').forEach((button) => {
        button.classList.remove('selected');
    });

    const selectedBtn = dom.vote_players().querySelector('#vote-' + playerId);
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
    const chameleonName =
        demoState.players.find((player) => player.id === demoState.chameleonId)
            ?.name || 'Sam';
    const votedForName =
        demoState.players.find((player) => player.id === demoState.votedFor)
            ?.name || 'Unknown';

    dom.result_banner().textContent = chameleonCaught
        ? 'Players Win!'
        : 'Chameleon Wins!';

    dom.result_chameleon().textContent = 'Chameleon: ' + chameleonName;
    dom.result_word().textContent = 'Secret word: ' + demoState.secretWord;
    dom.result_outcome().textContent = chameleonCaught
        ? 'The chameleon was caught.'
        : 'The chameleon escaped.';

    dom.result_votes().innerHTML = `
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
