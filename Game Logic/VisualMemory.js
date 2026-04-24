(() => {
  'use strict';

  let level, lives, currentWord;
  let seenWords, usedWords;
  let isCurrentWordSeen = false;

  const WORDS = [
    // ── vowel swaps ──
    "bat", "bet", "bit", "bot", "but",
    "cap", "cop", "cup", "cep", "cip",
    "man", "men", "min", "mon", "mun",

    // ── double letters ──
    "letter", "latter", "litter", "bitter", "butter",
    "dinner", "winner", "sinner", "inner", "spinner",

    // ── ending variations ──
    "play", "plays", "played", "player", "playing",
    "test", "tests", "tested", "tester", "testing",

    // ── prefix confusion ──
    "react", "enact", "interact", "counteract", "detract",
    "form", "reform", "inform", "transform", "uniform",

    // ── visually similar shapes ──
    "clap", "clip", "slip", "flip", "flap",
    "drip", "drop", "crop", "crap", "trap",

    // ── same structure different letters ──
    "stone", "stony", "atone", "alone", "clone",
    "plane", "plans", "plant", "plank", "blank",

    // ── tricky pairs ──
    "angel", "angle", "anger", "ankle", "amble",
    "brake", "break", "bleak", "black", "block",

    // ── consonant swaps ──
    "card", "cord", "core", "care", "cure",
    "bold", "bald", "ball", "bell", "bill",

    // ── near duplicates ──
    "mouse", "mouze", "house", "horse", "hoarse",
    "light", "might", "night", "right", "sight",

    // ── fast confusion words ──
    "quick", "quack", "click", "clock", "cloak",
    "bring", "brink", "drink", "drank", "drunk",

    // ── extra fillers (still similar style) ──
    "track", "trace", "truce", "truck", "trick",
    "grind", "grand", "grant", "giant", "plant",
    "flash", "slash", "smash", "stash", "crash",
    "frame", "flame", "blame", "claim", "shame"
  ];

  /* DOM */
  const sIdle = document.getElementById('s-idle');
  const sGame = document.getElementById('s-game');
  const sGameOver = document.getElementById('s-gameover');

  const wordDisplay = document.getElementById('word-display');
  const wordCard = document.getElementById('word-card');
  const glow = document.getElementById('card-glow');

  const levelLbl = document.getElementById('game-level-lbl');
  const livesEl = document.getElementById('lives');

  const goLevel = document.getElementById('go-level');
  const goMissed = document.getElementById('go-missed');

  const btnStart = document.getElementById('btn-start-idle');
  const btnRestart = document.getElementById('btn-restart');
  const btnSeen = document.getElementById('btn-seen');
  const btnNew = document.getElementById('btn-new');

  /* STATE SWITCH */
  function switchState(show) {
    [sIdle, sGame, sGameOver].forEach(s => s.classList.remove('active'));
    show.classList.add('active');
  }

  function updateLives() {
    livesEl.textContent = "❤️".repeat(lives);
  }

  /* ANIMATIONS */
  function animateWord() {
    wordDisplay.style.opacity = 0;
    wordDisplay.style.transform = "scale(0.8) translateY(10px)";

    setTimeout(() => {
      wordDisplay.style.opacity = 1;
      wordDisplay.style.transform = "scale(1) translateY(0)";
    }, 80);
  }

  function glowEffect(color) {
    glow.style.background = color;
    glow.style.opacity = 1;
    setTimeout(() => glow.style.opacity = 0, 200);
  }

  /* WORD LOGIC */
  function getNewWord() {
    let w;
    do {
      w = WORDS[Math.floor(Math.random() * WORDS.length)];
    } while (usedWords.includes(w));
    return w;
  }

  function nextWord() {
    const showOld = Math.random() < 0.4 && seenWords.size > 0;

    if (showOld) {
      const arr = Array.from(seenWords);
      currentWord = arr[Math.floor(Math.random() * arr.length)];
      isCurrentWordSeen = true;
    } else {
      currentWord = getNewWord();
      isCurrentWordSeen = false;
    }

    wordDisplay.textContent = currentWord.toUpperCase();
    levelLbl.textContent = "Level " + level;

    animateWord();
  }

  /* GAME */
  function startGame() {
    level = 1;
    lives = 2;
    seenWords = new Set();
    usedWords = [];

    updateLives();
    switchState(sGame);
    nextWord();
  }

  function handleAnswer(type) {

    let correct =
      (type === "seen" && isCurrentWordSeen) ||
      (type === "new" && !isCurrentWordSeen);

    if (correct) {
      glowEffect("rgba(34,197,94,0.3)");
    } else {
      glowEffect("rgba(239,68,68,0.3)");
      lives--;
      updateLives();

      if (lives <= 0) {
        endGame();
        return;
      }
    }

    // AFTER answering → mark word as seen
    if (!isCurrentWordSeen) {
      seenWords.add(currentWord);
      usedWords.push(currentWord);
    }

    level++;
    setTimeout(nextWord, 250);
  }

  function endGame() {
    goLevel.textContent = level;
    goMissed.textContent = currentWord.toUpperCase();
    switchState(sGameOver);
  }

  /* EVENTS */
  btnStart.onclick = startGame;
  btnRestart.onclick = startGame;

  btnSeen.onclick = () => handleAnswer("seen");
  btnNew.onclick = () => handleAnswer("new");

  document.addEventListener("keydown", (e) => {
    if (!sGame.classList.contains("active")) return;

    if (e.key.toLowerCase() === "s") handleAnswer("seen");
    if (e.key.toLowerCase() === "n") handleAnswer("new");
  });

})();