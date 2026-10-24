/**
 * Reflex.exe - Precision Reaction Time Challenge (5-Round Test)
 * Built for Sagnik's Developer Arcade
 */

(function () {
    'use strict';

    class ReflexGame {
        constructor() {
            this.container = document.getElementById('game-panel-reflex');
            if (!this.container) return;

            // UI Elements
            this.arenaBox = document.getElementById('reflex-arena-box');
            this.iconEl = document.getElementById('reflex-status-icon');
            this.titleEl = document.getElementById('reflex-status-title');
            this.descEl = document.getElementById('reflex-status-desc');
            this.roundDisplay = document.getElementById('reflex-round-val');
            this.bestDisplay = document.getElementById('reflex-best-val');
            this.roundsList = document.getElementById('reflex-rounds-list');
            this.resultsModal = document.getElementById('reflex-results-modal');

            // Game State
            this.state = 'READY'; // 'READY', 'WAITING', 'FALSE_START', 'SIGNAL', 'ROUND_DONE', 'FINISHED'
            this.currentRound = 1;
            this.totalRounds = 5;
            this.roundTimes = [];
            this.waitTimeout = null;
            this.signalStartTime = 0;
            this.isActive = false;
            this.personalBestAvg = this.loadPersonalBest();

            this.initEvents();
            this.initUI();
            this.resetChallenge();
        }

        loadPersonalBest() {
            try {
                return parseInt(localStorage.getItem('arcade_reflex_best_avg') || '0', 10);
            } catch (e) {
                return 0;
            }
        }

        savePersonalBest(val) {
            try {
                localStorage.setItem('arcade_reflex_best_avg', val.toString());
            } catch (e) {}
        }

        resetChallenge() {
            this.clearWaitingTimer();
            this.state = 'READY';
            this.currentRound = 1;
            this.roundTimes = [];
            this.signalStartTime = 0;

            if (this.resultsModal) {
                this.resultsModal.classList.add('hidden');
                this.resultsModal.classList.remove('flex');
            }

            this.updateRoundStats();
            this.renderState();
        }

        clearWaitingTimer() {
            if (this.waitTimeout) {
                clearTimeout(this.waitTimeout);
                this.waitTimeout = null;
            }
        }

        handleInteraction() {
            if (!this.isActive) return;

            switch (this.state) {
                case 'READY':
                    this.startWaitingState();
                    break;

                case 'WAITING':
                    this.handleFalseStart();
                    break;

                case 'SIGNAL':
                    this.handleSignalClick();
                    break;

                case 'FALSE_START':
                case 'ROUND_DONE':
                    if (this.currentRound <= this.totalRounds) {
                        this.startWaitingState();
                    }
                    break;

                case 'FINISHED':
                    this.resetChallenge();
                    break;
            }
        }

        startWaitingState() {
            this.clearWaitingTimer();
            this.state = 'WAITING';
            this.renderState();

            // Random delay between 1.6s and 4.6s
            const delay = Math.floor(Math.random() * 3000) + 1600;

            this.waitTimeout = setTimeout(() => {
                if (this.state === 'WAITING' && this.isActive) {
                    this.triggerSignal();
                }
            }, delay);
        }

        handleFalseStart() {
            this.clearWaitingTimer();
            this.state = 'FALSE_START';
            this.renderState();
        }

        triggerSignal() {
            this.state = 'SIGNAL';
            this.signalStartTime = performance.now();
            this.renderState();
        }

        handleSignalClick() {
            const reactionTime = Math.round(performance.now() - this.signalStartTime);
            this.roundTimes.push(reactionTime);
            this.state = 'ROUND_DONE';

            this.updateRoundStats();
            this.renderState(reactionTime);

            if (this.roundTimes.length >= this.totalRounds) {
                // Completed all 5 rounds
                setTimeout(() => {
                    this.finishChallenge();
                }, 750);
            } else {
                this.currentRound++;
                if (this.roundDisplay) {
                    this.roundDisplay.textContent = `${this.currentRound}/${this.totalRounds}`;
                }
            }
        }

        updateRoundStats() {
            if (this.roundDisplay) {
                this.roundDisplay.textContent = `${Math.min(this.currentRound, this.totalRounds)}/${this.totalRounds}`;
            }

            if (this.bestDisplay) {
                this.bestDisplay.textContent = this.personalBestAvg > 0 ? `${this.personalBestAvg} ms` : '—';
            }

            if (this.roundsList) {
                this.roundsList.innerHTML = '';
                for (let r = 1; r <= this.totalRounds; r++) {
                    const badge = document.createElement('div');
                    const hasTime = r <= this.roundTimes.length;
                    const time = hasTime ? this.roundTimes[r - 1] : null;

                    badge.className = `flex items-center justify-between px-3 py-1.5 rounded-md border text-xs font-mono font-bold ${
                        hasTime
                            ? 'bg-canvas-white border-charcoal-border shadow-subtle'
                            : (r === this.currentRound
                                ? 'bg-card-saffron border-charcoal-border ring-2 ring-charcoal-border'
                                : 'bg-pale-ash border-neutral-300 text-neutral-400')
                    }`;

                    badge.innerHTML = `
                        <span>Round ${r}</span>
                        <span>${hasTime ? `${time} ms` : '—'}</span>
                    `;
                    this.roundsList.appendChild(badge);
                }
            }
        }

        finishChallenge() {
            this.state = 'FINISHED';
            const sum = this.roundTimes.reduce((a, b) => a + b, 0);
            const avg = Math.round(sum / this.totalRounds);
            const best = Math.min(...this.roundTimes);

            let isNewBest = false;
            if (this.personalBestAvg === 0 || avg < this.personalBestAvg) {
                this.personalBestAvg = avg;
                this.savePersonalBest(avg);
                isNewBest = true;
                if (this.bestDisplay) this.bestDisplay.textContent = `${avg} ms`;
            }

            this.showResultsModal(avg, best, isNewBest);
        }

        showResultsModal(avg, best, isNewBest) {
            if (!this.resultsModal) return;

            const resAvg = document.getElementById('reflex-res-avg');
            const resBest = document.getElementById('reflex-res-best');
            const resTier = document.getElementById('reflex-res-tier');
            const resBanner = document.getElementById('reflex-res-best-banner');
            const resTable = document.getElementById('reflex-res-table');

            if (resAvg) resAvg.textContent = `${avg} ms`;
            if (resBest) resBest.textContent = `${best} ms`;

            // Reflex Tier evaluation
            let tier = 'Average Human Reflexes';
            let tierIcon = '🏃';
            if (avg < 185) {
                tier = '⚡ Superhuman / Esports God';
            } else if (avg <= 220) {
                tier = '🏎️ Pro Competitive Gamer';
            } else if (avg <= 270) {
                tier = '🎯 Fast Reflexes (Above Average)';
            } else if (avg <= 340) {
                tier = '🏃 Solid Normal Reflexes';
            } else if (avg <= 420) {
                tier = '☕ Needs More Caffeine';
            } else {
                tier = '🐢 Sloth Mode';
            }

            if (resTier) resTier.textContent = tier;

            if (resBanner) {
                if (isNewBest) resBanner.classList.remove('hidden');
                else resBanner.classList.add('hidden');
            }

            if (resTable) {
                resTable.innerHTML = '';
                this.roundTimes.forEach((t, i) => {
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center py-1 border-b border-neutral-200 text-xs font-mono';
                    row.innerHTML = `<span class="font-bold text-neutral-600">Round 0${i + 1}</span><span class="font-bold text-midnight-ink">${t} ms</span>`;
                    resTable.appendChild(row);
                });
            }

            this.resultsModal.classList.remove('hidden');
            this.resultsModal.classList.add('flex');
        }

        renderState(reactionTime = null) {
            if (!this.arenaBox) return;

            const box = this.arenaBox;
            const icon = this.iconEl;
            const title = this.titleEl;
            const desc = this.descEl;

            // Reset box classes
            box.className = 'w-full min-h-[300px] sm:min-h-[360px] rounded-xl border-3 border-charcoal-border shadow-subtle-4 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer transition-colors duration-150 touch-manipulation ';

            switch (this.state) {
                case 'READY':
                    box.className += 'bg-card-saffron hover:bg-highlight-yellow';
                    if (icon) icon.innerHTML = '<i class="fas fa-hand-pointer text-5xl sm:text-6xl text-midnight-ink mb-4"></i>';
                    if (title) title.textContent = `ROUND ${this.currentRound} OF ${this.totalRounds}`;
                    if (desc) desc.textContent = 'Click or Tap anywhere inside this card to begin.';
                    break;

                case 'WAITING':
                    box.className += 'bg-red-500 text-white animate-pulse';
                    if (icon) icon.innerHTML = '<i class="fas fa-hourglass-half text-5xl sm:text-6xl text-white mb-4 animate-spin"></i>';
                    if (title) title.textContent = 'WAIT FOR GREEN...';
                    if (desc) desc.textContent = 'Do NOT click yet! Wait for the screen to turn neon green.';
                    break;

                case 'FALSE_START':
                    box.className += 'bg-red-700 text-white';
                    if (icon) icon.innerHTML = '<i class="fas fa-exclamation-triangle text-5xl sm:text-6xl text-highlight-yellow mb-4"></i>';
                    if (title) title.textContent = 'TOO EARLY!';
                    if (desc) desc.textContent = 'You triggered before the green signal. Click anywhere to try this round again.';
                    break;

                case 'SIGNAL':
                    box.className += 'bg-accent-green text-midnight-ink';
                    if (icon) icon.innerHTML = '<i class="fas fa-bolt text-5xl sm:text-6xl text-midnight-ink mb-4 animate-bounce"></i>';
                    if (title) title.textContent = '⚡ CLICK / TAP NOW!';
                    if (desc) desc.textContent = 'Quickly! Click as fast as you can!';
                    break;

                case 'ROUND_DONE':
                    box.className += 'bg-card-mint text-midnight-ink';
                    if (icon) icon.innerHTML = '<i class="fas fa-check-circle text-5xl sm:text-6xl text-emerald-700 mb-4"></i>';
                    if (title) title.textContent = `${reactionTime} ms`;
                    if (desc) desc.textContent = this.currentRound < this.totalRounds
                        ? 'Great reaction! Click anywhere to proceed to the next round.'
                        : 'Final round complete! Calculating reflex analytics...';
                    break;

                case 'FINISHED':
                    box.className += 'bg-card-lavender text-midnight-ink';
                    if (icon) icon.innerHTML = '<i class="fas fa-trophy text-5xl sm:text-6xl text-highlight-yellow mb-4"></i>';
                    if (title) title.textContent = 'CHALLENGE COMPLETE';
                    if (desc) desc.textContent = 'Review your results or tap to test again.';
                    break;
            }
        }

        initEvents() {
            // Main click / pointer interaction on the reactive box
            if (this.arenaBox) {
                this.arenaBox.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    this.handleInteraction();
                });
            }

            // Keyboard spacebar trigger
            window.addEventListener('keydown', (e) => {
                if (!this.isActive) return;
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

                if (e.code === 'Space') {
                    e.preventDefault();
                    this.handleInteraction();
                }
            });

            // Results Modal Button
            const playAgainBtn = document.getElementById('reflex-play-again-btn');
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => {
                    this.resetChallenge();
                });
            }

            const resetBtn = document.getElementById('reflex-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetChallenge();
                });
            }
        }

        initUI() {
            this.updateRoundStats();
        }

        onActivate() {
            this.isActive = true;
        }

        onDeactivate() {
            this.isActive = false;
            this.clearWaitingTimer();
            if (this.state === 'WAITING') {
                this.state = 'READY';
                this.renderState();
            }
        }
    }

    // Export instance to window
    window.ReflexGame = ReflexGame;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.reflexGameInstance = new ReflexGame();
        });
    } else {
        window.reflexGameInstance = new ReflexGame();
    }
})();
