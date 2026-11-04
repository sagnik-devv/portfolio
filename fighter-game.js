/**
 * Neo Street Brawler - Tekken / Street Fighter Style Arcade Fighting Game
 * Built for Sagnik's Developer Arcade (sagnik.site)
 * Features dual health bars, combo system, AI opponent, super meter, particle FX & Web Audio synthesizer.
 */

(function () {
    'use strict';

    // Arena Constants
    const VIRTUAL_WIDTH = 960;
    const VIRTUAL_HEIGHT = 460;
    const GROUND_Y = 385;
    const GRAVITY = 0.72;
    const ROUND_TIME_LIMIT = 60; // 60 seconds per round

    // Load Sagnik's authentic cursor face image
    const sagnikFaceImg = typeof Image !== 'undefined' ? new Image() : null;
    if (sagnikFaceImg) {
        sagnikFaceImg.src = 'cursor-original.png';
        sagnikFaceImg.onerror = () => {
            sagnikFaceImg.src = 'cursor-64.png';
        };
    }

    // -------------------------------------------------------------
    // Audio Completely Disabled
    // -------------------------------------------------------------
    class FighterAudio {
        constructor() {
            this.ctx = null;
            this.muted = true;
        }

        init() {}
        playPunch() {}
        playKick() {}
        playBlock() {}
        playFireball() {}
        playSuper() {}
        playRoundStart() {}
        playKO() {}
        playJump() {}
    }

    // -------------------------------------------------------------
    // Projectile (Hadouken / Energy Wave)
    // -------------------------------------------------------------
    class Projectile {
        constructor(x, y, vx, owner, color) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.owner = owner; // 'p1' or 'cpu'
            this.color = color || '#38bdf8';
            this.radius = 18;
            this.damage = 14;
            this.active = true;
            this.life = 0;
        }

        update() {
            this.x += this.vx;
            this.life++;
            if (this.x < 30 || this.x > VIRTUAL_WIDTH - 30 || this.life > 160) {
                this.active = false;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Glowing Outer Ring
            const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 8);
            glow.addColorStop(0, '#ffffff');
            glow.addColorStop(0.4, this.color);
            glow.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.fill();

            // Core energy orb
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Energy trailing sparks
            for (let i = 0; i < 3; i++) {
                const angle = (this.life * 0.3 + i * 2.1);
                const sparkX = Math.cos(angle) * (this.radius * 0.9);
                const sparkY = Math.sin(angle) * (this.radius * 0.9);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // -------------------------------------------------------------
    // Particle Engine (Impact Sparks, Dust, Text)
    // -------------------------------------------------------------
    class ParticleEngine {
        constructor() {
            this.particles = [];
            this.floatingTexts = [];
        }

        spawnHitSparks(x, y, count = 12, isBlock = false) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2.5 + Math.random() * 5.5;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    size: 3 + Math.random() * 4,
                    color: isBlock ? (Math.random() > 0.5 ? '#38bdf8' : '#e2e8f0') : (Math.random() > 0.5 ? '#facc15' : '#ef4444'),
                    life: 1,
                    decay: 0.05 + Math.random() * 0.05,
                    isSpark: true
                });
            }
        }

        spawnDust(x, y, count = 6) {
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 20,
                    y: y + (Math.random() - 0.5) * 6,
                    vx: (Math.random() - 0.5) * 2.2,
                    vy: -Math.random() * 1.5,
                    size: 5 + Math.random() * 7,
                    color: 'rgba(212, 212, 216, 0.45)',
                    life: 1,
                    decay: 0.04 + Math.random() * 0.03,
                    isSpark: false
                });
            }
        }

        spawnFloatingText(text, x, y, color = '#facc15', size = 20) {
            this.floatingTexts.push({
                text,
                x,
                y,
                vy: -1.6,
                color,
                size,
                alpha: 1,
                decay: 0.025
            });
        }

        update() {
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.isSpark ? 0.15 : -0.05;
                p.life -= p.decay;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // Update floating texts
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const t = this.floatingTexts[i];
                t.y += t.vy;
                t.alpha -= t.decay;
                if (t.alpha <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }

        draw(ctx) {
            // Draw particles
            for (let p of this.particles) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                if (p.isSpark) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (2 - p.life), 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // Draw floating texts
            for (let t of this.floatingTexts) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, t.alpha);
                ctx.font = `900 ${t.size}px 'Courier New', monospace, sans-serif`;
                ctx.textAlign = 'center';

                // Neo-brutalist shadow
                ctx.fillStyle = '#0a0a0d';
                ctx.fillText(t.text, t.x + 2, t.y + 2);

                ctx.fillStyle = t.color;
                ctx.fillText(t.text, t.x, t.y);
                ctx.restore();
            }
        }

        clear() {
            this.particles = [];
            this.floatingTexts = [];
        }
    }

    // -------------------------------------------------------------
    // Fighter Entity (Sagnik & Shadow Jin)
    // -------------------------------------------------------------
    class Fighter {
        constructor(config) {
            this.id = config.id; // 'p1' or 'cpu'
            this.name = config.name || 'FIGHTER';
            this.isPlayer = config.isPlayer;
            this.isAvatar = config.isAvatar || false;
            this.audio = config.audio;
            this.particles = config.particles;

            // Color Palette
            this.giColor = config.giColor || '#a3e635'; // Lime green for P1, Crimson for CPU
            this.trimColor = config.trimColor || '#171717';
            this.skinColor = config.skinColor || '#f6d8ae';
            this.hairColor = config.hairColor || '#1e1b4b';
            this.bandColor = config.bandColor || '#ef4444';
            this.auraColor = config.auraColor || '#38bdf8';

            // Dimensions & Position
            this.width = 54;
            this.height = 124;
            this.startX = config.startX || 220;
            this.x = this.startX;
            this.y = GROUND_Y;
            this.vx = 0;
            this.vy = 0;
            this.facing = config.facing || 1; // 1 = right, -1 = left

            // Combat Stats
            this.maxHealth = 100;
            this.health = 100;
            this.displayHealth = 100; // For delayed yellow loss bar
            this.superMeter = 0;
            this.maxSuper = 100;
            this.roundsWon = 0;

            // State Machine
            // 'idle', 'walk_fwd', 'walk_back', 'jump', 'crouch', 'punch', 'kick', 'crouch_kick',
            // 'jump_kick', 'special', 'super', 'block', 'hit_stun', 'knockdown', 'ko', 'win'
            this.state = 'idle';
            this.stateTime = 0;
            this.isGrounded = true;
            this.isBlocking = false;
            this.isAttacking = false;
            this.attackHasHit = false;

            // Attack tracking
            this.attackType = null;
            this.comboCount = 0;
            this.comboTimer = 0;
        }

        reset(roundReset = false) {
            this.x = this.startX;
            this.y = GROUND_Y;
            this.vx = 0;
            this.vy = 0;
            this.health = 100;
            this.displayHealth = 100;
            this.state = 'idle';
            this.stateTime = 0;
            this.isGrounded = true;
            this.isBlocking = false;
            this.isAttacking = false;
            this.attackHasHit = false;
            this.attackType = null;
            this.comboCount = 0;
            this.comboTimer = 0;
            if (!roundReset) {
                this.roundsWon = 0;
                this.superMeter = 0;
            }
        }

        setState(newState, duration = 0) {
            if (this.state === 'ko') return; // Cannot cancel out of KO
            this.state = newState;
            this.stateTime = 0;
            this.stateDuration = duration;
            this.isAttacking = ['punch', 'kick', 'crouch_kick', 'jump_kick', 'special', 'super'].includes(newState);
            this.attackHasHit = false;
        }

        update(opponent, projectiles) {
            this.stateTime++;

            // Smooth delayed health loss animation
            if (this.displayHealth > this.health) {
                this.displayHealth = Math.max(this.health, this.displayHealth - 0.55);
            }

            // Combo reset timer
            if (this.comboTimer > 0) {
                this.comboTimer--;
                if (this.comboTimer === 0) {
                    this.comboCount = 0;
                }
            }

            // Turn toward opponent when on ground and not attacking/stunned
            if (this.isGrounded && !this.isAttacking && this.state !== 'hit_stun' && this.state !== 'knockdown' && this.state !== 'ko') {
                if (this.x < opponent.x - 20) {
                    this.facing = 1;
                } else if (this.x > opponent.x + 20) {
                    this.facing = -1;
                }
            }

            // Apply Horizontal Physics
            this.x += this.vx;

            // Arena Horizontal Boundaries
            const minX = 70;
            const maxX = VIRTUAL_WIDTH - 70;
            if (this.x < minX) this.x = minX;
            if (this.x > maxX) this.x = maxX;

            // Apply Vertical Physics (Gravity & Jump)
            if (!this.isGrounded) {
                this.vy += GRAVITY;
                this.y += this.vy;

                if (this.y >= GROUND_Y) {
                    this.y = GROUND_Y;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.particles.spawnDust(this.x, this.y, 8);

                    if (this.state === 'jump' || this.state === 'jump_kick') {
                        this.setState('idle');
                    }
                }
            }

            // Handle State Lifecycles
            switch (this.state) {
                case 'idle':
                    this.vx *= 0.7;
                    this.isBlocking = false;
                    break;

                case 'walk_fwd':
                    this.vx = this.facing * 4.2;
                    this.isBlocking = false;
                    break;

                case 'walk_back':
                    this.vx = -this.facing * 3.4;
                    this.isBlocking = true; // Auto back-guard in fighting games
                    break;

                case 'crouch':
                    this.vx = 0;
                    break;

                case 'block':
                    this.vx *= 0.6;
                    this.isBlocking = true;
                    break;

                case 'punch':
                    this.vx *= 0.6;
                    this.handleAttackHitbox(opponent, {
                        startup: 3,
                        activeEnd: 9,
                        damage: 8,
                        reach: 62,
                        yOffset: -75,
                        hitHeight: 28,
                        type: 'punch',
                        superGain: 6,
                        knockback: 3.5
                    });
                    if (this.stateTime > 14) this.setState('idle');
                    break;

                case 'kick':
                    this.vx *= 0.6;
                    this.handleAttackHitbox(opponent, {
                        startup: 5,
                        activeEnd: 13,
                        damage: 13,
                        reach: 78,
                        yOffset: -65,
                        hitHeight: 34,
                        type: 'kick',
                        superGain: 10,
                        knockback: 6.5
                    });
                    if (this.stateTime > 19) this.setState('idle');
                    break;

                case 'crouch_kick':
                    this.vx *= 0.6;
                    this.handleAttackHitbox(opponent, {
                        startup: 4,
                        activeEnd: 12,
                        damage: 10,
                        reach: 72,
                        yOffset: -22,
                        hitHeight: 25,
                        type: 'crouch_kick',
                        superGain: 8,
                        knockback: 5.0
                    });
                    if (this.stateTime > 16) this.setState('crouch');
                    break;

                case 'jump_kick':
                    this.handleAttackHitbox(opponent, {
                        startup: 2,
                        activeEnd: 25,
                        damage: 14,
                        reach: 70,
                        yOffset: -45,
                        hitHeight: 40,
                        type: 'jump_kick',
                        superGain: 12,
                        knockback: 7.0
                    });
                    break;

                case 'special':
                    this.vx *= 0.5;
                    // Fire projectile on frame 10
                    if (this.stateTime === 10) {
                        const projX = this.x + this.facing * 45;
                        const projY = this.y - 70;
                        const projVx = this.facing * 8.5;
                        projectiles.push(new Projectile(projX, projY, projVx, this.id, this.auraColor));
                        this.audio.playFireball();
                        this.particles.spawnHitSparks(projX, projY, 8, true);
                    }
                    if (this.stateTime > 24) this.setState('idle');
                    break;

                case 'super':
                    // Multi-hit super rush
                    this.vx = this.facing * 6.5;
                    if (this.stateTime % 6 === 0 && this.stateTime <= 24) {
                        this.audio.playPunch();
                        this.handleAttackHitbox(opponent, {
                            startup: 0,
                            activeEnd: 30,
                            damage: 9,
                            reach: 70,
                            yOffset: -65,
                            hitHeight: 35,
                            type: 'super',
                            superGain: 0,
                            knockback: 5.0
                        }, true);
                    }
                    if (this.stateTime > 34) {
                        this.setState('idle');
                    }
                    break;

                case 'hit_stun':
                    this.vx *= 0.82;
                    this.isBlocking = false;
                    if (this.stateTime > 14) this.setState('idle');
                    break;

                case 'knockdown':
                    this.vx *= 0.86;
                    this.isBlocking = false;
                    if (this.stateTime > 42) {
                        this.setState('idle');
                        this.particles.spawnDust(this.x, this.y, 6);
                    }
                    break;

                case 'ko':
                    this.vx *= 0.8;
                    this.isBlocking = false;
                    break;

                case 'win':
                    this.vx *= 0.5;
                    break;
            }
        }

        handleAttackHitbox(opponent, attackInfo, isMultiHit = false) {
            if (this.attackHasHit && !isMultiHit) return;
            if (this.stateTime < attackInfo.startup || this.stateTime > attackInfo.activeEnd) return;

            // Calculate attack reach box
            const attackX = this.facing === 1 ? this.x : this.x - attackInfo.reach;
            const attackWidth = attackInfo.reach;
            const attackY = this.y + attackInfo.yOffset;
            const attackHeight = attackInfo.hitHeight;

            // Opponent hurtbox
            const oppHurtX = opponent.x - opponent.width / 2;
            const oppHurtWidth = opponent.width;
            const oppHurtY = opponent.y - (opponent.state === 'crouch' ? 70 : opponent.height);
            const oppHurtHeight = opponent.state === 'crouch' ? 70 : opponent.height;

            // AABB Collision check
            const isColliding = (
                attackX < oppHurtX + oppHurtWidth &&
                attackX + attackWidth > oppHurtX &&
                attackY < oppHurtY + oppHurtHeight &&
                attackY + attackHeight > oppHurtY
            );

            if (isColliding) {
                this.attackHasHit = true;
                const contactX = (this.x + opponent.x) / 2;
                const contactY = attackY + attackHeight / 2;

                opponent.takeDamage(attackInfo.damage, this, attackInfo.knockback, attackInfo.type, contactX, contactY);
                this.gainSuper(attackInfo.superGain);
            }
        }

        takeDamage(rawDamage, attacker, knockbackForce, attackType, contactX, contactY) {
            if (this.state === 'ko') return;

            const isGuarding = this.isBlocking || this.state === 'block';

            if (isGuarding) {
                // Blocked attack (reduced chip damage)
                const chipDamage = Math.max(1, Math.round(rawDamage * 0.18));
                this.health = Math.max(0, this.health - chipDamage);
                this.vx = -this.facing * (knockbackForce * 0.5);
                this.audio.playBlock();
                this.particles.spawnHitSparks(contactX, contactY, 10, true);
                this.particles.spawnFloatingText('GUARD!', contactX, contactY - 20, '#38bdf8', 16);
            } else {
                // Clean Hit
                this.health = Math.max(0, this.health - rawDamage);
                this.gainSuper(rawDamage * 0.5); // Defender gains super when taking damage

                // Combo Tracker
                attacker.comboCount = (attacker.comboCount || 0) + 1;
                attacker.comboTimer = 75; // frames until combo resets
                if (attacker.comboCount >= 2) {
                    this.particles.spawnFloatingText(`${attacker.comboCount} HITS!`, contactX, contactY - 35, '#facc15', 22);
                }

                // Sound & Sparks
                if (attackType === 'kick' || attackType === 'jump_kick') {
                    this.audio.playKick();
                    this.particles.spawnHitSparks(contactX, contactY, 18, false);
                } else {
                    this.audio.playPunch();
                    this.particles.spawnHitSparks(contactX, contactY, 14, false);
                }

                // Knockback & Hit reactions
                this.vx = -this.facing * knockbackForce;

                if (rawDamage >= 13 || this.health <= 0) {
                    // Knockdown
                    this.setState('knockdown');
                    this.vy = -4.5;
                    this.isGrounded = false;
                } else {
                    // Hit Stun
                    this.setState('hit_stun');
                }
            }

            // K.O. Check
            if (this.health <= 0) {
                this.health = 0;
                this.setState('ko');
                this.audio.playKO();
                this.particles.spawnFloatingText('K.O.!', this.x, this.y - 80, '#ef4444', 36);
            }
        }

        gainSuper(amount) {
            this.superMeter = Math.min(this.maxSuper, this.superMeter + amount);
        }

        // Actions Triggered by Controls or AI
        actionJump() {
            if (this.isGrounded && !this.isAttacking && this.state !== 'hit_stun' && this.state !== 'knockdown' && this.state !== 'ko') {
                this.vy = -14.2;
                this.isGrounded = false;
                this.setState('jump');
                this.audio.playJump();
                this.particles.spawnDust(this.x, this.y, 6);
            }
        }

        actionPunch() {
            if (this.isAttacking || this.state === 'hit_stun' || this.state === 'knockdown' || this.state === 'ko') return;
            if (!this.isGrounded) return;
            this.setState('punch');
            this.audio.playPunch();
        }

        actionKick() {
            if (this.isAttacking || this.state === 'hit_stun' || this.state === 'knockdown' || this.state === 'ko') return;
            if (!this.isGrounded) {
                this.setState('jump_kick');
                this.audio.playKick();
            } else if (this.state === 'crouch') {
                this.setState('crouch_kick');
                this.audio.playKick();
            } else {
                this.setState('kick');
                this.audio.playKick();
            }
        }

        actionSpecial() {
            if (this.isAttacking || this.state === 'hit_stun' || this.state === 'knockdown' || this.state === 'ko') return;
            if (!this.isGrounded) return;

            // If super meter is full, unleash SUPER ART!
            if (this.superMeter >= this.maxSuper) {
                this.superMeter = 0;
                this.setState('super');
                this.audio.playSuper();
                this.particles.spawnFloatingText('★ SUPER RAGE ★', this.x, this.y - 90, '#f59e0b', 26);
                this.particles.spawnHitSparks(this.x, this.y - 60, 24, true);
            } else {
                // Normal Fireball
                this.setState('special');
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.facing, 1);

            // Shadow on Ground
            ctx.fillStyle = 'rgba(10, 10, 13, 0.45)';
            ctx.beginPath();
            const shadowWidth = this.state === 'crouch' ? 36 : 28;
            ctx.ellipse(0, 0, shadowWidth, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Super Aura Glow (when Super is 100%)
            if (this.superMeter >= this.maxSuper && this.state !== 'ko') {
                ctx.save();
                const auraPulse = Math.sin(this.stateTime * 0.25) * 6 + 10;
                ctx.strokeStyle = this.auraColor;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.6 + Math.sin(this.stateTime * 0.2) * 0.3;
                ctx.beginPath();
                ctx.ellipse(0, -60, 38 + auraPulse, 62 + auraPulse, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Guard Barrier Ring (When Blocking)
            if (this.isBlocking && this.state !== 'ko') {
                ctx.save();
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 4;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(15, -60, 48, -Math.PI / 2.2, Math.PI / 2.2);
                ctx.stroke();
                ctx.restore();
            }

            // Draw Fighter Sprite by State
            this.drawFighterBody(ctx);

            ctx.restore();

            // Overhead Fighter Name Badge
            this.drawNameTag(ctx);
        }

        drawNameTag(ctx) {
            ctx.save();
            const tagY = this.y - (this.state === 'crouch' ? 85 : this.height) - 18;
            const label = this.isAvatar ? '👑 SAGNIK (Host)' : `⭐ ${this.name}`;
            ctx.font = 'bold 11px monospace, "Courier New", sans-serif';
            const textWidth = ctx.measureText ? ctx.measureText(label).width : 65;

            // Neo-brutalist badge
            ctx.fillStyle = this.isAvatar ? '#fbbf24' : '#a3e635';
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 1.5;
            ctx.fillRect(this.x - textWidth / 2 - 6, tagY - 10, textWidth + 12, 16);
            ctx.strokeRect(this.x - textWidth / 2 - 6, tagY - 10, textWidth + 12, 16);

            ctx.fillStyle = '#171717';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, this.x, tagY - 2);

            // Pointer arrow
            ctx.beginPath();
            ctx.moveTo(this.x - 4, tagY + 6);
            ctx.lineTo(this.x + 4, tagY + 6);
            ctx.lineTo(this.x, tagY + 10);
            ctx.closePath();
            ctx.fillStyle = '#171717';
            ctx.fill();

            ctx.restore();
        }



        drawFighterBody(ctx) {
            const time = this.stateTime;


            const breathing = Math.sin(time * 0.12) * 2;

            // Neo-brutalist styling: heavy dark outlines
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#171717';

            if (this.state === 'ko') {
                // Collapsed on Floor
                ctx.fillStyle = this.giColor;
                // Legs
                ctx.beginPath();
                ctx.rect(-50, -18, 55, 16);
                ctx.fill();
                ctx.stroke();
                // Torso
                ctx.beginPath();
                ctx.rect(0, -22, 45, 20);
                ctx.fill();
                ctx.stroke();
                // Head
                if (this.isAvatar && sagnikFaceImg && sagnikFaceImg.complete && sagnikFaceImg.naturalWidth > 0) {
                    const faceH = 32;
                    const faceW = faceH * (sagnikFaceImg.naturalWidth / sagnikFaceImg.naturalHeight);
                    ctx.save();
                    ctx.translate(46, -14);
                    ctx.rotate(0.35);
                    ctx.drawImage(sagnikFaceImg, -faceW / 2, -faceH / 2, faceW, faceH);
                    ctx.restore();

                    // Floating dizzy stars
                    const starPhase = time * 0.15;
                    for (let i = 0; i < 3; i++) {
                        const sx = 46 + Math.cos(starPhase + i * 2.1) * 16;
                        const sy = -32 + Math.sin(starPhase + i * 2.1) * 6;
                        ctx.font = '12px sans-serif';
                        ctx.fillText('💫', sx - 6, sy);
                    }
                } else {
                    ctx.fillStyle = this.skinColor;
                    ctx.beginPath();
                    ctx.arc(46, -14, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                return;
            }

            if (this.state === 'knockdown') {
                // Falling backward
                ctx.save();
                ctx.rotate(-0.55);
                this.renderLimbs(ctx, -10, -50, 0, 0, true);
                ctx.restore();
                return;
            }

            if (this.state === 'crouch' || this.state === 'crouch_kick') {
                // Low Crouch Stance
                const isKicking = this.state === 'crouch_kick';

                // Legs
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(-22, -32, 24, 32, [4, 4, 8, 8]);
                ctx.fill();
                ctx.stroke();

                if (isKicking) {
                    // Extended Low Sweep Leg
                    ctx.fillStyle = this.giColor;
                    ctx.beginPath();
                    ctx.roundRect(0, -22, 58, 20, [4, 10, 10, 4]);
                    ctx.fill();
                    ctx.stroke();

                    // Foot / Boot
                    ctx.fillStyle = this.trimColor;
                    ctx.fillRect(52, -22, 16, 20);
                    ctx.strokeRect(52, -22, 16, 20);
                }

                // Torso
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(-16, -64, 32, 34, [6]);
                ctx.fill();
                ctx.stroke();

                // Belt
                ctx.fillStyle = this.trimColor;
                ctx.fillRect(-16, -42, 32, 7);
                ctx.strokeRect(-16, -42, 32, 7);

                // Head
                ctx.fillStyle = this.skinColor;
                ctx.beginPath();
                ctx.arc(0, -74, 13, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Spiky Hair & Headband
                this.drawHead(ctx, 0, -74);
                return;
            }

            // Normal Upright Stances (Idle, Walk, Attacks, Jump)
            let torsoY = -85 + (this.state === 'idle' ? breathing : 0);
            let torsoX = 0;

            if (this.state === 'jump') {
                torsoY = -78;
            } else if (this.state === 'win') {
                const winBounce = Math.abs(Math.sin(time * 0.2)) * 6;
                torsoY = -85 - winBounce;
            } else if (this.state === 'hit_stun') {
                torsoX = -8;
            }

            // Attack animations
            let punchExtend = 0;
            let kickAngle = 0;

            if (this.state === 'punch') {
                punchExtend = Math.sin((time / 14) * Math.PI) * 44;
            } else if (this.state === 'kick') {
                kickAngle = Math.sin((time / 19) * Math.PI) * 1.35;
            } else if (this.state === 'jump_kick') {
                kickAngle = 1.1;
            } else if (this.state === 'super') {
                punchExtend = Math.sin((time / 6) * Math.PI) * 38;
            }

            // Back Leg
            ctx.fillStyle = this.giColor;
            ctx.beginPath();
            ctx.roundRect(-22, -45, 18, 45, [4]);
            ctx.fill();
            ctx.stroke();

            // Back Boot
            ctx.fillStyle = this.trimColor;
            ctx.fillRect(-24, -12, 22, 12);
            ctx.strokeRect(-24, -12, 22, 12);

            // Front Leg or Kicking Leg
            if (kickAngle > 0.1) {
                // Kicking Leg in Air
                ctx.save();
                ctx.translate(5, torsoY + 40);
                ctx.rotate(-kickAngle);
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(0, -10, 68, 20, [4, 8, 8, 4]);
                ctx.fill();
                ctx.stroke();

                // Kicking Boot
                ctx.fillStyle = this.trimColor;
                ctx.fillRect(58, -10, 18, 20);
                ctx.strokeRect(58, -10, 18, 20);

                // Motion Swoosh Trail
                ctx.strokeStyle = this.auraColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, 72, -0.2, -kickAngle, true);
                ctx.stroke();
                ctx.restore();
            } else {
                // Standing Front Leg
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(4, -45, 18, 45, [4]);
                ctx.fill();
                ctx.stroke();

                // Front Boot
                ctx.fillStyle = this.trimColor;
                ctx.fillRect(4, -12, 22, 12);
                ctx.strokeRect(4, -12, 22, 12);
            }

            // Torso (Gi / Robe)
            ctx.fillStyle = this.giColor;
            ctx.beginPath();
            ctx.roundRect(torsoX - 16, torsoY, 34, 46, [6]);
            ctx.fill();
            ctx.stroke();

            // Martial Arts Gi V-Neck Lapels
            ctx.fillStyle = this.skinColor;
            ctx.beginPath();
            ctx.moveTo(torsoX - 5, torsoY);
            ctx.lineTo(torsoX + 2, torsoY + 18);
            ctx.lineTo(torsoX + 9, torsoY);
            ctx.closePath();
            ctx.fill();

            // Martial Belt
            ctx.fillStyle = this.trimColor;
            ctx.fillRect(torsoX - 16, torsoY + 36, 34, 8);
            ctx.strokeRect(torsoX - 16, torsoY + 36, 34, 8);

            // Belt Hanging Straps
            ctx.fillRect(torsoX - 4, torsoY + 42, 6, 20);
            ctx.strokeRect(torsoX - 4, torsoY + 42, 6, 20);

            // Punching Arm or Guarding Arms or Victory / Blast Pose
            if (this.state === 'win') {
                // Victor's raised fist pumping the air
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(torsoX + 6, torsoY - 18, 16, 32, [4]);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = this.bandColor;
                ctx.beginPath();
                ctx.arc(torsoX + 14, torsoY - 22, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (this.state === 'special') {
                // Dual-palm blast pose
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(torsoX + 4, torsoY + 10, 36, 16, [4]);
                ctx.fill();
                ctx.stroke();

                // Blast energy charging in hands
                const blastCharge = Math.sin((time / 18) * Math.PI) * 10;
                ctx.fillStyle = this.auraColor;
                ctx.beginPath();
                ctx.arc(torsoX + 44, torsoY + 18, 6 + Math.max(0, blastCharge), 0, Math.PI * 2);
                ctx.fill();
            } else if (punchExtend > 5) {
                // Forward Extended Punching Arm
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(torsoX + 4, torsoY + 8, 26 + punchExtend, 15, [4]);
                ctx.fill();
                ctx.stroke();

                // Glove / Fist
                ctx.fillStyle = this.bandColor;
                ctx.beginPath();
                ctx.roundRect(torsoX + 26 + punchExtend, torsoY + 6, 16, 18, [5]);
                ctx.fill();
                ctx.stroke();

                // Motion Wind Line
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(torsoX + 15, torsoY + 15);
                ctx.lineTo(torsoX + 38 + punchExtend, torsoY + 15);
                ctx.stroke();
            } else if (this.state === 'block') {
                // Arms in Guard Position Across Chest
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(torsoX + 6, torsoY + 6, 18, 30, [4]);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = this.bandColor;
                ctx.fillRect(torsoX + 8, torsoY + 4, 14, 14);
                ctx.strokeRect(torsoX + 8, torsoY + 4, 14, 14);
            } else {
                // Natural Fighting Stance Hand
                ctx.fillStyle = this.giColor;
                ctx.beginPath();
                ctx.roundRect(torsoX + 6, torsoY + 12, 16, 22, [4]);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = this.bandColor;
                ctx.beginPath();
                ctx.arc(torsoX + 22, torsoY + 22, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // Head and Hair
            this.drawHead(ctx, torsoX + 2, torsoY - 14);
        }

        drawHead(ctx, x, y) {
            // Sagnik (Host CPU): Render authentic cursor face
            if (this.isAvatar && sagnikFaceImg && sagnikFaceImg.complete && sagnikFaceImg.naturalWidth > 0) {
                const faceH = 36;
                const faceW = faceH * (sagnikFaceImg.naturalWidth / sagnikFaceImg.naturalHeight);

                ctx.save();
                // Golden aura glow if in super move or victory
                if (this.state === 'super' || this.state === 'win') {
                    ctx.save();
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 16;
                    ctx.drawImage(sagnikFaceImg, x - faceW / 2, y - faceH / 2, faceW, faceH);
                    ctx.restore();
                } else {
                    ctx.drawImage(sagnikFaceImg, x - faceW / 2, y - faceH / 2, faceW, faceH);
                }

                // Trailing Headband Ribbons (fluttering behind)
                const ribbonWave = Math.sin(this.stateTime * 0.25) * 5;
                ctx.beginPath();
                ctx.moveTo(x - faceW * 0.35, y - 2);
                ctx.quadraticCurveTo(x - faceW * 0.35 - 16, y - 4 + ribbonWave, x - faceW * 0.35 - 28, y + ribbonWave);
                ctx.lineWidth = 4;
                ctx.strokeStyle = this.bandColor;
                ctx.stroke();

                // If winning, golden crown overhead!
                if (this.state === 'win') {
                    ctx.font = '20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('👑', x, y - faceH / 2 - 8);
                }
                ctx.restore();
                return;
            }

            // Face
            ctx.fillStyle = this.skinColor;
            ctx.beginPath();
            ctx.arc(x, y, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Headband
            ctx.fillStyle = this.bandColor;
            ctx.fillRect(x - 13, y - 5, 26, 7);
            ctx.strokeRect(x - 13, y - 5, 26, 7);

            // Trailing Headband Ribbons (fluttering behind)
            const ribbonWave = Math.sin(this.stateTime * 0.25) * 5;
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 2);
            ctx.quadraticCurveTo(x - 28, y - 4 + ribbonWave, x - 38, y + ribbonWave);
            ctx.lineWidth = 4;
            ctx.strokeStyle = this.bandColor;
            ctx.stroke();

            // Reset outline
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#171717';

            // Spiky Anime Fighter Hair
            ctx.fillStyle = this.hairColor;
            ctx.beginPath();
            ctx.moveTo(x - 13, y - 5);
            ctx.lineTo(x - 18, y - 18);
            ctx.lineTo(x - 8, y - 24);
            ctx.lineTo(x, y - 28);
            ctx.lineTo(x + 10, y - 25);
            ctx.lineTo(x + 16, y - 16);
            ctx.lineTo(x + 13, y - 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Eye / Determination Gaze
            ctx.fillStyle = '#171717';
            ctx.fillRect(x + 5, y - 1, 4, 3);
        }

        renderLimbs(ctx, torsoX, torsoY) {
            // Helper for knockdown / tumble state
            ctx.fillStyle = this.giColor;
            ctx.fillRect(torsoX - 15, torsoY, 30, 40);
            ctx.strokeRect(torsoX - 15, torsoY, 30, 40);

            if (this.isAvatar && sagnikFaceImg && sagnikFaceImg.complete && sagnikFaceImg.naturalWidth > 0) {
                const faceH = 30;
                const faceW = faceH * (sagnikFaceImg.naturalWidth / sagnikFaceImg.naturalHeight);
                ctx.drawImage(sagnikFaceImg, torsoX - faceW / 2, torsoY - 12 - faceH / 2, faceW, faceH);
            } else {
                ctx.fillStyle = this.skinColor;
                ctx.beginPath();
                ctx.arc(torsoX, torsoY - 12, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    // -------------------------------------------------------------
    // AI Controller for CPU Opponent
    // -------------------------------------------------------------
    class FighterAI {
        constructor(fighter, opponent, difficulty = 'normal') {
            this.fighter = fighter;
            this.opponent = opponent;
            this.difficulty = difficulty;
            this.decisionTimer = 0;
            this.decisionInterval = 12; // Frames between tactical evaluations
            this.currentAction = 'idle';

            // Difficulty tunings
            this.params = {
                easy: { reactionDelay: 18, blockChance: 0.30, aggression: 0.40, specialChance: 0.08 },
                normal: { reactionDelay: 10, blockChance: 0.58, aggression: 0.65, specialChance: 0.16 },
                hard: { reactionDelay: 5, blockChance: 0.82, aggression: 0.85, specialChance: 0.28 }
            }[difficulty] || { reactionDelay: 10, blockChance: 0.58, aggression: 0.65, specialChance: 0.16 };
        }

        setDifficulty(diff) {
            this.difficulty = diff;
            this.params = {
                easy: { reactionDelay: 18, blockChance: 0.30, aggression: 0.40, specialChance: 0.08 },
                normal: { reactionDelay: 10, blockChance: 0.58, aggression: 0.65, specialChance: 0.16 },
                hard: { reactionDelay: 5, blockChance: 0.82, aggression: 0.85, specialChance: 0.28 }
            }[diff] || this.params;
        }

        update(projectiles) {
            if (this.fighter.state === 'ko' || this.fighter.state === 'knockdown') return;

            this.decisionTimer++;

            // React to incoming projectiles (Jump over or Block!)
            const incomingProjectile = projectiles.find(p => p.owner !== this.fighter.id && Math.abs(p.x - this.fighter.x) < 220);
            if (incomingProjectile) {
                if (Math.random() < this.params.blockChance) {
                    if (Math.random() > 0.4) {
                        this.fighter.actionJump();
                    } else {
                        this.fighter.setState('block');
                    }
                    return;
                }
            }

            // Periodic tactical decision
            if (this.decisionTimer >= this.decisionInterval) {
                this.decisionTimer = 0;
                this.makeTacticalChoice();
            }
        }

        makeTacticalChoice() {
            const dist = Math.abs(this.fighter.x - this.opponent.x);

            // Reactive Defense: If player is attacking and close, chance to block
            if (this.opponent.isAttacking && dist < 120) {
                if (Math.random() < this.params.blockChance) {
                    this.fighter.setState('block');
                    return;
                }
            }

            // Super Attack Execution
            if (this.fighter.superMeter >= this.fighter.maxSuper && dist < 260) {
                this.fighter.actionSpecial();
                return;
            }

            // Close Combat Range (< 105px)
            if (dist < 105) {
                const roll = Math.random();
                if (roll < 0.45) {
                    this.fighter.actionPunch();
                } else if (roll < 0.75) {
                    this.fighter.actionKick();
                } else if (roll < 0.90) {
                    // Quick step back
                    this.fighter.setState('walk_back');
                } else {
                    this.fighter.setState('crouch');
                }
                return;
            }

            // Mid Range (105px - 260px)
            if (dist < 260) {
                const roll = Math.random();
                if (roll < this.params.specialChance) {
                    this.fighter.actionSpecial();
                } else if (roll < 0.55) {
                    // Approach with forward walk
                    this.fighter.setState('walk_fwd');
                } else if (roll < 0.75) {
                    // Jump in with kick
                    this.fighter.actionJump();
                    setTimeout(() => {
                        if (this.fighter.state === 'jump') this.fighter.actionKick();
                    }, 220);
                } else {
                    this.fighter.setState('idle');
                }
                return;
            }

            // Long Range (> 260px)
            const roll = Math.random();
            if (roll < 0.35 && Math.random() < this.params.specialChance * 1.5) {
                this.fighter.actionSpecial();
            } else if (roll < 0.85) {
                this.fighter.setState('walk_fwd');
            } else {
                this.fighter.actionJump();
            }
        }
    }

    // -------------------------------------------------------------
    // Main Game Controller: Street Fighter / Tekken Arcade
    // -------------------------------------------------------------
    class NeoStreetBrawler {
        constructor() {
            this.panel = document.getElementById('game-panel-fighter');
            if (!this.panel) return;

            this.canvas = document.getElementById('fighter-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            // Setup Internal Virtual Resolution
            this.canvas.width = VIRTUAL_WIDTH;
            this.canvas.height = VIRTUAL_HEIGHT;

            // Audio & Particles
            this.audio = new FighterAudio();
            this.particles = new ParticleEngine();
            this.projectiles = [];

            // UI Elements
            this.p1HealthBar = document.getElementById('fighter-p1-hp-fill');
            this.p1LossBar = document.getElementById('fighter-p1-hp-trail');
            this.p2HealthBar = document.getElementById('fighter-p2-hp-fill');
            this.p2LossBar = document.getElementById('fighter-p2-hp-trail');
            this.p1SuperBar = document.getElementById('fighter-p1-super-fill');
            this.p2SuperBar = document.getElementById('fighter-p2-super-fill');
            this.roundTimerDisplay = document.getElementById('fighter-timer-val');
            this.p1RoundsContainer = document.getElementById('fighter-p1-rounds');
            this.p2RoundsContainer = document.getElementById('fighter-p2-rounds');
            this.p1NameDisplay = document.getElementById('fighter-p1-name');
            this.p2NameDisplay = document.getElementById('fighter-p2-name');

            // Overlay Elements
            this.bannerOverlay = document.getElementById('fighter-announcement-overlay');
            this.bannerText = document.getElementById('fighter-announcement-text');
            this.subBannerText = document.getElementById('fighter-sub-text');
            this.matchModal = document.getElementById('fighter-match-modal');
            this.modalTitle = document.getElementById('fighter-modal-title');
            this.modalDesc = document.getElementById('fighter-modal-desc');

            // Buttons
            this.resetBtn = document.getElementById('fighter-reset-btn');
            this.soundBtn = document.getElementById('fighter-sound-btn');
            this.nameBtn = document.getElementById('fighter-name-btn');
            this.playAgainBtn = document.getElementById('fighter-play-again-btn');
            this.diffButtons = document.querySelectorAll('.fighter-diff-btn');

            // Mobile Controls
            this.btnTouchLeft = document.getElementById('btn-touch-f-left');
            this.btnTouchRight = document.getElementById('btn-touch-f-right');
            this.btnTouchJump = document.getElementById('btn-touch-f-jump');
            this.btnTouchCrouch = document.getElementById('btn-touch-f-crouch');
            this.btnTouchPunch = document.getElementById('btn-touch-f-punch');
            this.btnTouchKick = document.getElementById('btn-touch-f-kick');
            this.btnTouchSpecial = document.getElementById('btn-touch-f-special');
            this.btnTouchGuard = document.getElementById('btn-touch-f-guard');

            // Fighters Init
            const heroName = (window.getPortfolioVisitorName ? window.getPortfolioVisitorName() : localStorage.getItem('sagnik_portfolio_visitor')) || '';
            this.playerName = heroName ? `${heroName} (You)` : (localStorage.getItem('sagnik_arcade_username') || 'VISITOR (You)');
            const p1FighterName = heroName || (this.playerName.includes(' (You)') ? this.playerName.replace(' (You)', '') : this.playerName);

            this.p1 = new Fighter({
                id: 'p1',
                name: p1FighterName,
                isPlayer: true,
                isAvatar: false,
                startX: 250,
                facing: 1,
                giColor: '#a3e635', // Lime Green Gi for Challenger
                trimColor: '#171717',
                bandColor: '#ef4444',
                hairColor: '#0f172a',
                skinColor: '#fcd34d',
                auraColor: '#38bdf8',
                audio: this.audio,
                particles: this.particles
            });

            // Listen for hero section visitor name changes in real-time
            window.addEventListener('visitorNameChanged', (e) => {
                const raw = e.detail && e.detail.name ? e.detail.name : '';
                this.playerName = raw ? `${raw} (You)` : 'VISITOR (You)';
                if (this.p1) {
                    this.p1.name = raw ? raw.substring(0, 14) : 'VISITOR';
                }
                this.updatePlayerNameUI();
            });

            this.cpu = new Fighter({
                id: 'cpu',
                name: 'SAGNIK (Host)',
                isPlayer: false,
                isAvatar: true, // Sagnik's authentic Roblox avatar as the main bot!
                startX: 710,
                facing: -1,
                giColor: '#e11d48',
                trimColor: '#09090b',
                bandColor: '#f59e0b',
                hairColor: '#171717',
                skinColor: '#fed7aa',
                auraColor: '#fbbf24', // Sagnik's golden dragon aura
                audio: this.audio,
                particles: this.particles
            });

            // AI Controller
            this.currentDiff = 'normal';
            this.ai = new FighterAI(this.cpu, this.p1, this.currentDiff);

            // Match State
            this.currentRound = 1;
            this.roundTimer = ROUND_TIME_LIMIT;
            this.timerIntervalId = null;
            this.roundState = 'intro'; // 'intro', 'fight', 'round_end', 'match_over'
            this.screenShake = 0;
            this.isActive = false;
            this.keys = {};

            // Bind Events
            this.initEvents();
            this.updatePlayerNameUI();
            this.startNewMatch();
        }

        initEvents() {
            // Prevent page dragging when touching game canvas
            this.canvas.addEventListener('touchmove', (e) => {
                if (e.cancelable) e.preventDefault();
            }, { passive: false });

            // Keyboard Controls
            window.addEventListener('keydown', (e) => {
                if (!this.isActive) return;
                const k = e.key.toLowerCase();

                // Prevent page scroll on game controls
                if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) {
                    if (document.activeElement?.tagName !== 'INPUT') {
                        e.preventDefault();
                    }
                }

                this.keys[k] = true;

                if (this.roundState !== 'fight') return;

                // Instant attack triggers
                if (k === 'j') {
                    this.p1.actionPunch();
                } else if (k === 'k') {
                    this.p1.actionKick();
                } else if (k === 'u' || k === ' ') {
                    this.p1.actionSpecial();
                } else if (k === 'w' || k === 'arrowup') {
                    this.p1.actionJump();
                }
            });

            window.addEventListener('keyup', (e) => {
                const k = e.key.toLowerCase();
                this.keys[k] = false;
            });

            // Mobile Virtual Touch Controls
            this.bindTouchButton(this.btnTouchLeft, () => { this.keys['a'] = true; }, () => { this.keys['a'] = false; });
            this.bindTouchButton(this.btnTouchRight, () => { this.keys['d'] = true; }, () => { this.keys['d'] = false; });
            this.bindTouchButton(this.btnTouchJump, () => { this.p1.actionJump(); });
            this.bindTouchButton(this.btnTouchCrouch, () => { this.keys['s'] = true; }, () => { this.keys['s'] = false; });
            this.bindTouchButton(this.btnTouchPunch, () => { this.p1.actionPunch(); });
            this.bindTouchButton(this.btnTouchKick, () => { this.p1.actionKick(); });
            this.bindTouchButton(this.btnTouchSpecial, () => { this.p1.actionSpecial(); });
            this.bindTouchButton(this.btnTouchGuard, () => { this.keys['l'] = true; }, () => { this.keys['l'] = false; });

            // Reset Button
            this.resetBtn?.addEventListener('click', () => {
                this.startNewMatch();
            });

            // Sound Toggle
            this.soundBtn?.addEventListener('click', () => {
                this.audio.muted = !this.audio.muted;
                this.soundBtn.innerHTML = this.audio.muted
                    ? '<i class="fas fa-volume-mute text-red-500"></i> Muted'
                    : '<i class="fas fa-volume-up text-emerald-500"></i> Sound On';
            });

            // Edit Name Button
            this.nameBtn?.addEventListener('click', () => {
                const promptCurrent = (this.p1?.name && this.p1.name !== 'VISITOR') ? this.p1.name : (window.getPortfolioVisitorName ? window.getPortfolioVisitorName() : '');
                const newName = prompt('Enter your Fighter Name:', promptCurrent);
                if (newName && newName.trim().length > 0) {
                    const clean = newName.trim().substring(0, 14);
                    this.playerName = `${clean} (You)`;
                    localStorage.setItem('sagnik_arcade_username', this.playerName);
                    localStorage.setItem('sagnik_portfolio_visitor', clean);
                    this.p1.name = clean;
                    this.updatePlayerNameUI();

                    // Sync hero section input if present
                    const heroInput = document.getElementById('hero-visitor-name-input');
                    if (heroInput && heroInput.value !== clean) {
                        heroInput.value = clean;
                        heroInput.dispatchEvent(new Event('input'));
                    }
                }
            });

            // Play Again in Modal
            this.playAgainBtn?.addEventListener('click', () => {
                this.matchModal?.classList.add('hidden');
                this.matchModal?.classList.remove('flex');
                this.startNewMatch();
            });

            // Difficulty Buttons
            this.diffButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const diff = btn.dataset.diff;
                    this.currentDiff = diff;
                    this.ai.setDifficulty(diff);

                    this.diffButtons.forEach(b => {
                        b.classList.remove('bg-rose-600', 'text-white', 'shadow-subtle');
                        b.classList.add('bg-neutral-800', 'text-neutral-300');
                    });
                    btn.classList.add('bg-rose-600', 'text-white', 'shadow-subtle');
                    btn.classList.remove('bg-neutral-800', 'text-neutral-300');
                });
            });
        }

        bindTouchButton(btn, onDown, onUp) {
            if (!btn) return;
            const handleDown = (e) => {
                e.preventDefault();
                this.audio.init();
                if (onDown) onDown();
            };
            const handleUp = (e) => {
                e.preventDefault();
                if (onUp) onUp();
            };

            btn.addEventListener('touchstart', handleDown, { passive: false });
            btn.addEventListener('touchend', handleUp, { passive: false });
            btn.addEventListener('touchcancel', handleUp, { passive: false });
            btn.addEventListener('mousedown', handleDown);
            btn.addEventListener('mouseup', handleUp);
            btn.addEventListener('mouseleave', handleUp);
        }

        updatePlayerNameUI() {
            if (this.p1NameDisplay) {
                this.p1NameDisplay.textContent = this.playerName;
            }
            const vsBadge = document.getElementById('fighter-vs-badge-name');
            if (vsBadge) {
                const raw = (window.getPortfolioVisitorName ? window.getPortfolioVisitorName() : '') || (this.p1?.name || 'YOU');
                vsBadge.textContent = raw.toUpperCase();
            }
        }

        startNewMatch() {
            this.currentRound = 1;
            this.p1.roundsWon = 0;
            this.cpu.roundsWon = 0;
            this.matchModal?.classList.add('hidden');
            this.matchModal?.classList.remove('flex');
            this.updateRoundBadges();
            this.startRound();
        }

        startRound() {
            clearInterval(this.timerIntervalId);
            this.roundState = 'intro';
            this.roundTimer = ROUND_TIME_LIMIT;
            this.roundTimerDisplay.textContent = this.roundTimer;

            this.p1.reset(true);
            this.cpu.reset(true);
            this.projectiles = [];
            this.particles.clear();

            // Display Round Intro Banner
            const fighterName = (this.p1?.name && this.p1.name !== 'VISITOR' && !this.p1.name.includes('(You)')) 
                ? this.p1.name.toUpperCase() 
                : '';
            const fightSub = fighterName ? `READY... FIGHT, ${fighterName}!` : 'READY... FIGHT!';
            this.showAnnouncement(`ROUND ${this.currentRound}`, fightSub, 1800, () => {
                this.roundState = 'fight';
                this.audio.playRoundStart();
                this.startTimer();
            });
        }

        startTimer() {
            this.timerIntervalId = setInterval(() => {
                if (this.roundState === 'fight') {
                    this.roundTimer--;
                    if (this.roundTimerDisplay) {
                        this.roundTimerDisplay.textContent = this.roundTimer;
                    }

                    if (this.roundTimer <= 0) {
                        this.roundTimer = 0;
                        this.handleTimeOver();
                    }
                }
            }, 1000);
        }

        handleTimeOver() {
            clearInterval(this.timerIntervalId);
            this.roundState = 'round_end';

            let winner = null;
            if (this.p1.health > this.cpu.health) {
                winner = this.p1;
            } else if (this.cpu.health > this.p1.health) {
                winner = this.cpu;
            }

            this.showAnnouncement('TIME OVER!', winner ? `${winner.name} WINS!` : 'DRAW ROUND!', 2400, () => {
                this.concludeRound(winner);
            });
        }

        showAnnouncement(main, sub, duration = 1600, callback) {
            if (!this.bannerOverlay) {
                if (callback) callback();
                return;
            }
            this.bannerText.textContent = main;
            this.subBannerText.textContent = sub;
            this.bannerOverlay.classList.remove('hidden');
            this.bannerOverlay.classList.add('flex');

            setTimeout(() => {
                this.bannerOverlay.classList.add('hidden');
                this.bannerOverlay.classList.remove('flex');
                if (callback) callback();
            }, duration);
        }

        concludeRound(roundWinner) {
            if (roundWinner) {
                roundWinner.roundsWon++;
            }
            this.updateRoundBadges();

            // Check if someone reached 2 round wins (Best of 3)
            if (this.p1.roundsWon >= 2 || this.cpu.roundsWon >= 2) {
                this.roundState = 'match_over';
                const matchWinner = this.p1.roundsWon >= 2 ? this.p1 : this.cpu;
                const isPlayerVictory = matchWinner === this.p1;

                setTimeout(() => {
                    this.showMatchModal(isPlayerVictory);
                }, 800);
            } else {
                // Next Round
                this.currentRound++;
                setTimeout(() => {
                    this.startRound();
                }, 600);
            }
        }

        updateRoundBadges() {
            // P1 Round Icons
            if (this.p1RoundsContainer) {
                let p1Html = '';
                for (let i = 0; i < 2; i++) {
                    p1Html += i < this.p1.roundsWon
                        ? '<span class="inline-block w-3.5 h-3.5 rounded-full bg-accent-green border border-charcoal-border shadow-subtle-3"></span>'
                        : '<span class="inline-block w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-700"></span>';
                }
                this.p1RoundsContainer.innerHTML = p1Html;
            }

            // CPU Round Icons
            if (this.p2RoundsContainer) {
                let p2Html = '';
                for (let i = 0; i < 2; i++) {
                    p2Html += i < this.cpu.roundsWon
                        ? '<span class="inline-block w-3.5 h-3.5 rounded-full bg-rose-500 border border-charcoal-border shadow-subtle-3"></span>'
                        : '<span class="inline-block w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-700"></span>';
                }
                this.p2RoundsContainer.innerHTML = p2Html;
            }
        }

        showMatchModal(isPlayerWin) {
            if (!this.matchModal) return;
            this.modalTitle.textContent = isPlayerWin ? 'VICTORY - CHAMPION!' : 'DEFEATED - K.O.';
            this.modalTitle.className = isPlayerWin
                ? 'text-3xl font-extrabold text-accent-green font-mono uppercase tracking-wider mb-2'
                : 'text-3xl font-extrabold text-rose-500 font-mono uppercase tracking-wider mb-2';

            this.modalDesc.textContent = isPlayerWin
                ? `Sensational martial mastery! ${this.p1.name} defeated ${this.cpu.name} with a final score of ${this.p1.roundsWon} - ${this.cpu.roundsWon}.`
                : `${this.cpu.name} proved too formidable this time. Practice your guard, time your specials, and claim revenge!`;

            this.matchModal.classList.remove('hidden');
            this.matchModal.classList.add('flex');
        }

        handlePlayerInput() {
            if (this.roundState !== 'fight') return;

            // Guarding
            if (this.keys['l']) {
                this.p1.setState('block');
                return;
            }

            // Crouch
            if (this.keys['s'] || this.keys['arrowdown']) {
                if (this.p1.isGrounded && !this.p1.isAttacking) {
                    this.p1.setState('crouch');
                }
                return;
            }

            // Horizontal Movement
            const moveLeft = this.keys['a'] || this.keys['arrowleft'];
            const moveRight = this.keys['d'] || this.keys['arrowright'];

            if (moveLeft && !moveRight) {
                if (this.p1.isGrounded && !this.p1.isAttacking) {
                    this.p1.setState(this.p1.facing === 1 ? 'walk_back' : 'walk_fwd');
                }
            } else if (moveRight && !moveLeft) {
                if (this.p1.isGrounded && !this.p1.isAttacking) {
                    this.p1.setState(this.p1.facing === 1 ? 'walk_fwd' : 'walk_back');
                }
            } else if (this.p1.isGrounded && !this.p1.isAttacking && this.p1.state !== 'hit_stun' && this.p1.state !== 'knockdown') {
                this.p1.setState('idle');
            }
        }

        update() {
            if (!this.isActive) return;

            // Handle Keyboard inputs for P1
            this.handlePlayerInput();

            // Handle AI logic for CPU
            if (this.roundState === 'fight') {
                this.ai.update(this.projectiles);
            }

            // Update Fighters
            this.p1.update(this.cpu, this.projectiles);
            this.cpu.update(this.p1, this.projectiles);

            // Update Projectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const proj = this.projectiles[i];
                proj.update();

                const target = proj.owner === 'p1' ? this.cpu : this.p1;
                // Collision check with target
                const hitDist = Math.abs(proj.x - target.x);
                const hitY = Math.abs(proj.y - (target.y - 60));

                if (hitDist < 35 && hitY < 55) {
                    proj.active = false;
                    target.takeDamage(proj.damage, proj.owner === 'p1' ? this.p1 : this.cpu, 6.0, 'special', proj.x, proj.y);
                }

                if (!proj.active) {
                    this.particles.spawnHitSparks(proj.x, proj.y, 10, true);
                    this.projectiles.splice(i, 1);
                }
            }

            // Update Particles
            this.particles.update();

            // Check Knockout condition during fight
            if (this.roundState === 'fight') {
                if (this.p1.health <= 0 || this.cpu.health <= 0) {
                    this.roundState = 'round_end';
                    clearInterval(this.timerIntervalId);
                    this.screenShake = 16;

                    const winner = this.p1.health > 0 ? this.p1 : this.cpu;
                    winner.setState('win');

                    setTimeout(() => {
                        this.showAnnouncement('K.O.!', `${winner.name} WINS ROUND!`, 2200, () => {
                            this.concludeRound(winner);
                        });
                    }, 1000);
                }
            }

            // Decay screen shake
            if (this.screenShake > 0) {
                this.screenShake *= 0.88;
                if (this.screenShake < 0.3) this.screenShake = 0;
            }

            // Update HUD elements
            this.updateHUD();
        }

        updateHUD() {
            // Health Bars
            if (this.p1HealthBar) {
                this.p1HealthBar.style.width = `${Math.max(0, this.p1.health)}%`;
            }
            if (this.p1LossBar) {
                this.p1LossBar.style.width = `${Math.max(0, this.p1.displayHealth)}%`;
            }
            if (this.p2HealthBar) {
                this.p2HealthBar.style.width = `${Math.max(0, this.cpu.health)}%`;
            }
            if (this.p2LossBar) {
                this.p2LossBar.style.width = `${Math.max(0, this.cpu.displayHealth)}%`;
            }

            // Super Gauges
            if (this.p1SuperBar) {
                this.p1SuperBar.style.width = `${(this.p1.superMeter / this.p1.maxSuper) * 100}%`;
                if (this.p1.superMeter >= this.p1.maxSuper) {
                    this.p1SuperBar.classList.add('animate-pulse');
                } else {
                    this.p1SuperBar.classList.remove('animate-pulse');
                }
            }
            if (this.p2SuperBar) {
                this.p2SuperBar.style.width = `${(this.cpu.superMeter / this.cpu.maxSuper) * 100}%`;
                if (this.cpu.superMeter >= this.cpu.maxSuper) {
                    this.p2SuperBar.classList.add('animate-pulse');
                } else {
                    this.p2SuperBar.classList.remove('animate-pulse');
                }
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            // Screen Shake Translation
            if (this.screenShake > 0) {
                const shakeX = (Math.random() - 0.5) * this.screenShake;
                const shakeY = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(shakeX, shakeY);
            }

            // 1. Draw Neo-Tokyo Fighting Arena Background
            this.drawArenaStage(ctx);

            // 2. Draw Fighters
            this.p1.draw(ctx);
            this.cpu.draw(ctx);

            // 3. Draw Projectiles
            for (let proj of this.projectiles) {
                proj.draw(ctx);
            }

            // 4. Draw Particles & Combat Floating Texts
            this.particles.draw(ctx);

            ctx.restore();
        }

        drawArenaStage(ctx) {
            // Sky Gradient (Cyber Sunset)
            const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
            skyGrad.addColorStop(0, '#0a0d18');
            skyGrad.addColorStop(0.55, '#1e1b4b');
            skyGrad.addColorStop(0.85, '#4c0519');
            skyGrad.addColorStop(1, '#831843');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

            // Distant Cyber Skyline & Skyscrapers
            ctx.fillStyle = '#070a13';
            const buildings = [
                { x: 30, w: 90, h: 220 },
                { x: 135, w: 75, h: 270 },
                { x: 230, w: 110, h: 180 },
                { x: 360, w: 80, h: 250 },
                { x: 460, w: 125, h: 290 },
                { x: 605, w: 70, h: 230 },
                { x: 690, w: 115, h: 280 },
                { x: 820, w: 100, h: 200 }
            ];

            buildings.forEach(b => {
                ctx.fillRect(b.x, GROUND_Y - b.h, b.w, b.h);
                // Glowing Cyber Windows
                ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
                for (let wy = GROUND_Y - b.h + 15; wy < GROUND_Y - 20; wy += 26) {
                    for (let wx = b.x + 12; wx < b.x + b.w - 14; wx += 18) {
                        if (Math.sin(wx * wy) > -0.2) {
                            ctx.fillRect(wx, wy, 8, 12);
                        }
                    }
                }
                ctx.fillStyle = '#070a13';
            });

            // Midground Cyber Torii Gate / Arena Pillars
            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 6;
            ctx.strokeRect(60, 140, 40, GROUND_Y - 140);
            ctx.strokeRect(VIRTUAL_WIDTH - 100, 140, 40, GROUND_Y - 140);

            // Floor / Dojo Platform
            const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
            floorGrad.addColorStop(0, '#18181b');
            floorGrad.addColorStop(1, '#09090b');
            ctx.fillStyle = floorGrad;
            ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

            // Neo-Brutalist Border Line for Ground
            ctx.strokeStyle = '#a3e635';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y);
            ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
            ctx.stroke();

            // Floor Grid Lines
            ctx.strokeStyle = 'rgba(163, 230, 53, 0.15)';
            ctx.lineWidth = 2;
            for (let x = 0; x < VIRTUAL_WIDTH; x += 60) {
                ctx.beginPath();
                ctx.moveTo(x, GROUND_Y);
                ctx.lineTo(x + (x - VIRTUAL_WIDTH / 2) * 0.4, VIRTUAL_HEIGHT);
                ctx.stroke();
            }
        }

        // Arcade Manager Lifecycle Hooks
        onActivate() {
            this.isActive = true;
            this.audio.init();
            if (!this.loopRunning) {
                this.loopRunning = true;
                this.gameLoop();
            }
        }

        onDeactivate() {
            this.isActive = false;
            this.loopRunning = false;
            this.keys = {};
        }

        gameLoop() {
            if (!this.isActive) {
                this.loopRunning = false;
                return;
            }

            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    // Instantiation
    function initFighterGame() {
        if (!window.fighterGameInstance) {
            window.fighterGameInstance = new NeoStreetBrawler();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFighterGame);
    } else {
        initFighterGame();
    }
})();

