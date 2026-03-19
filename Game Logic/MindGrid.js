// Constants

const CELL_COUNT     = 16;
const HIGHLIGHT_MS   = 500;
const GAP_MS         = 250;
const BEFORE_PLAY_MS = 600;
const STORAGE_KEY    = "mindgrid_best";

// Storage

// Reads best score from localStorage — returns 0 if nothing saved yet
function loadBest() {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
}

// Writes best score to localStorage so it survives closing the browser
function saveBest() {
    localStorage.setItem(STORAGE_KEY, String(best));
}

// State

let sequence  = [];
let userInput = [];
let round     = 1;
let score     = 0;
let best      = loadBest(); // restored from localStorage on every page load
let isPlaying = false;

// DOM References

const gameBox     = document.getElementById("game-box");
const idleState   = document.getElementById("idle-state");
const activeState = document.getElementById("active-state");
const resultState = document.getElementById("result-state");

const statRound   = document.getElementById("stat-round");
const statScore   = document.getElementById("stat-score");
const statBest    = document.getElementById("stat-best");

const reactionNum = document.getElementById("reaction-number");
const perfBadge   = document.getElementById("perf-badge");
const tryAgainBtn = document.getElementById("try-again-btn");

const cells = Array.from({ length: CELL_COUNT }, (_, i) =>
    document.getElementById(String(i))
);

// Utility

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomCellIndex() {
    return Math.floor(Math.random() * CELL_COUNT);
}

// Cell Visual States

const BASE_STYLE = ["rounded-lg", "border", "transition-all", "duration-200"];

// Default dark tile — used between rounds and on reset
function dimCell(cell) {
    cell.className = "";
    cell.classList.add(...BASE_STYLE, "bg-gray-900", "border-gray-800");
    cell.style.cssText = "width:clamp(32px,7vw,48px);height:clamp(32px,7vw,48px);";
}

// Bright blue flash shown during sequence playback
function highlightCell(cell) {
    cell.className = "";
    cell.classList.add(
        ...BASE_STYLE,
        "bg-blue-500", "border-blue-300",
        "shadow-[0_0_18px_rgba(59,130,246,0.85)]"
    );
    cell.style.cssText = "width:clamp(32px,7vw,48px);height:clamp(32px,7vw,48px);";
}

// Solid blue confirming a correct player click
function markCorrect(cell) {
    cell.className = "";
    cell.classList.add(
        ...BASE_STYLE,
        "bg-blue-600", "border-blue-400",
        "shadow-[0_0_14px_rgba(37,99,235,0.7)]",
        "cursor-default"
    );
    cell.style.cssText = "width:clamp(32px,7vw,48px);height:clamp(32px,7vw,48px);";
}

// Red marking the wrong click before game over
function markWrong(cell) {
    cell.className = "";
    cell.classList.add(
        ...BASE_STYLE,
        "bg-red-600", "border-red-400",
        "shadow-[0_0_14px_rgba(220,38,38,0.7)]",
        "cursor-default"
    );
    cell.style.cssText = "width:clamp(32px,7vw,48px);height:clamp(32px,7vw,48px);";
}

// Interactive tile shown during the player's recall phase
function makeClickable(cell) {
    cell.className = "";
    cell.classList.add(
        ...BASE_STYLE,
        "bg-gray-800", "border-gray-700",
        "cursor-pointer",
        "hover:bg-blue-900", "hover:border-blue-600"
    );
    cell.style.cssText = "width:clamp(32px,7vw,48px);height:clamp(32px,7vw,48px);";
}

function resetGrid()         { cells.forEach(dimCell); }
function makeGridClickable() { cells.forEach(makeClickable); }

// Stats

function updateStats() {
    statRound.textContent = round;
    statScore.textContent = score;
    statBest.textContent  = best > 0 ? String(best) : "--";
}

// Screen Management

function showScreen(screen) {
    [idleState, activeState, resultState].forEach(el => {
        el.classList.add("hidden");
        el.classList.remove("flex");
    });
    screen.classList.remove("hidden");
    screen.classList.add("flex");
}

// Core Game Logic

function startGame() {
    sequence  = [];
    userInput = [];
    round     = 1;
    score     = 0;
    isPlaying = true;

    resetGrid();
    updateStats();
    showScreen(activeState);

    // Small delay before the first sequence plays improves UX
    setTimeout(() => {
        isPlaying = false;
        nextRound();
    }, 200);
}

function nextRound() {
    userInput = [];
    sequence.push(randomCellIndex()); // grow the sequence by one new tile
    updateStats();
    resetGrid();
    playSequence();
}

async function playSequence() {
    isPlaying = true;
    gameBox.style.cursor = "default";

    await delay(BEFORE_PLAY_MS);

    // Flash each tile in order with a gap between each
    for (const index of sequence) {
        const cell = cells[index];
        highlightCell(cell);
        await delay(HIGHLIGHT_MS);
        dimCell(cell);
        await delay(GAP_MS);
    }

    // Sequence done — hand control to the player
    isPlaying = false;
    gameBox.style.cursor = "pointer";
    makeGridClickable();
}

function handleCellClick(index) {
    if (isPlaying) return; // ignore clicks during sequence animation

    const cell = cells[index];
    userInput.push(index);
    checkAnswer(cell);
}

function checkAnswer(cell) {
    const step = userInput.length - 1;

    // Wrong tile or wrong order — end the game
    if (userInput[step] !== sequence[step]) {
        markWrong(cell);
        gameOver();
        return;
    }

    markCorrect(cell);

    // Player finished the full sequence for this round
    if (userInput.length === sequence.length) {
        isPlaying = true; // block stray clicks during the pause

        score += sequence.length;
        round++;

        if (score > best) {
            best = score;
            saveBest(); // persist new best to localStorage
        }

        updateStats();

        setTimeout(() => {
            isPlaying = false;
            nextRound();
        }, 800);
    }
}

function gameOver() {
    isPlaying = true;

    if (score > best) {
        best = score;
        saveBest(); // persist new best to localStorage
    }

    updateStats();

    const correct = userInput.length - 1;
    reactionNum.textContent = `${correct} / ${sequence.length}`;

    perfBadge.textContent = "Game Over";

    // Short delay
    setTimeout(() => {
        showScreen(resultState);
        gameBox.style.cursor = "default";
        isPlaying = false;
    }, 900);
}

// Event Listeners

// Starts the game only from the idle screen
gameBox.addEventListener("click", () => {
    if (!idleState.classList.contains("hidden")) {
        startGame();
    }
});

// Individual cell clicks — stopPropagation prevents bubbling to gameBox
cells.forEach((cell, index) => {
    cell.addEventListener("click", (e) => {
        e.stopPropagation();
        handleCellClick(index);
    });
});

// Try Again
tryAgainBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startGame();
});

// Initialisation

showScreen(idleState);
updateStats(); 