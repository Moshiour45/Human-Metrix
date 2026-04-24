(() => {
  'use strict';

  const gameArea = document.getElementById('game-area');
  const idleState = document.getElementById('idle-state');
  const resultState = document.getElementById('result-state');

  const statRemaining = document.getElementById('stat-remaining');
  const statBest = document.getElementById('stat-best');
  const resetBtn = document.getElementById('reset-btn');
  const finalTime = document.getElementById('final-time');

  let totalTargets = 30;
  let remaining = totalTargets;
  let startTime = null;
  let gameRunning = false;
  let activeTarget = null;

  const BEST_KEY = "aim_best_time";

  /* ---------- LOCAL STORAGE ---------- */
  function loadBest() {
    const best = localStorage.getItem(BEST_KEY);
    statBest.textContent = best ? best + "s" : "--";
  }

  function saveBest(time) {
    const best = localStorage.getItem(BEST_KEY);
    if (!best || time < best) {
      localStorage.setItem(BEST_KEY, time);
    }
  }

  /* ---------- RESET ---------- */
  function resetGame() {
    gameRunning = false;
    remaining = totalTargets;
    statRemaining.textContent = remaining;

    idleState.classList.remove('hidden');
    resultState.classList.add('hidden');

    removeTarget();
    loadBest();
  }

  /* ---------- START ---------- */
  function startGame() {
    gameRunning = true;
    remaining = totalTargets;
    statRemaining.textContent = remaining;

    idleState.classList.add('hidden');
    resultState.classList.add('hidden');

    startTime = performance.now();
    spawnTarget();
  }

  /* ---------- TARGET ---------- */
  function spawnTarget() {
    if (!gameRunning || remaining <= 0) {
      endGame();
      return;
    }

    const target = document.createElement('div');
    target.className = "absolute rounded-full bg-blue-500";

    const size = 40;
    target.style.width = size + "px";
    target.style.height = size + "px";

    const rect = gameArea.getBoundingClientRect();
    const x = Math.random() * (rect.width - size);
    const y = Math.random() * (rect.height - size);

    target.style.left = x + "px";
    target.style.top = y + "px";

    gameArea.appendChild(target);
    activeTarget = target;

    target.addEventListener('click', (e) => {
      e.stopPropagation();
      hitTarget();
    });
  }

  /* ---------- HIT ---------- */
  function hitTarget() {
    removeTarget();
    remaining--;
    statRemaining.textContent = remaining;

    spawnTarget();
  }

  /* ---------- REMOVE TARGET ---------- */
  function removeTarget() {
    if (activeTarget) {
      activeTarget.remove();
      activeTarget = null;
    }
  }

  /* ---------- END GAME ---------- */
  function endGame() {
    gameRunning = false;

    const endTime = performance.now();
    const time = ((endTime - startTime) / 1000).toFixed(2);

    finalTime.textContent = time + "s";
    resultState.classList.remove('hidden');

    saveBest(time);
    loadBest();
  }

  /* ---------- EVENTS ---------- */
  gameArea.addEventListener('click', () => {
    if (!gameRunning) {
      startGame();
    }
  });

  resetBtn.addEventListener('click', resetGame);

  /* ---------- INIT ---------- */
  loadBest();

})();