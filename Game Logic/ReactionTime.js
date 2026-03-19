// Reaction Time Game Logic

const STATE = { IDLE: 'idle', WAITING: 'waiting', READY: 'ready', RESULT: 'result' };
let currentState = STATE.IDLE;
let startTime = null;
let waitTimer = null;

// Load persisted stats from localStorage
let tries = parseInt(localStorage.getItem('rt_tries')) || 0;
let best = parseInt(localStorage.getItem('rt_best')) || null;

const gameBox     = document.getElementById('game-box');
const innerBox    = gameBox.querySelector('.rounded-xl');
const idleState   = document.getElementById('idle-state');
const resultState = document.getElementById('result-state');
const reactionNum = document.getElementById('reaction-number');
const perfBadge   = document.getElementById('perf-badge');
const statLast    = document.getElementById('stat-last');
const statBest    = document.getElementById('stat-best');
const statTries   = document.getElementById('stat-tries');
const tryAgainBtn = document.getElementById('try-again-btn');

if (tryAgainBtn) tryAgainBtn.style.display = 'none';

// Restore stats display on page load
statTries.textContent = tries;
if (best !== null) statBest.textContent = best + ' ms';

// Box colours

function setBoxDefault() {
    innerBox.style.transition = 'background-color 0.3s ease';
    innerBox.classList.remove('bg-blue-600', 'bg-red-950');
    innerBox.classList.add('bg-gray-950');
}

function setBoxBlue() {
    innerBox.style.transition = 'background-color 0.05s ease';
    innerBox.classList.remove('bg-gray-950', 'bg-red-950');
    innerBox.classList.add('bg-blue-600');
}

function setBoxRed() {
    innerBox.style.transition = 'background-color 0.2s ease';
    innerBox.classList.remove('bg-gray-950', 'bg-blue-600');
    innerBox.classList.add('bg-red-950');
}

// Panels

function showIdle() {
    idleState.classList.remove('hidden');
    idleState.classList.add('flex');
    resultState.classList.add('hidden');
    resultState.classList.remove('flex');
}

function showResult() {
    idleState.classList.add('hidden');
    idleState.classList.remove('flex');
    resultState.classList.remove('hidden');
    resultState.classList.add('flex');
}

// Helpers

function setIdleText(html) {
    idleState.innerHTML = html;
}

function resetIdleText() {
    setIdleText(`<p class="text-gray-500 text-xl sm:text-xl lg:text-2xl font-medium tracking-wide select-none">
      Click anywhere to start the game
    </p>`);
}

function getBadge(ms) {
    if (ms < 200) return { label: 'Superhuman', border: 'border-purple-700', bg: 'bg-purple-950', text: 'text-purple-400' };
    if (ms < 250) return { label: 'Lightning',  border: 'border-blue-700',   bg: 'bg-blue-950',   text: 'text-blue-400'   };
    if (ms < 300) return { label: 'Fast',        border: 'border-green-700',  bg: 'bg-green-950',  text: 'text-green-400'  };
    if (ms < 380) return { label: 'Average',     border: 'border-yellow-700', bg: 'bg-yellow-950', text: 'text-yellow-400' };
    return               { label: 'Slow',        border: 'border-red-900',    bg: 'bg-red-950',    text: 'text-red-400'    };
}

function randomDelay() {
    return 1500 + Math.random() * 3500;
}

// Save stats to localStorage

function saveStats() {
    localStorage.setItem('rt_tries', tries);
    if (best !== null) localStorage.setItem('rt_best', best);
}

// State transitions

function goToWaiting() {
    currentState = STATE.WAITING;
    setBoxDefault();
    showIdle();
    setIdleText(`
      <div class="flex flex-col items-center gap-3">
        <div class="flex gap-1.5 mb-1">
          <span class="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style="animation-delay:0s"></span>
          <span class="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style="animation-delay:0.15s"></span>
          <span class="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style="animation-delay:0.3s"></span>
        </div>
        <p class="text-gray-400 text-xl sm:text-2xl font-semibold tracking-wide select-none">
          Wait for it to turn blue…
        </p>
        <p class="text-gray-700 text-xs font-medium tracking-widest uppercase select-none">Don't click yet</p>
      </div>`);

    waitTimer = setTimeout(goToReady, randomDelay());
}

function goToReady() {
    currentState = STATE.READY;
    setBoxBlue();
    showIdle();
    setIdleText(`
      <p class="text-white text-2xl sm:text-3xl font-black tracking-tight select-none">
        Click Now!
      </p>`);
    startTime = performance.now();
}

function goToResult(ms) {
    currentState = STATE.RESULT;
    tries++;
    setBoxDefault();

    if (best === null || ms < best) best = ms;

    // Update display and persist
    statLast.textContent  = ms + ' ms';
    statBest.textContent  = best + ' ms';
    statTries.textContent = tries;
    saveStats();

    const badge = getBadge(ms);
    perfBadge.className   = `px-4 sm:px-5 py-1 sm:py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${badge.border} ${badge.bg} ${badge.text}`;
    perfBadge.textContent = badge.label;

    reactionNum.textContent = ms;

    let hint = document.getElementById('continue-hint');
    if (!hint) {
        hint = document.createElement('p');
        hint.id          = 'continue-hint';
        hint.className   = 'text-gray-600 text-xl font-semibold uppercase tracking-widest mt-6 select-none animate-pulse';
        hint.textContent = 'Click anywhere to continue';
        resultState.appendChild(hint);
    }

    showResult();
}

function goToTooEarly() {
    clearTimeout(waitTimer);
    currentState = STATE.RESULT;
    setBoxRed();
    showIdle();
    setIdleText(`
      <div class="flex flex-col items-center gap-2">
        <p class="text-red-400 text-2xl sm:text-3xl font-black tracking-tight select-none">Too Early!</p>
        <p class="text-gray-600 text-xs font-medium tracking-widest uppercase select-none mt-1">Wait for the box to turn blue</p>
      </div>`);

    setTimeout(() => {
        currentState = STATE.IDLE;
        setBoxDefault();
        resetIdleText();
    }, 1400);
}

// Click handler

gameBox.addEventListener('click', () => {
    switch (currentState) {
        case STATE.IDLE:    goToWaiting();                                         break;
        case STATE.WAITING: goToTooEarly();                                        break;
        case STATE.READY:   goToResult(Math.round(performance.now() - startTime)); break;
        case STATE.RESULT:  goToWaiting();                                         break;
    }
});