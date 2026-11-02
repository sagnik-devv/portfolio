# ⚡ Sagnik Chakraborty | Personal Portfolio & Developer Arcade

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Canvas API](https://img.shields.io/badge/HTML5_Canvas-000000?style=for-the-badge&logo=html5&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=black)

<br/>

**A playful, high-performance Neo-Brutalist portfolio showcasing full-stack engineering, live coding metrics, and an interactive 5-game developer arcade.**

[🌐 Explore Portfolio](https://github.com/sagnik-devv/portfolio) • [🐙 GitHub (@sagnik-devv)](https://github.com/sagnik-devv) • [⚡ LeetCode (@sagnikcodez)](https://leetcode.com/u/sagnikcodez/) • [💼 LinkedIn](https://www.linkedin.com/in/sagnik-chakraborty-0ab433364/)

</div>

---

## 🎨 Overview & Design Philosophy

Built with a bold **Neo-Brutalist** aesthetic, this portfolio pairs modular software engineering with interactive gamification. It delivers a fast, zero-dependency static experience with custom typography, high-contrast retro neon palettes, crisp 2px/3px charcoal borders, hard drop-shadows, and smooth micro-animations.

- **Zero-Bloat Architecture:** 100% client-side vanilla JavaScript (ES6+), HTML5, and Tailwind CSS. No heavyweight frameworks, bundling pipelines, or compilation steps required.
- **Custom Design System:** High-visibility pastel cards (`card-pink`, `card-mint`, `card-saffron`, `card-lavender`), custom Satoshi typography, custom multi-resolution favicon (`favicon.ico`), and a custom high-DPI cursor (`cursor.png` + `cursor-64.png`).
- **Mobile-First Experience:** Includes an iOS-style glassmorphic floating bottom dock navigation and touch-optimized mini-game controls.

---

## 🚀 Key Features

### 1. 🕹️ The Developer Arcade (4 Playable Mini-Games)
An interactive game suite embedded directly into the portfolio, featuring real-time canvas rendering, physics engines, touch controls, sound effects (synthesized via Web Audio API), and persistent local high scores:

| Game | Module | Description |
| :--- | :--- | :--- |
| **⚽ 1v1 Roblox Football** | [`football-game.js`](football-game.js) | Full 2D physics pitch playing 1v1 against Sagnik's authentic 3D Roblox avatar as the main goalkeeper/striker bot, with dynamic physics, customizable jerseys, scoreboard, and intelligent AI. |
| **🐍 Retro Snake** | [`snake-game.js`](snake-game.js) | Classic grid-based snake with adjustable game speeds, food spawning, high-score tracking, and mobile touch pads. |
| **⌨️ Type or Die (Recruiter Edition)** | [`type-game.js`](type-game.js) | Funky speed typing test featuring hilarious recruiter interview dialogues where Sagnik cheekily pitches "Hire me, hire me!", measuring WPM, accuracy, and offer letter tiers. |
| **🥋 Street Tekken** | [`fighter-game.js`](fighter-game.js) | Street Fighter / Tekken-style 1v1 arcade brawler fighting against Sagnik's 3D Roblox avatar as the main boss bot, with dual health bars, combo counter, special fireball attacks, block mechanics, round timer, and intelligent AI. |
| **🎛️ Arcade Manager** | [`arcade-manager.js`](arcade-manager.js) | Unified tabbed manager handling game state transitions, audio synthesis, and event delegation. |

---

### 2. 📊 Live Developer Metrics & Activity Dashboards
A segmented, interactive dashboard toggleable between live **GitHub** and **LeetCode** problem-solving profiles:

#### ⚡ LeetCode Live Integration (`@sagnikcodez`)
- **Multi-Tier Resilient API Pipeline:** Pulls live statistics via high-speed serverless endpoints (`leetcode-api-faisalshohag.vercel.app` &rarr; `leetcode-api-pied.vercel.app` &rarr; `alfa-leetcode-api.onrender.com`).
- **Problem-Solving Metrics:** Live count of solved problems categorized by difficulty (Easy, Medium, Hard), acceptance rate, contribution points, and global ranking.
- **Dynamic 52-Week Activity Heatmap:** Real-time generation of the 52-week activity grid mapped directly from `submissionCalendar` timestamps with color tiers and hover tooltips.
- **Live Submissions Feed:** Real-time stream of verified accepted solutions with direct links to problem statements.
- **Instant Caching:** Synchronized `localStorage` caching ensures instant page loads without layout shifts.

#### 🐙 GitHub Live Integration (`@sagnik-devv`)
- **Real 2026 Contribution Calendar:** Connected to public contributions APIs (`github-contributions-api.jogruber.de`) to render your actual 52-week GitHub green square heatmap with contribution counts and dates.
- **Live Repository Stats:** Displays verified public repos, followers, stars, and primary programming languages.
- **Featured Builds Showcase:** Live repository cards highlighting recent open-source projects like [Riwaaz](https://github.com/sagnik-devv/Riwaaz) and [PujaHop](https://github.com/sagnik-devv/PujaHop).
- **Graceful Fallback & PAT Support:** Resilient error handling prevents rate-limiting crashes. Supports optional local Personal Access Tokens (`localStorage.setItem('gh_token', '...')`) for 5,000 req/hr limits.

---

### 3. 🤖 Real-Time Transparent Roblox Avatar Companion
- **Real-Time Client-Side Chroma Keying:** Runs a custom HTML5 canvas processing engine (< 0.4 ms/frame) that samples video frames from [`roblox_avtar.mp4`](roblox_avtar.mp4) and dynamically removes the neutral background with feathered anti-aliasing.
- **Cross-Platform Transparency:** Eliminates platform-restricted alpha codecs (like Apple ProRes or WebM VP9), ensuring 100% transparent playback across iOS Safari, Android, Chrome, Firefox, and macOS.
- **Persistent Floating Presence:** Stays on screen as you scroll on both desktop (`bottom-6 right-6`) and mobile (`bottom-24 right-3` positioned safely above the navigation dock).
- **Interactive Speech Bubbles:** Features subtle idle floating, reactive click bounces, witty project dialogues, and a quick minimize/restore toggle button.

---

### 4. 🎯 Featured Engineering Projects

- **[Riwaaz](https://github.com/sagnik-devv/Riwaaz)** — Full-stack luxury Indian wedding wear & bridal couture eCommerce platform built with TypeScript, modern component architecture, and responsive design.
- **[PujaHop](https://github.com/sagnik-devv/PujaHop)** — Real-time Pujo itinerary and pandal navigation application for crowd management and festival routes.
- **[CodeBhumi](https://codebhumiscc.netlify.app)** — Collaborative developer community and coding knowledge hub.
- **[LPU CGPA Calculator](https://lpucgpacalc.vercel.app)** — Accurate semester GPA & cumulative CGPA calculator designed for university students.

---

## 📂 Project Structure

```bash
portfolio/
├── index.html                   # Core single-page application & layouts
│
├── arcade-manager.js            # Unified arcade controller & Web Audio SFX
├── football-game.js             # 1v1 Roblox Football canvas mini-game
├── snake-game.js                # Retro Snake game logic & controls
├── type-game.js                 # Speed typing test engine & WPM metrics
├── fighter-game.js              # Street Fighter / Tekken arcade brawler engine
│
├── roblox_avtar.mp4             # 3D Roblox avatar animation source
├── roblox_avatar_transparent.png# Instant pre-render avatar placeholder
│
├── cursor.png                   # Custom standard pointer cursor (32x32)
├── cursor-64.png                # High-DPI Retina pointer cursor (64x64)
├── cursor-original.png          # High-resolution original cursor artwork
├── favicon.ico                  # Multi-resolution browser favicon (16x16, 32x32)
│
├── CVpdf.pdf                    # Downloadable developer resume
└── README.md                    # Project documentation
```

---

## 🛠️ Local Development & Quick Start

Because the codebase is built entirely with modern web standards, **no installation or build step is required**.

### Option 1: Instant Static Server (Recommended)
Run any lightweight HTTP server in the repository directory:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node.js npx serve
npx serve .
```

Open `http://localhost:8000` in your web browser.

### Option 2: Direct File Open
You can also open [`index.html`](index.html) directly in any modern browser (Chrome, Edge, Firefox, Safari).

---

## ⚙️ Configuration & Customization

### Changing Usernames
To configure your own metrics, update the username constants in [`index.html`](index.html):

```javascript
// GitHub Username
const ghUsername = 'your-github-username';

// LeetCode Username
const lcUsername = 'your-leetcode-username';
```

### GitHub API Token (Optional)
To avoid shared IP rate limits on GitHub's public API, you can authenticate locally in your browser console:

```javascript
localStorage.setItem('gh_token', 'your_personal_access_token_here');
```

The script will automatically detect this token and supply `Authorization: Bearer <token>` on all requests.

---

## 👨‍💻 Author

**Sagnik Chakraborty**  
- **GitHub:** [@sagnik-devv](https://github.com/sagnik-devv)  
- **LeetCode:** [@sagnikcodez](https://leetcode.com/u/sagnikcodez/)  
- **LinkedIn:** [Sagnik Chakraborty](https://www.linkedin.com/in/sagnik-chakraborty-0ab433364/)  
- **Email:** [sagnik.devv@gmail.com](mailto:sagnik.devv@gmail.com)

---

<div align="center">
  <sub>Built playfully with ⚡ HTML5, CSS3, Tailwind & JavaScript. &copy; 2026 Sagnik Chakraborty.</sub>
</div>

