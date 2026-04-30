const dom = {
    home_name: () => document.getElementById('home-name'),
    join_code: () => document.getElementById('join-code'),
    home_err: () => document.getElementById('home-err'),
    lobby_code: () => document.getElementById('lobby-code'),
    lobby_players: () => document.getElementById('lobby-players'),
    lobby_topic_btns: () => document.getElementById('topic-btns'),
    lobby_err: () => document.getElementById('lobby-err'),
    lobby_start: () => document.getElementById('lobby-start'),
    lobby_waiting: () => document.getElementById('lobby-waiting'),
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
    result_votes: () => document.getElementById('result-votes'),
    play_again_btn: () => document.getElementById('play-again-btn'),
};

let state = {
    playerName: '',
    roomCode: '',
    myId: '',
    isHost: false,
    players: [],
    topic: '',
    topics: [],
    selectedTopic: '',
    wordGrid: [],
    secretWord: null,
    isChameleon: false,
    clues: [],
    votedFor: null,
};

var socket = io();

function show(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    const s = document.getElementById(id);
    if (s) s.classList.add('active');
}

function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function createLobby() {
    const name = dom.home_name().value.trim();
    if (!name) {
        setError('home-err', 'Enter your name.');
        return;
    }
    state.playerName = name;
    socket.emit('createLobby', { name });
}

function joinLobby() {
    const name = dom.home_name().value.trim();
    const code = dom.join_code().value.trim();
    if (!name) {
        setError('home-err', 'Enter your name.');
        return;
    }
    if (!code) {
        setError('home-err', 'Enter a room code.');
        return;
    }
    state.playerName = name;
    socket.emit('joinLobby', { name, code });
}

function renderLobby() {
    dom.lobby_code().textContent = state.roomCode;

    dom.lobby_players().innerHTML = state.players
        .map(p => {
            let item = '<li>' + p.name;
            if (p.id === state.myId) item += ' <span class="muted">(you)</span>';
            if (p.id === state.hostId) item += ' *';
            item += '</li>';
            return item;
        })
        .join('');

    dom.lobby_topic_btns().innerHTML = state.topics
        .map(t => {
            const selected = state.selectedTopic === t ? 'selected' : '';
            return '<button class="topic-btn ' + selected + '" onclick="selectTopic(\'' + t + '\')">' + t + '</button>';
        })
        .join('');

    const startBtn = dom.lobby_start();
    const waitEl = dom.lobby_waiting();
    if (startBtn) startBtn.style.display = state.isHost ? '' : 'none';
    if (waitEl) waitEl.style.display = state.isHost ? 'none' : '';

    setError('lobby-err', '');
}

function selectTopic(topic) {
    if (!state.isHost) return;
    state.selectedTopic = topic;
    socket.emit('selectTopic', { code: state.roomCode, topic });
}

function startGame() {
    setError('lobby-err', '');
    socket.emit('startGame', { code: state.roomCode });
}

function renderReveal() {
    dom.reveal_role().textContent = state.isChameleon ? 'You are the Chameleon' : 'You are a Player';
    dom.reveal_word().textContent = state.isChameleon
        ? "You don't know the secret word - blend in!"
        : 'Secret word: ' + state.secretWord;
    dom.reveal_topic().textContent = 'Topic: ' + state.topic;
}

function goGame() {
    socket.emit('playerReady', { code: state.roomCode });
    show('s-waiting');
}

function renderGame() {
    dom.game_topic().textContent = state.topic;
    dom.game_info().textContent = state.isChameleon
        ? 'You are the Chameleon - try to blend in!'
        : 'Secret word: ' + state.secretWord;

    let html = '';
    for (let r = 0; r < 4; r++) {
        html += '<tr>';
        for (let c = 0; c < 4; c++) {
            const w = state.wordGrid[r * 4 + c];
            const secret = !state.isChameleon && w === state.secretWord;
            html += '<td class="' + (secret ? 'secret' : '') + '">' + w + '</td>';
        }
        html += '</tr>';
    }
    dom.word_table().innerHTML = html;
    dom.clue_input().value = '';
    renderClueList();
    setError('clue-err', '');

    const proceedBtn = dom.proceed_btn();
    if (proceedBtn) proceedBtn.style.display = 'none';
}

function submitClue() {
    const clue = dom.clue_input().value.trim();
    if (!clue) {
        setError('clue-err', 'Enter a clue.');
        return;
    }
    socket.emit('submitClue', { code: state.roomCode, clue });
}

function renderClueList() {
    dom.clue_list().innerHTML = state.clues
        .map(c => '<div class="clue-row"><span>' + c.playerName + ':</span> <em>' + c.clue + '</em></div>')
        .join('');
}

function goVoting() {
    if (!state.isHost) return;
    socket.emit('goVoting', { code: state.roomCode });
}

function renderVoting(players) {
    state.votedFor = null;
    dom.vote_players().innerHTML = players
        .map(p => '<div class="vote-row"><button class="vote-btn" id="vote-' + p.id + '" onclick="selectVote(\'' + p.id + '\')">' + p.name + '</button></div>')
        .join('');
    setError('vote-err', '');
}

function selectVote(playerId) {
    state.votedFor = playerId;
    document.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
    const btn = document.getElementById('vote-' + playerId);
    if (btn) btn.classList.add('selected');
}

function submitVote() {
    if (!state.votedFor) {
        setError('vote-err', 'Select a player first.');
        return;
    }
    socket.emit('submitVote', { code: state.roomCode, targetId: state.votedFor });
    setError('vote-err', '');
}

function renderResults(data) {
    dom.result_banner().textContent = data.chameleonCaught ? 'Players Win!' : 'Chameleon Wins!';
    dom.result_chameleon().textContent = 'Chameleon: ' + data.chameleonName;
    dom.result_word().textContent = 'Secret word: ' + data.secretWord;
    dom.result_outcome().textContent = data.chameleonCaught
        ? 'The chameleon was caught!'
        : 'The chameleon escaped!';
    dom.result_votes().innerHTML = data.voteList
        .map(v => '<li>' + v.voterName + ' -> ' + v.targetName + '</li>')
        .join('');

    const btn = dom.play_again_btn();
    if (btn) btn.style.display = state.isHost ? '' : 'none';
}

function playAgain() {
    socket.emit('playAgain', { code: state.roomCode });
}

function goHome() {
    show('s-home');
    setError('home-err', '');
}

socket.on('joinedLobby', ({ code, playerId, players, topics, topic, isHost }) => {
    state.roomCode = code;
    state.myId = playerId;
    state.players = players;
    state.topics = topics;
    state.selectedTopic = topic;
    state.isHost = isHost;
    state.hostId = players[0]?.id;
    renderLobby();
    show('s-lobby');
});

socket.on('playerJoined', ({ players }) => {
    state.players = players;
    renderLobby();
});

socket.on('playerLeft', ({ players }) => {
    state.players = players;
    renderLobby();
});

socket.on('youAreHost', () => {
    state.isHost = true;
    state.hostId = state.myId;
    renderLobby();
});

socket.on('topicChanged', ({ topic }) => {
    state.selectedTopic = topic;
    renderLobby();
});

socket.on('gameStarted', ({ topic, wordGrid, secretWord, isChameleon, players }) => {
    state.topic = topic;
    state.wordGrid = wordGrid;
    state.secretWord = secretWord;
    state.isChameleon = isChameleon;
    state.players = players;
    state.clues = [];
    renderReveal();
    show('s-reveal');
});

socket.on('allReady', () => {
    renderGame();
    show('s-game');
});

socket.on('clueAdded', ({ clues }) => {
    state.clues = clues;
    renderClueList();
});

socket.on('clueError', (msg) => {
    setError('clue-err', msg);
});

socket.on('allCluesIn', () => {
    const btn = dom.proceed_btn();
    if (btn) btn.style.display = state.isHost ? '' : 'none';
    const waiting = document.getElementById('clue-waiting');
    if (waiting) waiting.style.display = state.isHost ? 'none' : '';
});

socket.on('votingStarted', ({ players }) => {
    renderVoting(players);
    show('s-voting');
});

socket.on('results', (data) => {
    renderResults(data);
    show('s-results');
});

socket.on('backToLobby', ({ players, topics, topic }) => {
    state.players = players;
    state.topics = topics;
    state.selectedTopic = topic;
    renderLobby();
    show('s-lobby');
});

socket.on('err', (msg) => {
    const active = document.querySelector('section.active');
    const id = active ? active.id : '';
    if (id === 's-home') {
        setError('home-err', msg);
    } else if (id === 's-lobby') {
        setError('lobby-err', msg);
    } else {
        alert(msg);
    }
});

window.onload = () => show('s-home');
