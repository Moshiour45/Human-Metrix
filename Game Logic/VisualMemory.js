/* ═══════════════════════════════════════════════
   Visual Memory – Game Logic
   ═══════════════════════════════════════════════ */

"use strict";

/* ── Word Pool ── */
const WORD_POOL = [
  "apple","bridge","cloud","dragon","eagle","forest","ghost","harbor",
  "island","jungle","kernel","lantern","marble","needle","ocean","planet",
  "quartz","rabbit","silver","timber","umbra","violet","walnut","xenon",
  "yellow","zenith","anchor","blaze","cipher","dome","ember","flare",
  "glyph","haze","ivory","jade","knoll","lunar","mist","nova",
  "orbit","prism","quill","raven","shard","thorn","umber","vault",
  "whisper","xray","yonder","zeal","abyss","beacon","cobalt","drift",
  "eclipse","fjord","gravel","hollow","iris","jasper","kite","lava",
  "marsh","neon","opal","pulse","quest","ridge","slate","tundra",
  "uplift","venom","wrath","pixel","byte","cache","delta","echo",
  "flux","grid","heap","index","jolt","kern","link","mesh",
  "node","oxide","port","query","realm","stack","token","unit"
];

/* ── State ── */
let level        = 1;
let score        = 0;
let seenWords    = new Set();
let usedIndices  = new Set();
let currentWord  = "";
let correctAnswer= "";   // "seen" | "new"
let inputLocked  = false;

/* ── Helpers: DOM ── */
const $ = id => document.getElementById(id);

function showState(id) {
  document.querySelectorAll(".state").forEach(el => el.classList.remove("active"));
  $(id).classList.add("active");
}

/* ── Start ── */
function startGame() {
  level       = 1;
  score       = 0;
  seenWords   = new Set();
  usedIndices = new Set();
  inputLocked = false;
  nextRound();
}

/* ── Next Round ── */
function nextRound() {
  inputLocked = false;
  updateLevelBadge();
  showState("s-game");

  const word = getWord();
  currentWord   = word;

  // Determine correct answer BEFORE adding to seenWords for display
  correctAnswer = seenWords.has(word) ? "seen" : "new";

  displayWord(word);
}

/* ── Get Word ── */
function getWord() {
  const canRepeat = seenWords.size > 0;

  if (canRepeat && Math.random() < 0.5) {
    // Pick a random word from seenWords
    const arr = Array.from(seenWords);
    return arr[Math.floor(Math.random() * arr.length)];
  } else {
    // Pick a new word not seen before
    const available = WORD_POOL.filter((_, i) => !usedIndices.has(i));
    if (available.length === 0) {
      // Pool exhausted: reset used (but keep seenWords)
      usedIndices.clear();
      return WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    const word = available[randomIndex];
    usedIndices.add(WORD_POOL.indexOf(word));
    return word;
  }
}

/* ── Display Word with animation ── */
function displayWord(word) {
  const el = $("word-display");
  el.style.opacity = "0";
  el.style.transform = "scale(0.88) translateY(10px)";

  setTimeout(() => {
    el.textContent = word;
    el.style.transition = "opacity 0.22s ease, transform 0.22s ease";
    el.style.opacity = "1";
    el.style.transform = "scale(1) translateY(0)";
  }, 120);
}

/* ── Handle Answer ── */
function handleAnswer(choice) {
  if (inputLocked) return;
  inputLocked = true;

  const isCorrect = choice === correctAnswer;

  // Add word to seen set regardless (it's been shown)
  seenWords.add(currentWord);

  if (isCorrect) {
    score++;
    showFeedback(true);
  } else {
    showFeedback(false);
  }
}

/* ── Show Feedback ── */
function showFeedback(isCorrect) {
  showState("s-feedback");

  $("fb-icon").textContent   = isCorrect ? "✓" : "✗";
  $("fb-icon").style.color   = isCorrect ? "#34d399" : "#f87171";
  $("fb-title").textContent  = isCorrect ? "Correct!" : "Incorrect!";
  $("fb-title").style.color  = isCorrect ? "#34d399" : "#f87171";
  $("fb-word").textContent   = currentWord;
  $("fb-word").style.color   = isCorrect ? "#34d399" : "#f87171";

  $("fb-detail").textContent = isCorrect
    ? `The word "${currentWord}" was ${correctAnswer === "seen" ? "already seen" : "brand new"}.`
    : `The word "${currentWord}" was ${correctAnswer === "seen" ? "already seen" : "brand new"}.`;

  if (isCorrect) {
    level++;
    const btn = $("btn-next");
    btn.textContent = "Next Round";
    btn.className   = "btn-next btn-continue";
    btn.onclick     = nextRound;
  } else {
    const btn = $("btn-next");
    btn.textContent = "See Results";
    btn.className   = "btn-next btn-retry";
    btn.onclick     = showGameOver;
  }
}

/* ── Game Over ── */
function showGameOver() {
  showState("s-gameover");
  $("go-level").textContent  = level;
  $("go-score").textContent  = score;
  const total = score + 1; // +1 for the wrong answer
  const pct   = total > 0 ? Math.round((score / total) * 100) : 0;
  $("go-accuracy").textContent = pct + "%";
  $("go-missed").textContent   = currentWord;
}

/* ── UI helpers ── */
function updateLevelBadge() {
  $("game-level-lbl").textContent = "Level " + level;
}

/* ── Keyboard support ── */
document.addEventListener("keydown", e => {
  if ($("s-game").classList.contains("active")) {
    if (e.key === "s" || e.key === "S") handleAnswer("seen");
    if (e.key === "n" || e.key === "N") handleAnswer("new");
  }
  if (e.key === "Enter") {
    if ($("s-idle").classList.contains("active"))     { startGame(); }
    else if ($("s-feedback").classList.contains("active")) { $("btn-next").click(); }
    else if ($("s-gameover").classList.contains("active")) { startGame(); }
  }
});

/* ── Wire up idle button ── */
document.addEventListener("DOMContentLoaded", () => {
  $("btn-start-idle").addEventListener("click", startGame);
  $("btn-restart").addEventListener("click", startGame);
});