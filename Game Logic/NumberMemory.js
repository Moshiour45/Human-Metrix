// ── constants ──────────────────────────────────────────────────
        const CIRC     = 2 * Math.PI * 90;
        const MIN_TIME = 1500;

        // ── state ──────────────────────────────────────────────────────
        let level, currentNum, ringTimer, elapsed, duration, lastCorrect;

        // ── helpers ────────────────────────────────────────────────────
        function showState(id) {
            document.querySelectorAll('.state').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        }

        function genNumber(digits) {
            let n = String(Math.floor(Math.random() * 9) + 1);
            for (let i = 1; i < digits; i++) n += String(Math.floor(Math.random() * 10));
            return n;
        }

        function getDuration(lvl) {
            return Math.max(MIN_TIME, 3000 - (lvl - 1) * 100);
        }

        // ── phases ─────────────────────────────────────────────────────
        function startGame() {
            level = 1;
            clearInterval(ringTimer);
            showState('s-memorize');
            startMemorize();
        }

        function startMemorize() {
            currentNum = genNumber(level);
            duration   = getDuration(level);
            elapsed    = 0;

            document.getElementById('mem-level-lbl').textContent = 'Level ' + level;
            document.getElementById('display-num').textContent   = currentNum;

            const prog = document.getElementById('ring-prog');
            prog.style.strokeDasharray  = CIRC;
            prog.style.strokeDashoffset = 0;

            clearInterval(ringTimer);
            const STEP = 50;
            ringTimer = setInterval(() => {
                elapsed += STEP;
                prog.style.strokeDashoffset = CIRC * (elapsed / duration);
                if (elapsed >= duration) {
                    clearInterval(ringTimer);
                    startRecall();
                }
            }, STEP);
        }

        function startRecall() {
            document.getElementById('rec-level-lbl').textContent = 'Level ' + level;
            document.getElementById('inp-num').value = '';
            showState('s-recall');
            setTimeout(() => document.getElementById('inp-num').focus(), 80);
        }

        function submitAnswer() {
            const val = document.getElementById('inp-num').value.trim();
            if (!val) return;
            lastCorrect = (val === currentNum);
            showFeedback(lastCorrect);
        }

        function showFeedback(isCorrect) {
            const icon    = document.getElementById('feedback-icon');
            const title   = document.getElementById('feedback-title');
            const detail  = document.getElementById('feedback-detail');
            const numDisp = document.getElementById('feedback-correct');
            const btn     = document.getElementById('btn-next');

            numDisp.textContent = currentNum;

            if (isCorrect) {
                icon.textContent   = '✓';
                icon.style.color   = '#34d399';
                title.textContent  = 'Correct!';
                detail.textContent = 'Moving to level ' + (level + 1);
                numDisp.className  = 'correct-flash';
                btn.textContent    = 'Next Level →';
                btn.className      = 'btn-continue';
            } else {
                icon.textContent   = '✗';
                icon.style.color   = '#f87171';
                title.textContent  = 'Incorrect';
                detail.textContent = 'The correct number was:';
                numDisp.className  = 'wrong-flash';
                btn.textContent    = 'See Results';
                btn.className      = 'btn-retry';
            }

            showState('s-feedback');
        }

        function advanceFromFeedback() {
            if (lastCorrect) {
                level++;
                showState('s-memorize');
                startMemorize();
            } else {
                showGameOver();
            }
        }

        function showGameOver() {
            document.getElementById('go-level').textContent  = level;
            document.getElementById('go-digits').textContent = level;
            document.getElementById('go-missed').textContent = currentNum;
            showState('s-gameover');
        }

        // ── event listeners ────────────────────────────────────────────
        document.getElementById('btn-start').addEventListener('click', startGame);

        document.getElementById('btn-submit').addEventListener('click', submitAnswer);

        document.getElementById('inp-num').addEventListener('keydown', e => {
            if (e.key === 'Enter') submitAnswer();
        });

        document.getElementById('btn-next').addEventListener('click', advanceFromFeedback);

        document.getElementById('btn-restart').addEventListener('click', startGame);

        // ── hamburger ──────────────────────────────────────────────────
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });