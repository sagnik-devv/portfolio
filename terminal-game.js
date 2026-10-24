/**
 * Hack the Terminal - Code-Breaking Logic Puzzle
 * Built for Sagnik's Developer Arcade
 */

(function () {
    'use strict';

    class HackTerminalGame {
        constructor() {
            this.container = document.getElementById('game-panel-terminal');
            if (!this.container) return;

            // UI Elements
            this.slotsContainer = document.getElementById('term-slots-container');
            this.historyFeed = document.getElementById('term-history-feed');
            this.attemptsDisplay = document.getElementById('term-attempts-val');
            this.attemptsBar = document.getElementById('term-attempts-bar');
            this.statusMsg = document.getElementById('term-status-msg');
            this.resultOverlay = document.getElementById('term-result-overlay');

            // Difficulty modes
            this.difficulties = {
                easy: { length: 3, attempts: 10, label: 'Novice (3 Digits)' },
                normal: { length: 4, attempts: 8, label: 'Analyst (4 Digits)' },
                hard: { length: 5, attempts: 7, label: 'Cyber-Ops (5 Digits)' }
            };

            this.currentDiff = 'normal';
            this.codeLength = 4;
            this.maxAttempts = 8;
            this.attemptsLeft = 8;
            this.secretCode = [];
            this.currentGuess = [];
            this.guessHistory = [];
            this.eliminatedDigits = new Set();
            this.confirmedDigits = new Set();
            this.isActive = false;
            this.isGameOver = false;

            this.initEvents();
            this.initUI();
            this.resetGame();
        }

        generateSecretCode() {
            const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            // Fisher-Yates shuffle
            for (let i = digits.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [digits[i], digits[j]] = [digits[j], digits[i]];
            }
            return digits.slice(0, this.codeLength);
        }

        resetGame() {
            const config = this.difficulties[this.currentDiff] || this.difficulties.normal;
            this.codeLength = config.length;
            this.maxAttempts = config.attempts;
            this.attemptsLeft = this.maxAttempts;
            this.secretCode = this.generateSecretCode();
            this.currentGuess = [];
            this.guessHistory = [];
            this.eliminatedDigits.clear();
            this.confirmedDigits.clear();
            this.isGameOver = false;

            this.updateSlotsDisplay();
            this.renderHistory();
            this.updateKeypadBadges();
            this.updateAttemptsUI();
            this.setStatus('Ready for decryption sequence. Enter digits.', 'neutral');

            if (this.resultOverlay) {
                this.resultOverlay.classList.add('hidden');
                this.resultOverlay.classList.remove('flex');
            }
        }

        setStatus(msg, type = 'neutral') {
            if (!this.statusMsg) return;
            this.statusMsg.textContent = msg;
            this.statusMsg.className = 'text-xs font-mono font-semibold ';
            if (type === 'error') {
                this.statusMsg.className += 'text-red-400 animate-pulse';
            } else if (type === 'success') {
                this.statusMsg.className += 'text-accent-green';
            } else if (type === 'warning') {
                this.statusMsg.className += 'text-amber-300';
            } else {
                this.statusMsg.className += 'text-neutral-400';
            }
        }

        inputDigit(digit) {
            if (!this.isActive || this.isGameOver) return;
            if (this.currentGuess.length >= this.codeLength) {
                this.setStatus(`Max ${this.codeLength} digits entered. Press SUBMIT to verify.`, 'warning');
                return;
            }

            // Enforce unique digits
            if (this.currentGuess.includes(digit)) {
                this.setStatus(`Digit ${digit} already selected. Digits must be unique!`, 'error');
                return;
            }

            this.currentGuess.push(digit);
            this.updateSlotsDisplay();
            this.setStatus(`Digit ${digit} entered (${this.currentGuess.length}/${this.codeLength}).`, 'neutral');
        }

        backspace() {
            if (!this.isActive || this.isGameOver) return;
            if (this.currentGuess.length > 0) {
                this.currentGuess.pop();
                this.updateSlotsDisplay();
                this.setStatus('Last digit cleared.', 'neutral');
            }
        }

        clearGuess() {
            if (!this.isActive || this.isGameOver) return;
            this.currentGuess = [];
            this.updateSlotsDisplay();
            this.setStatus('Guess buffer cleared.', 'neutral');
        }

        submitGuess() {
            if (!this.isActive || this.isGameOver) return;

            if (this.currentGuess.length < this.codeLength) {
                this.setStatus(`Incomplete code! Enter ${this.codeLength} digits to submit.`, 'error');
                return;
            }

            // Calculate feedback (Exact vs Partial vs Absent)
            const guess = [...this.currentGuess];
            const secret = [...this.secretCode];
            let exact = 0;
            let partial = 0;

            const unmatchedSecret = [];
            const unmatchedGuess = [];

            // First pass: exact matches
            for (let i = 0; i < this.codeLength; i++) {
                if (guess[i] === secret[i]) {
                    exact++;
                    this.confirmedDigits.add(guess[i]);
                } else {
                    unmatchedSecret.push(secret[i]);
                    unmatchedGuess.push(guess[i]);
                }
            }

            // Second pass: partial matches
            unmatchedGuess.forEach(d => {
                const idx = unmatchedSecret.indexOf(d);
                if (idx !== -1) {
                    partial++;
                    this.confirmedDigits.add(d);
                    unmatchedSecret.splice(idx, 1);
                } else {
                    this.eliminatedDigits.add(d);
                }
            });

            const miss = this.codeLength - (exact + partial);

            // Record guess
            this.guessHistory.unshift({
                attemptNum: this.maxAttempts - this.attemptsLeft + 1,
                guess: guess,
                exact,
                partial,
                miss
            });

            this.attemptsLeft--;
            this.currentGuess = [];
            this.updateSlotsDisplay();
            this.renderHistory();
            this.updateKeypadBadges();
            this.updateAttemptsUI();

            // Win condition
            if (exact === this.codeLength) {
                this.handleWin();
                return;
            }

            // Loss condition
            if (this.attemptsLeft <= 0) {
                this.handleLoss();
                return;
            }

            this.setStatus(`Result: ${exact} Exact, ${partial} Partial. ${this.attemptsLeft} attempts remaining.`, 'neutral');
        }

        handleWin() {
            this.isGameOver = true;
            this.setStatus('ACCESS GRANTED! System Override Complete.', 'success');
            this.showResultOverlay(true);
        }

        handleLoss() {
            this.isGameOver = true;
            this.setStatus('TERMINAL LOCKDOWN! Maximum attempts exceeded.', 'error');
            this.showResultOverlay(false);
        }

        showResultOverlay(isWin) {
            if (!this.resultOverlay) return;

            const icon = document.getElementById('term-res-icon');
            const title = document.getElementById('term-res-title');
            const desc = document.getElementById('term-res-desc');
            const codeReveal = document.getElementById('term-res-code');
            const attemptsUsed = this.maxAttempts - this.attemptsLeft;

            if (isWin) {
                if (icon) icon.innerHTML = '<i class="fas fa-unlock-alt text-4xl text-accent-green"></i>';
                if (title) title.textContent = 'ACCESS GRANTED';
                if (title) title.className = 'text-2xl font-bold font-mono text-accent-green mb-1';
                if (desc) desc.textContent = `Security cipher bypassed in ${attemptsUsed} ${attemptsUsed === 1 ? 'attempt' : 'attempts'}!`;
                if (codeReveal) codeReveal.innerHTML = `<span class="text-xs text-neutral-400">CORRECT PIN:</span> <span class="text-accent-green font-bold tracking-widest text-lg">${this.secretCode.join(' ')}</span>`;
            } else {
                if (icon) icon.innerHTML = '<i class="fas fa-lock text-4xl text-red-500"></i>';
                if (title) title.textContent = 'ACCESS DENIED';
                if (title) title.className = 'text-2xl font-bold font-mono text-red-500 mb-1';
                if (desc) desc.textContent = 'The security vault remains sealed. Decryption protocol failed.';
                if (codeReveal) codeReveal.innerHTML = `<span class="text-xs text-neutral-400">SECRET PIN WAS:</span> <span class="text-red-400 font-bold tracking-widest text-lg">${this.secretCode.join(' ')}</span>`;
            }

            this.resultOverlay.classList.remove('hidden');
            this.resultOverlay.classList.add('flex');
        }

        updateSlotsDisplay() {
            if (!this.slotsContainer) return;
            this.slotsContainer.innerHTML = '';

            for (let i = 0; i < this.codeLength; i++) {
                const slot = document.createElement('div');
                const hasDigit = i < this.currentGuess.length;
                const digit = hasDigit ? this.currentGuess[i] : '';

                slot.className = `w-11 sm:w-14 h-12 sm:h-14 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-xl sm:text-2xl transition-all ${
                    hasDigit
                        ? 'border-accent-green bg-neutral-900 text-accent-green shadow-subtle ring-1 ring-accent-green/50'
                        : (i === this.currentGuess.length
                            ? 'border-highlight-yellow bg-neutral-950 text-highlight-yellow animate-pulse'
                            : 'border-neutral-700 bg-neutral-950 text-neutral-600')
                }`;

                slot.textContent = hasDigit ? digit : '_';
                this.slotsContainer.appendChild(slot);
            }
        }

        renderHistory() {
            if (!this.historyFeed) return;
            this.historyFeed.innerHTML = '';

            if (this.guessHistory.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'text-center py-6 text-neutral-500 font-mono text-xs';
                empty.innerHTML = '<i class="fas fa-terminal mr-1"></i> Awaiting initial code input sequence...';
                this.historyFeed.appendChild(empty);
                return;
            }

            this.guessHistory.forEach(item => {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between p-2.5 bg-neutral-900 border border-neutral-800 rounded-md font-mono text-xs sm:text-sm';

                // Attempt number + Guess digits
                const left = document.createElement('div');
                left.className = 'flex items-center gap-2 sm:gap-3';
                left.innerHTML = `
                    <span class="text-neutral-500 text-[11px]">#0${item.attemptNum}</span>
                    <span class="px-2 py-0.5 bg-neutral-950 border border-neutral-700 text-white rounded font-bold tracking-widest">
                        ${item.guess.join(' ')}
                    </span>
                `;

                // Badges for Exact and Partial
                const right = document.createElement('div');
                right.className = 'flex items-center gap-1.5 sm:gap-2';
                right.innerHTML = `
                    <span class="px-2 py-0.5 rounded text-[11px] font-bold border ${
                        item.exact > 0
                            ? 'bg-accent-green/20 text-accent-green border-accent-green/40'
                            : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }">
                        🟢 ${item.exact} Exact
                    </span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-bold border ${
                        item.partial > 0
                            ? 'bg-highlight-yellow/20 text-highlight-yellow border-highlight-yellow/40'
                            : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }">
                        🟡 ${item.partial} Partial
                    </span>
                `;

                row.appendChild(left);
                row.appendChild(right);
                this.historyFeed.appendChild(row);
            });
        }

        updateKeypadBadges() {
            const keys = document.querySelectorAll('.term-key-digit');
            keys.forEach(btn => {
                const digit = parseInt(btn.dataset.digit, 10);
                if (this.eliminatedDigits.has(digit)) {
                    btn.classList.add('opacity-35', 'line-through', 'border-neutral-800');
                    btn.classList.remove('border-charcoal-border', 'bg-neutral-800');
                } else if (this.confirmedDigits.has(digit)) {
                    btn.classList.remove('opacity-35', 'line-through');
                    btn.classList.add('border-accent-green', 'text-accent-green');
                } else {
                    btn.classList.remove('opacity-35', 'line-through', 'border-accent-green', 'text-accent-green');
                    btn.classList.add('border-charcoal-border');
                }
            });
        }

        updateAttemptsUI() {
            if (this.attemptsDisplay) {
                this.attemptsDisplay.textContent = `${this.attemptsLeft}/${this.maxAttempts}`;
            }

            if (this.attemptsBar) {
                const pct = (this.attemptsLeft / this.maxAttempts) * 100;
                this.attemptsBar.style.width = `${pct}%`;
                if (pct <= 25) {
                    this.attemptsBar.className = 'h-full bg-red-500 transition-all duration-300';
                } else if (pct <= 50) {
                    this.attemptsBar.className = 'h-full bg-highlight-yellow transition-all duration-300';
                } else {
                    this.attemptsBar.className = 'h-full bg-accent-green transition-all duration-300';
                }
            }
        }

        initEvents() {
            // Physical Keyboard Listener
            window.addEventListener('keydown', (e) => {
                if (!this.isActive || this.isGameOver) return;
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

                if (e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                    this.inputDigit(parseInt(e.key, 10));
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    this.backspace();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.submitGuess();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.clearGuess();
                }
            });

            // Result Modal Buttons
            const playAgainBtn = document.getElementById('term-play-again-btn');
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => {
                    this.resetGame();
                });
            }

            const restartBtn = document.getElementById('term-reset-btn');
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    this.resetGame();
                });
            }
        }

        initUI() {
            // Virtual Numeric Keypad buttons
            const digitBtns = document.querySelectorAll('.term-key-digit');
            digitBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const d = parseInt(btn.dataset.digit, 10);
                    this.inputDigit(d);
                });
            });

            const delBtn = document.getElementById('term-key-del');
            if (delBtn) {
                delBtn.addEventListener('click', () => this.backspace());
            }

            const submitBtn = document.getElementById('term-key-submit');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => this.submitGuess());
            }

            // Difficulty buttons
            const diffButtons = document.querySelectorAll('.term-diff-btn');
            diffButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    diffButtons.forEach(b => {
                        b.classList.remove('bg-purple-600', 'text-white', 'shadow-subtle');
                        b.classList.add('bg-neutral-800', 'text-neutral-300');
                    });
                    btn.classList.add('bg-purple-600', 'text-white', 'shadow-subtle');
                    btn.classList.remove('bg-neutral-800', 'text-neutral-300');

                    this.currentDiff = btn.dataset.diff || 'normal';
                    this.resetGame();
                });
            });
        }

        onActivate() {
            this.isActive = true;
        }

        onDeactivate() {
            this.isActive = false;
        }
    }

    // Export instance to window
    window.HackTerminalGame = HackTerminalGame;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.hackTerminalInstance = new HackTerminalGame();
        });
    } else {
        window.hackTerminalInstance = new HackTerminalGame();
    }
})();
