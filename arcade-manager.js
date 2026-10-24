/**
 * Arcade Manager - Five-Game Developer Arcade Orchestrator
 * Built for Sagnik's Developer Arcade (sagnik.site)
 */

(function () {
    'use strict';

    class ArcadeManager {
        constructor() {
            this.games = ['football', 'snake', 'type', 'terminal', 'reflex'];
            this.activeGame = 'football';

            this.tabButtons = {
                football: document.getElementById('tab-btn-football'),
                snake: document.getElementById('tab-btn-snake'),
                type: document.getElementById('tab-btn-type'),
                terminal: document.getElementById('tab-btn-terminal'),
                reflex: document.getElementById('tab-btn-reflex')
            };

            this.panels = {
                football: document.getElementById('game-panel-football'),
                snake: document.getElementById('game-panel-snake'),
                type: document.getElementById('game-panel-type'),
                terminal: document.getElementById('game-panel-terminal'),
                reflex: document.getElementById('game-panel-reflex')
            };

            this.initTabs();
            this.initKeyboardNav();

            // Set default game active
            this.switchGame('football');
        }

        initTabs() {
            this.games.forEach(gameKey => {
                const btn = this.tabButtons[gameKey];
                if (!btn) return;

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchGame(gameKey);
                });
            });
        }

        initKeyboardNav() {
            const tabList = document.querySelector('[role="tablist"][aria-label="Arcade Game Selector"]');
            if (!tabList) return;

            tabList.addEventListener('keydown', (e) => {
                const keys = this.games;
                const currentIndex = keys.indexOf(this.activeGame);
                let newIndex = currentIndex;

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    newIndex = (currentIndex + 1) % keys.length;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    newIndex = (currentIndex - 1 + keys.length) % keys.length;
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    newIndex = 0;
                } else if (e.key === 'End') {
                    e.preventDefault();
                    newIndex = keys.length - 1;
                }

                if (newIndex !== currentIndex) {
                    const targetGame = keys[newIndex];
                    this.switchGame(targetGame);
                    this.tabButtons[targetGame]?.focus();
                }
            });
        }

        switchGame(gameKey) {
            if (!this.games.includes(gameKey)) return;

            // 1. Deactivate current game
            this.deactivateGame(this.activeGame);

            // 2. Update active game state
            this.activeGame = gameKey;

            // 3. Update Tab Buttons styling and ARIA attributes
            this.games.forEach(key => {
                const btn = this.tabButtons[key];
                const panel = this.panels[key];

                if (btn) {
                    const isActive = (key === gameKey);
                    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    btn.setAttribute('tabindex', isActive ? '0' : '-1');

                    if (isActive) {
                        btn.className = 'arcade-tab-btn active-tab px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 border-charcoal-border shadow-subtle-2 -translate-y-0.5 bg-accent-green text-midnight-ink transition-all duration-150 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcoal-border';
                    } else {
                        btn.className = 'arcade-tab-btn px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm border-2 border-charcoal-border shadow-subtle bg-canvas-white hover:bg-pale-ash text-midnight-ink hover:-translate-y-0.5 transition-all duration-150 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcoal-border';
                    }
                }

                if (panel) {
                    if (key === gameKey) {
                        panel.classList.remove('hidden');
                    } else {
                        panel.classList.add('hidden');
                    }
                }
            });

            // 4. Activate target game
            this.activateGame(gameKey);
        }

        deactivateGame(gameKey) {
            switch (gameKey) {
                case 'football':
                    if (window.footballArenaInstance) {
                        window.footballArenaInstance.pause();
                        window.footballArenaInstance.isActive = false;
                    }
                    break;
                case 'snake':
                    if (window.nokiaSnakeInstance) {
                        window.nokiaSnakeInstance.onDeactivate();
                    }
                    break;
                case 'type':
                    if (window.typeOrDieInstance) {
                        window.typeOrDieInstance.onDeactivate();
                    }
                    break;
                case 'terminal':
                    if (window.hackTerminalInstance) {
                        window.hackTerminalInstance.onDeactivate();
                    }
                    break;
                case 'reflex':
                    if (window.reflexGameInstance) {
                        window.reflexGameInstance.onDeactivate();
                    }
                    break;
            }
        }

        activateGame(gameKey) {
            switch (gameKey) {
                case 'football':
                    if (window.footballArenaInstance) {
                        window.footballArenaInstance.resume();
                        window.footballArenaInstance.isActive = true;
                    }
                    break;
                case 'snake':
                    if (window.nokiaSnakeInstance) {
                        window.nokiaSnakeInstance.onActivate();
                    }
                    break;
                case 'type':
                    if (window.typeOrDieInstance) {
                        window.typeOrDieInstance.onActivate();
                    }
                    break;
                case 'terminal':
                    if (window.hackTerminalInstance) {
                        window.hackTerminalInstance.onActivate();
                    }
                    break;
                case 'reflex':
                    if (window.reflexGameInstance) {
                        window.reflexGameInstance.onActivate();
                    }
                    break;
            }
        }
    }

    // Initialize Arcade Manager
    window.ArcadeManager = ArcadeManager;

    function initArcade() {
        window.arcadeManagerInstance = new ArcadeManager();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArcade);
    } else {
        initArcade();
    }
})();
