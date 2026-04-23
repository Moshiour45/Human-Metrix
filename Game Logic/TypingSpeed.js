// ─────────────────────────────────────────────────────────────────────────────
// Keyboard detection
// A device is considered "no keyboard" when ALL three signals fire together:
//   1. It has touch hardware          (maxTouchPoints > 0 or ontouchstart)
//   2. Primary pointer is coarse      (finger, not mouse)
//   3. No hover capability            (no mouse present)
// This avoids false-positives on touch-screen laptops (Surface, touch MacBook),
// where pointer is "fine" and hover is available even though touch exists.
// ─────────────────────────────────────────────────────────────────────────────
const NO_KEYBOARD = (function () {
    const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    const coarse   = window.matchMedia('(pointer: coarse)').matches;
    const noHover  = window.matchMedia('(hover: none)').matches;
    return hasTouch && coarse && noHover;
}());

// ─────────────────────────────────────────────────────────────────────────────
// Word pool & constants
// ─────────────────────────────────────────────────────────────────────────────
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

const WORD_COUNT = 200;

// ─────────────────────────────────────────────────────────────────────────────
// Game state
// ─────────────────────────────────────────────────────────────────────────────
const PHASE = { IDLE: 'idle', READY: 'ready', TYPING: 'typing', DONE: 'done' };
let phase = PHASE.IDLE;

let words       = [];
let currentWord = 0;
let typed       = '';
let wordResults = [];

let selectedTime  = 30;
let timeLeft      = 30;
let timerInterval = null;

let totalKeys = 0;
let wrongKeys = 0;

let bestWpm = parseInt(localStorage.getItem('ts_best_wpm')) || null;

// ─────────────────────────────────────────────────────────────────────────────
// DOM references
// ─────────────────────────────────────────────────────────────────────────────
const stateNoKb    = document.getElementById('state-no-keyboard');
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: show exactly one panel, hide all others
// ─────────────────────────────────────────────────────────────────────────────
function showPanel(panelEl) {
    [stateNoKb, stateIdle, stateActive, stateResult].forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
    });
    panelEl.classList.remove('hidden');
    panelEl.classList.add('flex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialise on page load
// ─────────────────────────────────────────────────────────────────────────────
(function init() {
    if (bestWpm) statBest.textContent = bestWpm + ' wpm';

    if (NO_KEYBOARD) {
        // Lock the game box — nothing interactive should work
        gameBox.style.cursor = 'default';
        showPanel(stateNoKb);
    } else {
        gameBox.style.cursor = 'pointer';
        showPanel(stateIdle);
    }
}());

// ─────────────────────────────────────────────────────────────────────────────
// Word generation & DOM build
// ─────────────────────────────────────────────────────────────────────────────
function generateWords() {
    const list = [];
    for (let i = 0; i < WORD_COUNT; i++) {
        list.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
    }
    return list;
}

function buildWordDOM() {
    wordInner.innerHTML  = '';
    wordInner.style.top  = '0px';

    words.forEach((word, wi) => {
        const wordEl = document.createElement('span');
        wordEl.className  = 'ts-word';
        wordEl.dataset.wi = wi;

        [...word].forEach((ch, ci) => {
            const span = document.createElement('span');
            span.className  = 'ts-letter';
            span.dataset.ci = ci;
            span.textContent = ch;
            wordEl.appendChild(span);
        });

        wordInner.appendChild(wordEl);
        wordInner.appendChild(document.createTextNode(' '));
    });

    setCursor(0, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cursor
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Repaint current word
// ─────────────────────────────────────────────────────────────────────────────
function repaintWord() {
    const wordEl = wordInner.querySelector(`[data-wi="${currentWord}"]`);
    if (!wordEl) return;

    const target = words[currentWord];

    wordEl.querySelectorAll('.extra').forEach(el => el.remove());

    const letters = wordEl.querySelectorAll('.ts-letter');
    letters.forEach((span, ci) => {
        span.classList.remove('correct', 'wrong', 'cursor');
        if (ci < typed.length) {
            span.classList.add(typed[ci] === target[ci] ? 'correct' : 'wrong');
        }
    });

    for (let i = target.length; i < typed.length; i++) {
        const extra = document.createElement('span');
        extra.className  = 'ts-letter extra';
        extra.textContent = typed[i];
        wordEl.appendChild(extra);
    }

    setCursor(currentWord, typed.length);
    scrollCheck();
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-scroll
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Commit word on spacebar
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Timer
// ─────────────────────────────────────────────────────────────────────────────
function startTimer() {
    timeLeft = selectedTime;
    timerDisplay.textContent = timeLeft;
    timerDisplay.classList.remove('timer-danger');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 5) timerDisplay.classList.add('timer-danger');

        const elapsed = selectedTime - timeLeft;
        if (elapsed > 0) {
            const liveWpm = Math.round((wordResults.filter(r => r === true).length / elapsed) * 60);
            statWpm.textContent = liveWpm || '--';
        }

        if (timeLeft <= 0) endGame();
    }, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Performance badge
// ─────────────────────────────────────────────────────────────────────────────
function getBadge(wpm) {
    if (wpm >= 100) return { label: 'Speed Demon',     border: 'border-purple-700', bg: 'bg-purple-950', text: 'text-purple-400' };
    if (wpm >= 70)  return { label: 'Fast',            border: 'border-blue-700',   bg: 'bg-blue-950',   text: 'text-blue-400'   };
    if (wpm >= 50)  return { label: 'Good',            border: 'border-green-700',  bg: 'bg-green-950',  text: 'text-green-400'  };
    if (wpm >= 30)  return { label: 'Average',         border: 'border-yellow-700', bg: 'bg-yellow-950', text: 'text-yellow-400' };
    return                 { label: 'Keep Practicing', border: 'border-red-900',    bg: 'bg-red-950',    text: 'text-red-400'    };
}

// ─────────────────────────────────────────────────────────────────────────────
// End game
// ─────────────────────────────────────────────────────────────────────────────
function endGame() {
    clearInterval(timerInterval);
    phase = PHASE.DONE;
    hiddenInput.blur();

    const correctWords = wordResults.filter(r => r === true).length;
    const wrongWords   = wordResults.filter(r => r === false).length;
    const wpm          = Math.round((correctWords / selectedTime) * 60);
    const accuracy     = totalKeys > 0
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

    showPanel(stateResult);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset — always returns to no-keyboard panel on touch-only devices
// ─────────────────────────────────────────────────────────────────────────────
function resetToIdle() {
    clearInterval(timerInterval);

    phase       = PHASE.IDLE;
    currentWord = 0;
    typed       = '';
    wordResults = [];
    totalKeys   = 0;
    wrongKeys   = 0;
    timeLeft    = selectedTime;

    timerDisplay.textContent = '--';
    timerDisplay.classList.remove('timer-danger');
    statWpm.textContent      = '--';
    statAccuracy.textContent = '--%';
    hiddenInput.value        = '';

    if (NO_KEYBOARD) {
        // Touch-only: always land back on the no-keyboard screen
        gameBox.style.cursor = 'default';
        showPanel(stateNoKb);
    } else {
        gameBox.style.cursor = 'pointer';
        showPanel(stateIdle);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Activate (idle → ready)
// ─────────────────────────────────────────────────────────────────────────────
function activateBox() {
    if (NO_KEYBOARD) return;   // should never reach here, but belt-and-braces

    phase = PHASE.READY;
    gameBox.style.cursor = 'text';

    words       = generateWords();
    currentWord = 0;
    typed       = '';
    wordResults = [];
    totalKeys   = 0;
    wrongKeys   = 0;

    timerDisplay.textContent = '--';
    timerDisplay.classList.remove('timer-danger');

    showPanel(stateActive);
    buildWordDOM();
    hiddenInput.focus();
}

// ─────────────────────────────────────────────────────────────────────────────
// Event listeners
// ─────────────────────────────────────────────────────────────────────────────

// Game box click
gameBox.addEventListener('click', () => {
    if (NO_KEYBOARD) return;
    if (phase === PHASE.IDLE) {
        activateBox();
    } else if (phase === PHASE.READY || phase === PHASE.TYPING) {
        hiddenInput.focus();
    }
});

// Typing
hiddenInput.addEventListener('keydown', (e) => {
    if (NO_KEYBOARD) return;

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

        const target   = words[currentWord];
        const expected = target[typed.length];
        totalKeys++;
        if (!expected || e.key !== expected) wrongKeys++;

        if (typed.length < target.length + 20) {
            typed += e.key;
        }

        repaintWord();
    }
});

// Keep textarea always empty (prevent system autocomplete interfering)
hiddenInput.addEventListener('input', () => {
    hiddenInput.value = '';
});

// Try Again button
tryAgainBtn.addEventListener('click', () => {
    if (NO_KEYBOARD) return;   // silently ignore on touch-only devices
    resetToIdle();
});

// Time selector buttons
document.querySelectorAll('.time-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (NO_KEYBOARD) return;
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