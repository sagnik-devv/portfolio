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
            "Recruiter: 'Do you work well in cross-functional teams?' Sagnik: 'Product managers adore my estimates, designers love my CSS precision, and QA finds zero bugs. What are you waiting for? Hire me, hire me!'",
            "Recruiter: 'How do you handle ambiguous project requirements?' Sagnik: 'I talk directly to stakeholders, sketch wireframes, clarify edge cases, and deliver a working prototype before lunch. Hire me, hire me!'",
            "Recruiter: 'Do you prefer remote work or office?' Sagnik: 'As long as there is high-speed WiFi, clean coffee, and code to ship, I will outwork your entire engineering department from anywhere on Earth. Hire me right now!'",
            "Recruiter: 'What is your favorite data structure?' Sagnik: 'Hash maps because O(1) lookup speed is pure poetry. Just like looking up the ideal candidate: instant match. Stop hesitating, hire me, hire me!'",
            "Recruiter: 'How do you keep your skills sharp?' Sagnik: 'Daily LeetCode grind, building interactive arcade games for my portfolio, and reading RFC specifications for breakfast. Hire me today!'",
            "Recruiter: 'What would your previous coworkers say about you?' Sagnik: 'That I write readable code, leave clean git commits, and never microwave fish in the breakroom. That is high culture. Hire me, hire me!'",
            "Recruiter: 'Can you handle working across different time zones?' Sagnik: 'My commits span Tokyo to San Francisco. I synchronize with global teams like an NTP atomic clock. Send the contract, hire me!'",
            "Recruiter: 'How do you handle critical code reviews?' Sagnik: 'No ego, just engineering. If there is a better way to optimize, I learn it and implement it immediately. That is growth mindset! Hire me, hire me!'",
            "Recruiter: 'What is your approach to technical documentation?' Sagnik: 'Self-documenting variable names, clean Markdown readmes, and architecture diagrams so clear an executive can understand them. Hire me right now!'",
            "Recruiter: 'Have you ever had a disagreement with a team member?' Sagnik: 'Yes, we debated tabs versus spaces. We settled on two spaces and celebrated with pizza. Conflict resolved. Hire me, hire me!'",
            "Recruiter: 'What is your ideal work environment?' Sagnik: 'High trust, fast feedback loops, modern tech stacks, and a company that recognizes talent when it is staring right at them. Smash that hire button!'",
            "Recruiter: 'How do you prioritize multiple urgent deadlines?' Sagnik: 'Eisenhower matrix in the morning, Kanban board in the afternoon, and zero procrastination all day. Stop scrolling and hire me, hire me!'",
            "Recruiter: 'Why computer science?' Sagnik: 'Because writing logic that turns human ideas into software used by thousands of people is the closest thing to real-world magic. Let us build magic together! Hire me!'",
            "Recruiter: 'What happens if you do not know the answer to a question?' Sagnik: 'I say so honestly, dig into the documentation, test hypotheses in a sandbox, and come back with the answer in thirty minutes. Hire me, hire me!'",
            "Recruiter: 'What is your coffee order?' Sagnik: 'Double shot espresso, black, zero sugar. Just like my code: strong, clean, and zero unnecessary bloat. Sign the offer letter, hire me!'",
            "Recruiter: 'Are you ready to join our engineering family?' Sagnik: 'I was born ready. My terminal is customized, my SSH keys are generated, and my passion is at 100%. Hire me, hire me!'",
            "Recruiter: 'What is your philosophy on technical debt?' Sagnik: 'Pay it down early before the compound interest crushes your sprint velocity. Clean refactoring is my specialty. Hire me today!'",
            "Recruiter: 'Can you start on Monday?' Sagnik: 'Monday? I can clone the repo and submit my first pull request by Sunday night. Send the onboarding paperwork, hire me, hire me!'"
        ],
        intermediate: [
            "Interviewer: 'How do you bypass Python's Global Interpreter Lock for CPU-heavy tasks?' Sagnik: 'Easy. Spin up multiprocessing workers, offload computation to NumPy C-extensions, or let me rewrite your bottleneck in pure C while you stare in awe. Sign the offer letter, hire me, hire me!'",
            "Interviewer: 'Our PostgreSQL query is taking twelve seconds to return customer orders. How do you fix it?' Sagnik: 'I run EXPLAIN ANALYZE, murder the accidental sequential scan with a composite B-tree index, and reduce your query time to three milliseconds. Then I sip my tea. Hire me right now!'",
            "Interviewer: 'Explain what causes a segmentation fault in C and how you prevent it.' Sagnik: 'Dereferencing a dangling pointer like a rookie. I treat malloc with respect, free every byte like it owes me money, and run Valgrind until there are zero memory leaks. That is discipline! Hire me!'",
            "Interviewer: 'What executes first: a setTimeout zero callback or a resolved Promise microtask?' Sagnik: 'The microtask queue drains before the macro task queue touches the call stack. The browser does not lie, and neither does my resume. What are you waiting for? Hire me, hire me!'",
            "Interviewer: 'Why is your junior engineer using a for-loop across two million rows in Pandas?' Sagnik: 'Because they love pain. I vectorize the entire calculation with NumPy broadcasting in 0.04 seconds, saving your AWS budget and your sanity. Smash that hire button!'",
            "Interviewer: 'Can you find the two-sum target in an unsorted array in linear time?' Sagnik: 'One pass with a hash map: check the complement in O(1), return the indices in O(N). Brute force O(N squared) is for amateurs. My LeetCode streak speaks for itself. Hire me today!'",
            "Interviewer: 'Someone accidentally pushed a broken commit directly to the master branch. What is your move?' Sagnik: 'Git revert the commit, protect the branch with strict PR approval rules, and save prod before the CEO notices. Then challenge the culprit to Street Tekken. Hire me immediately!'",
            "Interviewer: 'How do you structure a scalable full-stack application with Flask and Firebase?' Sagnik: 'Modular blueprints for REST endpoints, Firebase Auth with JWT validation, real-time listeners for instant sync, and 60 FPS frontends. Full-stack magic at your fingertips. Hire me, hire me!'",
            "Interviewer: 'Explain how Python handles memory management under the hood.' Sagnik: 'Reference counting combined with a generational garbage collector to break cyclical references. I monitor heap allocations like a hawk. Hire me, hire me!'",
            "Interviewer: 'What is the difference between INNER JOIN, LEFT JOIN, and CROSS JOIN?' Sagnik: 'Inner matches keys, Left keeps all left-side rows, and Cross produces a Cartesian product that will melt your server if you are reckless. Hire me right now!'",
            "Interviewer: 'How do you prevent SQL injection vulnerabilities?' Sagnik: 'Parameterized queries and prepared statements every single time. String concatenation in SQL is a cardinal sin. Security is priority one. Hire me, hire me!'",
            "Interviewer: 'Explain the difference between stack and heap memory in C.' Sagnik: 'Stack is fast, contiguous, and auto-managed. Heap is dynamic, manual, and where amateurs cause memory fragmentation. I manage both with precision. Hire me!'",
            "Interviewer: 'What is the benefit of using NumPy over standard Python lists?' Sagnik: 'Homogeneous typed C-arrays in contiguous memory blocks allowing SIMD vectorization without Python object wrapper overhead. Pure speed! Hire me, hire me!'",
            "Interviewer: 'How do you handle missing values in a Pandas DataFrame?' Sagnik: 'Inspect distribution with isna().sum(), impute with median or forward-fill based on domain logic, or drop if variance is negligible. Data hygiene is key. Hire me!'",
            "Interviewer: 'How does JavaScript prototypal inheritance differ from classical OOP?' Sagnik: 'Objects link directly to other objects through prototype delegates rather than blueprint copies. Elegant, flexible, and powerful. Hire me, hire me!'",
            "Interviewer: 'What is debounce versus throttle in UI event handling?' Sagnik: 'Debounce waits for silence; throttle enforces a rate limit. I use both to guarantee silky 60 FPS animations without crashing client browsers. Hire me!'",
            "Interviewer: 'Explain how Dijkstra algorithm finds the shortest path.' Sagnik: 'Greedy exploration using a min-heap priority queue, updating node distances in O((V + E) log V). Optimal and reliable, just like my engineering. Hire me, hire me!'",
            "Interviewer: 'What is the CAP theorem in distributed systems?' Sagnik: 'Consistency, Availability, Partition Tolerance: pick two during a network partition. I design for graceful degradation every time. Hire me right now!'",
            "Interviewer: 'How do you structure Flask blueprints for clean API separation?' Sagnik: 'Decoupled route modules, separate service layers for business logic, marshmallow schemas for validation, and dependency injection. Production grade! Hire me!'",
            "Interviewer: 'What are database transactions and ACID properties?' Sagnik: 'Atomicity, Consistency, Isolation, and Durability. Either all operations commit, or the entire transaction rolls back cleanly. No half-baked data. Hire me, hire me!'",
            "Interviewer: 'How do you detect and fix memory leaks in web applications?' Sagnik: 'Capture heap snapshots in Chrome DevTools, look for detached DOM trees, unclosed event listeners, and dangling closures. Problem solved. Hire me!'",
            "Interviewer: 'What is dynamic programming and when do you use it?' Sagnik: 'Breaking problems into overlapping subproblems with optimal substructure. Memoize top-down or tabulate bottom-up to turn exponential time into linear bliss. Hire me, hire me!'",
            "Interviewer: 'How do you optimize bundle size in modern frontends?' Sagnik: 'Tree-shaking dead code, dynamic import code-splitting, compressing SVGs, and avoiding heavy vendor libraries for things you can write in twenty lines. Hire me!'",
            "Interviewer: 'Explain how JWT authentication works across stateless servers.' Sagnik: 'Header, Payload, Signature signed with HMAC-SHA256 or RSA. Verified in micro-seconds without querying a session database on every request. Hire me, hire me!'",
            "Interviewer: 'What is the difference between process and thread in operating systems?' Sagnik: 'Processes have isolated address spaces; threads share memory within the same process. Concurrency is my playground. Hire me, hire me!'"
        ],
        code: [
            "if (recruiter.lookingForAStarEngineer() && candidate.name === 'Sagnik') {\n  recruiter.sendOfferLetter({\n    verdict: 'INSTANT_HIRE',\n    message: 'Hire me, hire me! Let us build something epic!'\n  });\n}",
            "const hireSagnik = async () => {\n  const interview = await evaluateSkills(['React', 'TypeScript', 'Node', 'SystemDesign']);\n  if (interview.score >= 100) {\n    return 'SIGN_THE_CONTRACT_NOW_HIRE_ME';\n  }\n  return 'HIRE_ME_ANYWAY';\n};",
            "SELECT candidate_id, name, 'HIRE_ME_HIRE_ME' AS status\nFROM engineers\nWHERE name = 'Sagnik'\n  AND ships_clean_code = true\n  AND breaks_prod = false\nLIMIT 1;\n-- 1 row returned: Immediate Offer!",
            "function evaluateCandidate(candidate) {\n  while (!company.hasHired(candidate)) {\n    company.inbox.push('Hey, you should hire me, hire me!');\n  }\n  return 'Company revenue increased by 300% 🚀';\n}",
            "const offerLetter = {\n  candidate: 'Sagnik Chakraborty',\n  role: 'Software Engineer',\n  decision: 'Offer Accepted',\n  note: 'Hire me, hire me! Let us ship world-class software together.'\n};\nconsole.log(offerLetter);",
            "const candidateEvaluation = {\n  candidate: 'Sagnik Chakraborty',\n  status: 'READY_TO_SHIP',\n  verdict: 'Send offer letter before Friday',\n  hireMe: () => 'Offer signed, champagne popped! 🍾'\n};\nconsole.log(candidateEvaluation.hireMe());",
            "async function buildDreamTeam(company) {\n  const sagnik = await recruit('Sagnik', 'FullStack & Python');\n  company.addEngineer(sagnik);\n  return 'Engineering velocity doubled! Hire me, hire me!';\n}",
            "CREATE TABLE company_offers (\n  id SERIAL PRIMARY KEY,\n  candidate VARCHAR(50) DEFAULT 'Sagnik',\n  salary NUMERIC(10, 2) NOT NULL,\n  status VARCHAR(20) DEFAULT 'HIRED_NOW'\n);\nINSERT INTO company_offers (salary) VALUES (150000.00);",
            "def evaluate_applicant(applicant):\n    if applicant.name == 'Sagnik' and applicant.passion >= 100:\n        return 'Print offer letter and celebrate! Hire me, hire me!'\n    return 'Still hire Sagnik anyway'",
            "int main(void) {\n    char *offer = malloc(64);\n    strcpy(offer, 'Sagnik is officially hired! Welcome aboard!');\n    printf('%s\\n', offer);\n    free(offer);\n    return 0;\n}",
            "import pandas as pd\ndf = pd.DataFrame({\n    'candidate': ['Sagnik'],\n    'bugs_fixed': [9999],\n    'verdict': ['Hire me, hire me!']\n})\nprint(df.to_string(index=False));",
            "const optimizePerformance = (app) => {\n  app.enableCaching();\n  app.minifyAssets();\n  app.hireEngineer('Sagnik');\n  return 'Lighthouse score: 100/100 ⚡';\n};",
            "git checkout -b feature/hire-sagnik\ngit commit -m 'feat: bring top-tier engineering talent onto team'\ngit push origin feature/hire-sagnik\n# Pull request approved by CTO! 🚀",
            "const eventLoop = {\n  callStack: ['runProductionApp'],\n  microtasks: ['hireSagnikImmediately'],\n  macrotasks: ['sendWelcomePackage']\n};\nconsole.log('Hire me, hire me! Priority execution.');",
            "UPDATE engineering_team\nSET lead_developer = 'Sagnik',\n    deployment_frequency = '10x'\nWHERE company_goals = 'dominate_market';\n-- Query OK, 1 row affected.",
            "const quicksort = (arr) => {\n  if (arr.length <= 1) return arr;\n  const [pivot, ...rest] = arr;\n  const left = rest.filter(x => x < pivot);\n  const right = rest.filter(x => x >= pivot);\n  return [...quicksort(left), pivot, ...quicksort(right)];\n};",
            "const memoizedFibonacci = (n, memo = {}) => {\n  if (n in memo) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = memoizedFibonacci(n - 1, memo) + memoizedFibonacci(n - 2, memo);\n  return memo[n];\n};",
            "from flask import Flask, jsonify\napp = Flask(__name__)\n@app.route('/hire-me')\ndef hire():\n    return jsonify(verdict='ACCEPTED', message='Let us build the future!')",
            "import numpy as np\nfeatures = np.array([100, 200, 300])\nweights = np.array([0.5, 0.3, 0.2])\nprediction = np.dot(features, weights)\nprint(f'Model prediction: Hire Sagnik! Score: {prediction:.0f}')",
            "class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n}",
            "const startSprint = () => {\n  const sprint = {\n    storyPoints: 50,\n    engineer: 'Sagnik',\n    velocity: 'Unmatched',\n    status: 'All tickets closed with zero regressions! 🎉'\n  };\n  return sprint.status;\n};"
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

            // Visitor Name Personalization
            const heroName = (window.getPortfolioVisitorName ? window.getPortfolioVisitorName() : localStorage.getItem('sagnik_portfolio_visitor')) || '';
            this.playerName = heroName || 'Visitor';

            // Sync with badge
            const display = document.getElementById('type-visitor-name-display');
            if (display) {
                display.textContent = this.playerName;
            }

            // Real-time visitor name sync
            window.addEventListener('visitorNameChanged', (e) => {
                const raw = e.detail && e.detail.name ? e.detail.name : '';
                this.playerName = raw || 'Visitor';
                const disp = document.getElementById('type-visitor-name-display');
                if (disp) {
                    disp.textContent = this.playerName;
                }
            });

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
            const resTitle = document.getElementById('type-res-title');
            const resBadge = document.getElementById('type-res-badge');
            const resBestBanner = document.getElementById('type-res-best-banner');

            if (resWpm) resWpm.textContent = stats.wpm;
            if (resAcc) resAcc.textContent = `${stats.accuracy}%`;
            if (resChars) resChars.textContent = `${this.correctChars} / ${this.typedText.length}`;
            if (resErrors) resErrors.textContent = this.errorCount;

            if (resTitle) {
                resTitle.textContent = (this.playerName && this.playerName !== 'Visitor')
                    ? `${this.playerName}'s Result!`
                    : 'Challenge Complete!';
            }

            // Tier evaluation
            let tier = 'Promising Candidate 📝';
            if (stats.wpm >= 90) tier = '🚀 Instant Offer (Lead Architect)';
            else if (stats.wpm >= 70) tier = '💼 Send The Contract! (Senior Engineer)';
            else if (stats.wpm >= 50) tier = '☕ Schedule Round 2 (Solid Hire)';
            else if (stats.wpm >= 35) tier = '📝 Promising Candidate (Hire Me!)';

            if (resBadge) {
                resBadge.textContent = (this.playerName && this.playerName !== 'Visitor')
                    ? `${this.playerName} • ${tier}`
                    : tier;
            }

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
