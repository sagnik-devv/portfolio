/**
 * Git Commit Snake - GitHub Heatmap Arcade Game
 * Built for Sagnik's Developer Portfolio & Arcade
 * Features live GitHub commit streak, authentic contribution graph, and neon green visuals.
 */

(function () {
    'use strict';

    const GH_USERNAME = 'sagnik-devv';
    const GH_PROFILE_URL = `https://github.com/${GH_USERNAME}`;

    // Audio completely disabled
    class GitAudio {
        constructor() {
            this.ctx = null;
            this.enabled = false;
        }

        init() {}
        play() {}
    }

    class GitCommitSnakeGame {
        constructor() {
            this.canvas = document.getElementById('snake-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            // Grid Layout (36 columns x 14 rows)
            // 36 columns = 12 months with 3 columns per month!
            // 14 rows = generous vertical space with 7 day labels
            this.cols = 36;
            this.rows = 14;
            this.cellSize = 18; // Step size per cell
            this.squareSize = 14.5; // Rounded square inside cell

            // Board Margins
            this.padLeft = 38; // Space for Mon, Wed, Fri
            this.padTop = 26; // Space for month headers
            this.padRight = 14;
            this.padBottom = 16;

            // Logical Resolution
            this.logicalWidth = this.padLeft + (this.cols * this.cellSize) + this.padRight; // 700px
            this.logicalHeight = this.padTop + (this.rows * this.cellSize) + this.padBottom; // 294px

            // DPR Setup
            this.setupResolution();

            // Audio
            this.audio = new GitAudio();

            // State
            this.state = 'IDLE'; // 'IDLE', 'PLAYING', 'PAUSED', 'GAME_OVER'
            this.isActive = false; // When tab is selected
            this.snake = [];
            this.direction = { x: 1, y: 0 };
            this.inputQueue = [];
            this.food = { x: 18, y: 7 };
            this.score = 0; // Commits eaten
            this.highScore = this.loadHighScore();
            this.sessionStreak = 0;
            this.wrapMode = true; // Default wrap-around like GitHub matrix
            this.difficulty = 'normal';
            this.speeds = { easy: 135, normal: 90, hard: 55 };

            this.tickInterval = null;
            this.animFrame = null;
            this.frameTime = 0;

            // Visual Effects
            this.particles = [];
            this.floatingTexts = [];
            this.shakeFrames = 0;

            // Heatmap Matrix
            this.gridMap = [];
            this.initGridMap();

            // Live GitHub Data & Streak
            this.liveStreak = 5;
            this.totalContributions = 168;
            this.loadLiveGitHubData();

            // Visitor Name Personalization
            const heroName = (window.getPortfolioVisitorName ? window.getPortfolioVisitorName() : localStorage.getItem('sagnik_portfolio_visitor')) || '';
            this.playerName = heroName || 'Visitor';

            const snakeNameDisplay = document.getElementById('snake-visitor-name-display');
            if (snakeNameDisplay) {
                snakeNameDisplay.textContent = this.playerName;
            }

            window.addEventListener('visitorNameChanged', (e) => {
                const raw = e.detail && e.detail.name ? e.detail.name : '';
                this.playerName = raw || 'Visitor';
                const disp = document.getElementById('snake-visitor-name-display');
                if (disp) {
                    disp.textContent = this.playerName;
                }
            });

            // Touch
            this.touchStartX = 0;
            this.touchStartY = 0;

            this.initEvents();
            this.initUI();
            this.reset();
            this.startAnimationLoop();
        }

        setupResolution() {
            const dpr = Math.max(window.devicePixelRatio || 1, 1);
            this.canvas.width = this.logicalWidth * dpr;
            this.canvas.height = this.logicalHeight * dpr;
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        loadHighScore() {
            try {
                return parseInt(localStorage.getItem('arcade_gitsnake_high') || localStorage.getItem('arcade_snake_highscore') || '0', 10);
            } catch (e) {
                return 0;
            }
        }

        saveHighScore(val) {
            try {
                localStorage.setItem('arcade_gitsnake_high', val.toString());
            } catch (e) {}
        }

        initGridMap() {
            this.gridMap = [];
            for (let c = 0; c < this.cols; c++) {
                this.gridMap[c] = [];
                for (let r = 0; r < this.rows; r++) {
                    this.gridMap[c][r] = {
                        level: 0,
                        count: 0,
                        isEaten: false
                    };
                }
            }
        }

        loadLiveGitHubData() {
            // Check for cached contributions
            try {
                const cached = localStorage.getItem('gh_contributions_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.processContributions(parsed);
                        return;
                    }
                }
            } catch (e) {}

            // Populate realistic defaults matching Sagnik's live screenshot (168 contributions in the last year)
            this.populateRealisticFallbackData();
        }

        onContributionsLoaded(contributions, totalObj) {
            if (Array.isArray(contributions) && contributions.length > 0) {
                this.processContributions(contributions);
            }
        }

        processContributions(contributions) {
            if (!Array.isArray(contributions) || contributions.length === 0) return;

            // Compute total contributions
            let total = 0;
            contributions.forEach(c => {
                total += (c.count || 0);
            });
            if (total > 0) this.totalContributions = total;

            // Compute Live Streak
            const sorted = [...contributions].filter(c => c && c.date).sort((a, b) => a.date.localeCompare(b.date));
            const countMap = new Map();
            sorted.forEach(c => countMap.set(c.date, c.count || 0));

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const yest = new Date(now);
            yest.setDate(yest.getDate() - 1);

            let checkDate = (countMap.get(todayStr) || 0) > 0 ? now : yest;
            let streak = 0;

            while (true) {
                const dStr = checkDate.toISOString().split('T')[0];
                const count = countMap.get(dStr) || 0;
                if (count > 0) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            this.liveStreak = Math.max(streak, 1);

            // Update UI elements
            this.updateHeaderAndStreakUI();

            // Map real contribution levels onto grid
            // Sample evenly across the last 365 days
            const recent = sorted.slice(-365);
            let idx = 0;
            for (let c = 0; c < this.cols; c++) {
                for (let r = 0; r < this.rows; r++) {
                    const dayItem = recent[idx % recent.length];
                    if (dayItem) {
                        const cnt = dayItem.count || 0;
                        let lvl = dayItem.level !== undefined ? dayItem.level : 0;
                        if (lvl === 0 && cnt > 0) {
                            lvl = cnt >= 8 ? 4 : (cnt >= 5 ? 3 : (cnt >= 2 ? 2 : 1));
                        }
                        this.gridMap[c][r].level = lvl;
                        this.gridMap[c][r].count = cnt;
                    }
                    idx++;
                }
            }

            this.render();
        }

        populateRealisticFallbackData() {
            this.totalContributions = 168;
            this.liveStreak = 5;
            this.updateHeaderAndStreakUI();

            // Fill grid with realistic commit heatmap matching Sagnik's GitHub screenshot
            for (let c = 0; c < this.cols; c++) {
                for (let r = 0; r < this.rows; r++) {
                    // Clusters around Dec (cols 3-5), Jan (6), Mar (12), Apr (15), May (18), Aug (27), Sep (30), Oct (34-35)
                    const inCluster = (c >= 3 && c <= 5) || (c === 7) || (c >= 12 && c <= 15) || (c >= 18 && c <= 20) || (c >= 27 && c <= 35);
                    const rand = Math.random();

                    let level = 0;
                    if (inCluster) {
                        if (rand > 0.45) level = Math.random() > 0.7 ? 4 : (Math.random() > 0.4 ? 3 : 2);
                        else if (rand > 0.25) level = 1;
                    } else {
                        if (rand > 0.88) level = Math.random() > 0.5 ? 2 : 1;
                    }

                    this.gridMap[c][r] = {
                        level,
                        count: level * 2,
                        isEaten: false
                    };
                }
            }
        }

        updateHeaderAndStreakUI() {
            const countEl = document.getElementById('git-snake-contrib-count');
            if (countEl) {
                countEl.textContent = `${this.totalContributions} contributions in the last year`;
            }
            const streakEl = document.getElementById('snake-streak-val');
            if (streakEl) {
                streakEl.textContent = `${this.liveStreak} Days`;
            }
        }

        reset() {
            this.hideGameOverModal();
            const startX = 6;
            const startY = 6;
            this.snake = [
                { x: startX, y: startY },
                { x: startX - 1, y: startY },
                { x: startX - 2, y: startY },
                { x: startX - 3, y: startY }
            ];
            this.direction = { x: 1, y: 0 };
            this.inputQueue = [];
            this.score = 0;
            this.sessionStreak = 0;
            this.particles = [];
            this.floatingTexts = [];
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
                this.food = available[Math.floor(Math.random() * available.length)];
                this.food.spawnTime = Date.now();
            }
        }

        start() {
            if (this.state === 'PLAYING') return;
            if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
                this.reset();
            }
            this.state = 'PLAYING';
            this.audio.play('start');
            this.startLoop();
            this.updateUIButtons();
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
        }

        restart() {
            this.stopLoop();
            this.reset();
            this.state = 'PLAYING';
            this.audio.play('start');
            this.startLoop();
            this.updateUIButtons();
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

        startAnimationLoop() {
            const animate = () => {
                this.frameTime++;
                this.updateEffects();
                this.render();
                this.animFrame = requestAnimationFrame(animate);
            };
            this.animFrame = requestAnimationFrame(animate);
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

            const lastDir = this.inputQueue.length > 0 ? this.inputQueue[this.inputQueue.length - 1] : this.direction;

            // Prevent 180-degree self reversal
            if (lastDir.x + dx === 0 && lastDir.y + dy === 0) return;
            if (lastDir.x === dx && lastDir.y === dy) return;

            if (this.inputQueue.length < 2) {
                this.inputQueue.push({ x: dx, y: dy });
            }
        }

        tick() {
            if (this.state !== 'PLAYING') return;

            if (this.inputQueue.length > 0) {
                this.direction = this.inputQueue.shift();
            }

            const head = this.snake[0];
            let newX = head.x + this.direction.x;
            let newY = head.y + this.direction.y;

            // Wall Collision / Wrap-around
            if (this.wrapMode) {
                newX = (newX + this.cols) % this.cols;
                newY = (newY + this.rows) % this.rows;
            } else {
                if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
                    this.gameOver('OUT_OF_BOUNDS: WALL COLLISION');
                    return;
                }
            }

            // Self Collision Check
            const willGrow = (newX === this.food.x && newY === this.food.y);
            const checkLength = willGrow ? this.snake.length : this.snake.length - 1;
            for (let i = 0; i < checkLength; i++) {
                if (this.snake[i].x === newX && this.snake[i].y === newY) {
                    this.gameOver('MERGE CONFLICT: SELF OVERLAP');
                    return;
                }
            }

            // Move Head Forward
            this.snake.unshift({ x: newX, y: newY });

            // Food / Commit Node Collision
            if (willGrow) {
                this.score++;
                this.sessionStreak++;

                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.saveHighScore(this.highScore);
                }

                // Turn the cell permanently into a Level 4 neon green commit!
                if (this.gridMap[newX] && this.gridMap[newX][newY]) {
                    this.gridMap[newX][newY].level = 4;
                    this.gridMap[newX][newY].count += 1;
                }

                // Spawn neon explosion particles
                const px = this.padLeft + newX * this.cellSize + this.cellSize / 2;
                const py = this.padTop + newY * this.cellSize + this.cellSize / 2;
                this.spawnParticles(px, py);

                // Spawn floating git commit notification
                const commitMsgs = [
                    '+1 Commit! 🚀',
                    'git commit -m "feat"',
                    'git push origin main',
                    'Merge: Clean Build ✨',
                    'Streak +1 🔥'
                ];
                const msg = commitMsgs[Math.floor(Math.random() * commitMsgs.length)];
                this.floatingTexts.push({
                    text: msg,
                    x: px,
                    y: py - 10,
                    alpha: 1.0,
                    vy: -0.75
                });

                // Audio Chime
                if (this.sessionStreak % 5 === 0) {
                    this.audio.play('streak');
                } else {
                    this.audio.play('commit');
                }

                this.spawnFood();
                this.updateStatsDisplay();
            } else {
                this.snake.pop(); // Remove tail
            }
        }

        spawnParticles(x, y) {
            for (let i = 0; i < 9; i++) {
                const angle = (Math.PI * 2 * i) / 9 + (Math.random() - 0.5);
                const speed = Math.random() * 2.5 + 1.2;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 3.5 + 2,
                    color: ['#a3e635', '#39d353', '#ffffff', '#22c55e'][Math.floor(Math.random() * 4)],
                    life: 1.0,
                    decay: Math.random() * 0.04 + 0.03
                });
            }
        }

        updateEffects() {
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // Update floating texts
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.y += ft.vy;
                ft.alpha -= 0.022;
                if (ft.alpha <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }

            if (this.shakeFrames > 0) {
                this.shakeFrames--;
            }
        }

        gameOver(reason = 'PUSH FAILED: REPO CONFLICT') {
            this.state = 'GAME_OVER';
            this.stopLoop();
            this.shakeFrames = 6;
            this.audio.play('conflict');
            this.updateStatsDisplay();
            this.updateUIButtons();
            this.showGameOverModal(reason);
        }

        showGameOverModal(reason) {
            const modal = document.getElementById('snake-game-over-modal');
            if (!modal) return;

            const modalTitle = document.getElementById('snake-modal-title');
            const scoreEl = document.getElementById('snake-res-score');
            const streakEl = document.getElementById('snake-res-streak');
            const bestEl = document.getElementById('snake-res-best');
            const liveStreakEl = document.getElementById('snake-res-livestreak');
            const descEl = document.getElementById('snake-modal-desc');

            if (modalTitle) {
                modalTitle.textContent = (this.playerName && this.playerName !== 'Visitor')
                    ? `${this.playerName.toUpperCase()}'S RUN HALTED`
                    : 'SESSION TERMINATED';
            }

            if (scoreEl) scoreEl.textContent = this.score.toString();
            if (streakEl) streakEl.textContent = this.sessionStreak.toString();
            if (bestEl) bestEl.textContent = this.highScore.toString();
            if (liveStreakEl) liveStreakEl.textContent = `${this.liveStreak} Days`;
            if (descEl) {
                descEl.textContent = (this.playerName && this.playerName !== 'Visitor')
                    ? `${this.playerName}'s push was interrupted: ${reason || 'Conflict detected'}`
                    : (reason || 'Branch conflict detected while pushing commits');
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        hideGameOverModal() {
            const modal = document.getElementById('snake-game-over-modal');
            if (modal) {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }
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

        // ================= RENDERING ENGINE =================
        render() {
            const ctx = this.ctx;
            const w = this.logicalWidth;
            const h = this.logicalHeight;

            ctx.save();

            // Screen Shake Effect on Collision
            if (this.shakeFrames > 0) {
                const shakeX = (Math.random() - 0.5) * 5;
                const shakeY = (Math.random() - 0.5) * 5;
                ctx.translate(shakeX, shakeY);
            }

            // GitHub Dark Canvas Background
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(0, 0, w, h);

            // Subtle Grid Border Frame
            ctx.strokeStyle = '#30363d';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.padLeft - 4, this.padTop - 4, this.cols * this.cellSize + 8, this.rows * this.cellSize + 8);

            // Draw Month Labels across the top
            this.renderMonthLabels(ctx);

            // Draw Day Labels on the left (Mon, Wed, Fri)
            this.renderDayLabels(ctx);

            // Draw Contribution Grid Cells
            this.renderHeatmapCells(ctx);

            // Draw Active Commit Node (Food)
            this.renderFoodNode(ctx);

            // Draw Neon Green Snake
            this.renderSnake(ctx);

            // Draw Particles & Floating Texts
            this.renderParticlesAndTexts(ctx);

            // Draw State Overlays (Idle, Paused)
            if (this.state === 'IDLE') {
                this.renderIdleOverlay(ctx);
            } else if (this.state === 'PAUSED') {
                this.renderPausedOverlay(ctx);
            }

            ctx.restore();
        }

        renderMonthLabels(ctx) {
            const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
            ctx.fillStyle = '#8b949e';
            ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Each month spans 3 columns
            for (let i = 0; i < months.length; i++) {
                const colIdx = i * 3;
                const x = this.padLeft + colIdx * this.cellSize;
                const y = 14;
                ctx.fillText(months[i], x, y);
            }
        }

        renderDayLabels(ctx) {
            ctx.fillStyle = '#8b949e';
            ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // Aligned with days of the week: Mon (row 2), Wed (row 6), Fri (row 10)
            const days = [
                { name: 'Mon', row: 2 },
                { name: 'Wed', row: 6 },
                { name: 'Fri', row: 10 }
            ];

            days.forEach(d => {
                const y = this.padTop + d.row * this.cellSize + this.cellSize / 2;
                ctx.fillText(d.name, this.padLeft - 8, y);
            });
        }

        renderHeatmapCells(ctx) {
            const sq = this.squareSize;
            const colors = {
                0: '#161b22', // No commits
                1: '#0e4429', // 1-2 commits
                2: '#006d32', // 3-5 commits
                3: '#26a641', // 6-9 commits
                4: '#39d353'  // 10+ commits
            };

            for (let c = 0; c < this.cols; c++) {
                for (let r = 0; r < this.rows; r++) {
                    const cell = this.gridMap[c][r];
                    const x = this.padLeft + c * this.cellSize + (this.cellSize - sq) / 2;
                    const y = this.padTop + r * this.cellSize + (this.cellSize - sq) / 2;

                    const baseColor = colors[cell.level] || colors[0];

                    ctx.fillStyle = baseColor;
                    ctx.beginPath();
                    ctx.roundRect(x, y, sq, sq, 2.5);
                    ctx.fill();

                    // Subtle border around empty cells
                    if (cell.level === 0) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    } else if (cell.level === 4) {
                        // Level 4 subtle neon highlight
                        ctx.strokeStyle = 'rgba(163, 230, 53, 0.5)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }

        renderFoodNode(ctx) {
            const fx = this.padLeft + this.food.x * this.cellSize + this.cellSize / 2;
            const fy = this.padTop + this.food.y * this.cellSize + this.cellSize / 2;
            const time = this.frameTime;

            ctx.save();

            // Pulsing Neon Aura Ring
            const pulse = Math.sin(time * 0.12) * 3 + 8;
            ctx.strokeStyle = 'rgba(163, 230, 53, 0.85)';
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#a3e635';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(fx, fy, pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Inner Active Commit Square / Node
            ctx.fillStyle = '#a3e635';
            ctx.beginPath();
            ctx.roundRect(fx - 5.5, fy - 5.5, 11, 11, 2.5);
            ctx.fill();

            // White Center Commit Dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        renderSnake(ctx) {
            if (!this.snake || this.snake.length === 0) return;

            const sq = this.squareSize + 0.5;
            const cs = this.cellSize;

            ctx.save();

            // 1. Git Branch Connecting Trail (Line linking all commit nodes)
            ctx.strokeStyle = 'rgba(163, 230, 53, 0.65)';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            for (let i = 0; i < this.snake.length; i++) {
                const seg = this.snake[i];
                const cx = this.padLeft + seg.x * cs + cs / 2;
                const cy = this.padTop + seg.y * cs + cs / 2;

                if (i === 0) {
                    ctx.moveTo(cx, cy);
                } else {
                    // Check if adjacent (avoid drawing line across wrapped screen)
                    const prev = this.snake[i - 1];
                    const dist = Math.hypot(seg.x - prev.x, seg.y - prev.y);
                    if (dist < 2.5) {
                        ctx.lineTo(cx, cy);
                    } else {
                        ctx.moveTo(cx, cy);
                    }
                }
            }
            ctx.stroke();

            // 2. Draw Snake Segments (Gradient Neon Green)
            for (let i = this.snake.length - 1; i >= 0; i--) {
                const seg = this.snake[i];
                const x = this.padLeft + seg.x * cs + (cs - sq) / 2;
                const y = this.padTop + seg.y * cs + (cs - sq) / 2;

                // Color gradient from bright neon green head to emerald tail
                const progress = i / Math.max(this.snake.length - 1, 1);
                let fillColor = '#a3e635';
                if (progress > 0.6) {
                    fillColor = '#16a34a';
                } else if (progress > 0.25) {
                    fillColor = '#22c55e';
                }

                ctx.save();
                if (i === 0) {
                    // Head: Intense Neon Glow
                    ctx.shadowColor = '#a3e635';
                    ctx.shadowBlur = 12;
                    ctx.fillStyle = '#a3e635';
                } else {
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 5;
                    ctx.fillStyle = fillColor;
                }

                ctx.beginPath();
                ctx.roundRect(x, y, sq, sq, 3.5);
                ctx.fill();

                // Dark Border
                ctx.strokeStyle = '#090d16';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Distinct Head Details (Terminal Pixel Eyes)
                if (i === 0) {
                    ctx.fillStyle = '#090d16'; // Dark pupil
                    const dir = this.direction;
                    const hx = x + sq / 2;
                    const hy = y + sq / 2;

                    if (dir.x === 1) { // Right
                        ctx.fillRect(hx + 1.5, hy - 4, 2.5, 2.5);
                        ctx.fillRect(hx + 1.5, hy + 1.5, 2.5, 2.5);
                    } else if (dir.x === -1) { // Left
                        ctx.fillRect(hx - 4, hy - 4, 2.5, 2.5);
                        ctx.fillRect(hx - 4, hy + 1.5, 2.5, 2.5);
                    } else if (dir.y === -1) { // Up
                        ctx.fillRect(hx - 4, hy - 4, 2.5, 2.5);
                        ctx.fillRect(hx + 1.5, hy - 4, 2.5, 2.5);
                    } else { // Down
                        ctx.fillRect(hx - 4, hy + 1.5, 2.5, 2.5);
                        ctx.fillRect(hx + 1.5, hy + 1.5, 2.5, 2.5);
                    }
                }

                ctx.restore();
            }

            ctx.restore();
        }

        renderParticlesAndTexts(ctx) {
            // Draw explosion particles
            this.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(p.life, 0);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Draw floating toasts
            this.floatingTexts.forEach(ft => {
                ctx.save();
                ctx.globalAlpha = Math.max(ft.alpha, 0);
                ctx.fillStyle = '#a3e635';
                ctx.font = 'bold 11px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 4;
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });
        }

        renderIdleOverlay(ctx) {
            const w = this.logicalWidth;
            const h = this.logicalHeight;

            ctx.save();
            ctx.fillStyle = 'rgba(13, 17, 23, 0.70)';
            ctx.fillRect(this.padLeft - 4, this.padTop - 4, this.cols * this.cellSize + 8, this.rows * this.cellSize + 8);

            const boxW = 360;
            const boxH = 76;
            const boxX = (w - boxW) / 2;
            const boxY = (h - boxH) / 2;

            ctx.fillStyle = '#161b22';
            ctx.strokeStyle = '#30363d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 8);
            ctx.fill();
            ctx.stroke();

            // Accent bar on the left
            ctx.fillStyle = '#a3e635';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, 6, boxH, [8, 0, 0, 8]);
            ctx.fill();

            // Title
            ctx.fillStyle = '#a3e635';
            ctx.font = 'bold 15px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ GIT COMMIT SNAKE', w / 2 + 3, boxY + 30);

            // Subtitle
            ctx.fillStyle = '#e6edf3';
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.fillText('PRESS ARROW KEYS / WASD OR TAP START', w / 2 + 3, boxY + 54);

            ctx.restore();
        }

        renderPausedOverlay(ctx) {
            const w = this.logicalWidth;
            const h = this.logicalHeight;

            ctx.save();
            ctx.fillStyle = 'rgba(13, 17, 23, 0.70)';
            ctx.fillRect(this.padLeft - 4, this.padTop - 4, this.cols * this.cellSize + 8, this.rows * this.cellSize + 8);

            const boxW = 320;
            const boxH = 70;
            const boxX = (w - boxW) / 2;
            const boxY = (h - boxH) / 2;

            ctx.fillStyle = '#161b22';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 8);
            ctx.fill();
            ctx.stroke();

            // Accent bar on the left
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, 6, boxH, [8, 0, 0, 8]);
            ctx.fill();

            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⏸ COMMIT SESSION PAUSED', w / 2 + 3, boxY + 28);

            ctx.fillStyle = '#e6edf3';
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.fillText('PRESS SPACE OR TAP RESUME', w / 2 + 3, boxY + 50);

            ctx.restore();
        }

        initEvents() {
            // Window resize handler for canvas DPI
            window.addEventListener('resize', () => this.setupResolution());

            // Keyboard Controls
            window.addEventListener('keydown', (e) => {
                if (!this.isActive) return;
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
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

            this.canvas.addEventListener('touchmove', (e) => {
                if (e.cancelable) e.preventDefault();
            }, { passive: false });

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

                    if (Math.max(absDx, absDy) > 20) {
                        if (absDx > absDy) {
                            this.handleDirectionChange(dx > 0 ? 1 : -1, 0);
                        } else {
                            this.handleDirectionChange(0, dy > 0 ? 1 : -1);
                        }
                    }
                }
            }, { passive: true });

            // Click on Canvas
            this.canvas.addEventListener('click', () => {
                if (!this.isActive) return;
                if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
                    this.start();
                }
            });
        }

        initUI() {
            // Modal Restart Button
            const modalRestartBtn = document.getElementById('snake-modal-restart-btn');
            if (modalRestartBtn) {
                modalRestartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.restart();
                });
            }

            // Pause / Resume / Start Button
            const pauseBtn = document.getElementById('snake-pause-btn');
            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => {
                    if (this.state === 'PLAYING') this.pause();
                    else if (this.state === 'PAUSED') this.resume();
                    else this.start();
                });
            }

            // Restart Button
            const resetBtn = document.getElementById('snake-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.restart();
                });
            }

            // Sound Toggle Button
            const soundBtn = document.getElementById('snake-sound-btn');
            if (soundBtn) {
                soundBtn.addEventListener('click', () => {
                    this.audio.enabled = !this.audio.enabled;
                    if (this.audio.enabled) {
                        soundBtn.innerHTML = '<i class="fas fa-volume-up"></i> Sound On';
                        soundBtn.classList.remove('bg-card-pink');
                    } else {
                        soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Sound Off';
                        soundBtn.classList.add('bg-card-pink');
                    }
                });
            }

            // Difficulty / Speed Select
            const diffSelect = document.getElementById('snake-diff-select');
            if (diffSelect) {
                diffSelect.addEventListener('change', (e) => {
                    this.setDifficulty(e.target.value);
                });
            }

            // Mode (Wrap vs Solid) Select
            const modeSelect = document.getElementById('snake-mode-select');
            if (modeSelect) {
                modeSelect.addEventListener('change', (e) => {
                    this.setWrapMode(e.target.value === 'wrap');
                });
            }

            // D-Pad Touch Controls
            this.bindDpadButton('snake-dpad-up', 0, -1);
            this.bindDpadButton('snake-dpad-down', 0, 1);
            this.bindDpadButton('snake-dpad-left', -1, 0);
            this.bindDpadButton('snake-dpad-right', 1, 0);
        }

        bindDpadButton(id, dx, dy) {
            const btn = document.getElementById(id);
            if (!btn) return;

            const handler = (e) => {
                e.preventDefault();
                this.handleDirectionChange(dx, dy);
            };

            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); }, { passive: false });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); }, { passive: false });
            btn.addEventListener('mousedown', handler);
        }

        onActivate() {
            this.isActive = true;
            this.setupResolution();
            this.render();
        }

        onDeactivate() {
            this.isActive = false;
            if (this.state === 'PLAYING') {
                this.pause();
            }
        }
    }

    // Export both names for backwards compatibility with arcade-manager.js
    window.GitCommitSnakeGame = GitCommitSnakeGame;
    window.NokiaSnakeGame = GitCommitSnakeGame;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const instance = new GitCommitSnakeGame();
            window.gitSnakeInstance = instance;
            window.nokiaSnakeInstance = instance;
        });
    } else {
        const instance = new GitCommitSnakeGame();
        window.gitSnakeInstance = instance;
        window.nokiaSnakeInstance = instance;
    }
})();
