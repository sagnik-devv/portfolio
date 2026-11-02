/**
 * Type or Die - Typing Speed Challenge
 * Built for Sagnik's Developer Arcade
 */

(function () {
    'use strict';

    const PROMPTS = {
        beginner: [
            "Recruiter: 'Where do you see yourself in five years?' Sagnik: 'Refactoring your legacy code while saving the company millions. Stop searching, hire me, hire me!'",
            "Recruiter: 'What is your greatest technical strength?' Sagnik: 'Writing scalable APIs, shipping pixel-perfect frontends, and drinking iced coffee. Smash that hire button!'",
            "Recruiter: 'Why should we pick you over 500 other applicants?' Sagnik: 'Because my pull requests merge on the first review and I never break production on Fridays. Hire me right now!'",
            "Recruiter: 'Can you handle fast-paced startup pressure?' Sagnik: 'I debug distributed systems with a smile and zero panic. Pressure is my cardio. Sign the contract, hire me, hire me!'",
            "Recruiter: 'What is your salary expectation?' Sagnik: 'Fair enough to build your dream product, and competitive enough to feed my mechanical keyboard addiction. Hire me today!'",
            "Recruiter: 'Do you work well in cross-functional teams?' Sagnik: 'Product managers adore my estimates, designers love my CSS precision, and QA finds zero bugs. What are you waiting for? Hire me, hire me!'"
        ],
        intermediate: [
            "Recruiter: 'How do you design a high-throughput microservices architecture?' Sagnik: 'Event-driven queues, Redis caching, idempotent endpoints, and having Sagnik on the roster. Send the offer letter, hire me, hire me!'",
            "Recruiter: 'How do you resolve architectural disputes between engineers?' Sagnik: 'I challenge them to a match in Street Tekken, win by knockout, and merge the cleanest branch with zero downtime. That is senior leadership! Hire me!'",
            "Recruiter: 'What is your approach to Core Web Vitals optimization?' Sagnik: 'Sub-millisecond canvas renders, eliminating layout shifts, and hiring an engineer who treats 60 FPS as a baseline requirement. Hire me, hire me!'",
            "Recruiter: 'Can you describe your experience with cloud-native DevOps?' Sagnik: 'Containerized microservices, zero-downtime rolling deploys, automated CI/CD pipelines, and proactive health checks. Your dream engineer is right here. Hire me!'",
            "Recruiter: 'How do you handle production incidents on a holiday weekend?' Sagnik: 'I roll back the faulty build in three seconds, inspect the logs with surgical precision, and keep executives calm with solutions. Sign the papers, hire me, hire me!'",
            "Recruiter: 'Are you open to immediate opportunities?' Sagnik: 'My terminal is open, my code is clean, and my keyboard is clicking. Let us build the future together. Stop browsing LinkedIn, hire me, hire me!'"
        ],
        code: [
            "if (recruiter.lookingForAStarEngineer() && candidate.name === 'Sagnik') {\n  recruiter.sendOfferLetter({\n    verdict: 'INSTANT_HIRE',\n    message: 'Hire me, hire me! Let us build something epic!'\n  });\n}",
            "const hireSagnik = async () => {\n  const interview = await evaluateSkills(['React', 'TypeScript', 'Node', 'SystemDesign']);\n  if (interview.score >= 100) {\n    return 'SIGN_THE_CONTRACT_NOW_HIRE_ME';\n  }\n  return 'HIRE_ME_ANYWAY';\n};",
            "SELECT candidate_id, name, 'HIRE_ME_HIRE_ME' AS status\nFROM engineers\nWHERE name = 'Sagnik'\n  AND ships_clean_code = true\n  AND breaks_prod = false\nLIMIT 1;\n-- 1 row returned: Immediate Offer!",
            "function evaluateCandidate(candidate) {\n  while (!company.hasHired(candidate)) {\n    company.inbox.push('Hey, you should hire me, hire me!');\n  }\n  return 'Company revenue increased by 300% 🚀';\n}",
            "const offerLetter = {\n  candidate: 'Sagnik Chakraborty',\n  role: 'Software Engineer',\n  decision: 'Offer Accepted',\n  note: 'Hire me, hire me! Let us ship world-class software together.'\n};\nconsole.log(offerLetter);"
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
            let tier = 'Promising Candidate 📝';
            if (stats.wpm >= 90) tier = '🚀 Instant Offer (Lead Architect)';
            else if (stats.wpm >= 70) tier = '💼 Send The Contract! (Senior Engineer)';
            else if (stats.wpm >= 50) tier = '☕ Schedule Round 2 (Solid Hire)';
            else if (stats.wpm >= 35) tier = '📝 Promising Candidate (Hire Me!)';

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
