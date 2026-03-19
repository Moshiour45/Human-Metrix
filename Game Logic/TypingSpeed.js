// word pool 
const WORD_POOL = [
    "the","be","to","of","and","a","in","that","have","it","for","not","on","with",
    "he","as","you","do","at","this","but","his","by","from","they","we","say","her",
    "she","or","an","will","my","one","all","would","there","their","what","so","up",
    "out","if","about","who","get","which","go","me","when","make","can","like","time",
    "no","just","him","know","take","people","into","year","your","good","some","could",
    "them","see","other","than","then","now","look","only","come","its","over","think",
    "also","back","after","use","two","how","our","work","first","well","way","even",
    "new","want","because","any","these","give","day","most","us","great","between",
    "need","large","often","hand","high","place","hold","turn","while","small","end",
    "put","home","read","set","own","under","last","never","body","child","side","open",
    "begin","life","always","those","both","paper","together","stop","got","run","might",
    "move","try","kind","play","air","away","animal","house","point","page","letter",
    "mother","answer","found","study","still","learn","should","world","keep","light",
    "voice","power","town","fine","drive","short","road","book","carry","eat","friend",
    "idea","fish","mountain","north","once","base","hear","horse","plant","cover","color",
    "food","city","tree","farm","hard","start","story","far","sea","draw","left","late",
    "walk","white","group","music","water","land","different","number","long","little",
    "very","after","word","called","just","where","most","know","get","through","back",
    "much","before","go","good","new","write","our","used","me","man","too","any","same"
];

// generate enough words so timer never runs out
const WORD_COUNT = 200;

// game states (simple state machine)
const PHASE = { IDLE: 'idle', READY: 'ready', TYPING: 'typing', DONE: 'done' };
let phase = PHASE.IDLE;

let words       = [];   // current word list
let currentWord = 0;    // index of active word
let typed       = '';   // what user typed for current word
let wordResults = [];   // true/false per word

let selectedTime  = 30; // selected duration
let timeLeft      = 30;
let timerInterval = null;

// track typing stats
let totalKeys = 0;
let wrongKeys = 0;

// load best score if exists
let bestWpm = parseInt(localStorage.getItem('ts_best_wpm')) || null;

// DOM elements
const stateIdle    = document.getElementById('state-idle');
const stateActive  = document.getElementById('state-active');
const stateResult  = document.getElementById('state-result');
const wordInner    = document.getElementById('word-inner');
const wordArea     = document.getElementById('word-area');
const hiddenInput  = document.getElementById('hidden-input');
const timerDisplay = document.getElementById('timer-display');
const gameBox      = document.getElementById('game-box');
const tryAgainBtn  = document.getElementById('try-again-btn');

const statWpm      = document.getElementById('stat-wpm');
const statBest     = document.getElementById('stat-best');
const statAccuracy = document.getElementById('stat-accuracy');

const resultWpm      = document.getElementById('result-wpm');
const resultAccuracy = document.getElementById('result-accuracy');
const resultCorrect  = document.getElementById('result-correct');
const resultErrors   = document.getElementById('result-errors');
const resultTime     = document.getElementById('result-time');
const perfBadge      = document.getElementById('perf-badge');

// show best score initially
if (bestWpm) statBest.textContent = bestWpm + ' wpm';

// generate random words
function generateWords() {
    const list = [];
    for (let i = 0; i < WORD_COUNT; i++) {
        list.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
    }
    return list;
}

// build words into DOM (each letter wrapped for styling)
function buildWordDOM() {
    wordInner.innerHTML = '';
    wordInner.style.top = '0px'; // reset scroll

    words.forEach((word, wi) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'ts-word';
        wordEl.dataset.wi = wi;

        [...word].forEach((ch, ci) => {
            const span = document.createElement('span');
            span.className = 'ts-letter';
            span.dataset.ci = ci;
            span.textContent = ch;
            wordEl.appendChild(span);
        });

        wordInner.appendChild(wordEl);
        wordInner.appendChild(document.createTextNode(' '));
    });

    // start cursor at first letter
    setCursor(0, 0);
}

// move cursor visually
function setCursor(wordIdx, charIdx) {
    wordInner.querySelectorAll('.cursor').forEach(el => el.classList.remove('cursor'));
    wordInner.querySelectorAll('.cursor-after').forEach(el => el.classList.remove('cursor-after'));

    const wordEl = wordInner.querySelector(`[data-wi="${wordIdx}"]`);
    if (!wordEl) return;

    const letters = wordEl.querySelectorAll('.ts-letter');
    if (charIdx < letters.length) {
        letters[charIdx].classList.add('cursor');
    } else {
        wordEl.classList.add('cursor-after');
    }
}

// update coloring of letters while typing
function repaintWord() {
    const wordEl = wordInner.querySelector(`[data-wi="${currentWord}"]`);
    if (!wordEl) return;

    const target = words[currentWord];

    // remove overflow letters from previous frame
    wordEl.querySelectorAll('.extra').forEach(el => el.remove());

    const letters = wordEl.querySelectorAll('.ts-letter');
    letters.forEach((span, ci) => {
        span.classList.remove('correct', 'wrong', 'cursor');
        if (ci < typed.length) {
            span.classList.add(typed[ci] === target[ci] ? 'correct' : 'wrong');
        }
    });

    // show extra typed chars if user goes beyond word length
    for (let i = target.length; i < typed.length; i++) {
        const extra = document.createElement('span');
        extra.className = 'ts-letter extra';
        extra.textContent = typed[i];
        wordEl.appendChild(extra);
    }

    setCursor(currentWord, typed.length);
    scrollCheck();
}

// auto scroll when user moves to next line
function scrollCheck() {
    const wordEl = wordInner.querySelector(`[data-wi="${currentWord}"]`);
    if (!wordEl) return;

    const areaTop = wordArea.getBoundingClientRect().top;
    const wordTop = wordEl.getBoundingClientRect().top;
    const lineH   = wordArea.offsetHeight / 3;

    if (wordTop - areaTop > lineH + 2) {
        const currentOffset = parseInt(wordInner.style.top || '0');
        wordInner.style.top = (currentOffset - lineH) + 'px';
    }
}

// handle word completion (on space)
function commitWord() {
    if (typed.trim() === '') return;

    const isCorrect = typed === words[currentWord];
    wordResults[currentWord] = isCorrect;

    const wordEl = wordInner.querySelector(`[data-wi="${currentWord}"]`);
    if (wordEl) {
        if (!isCorrect) wordEl.classList.add('wrong-word');
        wordEl.classList.add('committed');
    }

    currentWord++;
    typed = '';
    setCursor(currentWord, 0);
    scrollCheck();
}

// start countdown timer
function startTimer() {
    timeLeft = selectedTime;
    timerDisplay.textContent = timeLeft;
    timerDisplay.classList.remove('timer-danger');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        // highlight last few seconds
        if (timeLeft <= 5) timerDisplay.classList.add('timer-danger');

        // live WPM update
        const elapsed = selectedTime - timeLeft;
        if (elapsed > 0) {
            const liveWpm = Math.round((wordResults.filter(r => r === true).length / elapsed) * 60);
            statWpm.textContent = liveWpm || '--';
        }

        if (timeLeft <= 0) endGame();
    }, 1000);
}

// simple performance tiers
function getBadge(wpm) {
    if (wpm >= 100) return { label: 'Speed Demon',     border: 'border-purple-700', bg: 'bg-purple-950', text: 'text-purple-400' };
    if (wpm >= 70)  return { label: 'Fast',            border: 'border-blue-700',   bg: 'bg-blue-950',   text: 'text-blue-400'   };
    if (wpm >= 50)  return { label: 'Good',            border: 'border-green-700',  bg: 'bg-green-950',  text: 'text-green-400'  };
    if (wpm >= 30)  return { label: 'Average',         border: 'border-yellow-700', bg: 'bg-yellow-950', text: 'text-yellow-400' };
    return                 { label: 'Keep Practicing', border: 'border-red-900',    bg: 'bg-red-950',    text: 'text-red-400'    };
}

// finish game and calculate stats
function endGame() {
    clearInterval(timerInterval);
    phase = PHASE.DONE;
    hiddenInput.blur();

    const correctWords = wordResults.filter(r => r === true).length;
    const wrongWords   = wordResults.filter(r => r === false).length;
    const wpm          = Math.round((correctWords / selectedTime) * 60);

    const accuracy = totalKeys > 0
        ? Math.round(((totalKeys - wrongKeys) / totalKeys) * 100)
        : 100;

    statWpm.textContent      = wpm;
    statAccuracy.textContent = accuracy + '%';

    if (!bestWpm || wpm > bestWpm) {
        bestWpm = wpm;
        localStorage.setItem('ts_best_wpm', bestWpm);
        statBest.textContent = bestWpm + ' wpm';
    }

    resultWpm.textContent      = wpm;
    resultAccuracy.textContent = accuracy + '%';
    resultCorrect.textContent  = correctWords;
    resultErrors.textContent   = wrongWords;
    resultTime.textContent     = selectedTime + 's';

    const badge = getBadge(wpm);
    perfBadge.className   = `px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${badge.border} ${badge.bg} ${badge.text}`;
    perfBadge.textContent = badge.label;

    stateActive.classList.add('hidden');
    stateActive.classList.remove('flex');
    stateResult.classList.remove('hidden');
    stateResult.classList.add('flex');
}

// reset everything back to start
function resetToIdle() {
    clearInterval(timerInterval);
    phase         = PHASE.IDLE;
    currentWord   = 0;
    typed         = '';
    wordResults   = [];
    totalKeys     = 0;
    wrongKeys     = 0;
    timeLeft      = selectedTime;

    timerDisplay.textContent = '--';
    timerDisplay.classList.remove('timer-danger');
    statWpm.textContent      = '--';
    statAccuracy.textContent = '--%';

    hiddenInput.value = '';

    stateResult.classList.add('hidden');
    stateResult.classList.remove('flex');
    stateActive.classList.add('hidden');
    stateActive.classList.remove('flex');
    stateIdle.classList.remove('hidden');
    stateIdle.classList.add('flex');

    gameBox.style.cursor = 'pointer';
}

// start game (idle → ready)
function activateBox() {
    phase = PHASE.READY;
    gameBox.style.cursor = 'text';

    words       = generateWords();
    currentWord = 0;
    typed       = '';
    wordResults = [];
    totalKeys   = 0;
    wrongKeys   = 0;

    stateIdle.classList.add('hidden');
    stateIdle.classList.remove('flex');
    stateResult.classList.add('hidden');
    stateResult.classList.remove('flex');
    stateActive.classList.remove('hidden');
    stateActive.classList.add('flex');

    timerDisplay.textContent = '--';
    timerDisplay.classList.remove('timer-danger');

    buildWordDOM();
    hiddenInput.focus();
}

// click handling
gameBox.addEventListener('click', () => {
    if (phase === PHASE.IDLE) {
        activateBox();
    } else if (phase === PHASE.READY || phase === PHASE.TYPING) {
        hiddenInput.focus();
    }
});

// main typing logic
hiddenInput.addEventListener('keydown', (e) => {

    if (e.key === 'Tab') {
        e.preventDefault();
        resetToIdle();
        return;
    }

    if (phase === PHASE.DONE || phase === PHASE.IDLE) return;

    if (e.key === ' ') {
        e.preventDefault();
        if (typed.length > 0) commitWord();
        return;
    }

    if (e.key === 'Backspace') {
        e.preventDefault();
        if (typed.length > 0) {
            typed = typed.slice(0, -1);
            repaintWord();
        }
        return;
    }

    if (e.key.length === 1) {

        if (phase === PHASE.READY) {
            phase = PHASE.TYPING;
            startTimer();
        }

        const target = words[currentWord];
        totalKeys++;

        const expected = target[typed.length];
        if (!expected || e.key !== expected) wrongKeys++;

        if (typed.length < target.length + 20) {
            typed += e.key;
        }

        repaintWord();
    }
});

// keep textarea empty always
hiddenInput.addEventListener('input', () => {
    hiddenInput.value = '';
});

// retry button
tryAgainBtn.addEventListener('click', () => {
    resetToIdle();
});

// time selection buttons
document.querySelectorAll('.time-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();

        if (phase === PHASE.TYPING) return;

        selectedTime = parseInt(btn.dataset.time);

        document.querySelectorAll('.time-opt').forEach(b => {
            b.classList.remove('bg-gray-800', 'text-white');
            b.classList.add('text-gray-500');
        });
        btn.classList.add('bg-gray-800', 'text-white');
        btn.classList.remove('text-gray-500');

        timerDisplay.textContent = '--';
    });
});