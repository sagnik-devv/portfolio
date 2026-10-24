/**
 * Type or Die - Typing Speed Challenge
 * Built for Sagnik's Developer Arcade
 */

(function () {
    'use strict';

    const PROMPTS = {
        beginner: [
            "Good code is its own best documentation. Always write code as if the guy who ends up maintaining it will be a violent psychopath who knows where you live.",
            "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
            "Simplicity is prerequisite for reliability. First, solve the problem. Then, write the clean code.",
            "There are two ways to write error-free programs; only the third one works. Keep debugging until it shines.",
            "Talk is cheap. Show me the code. Software engineering is the art of turning coffee into scalable solutions."
        ],
        intermediate: [
            "Modern web applications demand efficient state management, resilient network fallbacks, and micro-animations that elevate the user experience from ordinary to unforgettable.",
            "Distributed systems require careful consensus algorithms, idempotency across API endpoints, and comprehensive observability metrics to debug production incidents before users notice.",
            "Optimizing Core Web Vitals is not merely about raw benchmark scores; it directly impacts user engagement, bounce rates, and organic discoverability across major search engines.",
            "A well-architected frontend decouples business logic from rendering pipelines, allowing teams to refactor design tokens without triggering cascading layout recalculations.",
            "Clean architecture emphasizes dependency inversion, ensuring business domain entities remain independent of external database frameworks and third-party vendor SDKs."
        ],
        code: [
            "const debounce = (fn, delay = 300) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};",
            "async function fetchWithRetry(url, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url);\n      if (res.ok) return await res.json();\n    } catch (err) {\n      if (i === retries - 1) throw err;\n    }\n  }\n}",
            "interface UserSession {\n  readonly id: string;\n  name: string;\n  role: 'admin' | 'guest';\n  lastActive: number;\n}",
            "SELECT u.id, u.username, COUNT(o.id) AS total_orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.status = 'active'\nGROUP BY u.id\nHAVING COUNT(o.id) > 5\nORDER BY total_orders DESC;",
            "const memoize = (fn) => {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n};"
        ]
    };

    class TypeOrDieGame {
        constructor() {
            this.container = document.getElementById('game-panel-type');
            if (!this.container) return;

            this.textDisplay = document.getElementById('type-prompt-text');
            this.hiddenInput = document.getElementById('type-hidden-input');
            this.timerDisplay = document.getElementById('type-timer-val');
            this.wpmDisplay = document.getElementById('type-wpm-val');
            this.accuracyDisplay = document.getElementById('type-accuracy-val');
            this.errorsDisplay = document.getElementById('type-errors-val');
            this.bestDisplay = document.getElementById('type-best-val');
            this.progressBar = document.getElementById('type-progress-bar');
            this.resultsModal = document.getElementById('type-results-modal');

            // Game settings
            this.difficulty = 'beginner'; // 'beginner', 'intermediate', 'code'
            this.timeLimit = 30; // 15, 30, 60 seconds
            this.timeRemaining = 30;
            this.isActive = false; // tab focus
            this.hasStarted = false;
            this.isFinished = false;

            // Metrics
            this.currentPrompt = '';
            this.typedText = '';
            this.startTime = null;
            this.timerInterval = null;
            this.errorCount = 0;
            this.correctChars = 0;
            this.totalTypedChars = 0;
            this.bestWPM = this.loadBestWPM();

            this.initUI();
            this.initEvents();
            this.resetChallenge();
        }

        loadBestWPM() {
            try {
                return parseInt(localStorage.getItem('arcade_type_best_wpm') || '0', 10);
            } catch (e) {
                return 0;
            }
        }

        saveBestWPM(val) {
            try {
                localStorage.setItem('arcade_type_best_wpm', val.toString());
            } catch (e) {}
        }

        resetChallenge() {
            this.stopTimer();
            this.hasStarted = false;
            this.isFinished = false;
            this.typedText = '';
            this.timeRemaining = this.timeLimit;
            this.errorCount = 0;
            this.correctChars = 0;
            this.totalTypedChars = 0;

            if (this.hiddenInput) {
                this.hiddenInput.value = '';
            }

            // Pick random prompt from selected category
            const list = PROMPTS[this.difficulty] || PROMPTS.beginner;
            this.currentPrompt = list[Math.floor(Math.random() * list.length)];

            this.updateStatsDisplay();
            this.renderPromptText();

            if (this.progressBar) {
                this.progressBar.style.width = '100%';
            }

            if (this.resultsModal) {
                this.resultsModal.classList.add('hidden');
                this.resultsModal.classList.remove('flex');
            }
        }

        renderPromptText() {
            if (!this.textDisplay) return;
            this.textDisplay.innerHTML = '';

            // Apply monospace font class if code
            if (this.difficulty === 'code') {
                this.textDisplay.classList.add('font-mono', 'text-sm');
                this.textDisplay.classList.remove('font-sans', 'text-base', 'sm:text-lg');
            } else {
                this.textDisplay.classList.remove('font-mono', 'text-sm');
                this.textDisplay.classList.add('font-sans', 'text-base', 'sm:text-lg');
            }

            const prompt = this.currentPrompt;
            const typed = this.typedText;

            for (let i = 0; i < prompt.length; i++) {
                const char = prompt[i];
                const span = document.createElement('span');

                if (i < typed.length) {
                    if (typed[i] === char) {
                        span.className = 'text-emerald-700 bg-emerald-100/70 rounded-xs font-semibold';
                    } else {
                        span.className = 'text-red-700 bg-red-200/90 underline decoration-red-600 rounded-xs font-bold';
                    }
                } else if (i === typed.length) {
                    span.className = 'bg-accent-green text-midnight-ink font-bold animate-pulse px-0.5 rounded-xs ring-1 ring-charcoal-border';
                } else {
                    span.className = 'text-neutral-400';
                }

                span.textContent = char;
                this.textDisplay.appendChild(span);
            }
        }

        handleInput(e) {
            if (!this.isActive || this.isFinished) return;

            const val = this.hiddenInput.value;

            // Start timer on first character typed
            if (!this.hasStarted && val.length > 0) {
                this.hasStarted = true;
                this.startTime = performance.now();
                this.startTimer();
            }

            if (val.length > this.typedText.length) {
                // User added characters
                const newlyAddedChar = val[val.length - 1];
                const expectedChar = this.currentPrompt[val.length - 1];
                this.totalTypedChars++;
                if (newlyAddedChar !== expectedChar) {
                    this.errorCount++;
                }
            }

            this.typedText = val;
            this.calculateStats();
            this.renderPromptText();

            // Check if prompt is completed
            if (this.typedText.length >= this.currentPrompt.length) {
                this.finishRound();
            }
        }

        calculateStats() {
            let correct = 0;
            const len = Math.min(this.typedText.length, this.currentPrompt.length);
            for (let i = 0; i < len; i++) {
                if (this.typedText[i] === this.currentPrompt[i]) {
                    correct++;
                }
            }
            this.correctChars = correct;

            const elapsedSec = this.startTime ? Math.max((performance.now() - this.startTime) / 1000, 0.5) : 0;
            const wpm = elapsedSec > 0 ? Math.round((this.correctChars / 5) / (elapsedSec / 60)) : 0;

            const totalTyped = this.totalTypedChars;
            const accuracy = totalTyped > 0 ? Math.max(0, Math.round(((totalTyped - this.errorCount) / totalTyped) * 100)) : 100;

            if (this.wpmDisplay) this.wpmDisplay.textContent = wpm;
            if (this.accuracyDisplay) this.accuracyDisplay.textContent = `${accuracy}%`;
            if (this.errorsDisplay) this.errorsDisplay.textContent = this.errorCount;
            if (this.bestDisplay) this.bestDisplay.textContent = this.bestWPM;

            return { wpm, accuracy };
        }

        updateStatsDisplay() {
            if (this.timerDisplay) this.timerDisplay.textContent = `${this.timeRemaining}s`;
            if (this.wpmDisplay) this.wpmDisplay.textContent = '0';
            if (this.accuracyDisplay) this.accuracyDisplay.textContent = '100%';
            if (this.errorsDisplay) this.errorsDisplay.textContent = '0';
            if (this.bestDisplay) this.bestDisplay.textContent = this.bestWPM;
        }

        startTimer() {
            this.stopTimer();
            this.timerInterval = setInterval(() => {
                this.timeRemaining--;
                if (this.timerDisplay) {
                    this.timerDisplay.textContent = `${this.timeRemaining}s`;
                }

                if (this.progressBar) {
                    const pct = Math.max(0, (this.timeRemaining / this.timeLimit) * 100);
                    this.progressBar.style.width = `${pct}%`;
                }

                this.calculateStats();

                if (this.timeRemaining <= 0) {
                    this.finishRound();
                }
            }, 1000);
        }

        stopTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        }

        finishRound() {
            this.stopTimer();
            this.isFinished = true;
            const stats = this.calculateStats();

            let isNewBest = false;
            if (stats.wpm > this.bestWPM) {
                this.bestWPM = stats.wpm;
                this.saveBestWPM(this.bestWPM);
                isNewBest = true;
                if (this.bestDisplay) this.bestDisplay.textContent = this.bestWPM;
            }

            this.showResultsModal(stats, isNewBest);
        }

        showResultsModal(stats, isNewBest) {
            if (!this.resultsModal) return;

            const resWpm = document.getElementById('type-res-wpm');
            const resAcc = document.getElementById('type-res-accuracy');
            const resChars = document.getElementById('type-res-chars');
            const resErrors = document.getElementById('type-res-errors');
            const resBadge = document.getElementById('type-res-badge');
            const resBestBanner = document.getElementById('type-res-best-banner');

            if (resWpm) resWpm.textContent = stats.wpm;
            if (resAcc) resAcc.textContent = `${stats.accuracy}%`;
            if (resChars) resChars.textContent = `${this.correctChars} / ${this.typedText.length}`;
            if (resErrors) resErrors.textContent = this.errorCount;

            // Tier evaluation
            let tier = 'Novice Typist';
            if (stats.wpm >= 90) tier = '⚡ Speed Demon (Elite)';
            else if (stats.wpm >= 70) tier = '🏎️ Mechanical Keyboard Wizard';
            else if (stats.wpm >= 50) tier = '💻 Senior Software Engineer';
            else if (stats.wpm >= 35) tier = '📝 Solid Contender';

            if (resBadge) resBadge.textContent = tier;

            if (resBestBanner) {
                if (isNewBest && stats.wpm > 0) {
                    resBestBanner.classList.remove('hidden');
                } else {
                    resBestBanner.classList.add('hidden');
                }
            }

            this.resultsModal.classList.remove('hidden');
            this.resultsModal.classList.add('flex');
        }

        initEvents() {
            // Typing input listener
            if (this.hiddenInput) {
                this.hiddenInput.addEventListener('input', (e) => this.handleInput(e));
            }

            // Clicking on prompt area focuses input field (works on mobile touch & desktop)
            const promptBox = document.getElementById('type-prompt-box');
            if (promptBox && this.hiddenInput) {
                promptBox.addEventListener('click', () => {
                    this.hiddenInput.focus();
                });
            }

            // Mobile focus tap banner
            const focusBtn = document.getElementById('type-focus-tap-btn');
            if (focusBtn && this.hiddenInput) {
                focusBtn.addEventListener('click', () => {
                    this.hiddenInput.focus();
                });
            }

            // Results Modal Buttons
            const playAgainBtn = document.getElementById('type-play-again-btn');
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => {
                    this.resetChallenge();
                    if (this.hiddenInput) this.hiddenInput.focus();
                });
            }

            const newPromptBtn = document.getElementById('type-new-prompt-btn');
            if (newPromptBtn) {
                newPromptBtn.addEventListener('click', () => {
                    this.resetChallenge();
                    if (this.hiddenInput) this.hiddenInput.focus();
                });
            }

            const resetBtn = document.getElementById('type-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetChallenge();
                });
            }
        }

        initUI() {
            // Time Selector (15s, 30s, 60s)
            const timeButtons = document.querySelectorAll('.type-time-btn');
            timeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    timeButtons.forEach(b => {
                        b.classList.remove('bg-accent-green', 'shadow-subtle-2');
                        b.classList.add('bg-canvas-white');
                    });
                    btn.classList.add('bg-accent-green', 'shadow-subtle-2');
                    btn.classList.remove('bg-canvas-white');

                    this.timeLimit = parseInt(btn.dataset.time || '30', 10);
                    this.resetChallenge();
                });
            });

            // Difficulty / Category Selector
            const diffButtons = document.querySelectorAll('.type-diff-btn');
            diffButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    diffButtons.forEach(b => {
                        b.classList.remove('bg-highlight-yellow', 'shadow-subtle-2');
                        b.classList.add('bg-canvas-white');
                    });
                    btn.classList.add('bg-highlight-yellow', 'shadow-subtle-2');
                    btn.classList.remove('bg-canvas-white');

                    this.difficulty = btn.dataset.diff || 'beginner';
                    this.resetChallenge();
                });
            });
        }

        onActivate() {
            this.isActive = true;
            // Optionally auto-focus on desktop
            if (window.innerWidth >= 768 && this.hiddenInput) {
                setTimeout(() => this.hiddenInput.focus(), 150);
            }
        }

        onDeactivate() {
            this.isActive = false;
            this.stopTimer();
            if (this.hiddenInput) this.hiddenInput.blur();
        }
    }

    // Export instance to window
    window.TypeOrDieGame = TypeOrDieGame;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.typeOrDieInstance = new TypeOrDieGame();
        });
    } else {
        window.typeOrDieInstance = new TypeOrDieGame();
    }
})();
