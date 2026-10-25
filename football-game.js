/**
 * Sagnik Stadium 1v1 Football Mini-Game
 * Roblox-styled pixel soccer with realistic physics, smart AI, mobile touch controls, and Web Audio API sounds.
 */

(function () {
    'use strict';

    // Game Constants
    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 420;
    const PITCH_TOP = 175;
    const PITCH_BOTTOM = 395;
    const GOAL_WIDTH = 70;
    const GOAL_HEIGHT = 165; // from crossbar (y = 230) to ground (y = 395)
    const CROSSBAR_Y = 230;
    const GRAVITY = 0.55;
    const BOUNCE_RESTITUTION = 0.72;
    const FRICTION = 0.985;
    const WINNING_SCORE = 3;

    // Web Audio Synthesizer (Zero external dependencies)
    class RetroSound {
        constructor() {
            this.ctx = null;
            this.muted = false;
        }

        init() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playKick() {
            if (this.muted) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        }

        playWhistle(isGoal = false) {
            if (this.muted) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(2400, now);
            osc2.frequency.setValueAtTime(2425, now);

            if (isGoal) {
                // Triple blast
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.setValueAtTime(0.0, now + 0.12);
                gain.gain.setValueAtTime(0.3, now + 0.18);
                gain.gain.setValueAtTime(0.0, now + 0.3);
                gain.gain.setValueAtTime(0.35, now + 0.36);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.7);
                osc2.stop(now + 0.7);
            } else {
                // Short blast
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.25);
                osc2.stop(now + 0.25);
            }

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
        }

        playCrossbar() {
            if (this.muted) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.2);
        }

        playCheer() {
            if (this.muted) return;
            this.init();
            if (!this.ctx) return;
            const bufferSize = this.ctx.sampleRate * 1.5;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
            filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.28, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
            noise.stop(now + 1.5);
        }
    }

    // Ball Class
    class Ball {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 12;
            this.vx = 0;
            this.vy = 0;
            this.rotation = 0;
            this.trail = [];
        }

        reset(direction = 1) {
            this.x = CANVAS_WIDTH / 2;
            this.y = PITCH_TOP + 40;
            this.vx = direction * 2;
            this.vy = -3;
            this.trail = [];
        }

        update() {
            // Save trail for visual speed effect
            if (Math.abs(this.vx) > 5 || Math.abs(this.vy) > 5) {
                this.trail.push({ x: this.x, y: this.y, alpha: 0.5 });
                if (this.trail.length > 5) this.trail.shift();
            } else {
                this.trail = [];
            }

            this.vy += GRAVITY;
            this.vx *= FRICTION;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.vx * 0.08;

            // Ground bounce
            if (this.y + this.radius >= PITCH_BOTTOM) {
                this.y = PITCH_BOTTOM - this.radius;
                this.vy = -this.vy * BOUNCE_RESTITUTION;
                if (Math.abs(this.vy) < 1) this.vy = 0;
            }

            // Ceiling bounce (just in case)
            if (this.y - this.radius <= PITCH_TOP) {
                this.y = PITCH_TOP + this.radius;
                this.vy = -this.vy * 0.5;
            }

            // Wall bounces behind goal lines
            if (this.x - this.radius < 15) {
                this.x = 15 + this.radius;
                this.vx = -this.vx * 0.6;
            }
            if (this.x + this.radius > CANVAS_WIDTH - 15) {
                this.x = CANVAS_WIDTH - 15 - this.radius;
                this.vx = -this.vx * 0.6;
            }

            // Goal crossbar collisions
            // Left goal crossbar: x=GOAL_WIDTH (70), y=CROSSBAR_Y (230)
            const leftDist = Math.hypot(this.x - GOAL_WIDTH, this.y - CROSSBAR_Y);
            if (leftDist < this.radius + 6) {
                const angle = Math.atan2(this.y - CROSSBAR_Y, this.x - GOAL_WIDTH);
                this.vx = Math.cos(angle) * 8;
                this.vy = Math.sin(angle) * 8;
                window.soundManager?.playCrossbar();
            }

            // Right goal crossbar: x=CANVAS_WIDTH - GOAL_WIDTH (930), y=CROSSBAR_Y (230)
            const rightDist = Math.hypot(this.x - (CANVAS_WIDTH - GOAL_WIDTH), this.y - CROSSBAR_Y);
            if (rightDist < this.radius + 6) {
                const angle = Math.atan2(this.y - CROSSBAR_Y, this.x - (CANVAS_WIDTH - GOAL_WIDTH));
                this.vx = Math.cos(angle) * 8;
                this.vy = Math.sin(angle) * 8;
                window.soundManager?.playCrossbar();
            }
        }

        draw(ctx) {
            // Draw trail
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                ctx.save();
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.radius * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * (i / this.trail.length)})`;
                ctx.fill();
                ctx.restore();
            }

            // Shadow on pitch
            const shadowY = PITCH_BOTTOM + 2;
            const distFromGround = shadowY - (this.y + this.radius);
            const shadowScale = Math.max(0.3, 1 - distFromGround / 180);
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(this.x, shadowY - 4, this.radius * shadowScale * 1.2, 4 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.fill();
            ctx.restore();

            // Ball Body
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            // Base white circle with black outline
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#171717';
            ctx.stroke();

            // Iconic soccer pentagons / patches
            ctx.fillStyle = '#171717';
            // Center pentagon
            ctx.beginPath();
            const polyR = this.radius * 0.45;
            for (let i = 0; i < 5; i++) {
                const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const px = Math.cos(a) * polyR;
                const py = Math.sin(a) * polyR;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            // Radiating spoke lines
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 5; i++) {
                const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const px = Math.cos(a) * polyR;
                const py = Math.sin(a) * polyR;
                const ex = Math.cos(a) * this.radius;
                const ey = Math.sin(a) * this.radius;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // Roblox Character Class
    class RobloxPlayer {
        constructor(isAI, name, teamColor, startX) {
            this.isAI = isAI;
            this.name = name;
            this.teamColor = teamColor; // primary jersey color
            this.startX = startX;
            this.x = startX;
            this.y = PITCH_BOTTOM;
            this.vx = 0;
            this.vy = 0;
            this.width = 44;
            this.height = 68;
            this.isGrounded = true;
            this.facing = isAI ? 1 : -1; // 1 = facing right, -1 = facing left
            this.isKicking = false;
            this.kickTimer = 0;
            this.kickCooldown = 0;
            this.runCycle = 0;
            this.celebrateTimer = 0;
            this.score = 0;
            this.speed = 4.8;
            this.jumpForce = -11.5;
            this.skinColor = '#f5cd2f'; // Classic Roblox Yellow
        }

        reset(x) {
            this.x = x || this.startX;
            this.y = PITCH_BOTTOM;
            this.vx = 0;
            this.vy = 0;
            this.isKicking = false;
            this.kickTimer = 0;
            this.kickCooldown = 0;
            this.celebrateTimer = 0;
        }

        update(keys, ball, otherPlayer) {
            // Kick cooldown timer
            if (this.kickCooldown > 0) this.kickCooldown--;
            if (this.celebrateTimer > 0) this.celebrateTimer--;

            if (this.isKicking) {
                this.kickTimer++;
                if (this.kickTimer > 12) {
                    this.isKicking = false;
                    this.kickTimer = 0;
                }
            }

            // AI Logic or Human Player Controls
            if (this.isAI) {
                this.updateAI(ball, otherPlayer);
            } else {
                this.updateHuman(keys, ball);
            }

            // Apply physics
            this.vy += GRAVITY;
            this.x += this.vx;
            this.y += this.vy;

            // Ground collision
            if (this.y >= PITCH_BOTTOM) {
                this.y = PITCH_BOTTOM;
                this.vy = 0;
                this.isGrounded = true;
            } else {
                this.isGrounded = false;
            }

            // Pitch boundary limits (can enter own goal slightly, but not off screen)
            if (this.x < 35) this.x = 35;
            if (this.x > CANVAS_WIDTH - 35) this.x = CANVAS_WIDTH - 35;

            // Run cycle animation
            if (Math.abs(this.vx) > 0.3 && this.isGrounded) {
                this.runCycle += 0.28;
            } else if (!this.isGrounded) {
                this.runCycle = 0.5;
            } else {
                this.runCycle = 0;
            }

            // Ball collision & Kick
            this.checkBallInteraction(ball);
        }

        updateHuman(keys, ball) {
            this.vx = 0;
            if (keys.left) {
                this.vx = -this.speed;
                this.facing = -1;
            }
            if (keys.right) {
                this.vx = this.speed;
                this.facing = 1;
            }
            if (keys.up && this.isGrounded) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                window.soundManager?.init();
            }
            if (keys.kick && !this.isKicking && this.kickCooldown === 0) {
                this.triggerKick(ball);
            }
        }

        updateAI(ball, otherPlayer) {
            this.vx = 0;
            const distToBall = ball.x - this.x;
            const ballInAir = ball.y < PITCH_BOTTOM - 60;
            const ballHeadingToMyGoal = ball.vx < -1 && ball.x < CANVAS_WIDTH / 2;

            // Sagnik defends left goal (x=0 to 140)
            const targetX = Math.min(Math.max(ball.x - 25, 90), 550);

            // Strategic decision
            if (ball.x < 600) {
                if (this.x < targetX - 6) {
                    this.vx = this.speed * 0.9;
                    this.facing = 1;
                } else if (this.x > targetX + 6) {
                    this.vx = -this.speed * 0.9;
                    this.facing = -1;
                }
            } else {
                // Return to mid-defensive position
                const guardX = 280;
                if (Math.abs(this.x - guardX) > 10) {
                    this.vx = (guardX > this.x ? 1 : -1) * this.speed * 0.7;
                    this.facing = this.vx > 0 ? 1 : -1;
                }
            }

            // Jump to head/intercept aerial balls
            if (Math.abs(distToBall) < 70 && ballInAir && this.isGrounded && ball.y < PITCH_BOTTOM - 30) {
                if (Math.random() < 0.65) {
                    this.vy = this.jumpForce;
                    this.isGrounded = false;
                }
            }

            // AI Kick when ball is in front of Sagnik and close
            if (Math.abs(distToBall) < 45 && Math.abs(ball.y - this.y) < 55 && !this.isKicking && this.kickCooldown === 0) {
                this.facing = distToBall >= 0 ? 1 : -1;
                this.triggerKick(ball);
            }
        }

        triggerKick(ball) {
            this.isKicking = true;
            this.kickTimer = 0;
            this.kickCooldown = 18;
            window.soundManager?.playKick();

            // Kick impact check
            const kickReachX = this.x + this.facing * 34;
            const dist = Math.hypot(ball.x - kickReachX, ball.y - (this.y - 25));

            if (dist < 46) {
                // Powerful kick with elevation
                const power = this.isAI ? 12.0 : 14.2;
                const angle = this.facing === 1 ? -0.42 : -2.72; // slight upward angle
                ball.vx = Math.cos(angle) * power + (this.vx * 0.5);
                ball.vy = Math.sin(angle) * power;
                createImpactSparks(ball.x, ball.y);
            }
        }

        checkBallInteraction(ball) {
            const playerCenterY = this.y - this.height / 2;
            const dx = ball.x - this.x;
            const dy = ball.y - playerCenterY;
            const dist = Math.hypot(dx, dy);

            // Bounding box / circle overlap
            const minDistance = this.width / 2 + ball.radius;

            if (Math.abs(dx) < minDistance && ball.y > this.y - this.height && ball.y < this.y + 10) {
                // Push ball away realistically
                const pushDirection = dx >= 0 ? 1 : -1;
                ball.x = this.x + pushDirection * minDistance;
                ball.vx = pushDirection * (Math.abs(this.vx) * 1.25 + 4);

                // If falling on top of player's head, bounce up
                if (ball.y < this.y - this.height + 15 && ball.vy > 0) {
                    ball.vy = -Math.abs(ball.vy) * 0.9 - 3;
                    window.soundManager?.playKick();
                    createImpactSparks(ball.x, ball.y);
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Ground shadow
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
            ctx.fill();
            ctx.restore();

            // Scale X for facing direction
            ctx.scale(this.facing, 1);

            const isWalking = Math.abs(this.runCycle) > 0.05;
            const legSwing = Math.sin(this.runCycle) * 16;
            const armSwing = Math.sin(this.runCycle) * 22;

            // If celebrating, raise arms high!
            const isCelebrating = this.celebrateTimer > 0;

            // 1. BACK LEG (Left when facing right)
            ctx.save();
            ctx.translate(-7, -26);
            if (this.isKicking) {
                ctx.rotate(-0.25);
            } else if (isWalking) {
                ctx.rotate((-legSwing * Math.PI) / 180);
            }
            this.drawRobloxLeg(ctx, false);
            ctx.restore();

            // 2. BACK ARM
            ctx.save();
            ctx.translate(-16, -56);
            if (isCelebrating) {
                ctx.rotate(-2.4);
            } else if (isWalking) {
                ctx.rotate((-armSwing * Math.PI) / 180);
            }
            this.drawRobloxArm(ctx);
            ctx.restore();

            // 3. TORSO (Solid Block with Jersey)
            ctx.save();
            ctx.translate(-16, -58);
            this.drawRobloxTorso(ctx);
            ctx.restore();

            // 4. FRONT LEG (Kicking or walking)
            ctx.save();
            ctx.translate(7, -26);
            if (this.isKicking) {
                // Dynamic forward kick swing
                const kickPhase = Math.sin((this.kickTimer / 12) * Math.PI);
                ctx.rotate((kickPhase * 1.35));
            } else if (isWalking) {
                ctx.rotate((legSwing * Math.PI) / 180);
            }
            this.drawRobloxLeg(ctx, true);
            ctx.restore();

            // 5. HEAD & ROBLOX STUD & FACE
            ctx.save();
            ctx.translate(0, -68);
            this.drawRobloxHead(ctx);
            ctx.restore();

            // 6. FRONT ARM
            ctx.save();
            ctx.translate(14, -56);
            if (isCelebrating) {
                ctx.rotate(-2.5);
            } else if (this.isKicking) {
                ctx.rotate(-0.8);
            } else if (isWalking) {
                ctx.rotate((armSwing * Math.PI) / 180);
            }
            this.drawRobloxArm(ctx);
            ctx.restore();

            ctx.restore();

            // Draw player name tag overhead
            this.drawNameTag(ctx);
        }

        drawRobloxHead(ctx) {
            // Cylindrical Top Stud
            ctx.fillStyle = this.skinColor;
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.5;

            // Top stud
            ctx.fillRect(-6, -26, 12, 5);
            ctx.strokeRect(-6, -26, 12, 5);

            // Stud top circle highlight
            ctx.fillStyle = '#fce570';
            ctx.fillRect(-4, -26, 8, 2);

            // Head Block (22x22)
            ctx.fillStyle = this.skinColor;
            ctx.fillRect(-11, -21, 22, 21);
            ctx.strokeRect(-11, -21, 22, 21);

            // Head 3D bevel / highlight on top edge
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(-10, -20, 20, 2);

            // Hair
            if (this.isAI) {
                // Sagnik's stylish dark hair block
                ctx.fillStyle = '#171717';
                ctx.fillRect(-12, -23, 24, 7);
                ctx.fillRect(-12, -18, 5, 8); // sideburn
                ctx.fillRect(7, -18, 5, 4);
                // Hair tuft
                ctx.fillRect(-4, -25, 8, 3);
            } else {
                // Visitor Hair / Cap
                ctx.fillStyle = '#451a03'; // Brown stylish hair
                ctx.fillRect(-12, -23, 24, 6);
                ctx.fillRect(-12, -18, 4, 6);
                // Peak
                ctx.fillStyle = '#78350f';
                ctx.fillRect(-6, -24, 12, 3);
            }

            // Classic Roblox Face
            // Eye (facing forward)
            ctx.fillStyle = '#171717';
            ctx.fillRect(2, -14, 4, 4); // Eye
            // Eye shine
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(2, -14, 2, 2);

            // Determined Cheeky Smile
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(1, -7);
            ctx.lineTo(5, -6);
            ctx.lineTo(8, -8);
            ctx.stroke();

            // Cheerful blush
            ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.fillRect(4, -8, 3, 2);
        }

        drawRobloxTorso(ctx) {
            const w = 32;
            const h = 32;

            // Torso Base (Jersey)
            ctx.fillStyle = this.teamColor;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, w, h);

            // White collar V-neck
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(16, 8);
            ctx.lineTo(24, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Jersey Stripes / Detailing
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(3, 0, 4, h);
            ctx.fillRect(w - 7, 0, 4, h);

            // Jersey Number / Branding
            ctx.save();
            if (this.facing === -1) {
                ctx.translate(16, 0);
                ctx.scale(-1, 1);
                ctx.translate(-16, 0);
            }
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px "Satoshi", sans-serif';
            ctx.textAlign = 'center';
            if (this.isAI) {
                ctx.fillText('10', 16, 20);
                ctx.font = 'bold 6px "Satoshi", sans-serif';
                ctx.fillText('SAGNIK', 16, 28);
            } else {
                ctx.fillText('7', 16, 20);
                ctx.font = 'bold 6px "Satoshi", sans-serif';
                const shortName = (this.name || 'VISITOR').substring(0, 6).toUpperCase();
                ctx.fillText(shortName, 16, 28);
            }
            ctx.restore();

            // Torso bottom belt/hem
            ctx.fillStyle = '#171717';
            ctx.fillRect(0, h - 3, w, 3);
        }

        drawRobloxLeg(ctx, isFront) {
            const legW = 12;
            const legH = 26;

            // Shorts (Upper half)
            ctx.fillStyle = this.isAI ? '#ffffff' : '#0f172a';
            ctx.fillRect(-legW / 2, 0, legW, 11);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-legW / 2, 0, legW, 11);

            // Socks (Mid)
            ctx.fillStyle = this.teamColor;
            ctx.fillRect(-legW / 2, 11, legW, 10);
            ctx.strokeRect(-legW / 2, 11, legW, 10);

            // Cleats / Shoes (Bottom)
            ctx.fillStyle = isFront ? '#171717' : '#334155';
            ctx.fillRect(-legW / 2, 21, legW + 3, 5);
            ctx.strokeRect(-legW / 2, 21, legW + 3, 5);

            // Studs
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-legW / 2 + 1, 25, 3, 2);
            ctx.fillRect(legW / 2, 25, 3, 2);
        }

        drawRobloxArm(ctx) {
            const armW = 10;
            const armH = 26;

            // Sleeve (Upper)
            ctx.fillStyle = this.teamColor;
            ctx.fillRect(-armW / 2, 0, armW, 10);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-armW / 2, 0, armW, 10);

            // Yellow Skin (Roblox Hand)
            ctx.fillStyle = this.skinColor;
            ctx.fillRect(-armW / 2, 10, armW, 16);
            ctx.strokeRect(-armW / 2, 10, armW, 16);

            // Classic Roblox C-shaped hand notch
            ctx.fillStyle = '#171717';
            ctx.fillRect(-2, 22, 4, 3);
        }

        drawNameTag(ctx) {
            ctx.save();
            const tagY = this.y - this.height - 24;
            const label = this.isAI ? '👑 SAGNIK' : `⭐ ${this.name}`;

            ctx.font = 'bold 11px "Satoshi", sans-serif';
            const textWidth = ctx.measureText(label).width;

            // Tag badge background
            ctx.fillStyle = this.isAI ? '#fbbf24' : '#a3e635';
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.5;

            // Neo-brutalist badge
            ctx.fillRect(this.x - textWidth / 2 - 6, tagY - 11, textWidth + 12, 16);
            ctx.strokeRect(this.x - textWidth / 2 - 6, tagY - 11, textWidth + 12, 16);

            ctx.fillStyle = '#171717';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, this.x, tagY - 3);

            // Pointer arrow
            ctx.beginPath();
            ctx.moveTo(this.x - 4, tagY + 5);
            ctx.lineTo(this.x + 4, tagY + 5);
            ctx.lineTo(this.x, tagY + 9);
            ctx.closePath();
            ctx.fillStyle = '#171717';
            ctx.fill();

            ctx.restore();
        }
    }

    // Impact Sparks & Confetti System
    const particles = [];

    function createImpactSparks(x, y) {
        for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: ['#fbbf24', '#ffffff', '#a3e635', '#f43f5e'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 3,
                life: 18,
                maxLife: 18,
                type: 'spark'
            });
        }
    }

    function createGoalConfetti() {
        for (let i = 0; i < 90; i++) {
            particles.push({
                x: CANVAS_WIDTH / 2 + (Math.random() * 400 - 200),
                y: PITCH_TOP + Math.random() * 50,
                vx: (Math.random() - 0.5) * 8,
                vy: -4 - Math.random() * 7,
                color: ['#a3e635', '#fbbf24', '#38bdf8', '#f43f5e', '#ffffff', '#c084fc'][Math.floor(Math.random() * 6)],
                size: 6 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                life: 90 + Math.random() * 40,
                maxLife: 130,
                type: 'confetti'
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.type === 'confetti') {
                p.vy += 0.15; // gravity
                p.vx *= 0.98;
                p.rotation += p.rotSpeed;
            } else {
                p.vy += 0.2;
                p.vx *= 0.95;
            }

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles(ctx) {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.translate(p.x, p.y);

            if (p.type === 'confetti') {
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                ctx.strokeStyle = '#171717';
                ctx.lineWidth = 1;
                ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }

            ctx.restore();
        }
    }

    // Main Game Controller
    class FootballArena {
        constructor() {
            this.canvas = document.getElementById('football-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            window.soundManager = new RetroSound();

            this.visitorName = localStorage.getItem('sagnik_arena_visitor') || '';
            this.visitorColor = localStorage.getItem('sagnik_arena_color') || '#2563eb'; // Royal Blue

            this.ball = new Ball(CANVAS_WIDTH / 2, PITCH_TOP + 50);
            this.sagnik = new RobloxPlayer(true, 'SAGNIK', '#dc2626', 220); // Sagnik Red Team
            this.visitor = new RobloxPlayer(false, this.visitorName || 'Visitor', this.visitorColor, 780);

            this.state = 'LOBBY'; // 'LOBBY', 'PLAYING', 'GOAL_PAUSE', 'MATCH_OVER'
            this.goalMessage = '';
            this.goalMessageTimer = 0;
            this.matchTimer = 90; // 90 seconds
            this.matchSecondsTimer = 0;
            this.ledScrollOffset = 0;

            // Pre-generate crowd pixels
            this.crowd = [];
            for (let x = 0; x < CANVAS_WIDTH; x += 14) {
                for (let y = 10; y < PITCH_TOP - 40; y += 12) {
                    this.crowd.push({
                        x,
                        y,
                        color: ['#1e3a8a', '#dc2626', '#fbbf24', '#ffffff', '#22c55e', '#38bdf8', '#0284c7'][Math.floor(Math.random() * 7)],
                        bobOffset: Math.random() * Math.PI * 2,
                        flashTimer: Math.floor(Math.random() * 300)
                    });
                }
            }

            // Controls
            this.keys = {
                left: false,
                right: false,
                up: false,
                kick: false
            };

            this.setupEvents();
            this.setupUI();
            this.resizeCanvas();

            // Arcade lifecycle state
            this.isActive = true;
            this.isRunning = true;
            this.isPaused = false;
            this.animationFrameId = null;

            // Start game loop
            this.lastTime = performance.now();
            this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }

        setupEvents() {
            window.addEventListener('resize', () => this.resizeCanvas());

            // Keyboard
            window.addEventListener('keydown', (e) => {
                if (!this.isActive) return;
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    // Prevent page scroll only when playing or focused in arena
                    const rect = this.canvas.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        e.preventDefault();
                    }
                }

                if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
                if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
                if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
                if (e.code === 'Space' || e.key === 'k' || e.key === 'K' || e.code === 'Enter') this.keys.kick = true;
            });

            window.addEventListener('keyup', (e) => {
                if (!this.isActive) return;
                if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
                if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
                if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
                if (e.code === 'Space' || e.key === 'k' || e.key === 'K' || e.code === 'Enter') this.keys.kick = false;
            });

            // Touch / Virtual On-Screen Controls
            this.bindTouchButton('btn-touch-left', (pressed) => this.keys.left = pressed);
            this.bindTouchButton('btn-touch-right', (pressed) => this.keys.right = pressed);
            this.bindTouchButton('btn-touch-jump', (pressed) => this.keys.up = pressed);
            this.bindTouchButton('btn-touch-kick', (pressed) => this.keys.kick = pressed);

            // Canvas Click / Tap Play Me Button
            this.canvas.addEventListener('click', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = CANVAS_WIDTH / rect.width;
                const scaleY = CANVAS_HEIGHT / rect.height;
                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;

                // Check "PLAY ME" badge clicked (bottom right)
                if (clickX >= CANVAS_WIDTH - 150 && clickY >= CANVAS_HEIGHT - 60) {
                    this.openNameModal();
                }
            });
        }

        bindTouchButton(id, callback) {
            const btn = document.getElementById(id);
            if (!btn) return;

            const startHandler = (e) => {
                e.preventDefault();
                callback(true);
                btn.classList.add('bg-highlight-yellow', 'translate-x-0.5', 'translate-y-0.5');
                window.soundManager?.init();
            };

            const endHandler = (e) => {
                e.preventDefault();
                callback(false);
                btn.classList.remove('bg-highlight-yellow', 'translate-x-0.5', 'translate-y-0.5');
            };

            btn.addEventListener('touchstart', startHandler, { passive: false });
            btn.addEventListener('touchend', endHandler, { passive: false });
            btn.addEventListener('touchcancel', endHandler, { passive: false });
            btn.addEventListener('mousedown', startHandler);
            btn.addEventListener('mouseup', endHandler);
            btn.addEventListener('mouseleave', endHandler);
        }

        setupUI() {
            // Audio mute toggle
            const muteBtn = document.getElementById('arena-mute-btn');
            if (muteBtn) {
                muteBtn.addEventListener('click', () => {
                    window.soundManager.muted = !window.soundManager.muted;
                    muteBtn.innerHTML = window.soundManager.muted ?
                        '<i class="fas fa-volume-mute"></i> Sound Off' :
                        '<i class="fas fa-volume-up"></i> Sound On';
                });
            }

            // Reset Match
            const resetBtn = document.getElementById('arena-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetMatch();
                });
            }

            // Change Name Button
            const nameBtn = document.getElementById('arena-name-btn');
            if (nameBtn) {
                nameBtn.addEventListener('click', () => {
                    this.openNameModal();
                });
            }

            // Play / Start Button on UI Banner
            const startBannerBtn = document.getElementById('arena-play-banner-btn');
            if (startBannerBtn) {
                startBannerBtn.addEventListener('click', () => {
                    this.openNameModal();
                });
            }

            // Modal Form Handlers
            const modalForm = document.getElementById('arena-name-form');
            if (modalForm) {
                modalForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const nameInput = document.getElementById('arena-player-name-input');
                    const chosenName = nameInput.value.trim() || 'Visitor';

                    // Color choice
                    const selectedColor = document.querySelector('input[name="arena-jersey-color"]:checked')?.value || '#2563eb';

                    this.setVisitorProfile(chosenName, selectedColor);
                    this.closeNameModal();
                    this.resetMatch();
                    window.soundManager?.playWhistle(false);
                });
            }

            const modalClose = document.getElementById('arena-modal-close');
            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    this.closeNameModal();
                });
            }
        }

        openNameModal() {
            const modal = document.getElementById('arena-name-modal');
            const input = document.getElementById('arena-player-name-input');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                if (input) {
                    input.value = this.visitorName || '';
                    input.focus();
                }
            }
        }

        closeNameModal() {
            const modal = document.getElementById('arena-name-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        setVisitorProfile(name, color) {
            this.visitorName = name;
            this.visitorColor = color;
            localStorage.setItem('sagnik_arena_visitor', name);
            localStorage.setItem('sagnik_arena_color', color);

            this.visitor.name = name;
            this.visitor.teamColor = color;

            // Update badge on page
            const nameDisplay = document.getElementById('arena-visitor-display');
            if (nameDisplay) {
                nameDisplay.textContent = name;
            }
        }

        resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = CANVAS_WIDTH * dpr;
            this.canvas.height = CANVAS_HEIGHT * dpr;
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resetMatch() {
            this.sagnik.score = 0;
            this.visitor.score = 0;
            this.matchTimer = 90;
            this.matchSecondsTimer = 0;
            this.state = 'PLAYING';
            this.goalMessage = '';
            this.ball.reset(1);
            this.sagnik.reset(220);
            this.visitor.reset(780);
            window.soundManager?.playWhistle(false);
        }

        checkGoal() {
            if (this.state !== 'PLAYING') return;

            // Visitor Goal! (Ball inside Left Goal: x < GOAL_WIDTH and y > CROSSBAR_Y)
            if (this.ball.x < GOAL_WIDTH - 6 && this.ball.y > CROSSBAR_Y + 5) {
                this.visitor.score++;
                this.triggerGoalSequence(this.visitor.name + ' SCORED!', false);
                return;
            }

            // Sagnik Goal! (Ball inside Right Goal: x > CANVAS_WIDTH - GOAL_WIDTH and y > CROSSBAR_Y)
            if (this.ball.x > CANVAS_WIDTH - GOAL_WIDTH + 6 && this.ball.y > CROSSBAR_Y + 5) {
                this.sagnik.score++;
                this.triggerGoalSequence('SAGNIK SCORED!', true);
                return;
            }
        }

        triggerGoalSequence(msg, isSagnik) {
            this.state = 'GOAL_PAUSE';
            this.goalMessage = msg;
            this.goalMessageTimer = 110;

            if (isSagnik) {
                this.sagnik.celebrateTimer = 100;
            } else {
                this.visitor.celebrateTimer = 100;
            }

            window.soundManager?.playWhistle(true);
            window.soundManager?.playCheer();
            createGoalConfetti();

            // Check if game won
            if (this.sagnik.score >= WINNING_SCORE || this.visitor.score >= WINNING_SCORE) {
                setTimeout(() => {
                    this.state = 'MATCH_OVER';
                }, 2200);
            }
        }

        gameLoop(currentTime) {
            if (!this.isRunning) return;

            const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            if (!this.isPaused) {
                this.update(dt);
            }
            this.render();

            this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }

        pause() {
            this.isPaused = true;
            this.isActive = false;
            this.keys.left = false;
            this.keys.right = false;
            this.keys.up = false;
            this.keys.kick = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }

        resume() {
            this.isPaused = false;
            this.isActive = true;
            this.lastTime = performance.now();
            if (!this.animationFrameId) {
                this.isRunning = true;
                this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
            }
        }

        update(dt) {
            this.ledScrollOffset += 0.8;

            if (this.state === 'PLAYING') {
                this.matchSecondsTimer += dt;
                if (this.matchSecondsTimer >= 1) {
                    this.matchSecondsTimer = 0;
                    if (this.matchTimer > 0) {
                        this.matchTimer--;
                        if (this.matchTimer === 0) {
                            this.state = 'MATCH_OVER';
                            window.soundManager?.playWhistle(true);
                        }
                    }
                }

                this.ball.update();
                this.sagnik.update(this.keys, this.ball, this.visitor);
                this.visitor.update(this.keys, this.ball, this.sagnik);
                this.checkGoal();
            } else if (this.state === 'GOAL_PAUSE') {
                this.ball.update();
                this.sagnik.update(this.keys, this.ball, this.visitor);
                this.visitor.update(this.keys, this.ball, this.sagnik);

                this.goalMessageTimer--;
                if (this.goalMessageTimer <= 0) {
                    if (this.sagnik.score < WINNING_SCORE && this.visitor.score < WINNING_SCORE && this.matchTimer > 0) {
                        this.state = 'PLAYING';
                        this.ball.reset(Math.random() < 0.5 ? 1 : -1);
                        this.sagnik.reset(220);
                        this.visitor.reset(780);
                        window.soundManager?.playWhistle(false);
                    }
                }
            }

            updateParticles();
        }

        render() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            this.drawStadiumBackground(ctx);
            this.drawLEDAdBoard(ctx);
            this.drawPitch(ctx);
            this.drawGoals(ctx);

            // Draw players & ball
            this.sagnik.draw(ctx);
            this.visitor.draw(ctx);
            this.ball.draw(ctx);

            // Particles on top
            drawParticles(ctx);

            // Stadium Floodlight Glow Overlay
            this.drawFloodlights(ctx);

            // Scoreboard at top center (matching reference image)
            this.drawScoreboard(ctx);

            // "PLAY ME" button in bottom right corner (exact look from reference)
            this.drawPlayMeButton(ctx);

            // Goal & End screens
            if (this.state === 'GOAL_PAUSE') {
                this.drawGoalBanner(ctx);
            } else if (this.state === 'MATCH_OVER') {
                this.drawGameOverBanner(ctx);
            }
        }

        drawStadiumBackground(ctx) {
            // Night sky backdrop
            const skyGrad = ctx.createLinearGradient(0, 0, 0, PITCH_TOP);
            skyGrad.addColorStop(0, '#090d16');
            skyGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, PITCH_TOP);

            // Stadium Grandstand Tiers with cheering pixel crowd
            const now = performance.now() * 0.003;
            for (let i = 0; i < this.crowd.length; i++) {
                const c = this.crowd[i];
                const bob = Math.sin(now + c.bobOffset) * 2;
                ctx.fillStyle = c.color;
                ctx.fillRect(c.x, c.y + bob, 8, 8);

                // Flashing camera phones occasionally
                if (Math.random() < 0.002) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(c.x - 2, c.y + bob - 2, 12, 12);
                }
            }

            // Stadium roof girders
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 30);
            ctx.lineTo(CANVAS_WIDTH, 30);
            ctx.stroke();
        }

        drawLEDAdBoard(ctx) {
            const boardY = PITCH_TOP - 32;
            const boardH = 32;

            // Black casing
            ctx.fillStyle = '#0a0a0d';
            ctx.fillRect(0, boardY, CANVAS_WIDTH, boardH);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, boardY, CANVAS_WIDTH, boardH);

            // Glowing scrolling text
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, boardY, CANVAS_WIDTH, boardH);
            ctx.clip();

            const textSegment = '   ★  SAGNIK.DEV  ✦  SAGNIK CHAKRABORTY  ✦  AI & FULL STACK  ✦  1v1 ARENA  ✦  GOALAZO!  ';
            ctx.font = 'bold 13px "Courier New", monospace';
            const segWidth = ctx.measureText(textSegment).width;

            const offset = (this.ledScrollOffset % segWidth);
            for (let x = -offset; x < CANVAS_WIDTH + segWidth; x += segWidth) {
                // Alternating neon colors
                ctx.fillStyle = '#fbbf24';
                ctx.fillText(textSegment, x, boardY + 21);
            }
            ctx.restore();
        }

        drawPitch(ctx) {
            // Grass surface
            const pitchH = PITCH_BOTTOM - PITCH_TOP;

            // Alternating grass stripes (mowing pattern)
            const stripeWidth = 65;
            for (let x = 0; x < CANVAS_WIDTH; x += stripeWidth) {
                const isEven = Math.floor(x / stripeWidth) % 2 === 0;
                ctx.fillStyle = isEven ? '#15803d' : '#16a34a';
                ctx.fillRect(x, PITCH_TOP, stripeWidth, pitchH);
            }

            // Pitch boundary lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 3;

            // Touchline / sidelines
            ctx.strokeRect(30, PITCH_TOP + 10, CANVAS_WIDTH - 60, pitchH - 10);

            // Center Halfway line
            ctx.beginPath();
            ctx.moveTo(CANVAS_WIDTH / 2, PITCH_TOP + 10);
            ctx.lineTo(CANVAS_WIDTH / 2, PITCH_BOTTOM);
            ctx.stroke();

            // Center Circle
            ctx.beginPath();
            ctx.ellipse(CANVAS_WIDTH / 2, PITCH_TOP + pitchH / 2, 70, 26, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Center kick-off spot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(CANVAS_WIDTH / 2, PITCH_TOP + pitchH / 2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Left Penalty Box
            ctx.strokeRect(30, PITCH_TOP + 30, 110, pitchH - 50);

            // Right Penalty Box
            ctx.strokeRect(CANVAS_WIDTH - 140, PITCH_TOP + 30, 110, pitchH - 50);

            // Ground base strip
            ctx.fillStyle = '#171717';
            ctx.fillRect(0, PITCH_BOTTOM, CANVAS_WIDTH, CANVAS_HEIGHT - PITCH_BOTTOM);
        }

        drawGoals(ctx) {
            // Left Goal Net & Frame
            ctx.save();
            // Net grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 1;
            for (let x = 10; x <= GOAL_WIDTH; x += 10) {
                ctx.beginPath();
                ctx.moveTo(x, CROSSBAR_Y);
                ctx.lineTo(x - 8, PITCH_BOTTOM);
                ctx.stroke();
            }
            for (let y = CROSSBAR_Y; y <= PITCH_BOTTOM; y += 12) {
                ctx.beginPath();
                ctx.moveTo(10, y);
                ctx.lineTo(GOAL_WIDTH, y);
                ctx.stroke();
            }

            // Posts and Crossbar
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            // Crossbar
            ctx.moveTo(10, CROSSBAR_Y);
            ctx.lineTo(GOAL_WIDTH, CROSSBAR_Y);
            // Front post
            ctx.lineTo(GOAL_WIDTH, PITCH_BOTTOM);
            // Rear post
            ctx.moveTo(10, CROSSBAR_Y);
            ctx.lineTo(10, PITCH_BOTTOM);
            ctx.stroke();

            // Goal shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(10, PITCH_BOTTOM - 4, GOAL_WIDTH - 10, 4);
            ctx.restore();

            // Right Goal Net & Frame
            ctx.save();
            const rightGoalX = CANVAS_WIDTH - GOAL_WIDTH;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 1;
            for (let x = rightGoalX; x <= CANVAS_WIDTH - 10; x += 10) {
                ctx.beginPath();
                ctx.moveTo(x, CROSSBAR_Y);
                ctx.lineTo(x + 8, PITCH_BOTTOM);
                ctx.stroke();
            }
            for (let y = CROSSBAR_Y; y <= PITCH_BOTTOM; y += 12) {
                ctx.beginPath();
                ctx.moveTo(rightGoalX, y);
                ctx.lineTo(CANVAS_WIDTH - 10, y);
                ctx.stroke();
            }

            // Posts and Crossbar
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            // Crossbar
            ctx.moveTo(rightGoalX, CROSSBAR_Y);
            ctx.lineTo(CANVAS_WIDTH - 10, CROSSBAR_Y);
            // Front post
            ctx.moveTo(rightGoalX, CROSSBAR_Y);
            ctx.lineTo(rightGoalX, PITCH_BOTTOM);
            // Rear post
            ctx.moveTo(CANVAS_WIDTH - 10, CROSSBAR_Y);
            ctx.lineTo(CANVAS_WIDTH - 10, PITCH_BOTTOM);
            ctx.stroke();

            // Goal shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(rightGoalX, PITCH_BOTTOM - 4, GOAL_WIDTH - 10, 4);
            ctx.restore();
        }

        drawFloodlights(ctx) {
            // Floodlight 1 (Left)
            ctx.save();
            const g1 = ctx.createRadialGradient(200, 20, 10, 280, 240, 320);
            g1.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
            g1.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
            g1.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = g1;
            ctx.beginPath();
            ctx.moveTo(200, 10);
            ctx.lineTo(50, PITCH_BOTTOM);
            ctx.lineTo(450, PITCH_BOTTOM);
            ctx.closePath();
            ctx.fill();

            // Floodlight 2 (Right)
            const g2 = ctx.createRadialGradient(800, 20, 10, 720, 240, 320);
            g2.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
            g2.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
            g2.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.moveTo(800, 10);
            ctx.lineTo(550, PITCH_BOTTOM);
            ctx.lineTo(950, PITCH_BOTTOM);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        drawScoreboard(ctx) {
            // Scoreboard at top center (matching reference image)
            const sbWidth = 380;
            const sbHeight = 44;
            const sbX = (CANVAS_WIDTH - sbWidth) / 2;
            const sbY = 16;
            const centerX = CANVAS_WIDTH / 2;

            ctx.save();
            // Drop shadow
            ctx.fillStyle = '#0a0a0d';
            ctx.fillRect(sbX + 4, sbY + 4, sbWidth, sbHeight);

            // Dark Frame
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(sbX, sbY, sbWidth, sbHeight);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(sbX, sbY, sbWidth, sbHeight);

            // Top hanging chains/brackets
            ctx.fillStyle = '#64748b';
            ctx.fillRect(sbX + 45, 0, 4, sbY);
            ctx.fillRect(sbX + sbWidth - 49, 0, 4, sbY);

            // Sagnik Team Name (Left of score)
            ctx.fillStyle = '#f87171'; // Red highlight
            ctx.font = 'bold 15px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText('SAGNIK', centerX - 54, sbY + 22);

            // Center Scores [ 0 : 0 ]
            const scoreBoxW = 24;
            const scoreBoxH = 30;
            const boxY = sbY + 7;

            // Sagnik score box
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(centerX - 40, boxY, scoreBoxW, scoreBoxH);
            ctx.fillStyle = '#171717';
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.sagnik.score.toString(), centerX - 40 + scoreBoxW / 2, boxY + scoreBoxH / 2 + 1);

            // Colon separator
            ctx.fillStyle = '#ffffff';
            ctx.fillText(':', centerX, boxY + scoreBoxH / 2);

            // Visitor score box
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(centerX + 16, boxY, scoreBoxW, scoreBoxH);
            ctx.fillStyle = '#171717';
            ctx.fillText(this.visitor.score.toString(), centerX + 16 + scoreBoxW / 2, boxY + scoreBoxH / 2 + 1);

            // Visitor Team Name (Right of score)
            ctx.fillStyle = '#38bdf8'; // Cyan/Blue highlight
            ctx.textAlign = 'left';
            const displayName = (this.visitor.name || 'VISITOR').toUpperCase().substring(0, 9);
            ctx.fillText(displayName, centerX + 54, sbY + 22);

            // Match Clock beneath scoreboard
            const mins = Math.floor(this.matchTimer / 60);
            const secs = this.matchTimer % 60;
            const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(timeStr, centerX, sbY + sbHeight + 11);

            ctx.restore();
        }

        drawPlayMeButton(ctx) {
            // Exact replica of the "PLAY ME" badge from the user's reference image in bottom right
            const btnW = 100;
            const btnH = 36;
            const btnX = CANVAS_WIDTH - btnW - 35;
            const btnY = CANVAS_HEIGHT - btnH - 24;

            ctx.save();
            // Semi-transparent dark background
            ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
            ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = '#22c55e'; // Green neon outline
            ctx.lineWidth = 1.5;
            ctx.strokeRect(btnX, btnY, btnW, btnH);

            // Retro text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PLAY ME', btnX + btnW / 2, btnY + btnH / 2);

            ctx.restore();
        }

        drawGoalBanner(ctx) {
            ctx.save();
            // Background backdrop flash
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Bold neo-brutalist banner
            const bWidth = 520;
            const bHeight = 84;
            const bX = (CANVAS_WIDTH - bWidth) / 2;
            const bY = CANVAS_HEIGHT / 2 - 42;

            // Neo-brutalist shadow
            ctx.fillStyle = '#171717';
            ctx.fillRect(bX + 6, bY + 6, bWidth, bHeight);

            // Vibrant green card
            ctx.fillStyle = '#a3e635';
            ctx.fillRect(bX, bY, bWidth, bHeight);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 3;
            ctx.strokeRect(bX, bY, bWidth, bHeight);

            // Text
            ctx.fillStyle = '#171717';
            ctx.font = 'bold 36px "Satoshi", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚽ ' + this.goalMessage, CANVAS_WIDTH / 2, bY + 36);

            ctx.font = 'bold 13px "Satoshi", sans-serif';
            ctx.fillText('Restarting kickoff in a moment...', CANVAS_WIDTH / 2, bY + 65);

            ctx.restore();
        }

        drawGameOverBanner(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            const bWidth = 460;
            const bHeight = 170;
            const bX = (CANVAS_WIDTH - bWidth) / 2;
            const bY = (CANVAS_HEIGHT - bHeight) / 2;

            // Shadow
            ctx.fillStyle = '#171717';
            ctx.fillRect(bX + 8, bY + 8, bWidth, bHeight);

            // Card
            const isWinnerVisitor = this.visitor.score > this.sagnik.score;
            const isDraw = this.visitor.score === this.sagnik.score;

            ctx.fillStyle = isWinnerVisitor ? '#a3e635' : (isDraw ? '#fbbf24' : '#f87171');
            ctx.fillRect(bX, bY, bWidth, bHeight);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 3;
            ctx.strokeRect(bX, bY, bWidth, bHeight);

            ctx.fillStyle = '#171717';
            ctx.font = 'bold 28px "Satoshi", sans-serif';
            ctx.textAlign = 'center';

            let title = '';
            if (isDraw) title = '🤝 DRAW MATCH!';
            else if (isWinnerVisitor) title = `🏆 ${this.visitor.name.toUpperCase()} WINS!`;
            else title = '👑 SAGNIK WINS!';

            ctx.fillText(title, CANVAS_WIDTH / 2, bY + 45);

            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillText(`FINAL SCORE: SAGNIK ${this.sagnik.score} - ${this.visitor.score} ${this.visitor.name.toUpperCase()}`, CANVAS_WIDTH / 2, bY + 85);

            // Rematch hint
            ctx.font = 'bold 13px "Satoshi", sans-serif';
            ctx.fillText('Click anywhere or hit "Reset Match" to play again!', CANVAS_WIDTH / 2, bY + 125);

            ctx.restore();
        }
    }

    // Export FootballArena to window and initialize
    window.FootballArena = FootballArena;

    function initFootball() {
        const arena = new FootballArena();
        window.footballArenaInstance = arena;
        return arena;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFootball);
    } else {
        initFootball();
    }
})();
