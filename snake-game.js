/**
 * Nokia Snake - Classic Retro 3310 Mobile Snake Arcade Game
 * Built for Sagnik's Developer Arcade
 */

(function () {
    'use strict';

    class NokiaSnakeGame {
        constructor() {
            this.canvas = document.getElementById('snake-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            // Grid configuration (25 cols x 20 rows = 500x400)
            this.cols = 25;
            this.rows = 20;
            this.cellSize = 20;

            // Internal logical resolution
            this.canvas.width = this.cols * this.cellSize;
            this.canvas.height = this.rows * this.cellSize;

            // Audio
            this.audioCtx = null;
            this.soundEnabled = true;

            // State
            this.state = 'IDLE'; // 'IDLE', 'PLAYING', 'PAUSED', 'GAME_OVER'
            this.isActive = false; // When arcade tab is focused
            this.snake = [];
            this.direction = { x: 1, y: 0 };
            this.inputQueue = [];
            this.food = { x: 0, y: 0 };
            this.score = 0;
            this.highScore = this.loadHighScore();
            this.wrapMode = false; // false = solid walls, true = wrap around
            this.difficulty = 'normal'; // 'easy' (130ms), 'normal' (90ms), 'hard' (55ms)
            this.speeds = { easy: 135, normal: 90, hard: 55 };

            this.tickInterval = null;
            this.lastTickTime = 0;

            // Touch gesture support
            this.touchStartX = 0;
            this.touchStartY = 0;

            this.initEvents();
            this.initUI();
            this.reset();
            this.render();
        }

        loadHighScore() {
            try {
                return parseInt(localStorage.getItem('arcade_snake_highscore') || '0', 10);
            } catch (e) {
                return 0;
            }
        }

        saveHighScore(val) {
            try {
                localStorage.setItem('arcade_snake_highscore', val.toString());
            } catch (e) {}
        }

        initAudio() {
            if (!this.soundEnabled) return;
            if (!this.audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.audioCtx = new AudioCtx();
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        }

        playBeep(type) {
            if (!this.soundEnabled) return;
            this.initAudio();
            if (!this.audioCtx) return;

            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            if (type === 'eat') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.setValueAtTime(900, now + 0.05);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'die') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'start') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
            }
        }

        reset() {
            const startX = 6;
            const startY = 10;
            this.snake = [
                { x: startX, y: startY },
                { x: startX - 1, y: startY },
                { x: startX - 2, y: startY }
            ];
            this.direction = { x: 1, y: 0 };
            this.inputQueue = [];
            this.score = 0;
            this.spawnFood();
            this.updateStatsDisplay();
        }

        spawnFood() {
            const occupied = new Set();
            this.snake.forEach(seg => occupied.add(`${seg.x},${seg.y}`));

            const available = [];
            for (let x = 0; x < this.cols; x++) {
                for (let y = 0; y < this.rows; y++) {
                    if (!occupied.has(`${x},${y}`)) {
                        available.push({ x, y });
                    }
                }
            }

            if (available.length > 0) {
                const choice = available[Math.floor(Math.random() * available.length)];
                this.food = choice;
            }
        }

        start() {
            if (this.state === 'PLAYING') return;
            if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
                this.reset();
            }
            this.state = 'PLAYING';
            this.playBeep('start');
            this.startLoop();
            this.updateUIButtons();
            this.render();
        }

        pause() {
            if (this.state !== 'PLAYING') return;
            this.state = 'PAUSED';
            this.stopLoop();
            this.updateUIButtons();
            this.render();
        }

        resume() {
            if (this.state !== 'PAUSED') return;
            this.state = 'PLAYING';
            this.startLoop();
            this.updateUIButtons();
            this.render();
        }

        restart() {
            this.stopLoop();
            this.reset();
            this.state = 'PLAYING';
            this.playBeep('start');
            this.startLoop();
            this.updateUIButtons();
            this.render();
        }

        startLoop() {
            this.stopLoop();
            const interval = this.speeds[this.difficulty] || 90;
            this.tickInterval = setInterval(() => {
                this.tick();
            }, interval);
        }

        stopLoop() {
            if (this.tickInterval) {
                clearInterval(this.tickInterval);
                this.tickInterval = null;
            }
        }

        handleDirectionChange(dx, dy) {
            if (!this.isActive) return;
            if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
                this.start();
                return;
            }
            if (this.state === 'PAUSED') {
                this.resume();
            }

            // Determine reference direction (either current or last queued)
            const lastDir = this.inputQueue.length > 0 ? this.inputQueue[this.inputQueue.length - 1] : this.direction;

            // Prevent reversing 180 degrees
            if (lastDir.x + dx === 0 && lastDir.y + dy === 0) return;
            if (lastDir.x === dx && lastDir.y === dy) return;

            // Buffer up to 2 pending turns
            if (this.inputQueue.length < 2) {
                this.inputQueue.push({ x: dx, y: dy });
            }
        }

        tick() {
            if (this.state !== 'PLAYING') return;

            // Apply queued direction
            if (this.inputQueue.length > 0) {
                this.direction = this.inputQueue.shift();
            }

            const head = this.snake[0];
            let newX = head.x + this.direction.x;
            let newY = head.y + this.direction.y;

            // Wall handling
            if (this.wrapMode) {
                newX = (newX + this.cols) % this.cols;
                newY = (newY + this.rows) % this.rows;
            } else {
                if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
                    this.gameOver();
                    return;
                }
            }

            // Self collision check (exclude tail if it will move, but check body)
            const willGrow = (newX === this.food.x && newY === this.food.y);
            const checkLength = willGrow ? this.snake.length : this.snake.length - 1;
            for (let i = 0; i < checkLength; i++) {
                if (this.snake[i].x === newX && this.snake[i].y === newY) {
                    this.gameOver();
                    return;
                }
            }

            // Add new head
            this.snake.unshift({ x: newX, y: newY });

            // Food collision
            if (willGrow) {
                const mult = this.difficulty === 'hard' ? 2 : (this.difficulty === 'easy' ? 1 : 1.5);
                this.score += Math.round(10 * mult);
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.saveHighScore(this.highScore);
                }
                this.playBeep('eat');
                this.spawnFood();
                this.updateStatsDisplay();
            } else {
                this.snake.pop(); // Remove tail
            }

            this.render();
        }

        gameOver() {
            this.state = 'GAME_OVER';
            this.stopLoop();
            this.playBeep('die');
            this.updateStatsDisplay();
            this.updateUIButtons();
            this.render();
        }

        setDifficulty(diff) {
            if (this.speeds[diff]) {
                this.difficulty = diff;
                if (this.state === 'PLAYING') {
                    this.startLoop();
                }
            }
        }

        setWrapMode(wrap) {
            this.wrapMode = wrap;
            this.render();
        }

        updateStatsDisplay() {
            const scoreEl = document.getElementById('snake-score-val');
            const highEl = document.getElementById('snake-high-val');
            if (scoreEl) scoreEl.textContent = this.score;
            if (highEl) highEl.textContent = this.highScore;
        }

        updateUIButtons() {
            const pauseBtn = document.getElementById('snake-pause-btn');
            if (pauseBtn) {
                if (this.state === 'PLAYING') {
                    pauseBtn.innerHTML = '<i class="fas fa-pause mr-1"></i> Pause';
                } else if (this.state === 'PAUSED') {
                    pauseBtn.innerHTML = '<i class="fas fa-play mr-1"></i> Resume';
                } else {
                    pauseBtn.innerHTML = '<i class="fas fa-play mr-1"></i> Start';
                }
            }
        }

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const cs = this.cellSize;

            // LCD Background (authentic Nokia monochrome/green tone)
            ctx.fillStyle = '#9cb884';
            ctx.fillRect(0, 0, w, h);

            // Subtle LCD matrix grid pattern
            ctx.fillStyle = 'rgba(120, 142, 100, 0.22)';
            for (let x = 0; x < w; x += 4) {
                for (let y = 0; y < h; y += 4) {
                    if ((x + y) % 8 === 0) {
                        ctx.fillRect(x, y, 1.5, 1.5);
                    }
                }
            }

            // LCD Pixel Border (if not wrapMode, draw distinct dotted / solid wall border)
            if (!this.wrapMode) {
                ctx.strokeStyle = '#1d2a1b';
                ctx.lineWidth = 3;
                ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
            } else {
                // Dashed border indicator for wrap-around
                ctx.save();
                ctx.strokeStyle = 'rgba(29, 42, 27, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 6]);
                ctx.strokeRect(1, 1, w - 2, h - 2);
                ctx.restore();
            }

            // Draw Food (Pixel apple with leaf)
            const fx = this.food.x * cs;
            const fy = this.food.y * cs;
            ctx.fillStyle = '#172214';
            // Retro 16x16 pixel apple representation inside the 20x20 cell
            ctx.fillRect(fx + 3, fy + 5, 14, 12);
            ctx.fillRect(fx + 5, fy + 3, 10, 16);
            // Leaf stem
            ctx.fillRect(fx + 9, fy + 1, 3, 3);
            ctx.fillRect(fx + 12, fy + 2, 2, 2);

            // Draw Snake
            this.snake.forEach((seg, idx) => {
                const sx = seg.x * cs;
                const sy = seg.y * cs;

                ctx.fillStyle = '#172214';
                // Blocky pixel body with slight 1px inset to look like Nokia LCD pixels
                ctx.fillRect(sx + 1, sy + 1, cs - 2, cs - 2);

                // Distinct eyes for head
                if (idx === 0) {
                    ctx.fillStyle = '#9cb884'; // LCD inverted eye color
                    const dir = this.direction;
                    if (dir.x === 1) { // Moving right
                        ctx.fillRect(sx + cs - 6, sy + 4, 3, 3);
                        ctx.fillRect(sx + cs - 6, sy + cs - 7, 3, 3);
                    } else if (dir.x === -1) { // Moving left
                        ctx.fillRect(sx + 3, sy + 4, 3, 3);
                        ctx.fillRect(sx + 3, sy + cs - 7, 3, 3);
                    } else if (dir.y === -1) { // Moving up
                        ctx.fillRect(sx + 4, sy + 3, 3, 3);
                        ctx.fillRect(sx + cs - 7, sy + 3, 3, 3);
                    } else { // Moving down
                        ctx.fillRect(sx + 4, sy + cs - 6, 3, 3);
                        ctx.fillRect(sx + cs - 7, sy + cs - 6, 3, 3);
                    }
                }
            });

            // State Overlays on LCD
            if (this.state === 'IDLE') {
                this.renderLCDOverlay('NOKIA 3310 SNAKE', 'TAP START OR PRESS ARROW KEY', '#172214');
            } else if (this.state === 'PAUSED') {
                this.renderLCDOverlay('GAME PAUSED', 'PRESS SPACE OR TAP RESUME', '#172214');
            } else if (this.state === 'GAME_OVER') {
                const isNewHigh = this.score > 0 && this.score === this.highScore;
                const sub = isNewHigh ? `★ NEW HIGH SCORE: ${this.score} ★` : `SCORE: ${this.score} • HIGH: ${this.highScore}`;
                this.renderLCDOverlay('GAME OVER', sub, '#172214', 'TAP RESTART TO PLAY');
            }
        }

        renderLCDOverlay(title, subtitle, color, actionText) {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.save();
            // Semi-transparent LCD box
            ctx.fillStyle = 'rgba(156, 184, 132, 0.94)';
            const boxW = w - 60;
            const boxH = actionText ? 130 : 96;
            const boxX = 30;
            const boxY = (h - boxH) / 2;

            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // Title
            ctx.fillStyle = color;
            ctx.font = 'bold 22px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(title, w / 2, boxY + 28);

            // Subtitle
            ctx.font = 'bold 13px "Courier New", monospace';
            ctx.fillText(subtitle, w / 2, boxY + 58);

            if (actionText) {
                ctx.fillStyle = '#172214';
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.fillText(`[ ${actionText} ]`, w / 2, boxY + 92);
            }

            ctx.restore();
        }

        initEvents() {
            // Keyboard Controls
            window.addEventListener('keydown', (e) => {
                if (!this.isActive) return;
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                    // Prevent window scrolling while playing active snake
                    e.preventDefault();
                }

                if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    this.handleDirectionChange(0, -1);
                } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    this.handleDirectionChange(0, 1);
                } else if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.handleDirectionChange(-1, 0);
                } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.handleDirectionChange(1, 0);
                } else if (e.code === 'Space') {
                    if (this.state === 'PLAYING') this.pause();
                    else if (this.state === 'PAUSED') this.resume();
                    else this.start();
                } else if (e.code === 'Enter') {
                    if (this.state === 'GAME_OVER') this.restart();
                }
            });

            // Touch Swipe Handling on Canvas
            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    this.touchStartX = e.touches[0].clientX;
                    this.touchStartY = e.touches[0].clientY;
                }
            }, { passive: true });

            this.canvas.addEventListener('touchend', (e) => {
                if (!this.isActive) return;
                if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
                    this.start();
                    return;
                }
                if (e.changedTouches.length === 1) {
                    const dx = e.changedTouches[0].clientX - this.touchStartX;
                    const dy = e.changedTouches[0].clientY - this.touchStartY;
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);

                    if (Math.max(absDx, absDy) > 25) { // Threshold for swipe
                        if (absDx > absDy) {
                            if (dx > 0) this.handleDirectionChange(1, 0); // Right
                            else this.handleDirectionChange(-1, 0); // Left
                        } else {
                            if (dy > 0) this.handleDirectionChange(0, 1); // Down
                            else this.handleDirectionChange(0, -1); // Up
                        }
                    }
                }
            }, { passive: true });

            // Click canvas to start / play again
            this.canvas.addEventListener('click', () => {
                if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
                    this.start();
                } else if (this.state === 'PAUSED') {
                    this.resume();
                }
            });
        }

        initUI() {
            // Action Buttons
            const pauseBtn = document.getElementById('snake-pause-btn');
            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => {
                    if (this.state === 'PLAYING') this.pause();
                    else if (this.state === 'PAUSED') this.resume();
                    else this.start();
                });
            }

            const resetBtn = document.getElementById('snake-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.restart();
                });
            }

            const soundBtn = document.getElementById('snake-sound-btn');
            if (soundBtn) {
                soundBtn.addEventListener('click', () => {
                    this.soundEnabled = !this.soundEnabled;
                    soundBtn.innerHTML = this.soundEnabled ?
                        '<i class="fas fa-volume-up"></i> Sound On' :
                        '<i class="fas fa-volume-mute"></i> Sound Off';
                });
            }

            // Mode Toggle (Wall vs Wrap)
            const modeSelect = document.getElementById('snake-mode-select');
            if (modeSelect) {
                modeSelect.addEventListener('change', (e) => {
                    this.setWrapMode(e.target.value === 'wrap');
                });
            }

            // Difficulty Selector
            const diffSelect = document.getElementById('snake-diff-select');
            if (diffSelect) {
                diffSelect.addEventListener('change', (e) => {
                    this.setDifficulty(e.target.value);
                });
            }

            // On-Screen D-Pad (Up, Down, Left, Right)
            this.bindDpadButton('snake-dpad-up', () => this.handleDirectionChange(0, -1));
            this.bindDpadButton('snake-dpad-down', () => this.handleDirectionChange(0, 1));
            this.bindDpadButton('snake-dpad-left', () => this.handleDirectionChange(-1, 0));
            this.bindDpadButton('snake-dpad-right', () => this.handleDirectionChange(1, 0));
        }

        bindDpadButton(id, callback) {
            const btn = document.getElementById(id);
            if (!btn) return;

            const handler = (e) => {
                e.preventDefault();
                callback();
                btn.classList.add('bg-highlight-yellow');
                setTimeout(() => btn.classList.remove('bg-highlight-yellow'), 120);
            };

            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('mousedown', handler);
        }

        onActivate() {
            this.isActive = true;
            this.render();
        }

        onDeactivate() {
            this.isActive = false;
            if (this.state === 'PLAYING') {
                this.pause();
            }
        }
    }

    // Export instance to window
    window.NokiaSnakeGame = NokiaSnakeGame;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.nokiaSnakeInstance = new NokiaSnakeGame();
        });
    } else {
        window.nokiaSnakeInstance = new NokiaSnakeGame();
    }
})();
