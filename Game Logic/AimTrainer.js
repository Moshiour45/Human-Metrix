document.addEventListener('DOMContentLoaded', () => {
  const gameArea = document.getElementById('game-area');
  const idleState = document.getElementById('idle-state');
  const resultState = document.getElementById('result-state');
  const finalTimeText = document.getElementById('final-time');
  const statRemaining = document.getElementById('stat-remaining');
  const statBest = document.getElementById('stat-best');
  const resetBtn = document.getElementById('reset-btn');

  let targetsHit = 0;
  const totalTargets = 30;
  let startTime = 0;
  let isGameActive = false;

  const updateBestDisplay = () => {
    const savedBest = localStorage.getItem('aimTrainerBest');
    statBest.textContent = savedBest ? `${savedBest}s` : '--';
  };

  const startGame = () => {
    isGameActive = true;
    targetsHit = 0;
    statRemaining.textContent = totalTargets;
    idleState.classList.add('hidden');
    resultState.classList.add('hidden');
    spawnTarget();
    startTime = performance.now();
  };

  const spawnTarget = () => {
    const oldTarget = gameArea.querySelector('.target-node');
    if (oldTarget) oldTarget.remove();

    const target = document.createElement('div');
    target.className = 'target-node absolute transition-all active:scale-50 duration-75';

    const size = 68;
    Object.assign(target.style, {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 30% 30%, #60a5fa 0%, #2563eb 60%, #1e40af 100%)',
      border: '4px solid #ffffff',
      boxShadow: '0 0 40px rgba(37, 99, 235, 0.5), inset 0 0 15px rgba(255,255,255,0.5)',
      cursor: 'pointer',
      zIndex: '50'
    });

    const padding = 40;
    const maxX = gameArea.clientWidth - size - padding;
    const maxY = gameArea.clientHeight - size - padding;

    const x = Math.floor(Math.random() * (maxX - padding) + padding);
    const y = Math.floor(Math.random() * (maxY - padding) + padding);

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

    target.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      handleHit();
    });

    gameArea.appendChild(target);
  };

  const handleHit = () => {
    if (!isGameActive) return;
    targetsHit++;
    statRemaining.textContent = totalTargets - targetsHit;

    if (targetsHit < totalTargets) {
      spawnTarget();
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    isGameActive = false;
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

    const currentTarget = gameArea.querySelector('.target-node');
    if (currentTarget) currentTarget.remove();

    const savedBest = localStorage.getItem('aimTrainerBest');
    if (!savedBest || parseFloat(elapsed) < parseFloat(savedBest)) {
      localStorage.setItem('aimTrainerBest', elapsed);
      updateBestDisplay();
    }

    finalTimeText.textContent = `${elapsed}s`;
    resultState.classList.remove('hidden');
  };

  gameArea.addEventListener('mousedown', () => {
    if (!isGameActive && resultState.classList.contains('hidden')) {
      startGame();
    }
  });

  resetBtn.addEventListener('click', () => {
    isGameActive = false;
    const target = gameArea.querySelector('.target-node');
    if (target) target.remove();
    statRemaining.textContent = totalTargets;
    resultState.classList.add('hidden');
    idleState.classList.remove('hidden');
  });

  updateBestDisplay();
});