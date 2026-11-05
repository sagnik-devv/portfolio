/**
 * hanging-card.js
 * Interactive Physics-Based Hanging Developer ID Card
 * Pure Analytical & Classical Mechanics Pendulum Engine
 * 
 * Features:
 * - Direct Ribbon Click-to-Edit: Clicking on the lanyard ribbon opens an inline editor to write the hiring company name
 * - Live Dynamic Ribbon Stamping: The entered company name instantly prints along the broad fabric ribbon in real-time
 * - Exact Euler-Lagrange damped pendulum differential equation:
 *     d²θ/dt² = - (g / L) * sin(θ) - γ * dθ/dt
 * - Inextensible lanyard cord: distance from anchor to card slot is ALWAYS strictly L (no stretching, no detachment)
 * - Direct slot-locked kinematics: card transform-origin is placed precisely at the slot hole (50% 18px),
 *   guaranteeing 100% zero-offset synchronization between the broad strap and the badge at all angles.
 * - Secondary card body rotational inertia: card tilts naturally during drags and swings with restoring spring torque.
 * - Zero phantom movement: resting velocity smoothly damps to absolute zero (no perpetual jitter, no phantom wobble).
 * - Broad fabric ribbon (Kenji Lambert style) with 2px borders, dashed edge stitches, and metallic bracket.
 * - Retina DPR-scaled canvas rendering
 */

(function () {
    'use strict';

    function initHangingCard() {
        const heroSection = document.getElementById('about');
        const container = document.getElementById('hero-hanging-card-wrapper');
        const canvas = document.getElementById('hero-lanyard-canvas');
        const cardEl = document.getElementById('hero-hanging-card');
        const cardCompanyLabel = document.getElementById('hero-card-company-label');

        // Inline Ribbon Editor Elements
        const editorEl = document.getElementById('ribbon-company-editor');
        const editorInput = document.getElementById('ribbon-company-input');
        const editorSubmit = document.getElementById('ribbon-company-submit');
        const hoverHint = document.getElementById('hero-ribbon-hover-hint');

        if (!heroSection || !container || !canvas || !cardEl) {
            console.warn('[HangingCard] Required DOM elements not found.');
            return;
        }

        const ctx = canvas.getContext('2d');
        let dpr = window.devicePixelRatio || 1;
        let animFrameId = null;
        let isHeroVisible = true;

        // ================= CONFIGURATION & RESPONSIVENESS =================
        let isMobile = window.innerWidth < 768;
        let cardWidth = isMobile ? 120 : 180;
        let cardHeight = isMobile ? 185 : 272;
        let lanyardLength = isMobile ? 100 : 175;
        let strapWidth = isMobile ? 24 : 32;
        let slotOffset = isMobile ? 13 : 18; // Distance from card top edge to slot center
        let anchorX = 0;
        let anchorY = 64; // Aligns with bottom seam of fixed top navbar

        // ================= PENDULUM PHYSICAL CONSTANTS =================
        const GRAVITY = 980;         // px/s²
        const STRAP_DAMPING = 1.65;   // Angular damping for smooth natural settling
        const CARD_STIFFNESS = 40;    // Restoring spring between card angle and strap angle
        const CARD_DAMPING = 5.5;     // Card angular damping

        // State variables (Classical Euler-Lagrange dual link)
        let strapAngle = 0;          // Radians from vertical down
        let strapAngularVel = 0;     // rad/s
        let cardAngle = 0;           // Radians from vertical down
        let cardAngularVel = 0;      // rad/s

        // Slack state (when card is pushed upwards towards anchor)
        let isSlack = false;
        let slackPos = { x: 0, y: 0 };

        // Interaction state
        let isDragging = false;
        let dragPointer = { x: 0, y: 0 };
        let prevPointer = { x: 0, y: 0 };
        let dragTime = 0;

        // Recruiter Company Name State
        let recruiterCompanyName = '';
        try {
            recruiterCompanyName = localStorage.getItem('portfolio_recruiter_company') || '';
        } catch (_) {}

        function getOptimalAnchorX(width) {
            if (width < 768) {
                return Math.round(width - 75);
            }
            if (width < 1024) {
                return Math.round(width - 110);
            }
            // Position in open cyan area to the right of the video
            const videoRightEdge = Math.min((width / 2) + 360, width - 260);
            const rightMargin = width - 40;
            const optimalX = Math.round((videoRightEdge + rightMargin) / 2);
            return Math.max(optimalX, width - 220);
        }

        function updateDimensions() {
            const rect = heroSection.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            isMobile = window.innerWidth < 768;
            cardWidth = isMobile ? 120 : 180;
            cardHeight = isMobile ? 185 : 272;
            lanyardLength = isMobile ? 100 : 175;
            strapWidth = isMobile ? 24 : 32;
            slotOffset = isMobile ? 13 : 18;

            cardEl.style.width = cardWidth + 'px';
            cardEl.style.height = cardHeight + 'px';
            cardEl.style.transformOrigin = `50% ${slotOffset}px`;

            anchorY = 64;
            anchorX = getOptimalAnchorX(width);

            dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            return { width, height };
        }

        // ================= RECRUITER COMPANY BRANDING =================
        function updateCompanyBranding(name) {
            recruiterCompanyName = (name || '').trim();
            try {
                localStorage.setItem('portfolio_recruiter_company', recruiterCompanyName);
            } catch (_) {}

            if (cardCompanyLabel) {
                if (recruiterCompanyName) {
                    cardCompanyLabel.textContent = `${recruiterCompanyName.toUpperCase()} // PASS`;
                    cardCompanyLabel.classList.remove('text-neutral-500');
                    cardCompanyLabel.classList.add('text-accent-green');
                } else {
                    cardCompanyLabel.textContent = '2026 // ID';
                }
            }

            render();
        }

        // Initialize saved company name on load
        if (recruiterCompanyName) {
            updateCompanyBranding(recruiterCompanyName);
        }

        // ================= RIBBON HIT DETECTION & INLINE EDITING =================
        function distToSegment(px, py, ax, ay, bx, by) {
            const dx = bx - ax;
            const dy = by - ay;
            const lenSq = dx * dx + dy * dy;
            if (lenSq === 0) return { dist: Math.hypot(px - ax, py - ay), t: 0, projX: ax, projY: ay };

            let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const projX = ax + t * dx;
            const projY = ay + t * dy;
            return {
                dist: Math.hypot(px - projX, py - projY),
                t: t,
                projX: projX,
                projY: projY
            };
        }

        function isPointOnRibbon(px, py) {
            const slotPos = getSlotPosition();
            const hit = distToSegment(px, py, anchorX, anchorY, slotPos.x, slotPos.y);
            return hit.dist <= (strapWidth / 2 + 10) && hit.t >= 0.08 && hit.t <= 0.92;
        }

        function openRibbonEditor(clickX, clickY) {
            if (!editorEl || !editorInput) return;

            const slotPos = getSlotPosition();
            const posX = clickX || ((anchorX + slotPos.x) / 2);
            const posY = clickY || ((anchorY + slotPos.y) / 2);

            editorEl.style.left = posX + 'px';
            editorEl.style.top = posY + 'px';
            editorEl.classList.remove('hidden');

            editorInput.value = recruiterCompanyName;
            editorInput.focus();
            editorInput.select();

            if (hoverHint) {
                hoverHint.classList.add('hidden');
            }
        }

        function closeRibbonEditor() {
            if (!editorEl) return;
            editorEl.classList.add('hidden');
        }

        if (editorInput) {
            editorInput.addEventListener('input', (e) => {
                updateCompanyBranding(e.target.value);
            });

            editorInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    closeRibbonEditor();
                } else if (e.key === 'Escape') {
                    closeRibbonEditor();
                }
            });

            editorInput.addEventListener('blur', () => {
                // Short timeout to allow submit button clicks
                setTimeout(closeRibbonEditor, 180);
            });
        }

        if (editorSubmit) {
            editorSubmit.addEventListener('click', (e) => {
                e.stopPropagation();
                closeRibbonEditor();
            });
        }

        // Click / Hover detection on the hero section for the ribbon
        heroSection.addEventListener('click', (e) => {
            // Ignore if clicking on editor or card itself
            if (editorEl && editorEl.contains(e.target)) return;
            if (cardEl && cardEl.contains(e.target)) return;

            const heroRect = heroSection.getBoundingClientRect();
            const px = e.clientX - heroRect.left;
            const py = e.clientY - heroRect.top;

            if (isPointOnRibbon(px, py)) {
                openRibbonEditor(px, py);
            } else {
                closeRibbonEditor();
            }
        });

        heroSection.addEventListener('pointermove', (e) => {
            if (isDragging) return;
            if (editorEl && !editorEl.classList.contains('hidden')) return;

            const heroRect = heroSection.getBoundingClientRect();
            const px = e.clientX - heroRect.left;
            const py = e.clientY - heroRect.top;

            if (isPointOnRibbon(px, py)) {
                if (hoverHint) {
                    hoverHint.style.left = px + 'px';
                    hoverHint.style.top = (py - 12) + 'px';
                    hoverHint.classList.remove('hidden');
                }
            } else {
                if (hoverHint) {
                    hoverHint.classList.add('hidden');
                }
            }
        });

        // ================= POINTER / TOUCH DRAGGING =================
        function setupInteraction() {
            const dragHint = document.getElementById('hero-card-drag-hint');

            cardEl.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;

                closeRibbonEditor();

                isDragging = true;
                cardEl.style.cursor = 'grabbing';

                if (dragHint) {
                    dragHint.style.opacity = '0';
                }

                try {
                    cardEl.setPointerCapture(e.pointerId);
                } catch (_) {}

                const heroRect = heroSection.getBoundingClientRect();
                dragPointer.x = e.clientX - heroRect.left;
                dragPointer.y = e.clientY - heroRect.top;
                prevPointer.x = dragPointer.x;
                prevPointer.y = dragPointer.y;
                dragTime = performance.now();

                if (!animFrameId) {
                    lastTime = performance.now();
                    loop();
                }
            });

            cardEl.addEventListener('pointermove', (e) => {
                if (!isDragging) return;

                const heroRect = heroSection.getBoundingClientRect();
                dragPointer.x = e.clientX - heroRect.left;
                dragPointer.y = e.clientY - heroRect.top;
            });

            function endDrag(e) {
                if (!isDragging) return;
                isDragging = false;
                cardEl.style.cursor = 'grab';

                try {
                    if (cardEl.hasPointerCapture(e.pointerId)) {
                        cardEl.releasePointerCapture(e.pointerId);
                    }
                } catch (_) {}
            }

            cardEl.addEventListener('pointerup', endDrag);
            cardEl.addEventListener('pointercancel', endDrag);
        }

        // ================= ANALYTICAL KINEMATICS & RENDERING =================
        function getSlotPosition() {
            if (isSlack) {
                return { x: slackPos.x, y: slackPos.y };
            }
            // Strict Inextensible Circular Arc of radius lanyardLength
            return {
                x: anchorX + lanyardLength * Math.sin(strapAngle),
                y: anchorY + lanyardLength * Math.cos(strapAngle)
            };
        }

        function renderBroadLanyard(slotPos) {
            const heroRect = heroSection.getBoundingClientRect();
            ctx.clearRect(0, 0, heroRect.width, heroRect.height);

            const dx = slotPos.x - anchorX;
            const dy = slotPos.y - anchorY;
            const dist = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);

            const hw = strapWidth / 2;
            const nx = -Math.sin(angle);
            const ny = Math.cos(angle);

            ctx.save();

            // 1. Draw Broad Fabric Ribbon
            ctx.beginPath();
            if (isSlack && dist < lanyardLength - 4) {
                // Realistic gravitational cloth sag curve when pushed upwards
                const sag = Math.min((lanyardLength - dist) * 0.7, 42);
                const mx = (anchorX + slotPos.x) / 2;
                const my = (anchorY + slotPos.y) / 2 + sag;

                ctx.moveTo(anchorX - nx * hw, anchorY - ny * hw);
                ctx.quadraticCurveTo(mx - nx * hw, my - ny * hw, slotPos.x - nx * (hw * 0.85), slotPos.y - ny * (hw * 0.85));
                ctx.lineTo(slotPos.x + nx * (hw * 0.85), slotPos.y + ny * (hw * 0.85));
                ctx.quadraticCurveTo(mx + nx * hw, my + ny * hw, anchorX + nx * hw, anchorY + ny * hw);
            } else {
                // Taut ribbon with slight taper into the card punch slot
                const taperHw = hw * 0.85;
                ctx.moveTo(anchorX - nx * hw, anchorY - ny * hw);
                ctx.lineTo(anchorX + nx * hw, anchorY + ny * hw);
                ctx.lineTo(slotPos.x + nx * taperHw, slotPos.y + ny * taperHw);
                ctx.lineTo(slotPos.x - nx * taperHw, slotPos.y - ny * taperHw);
            }
            ctx.closePath();

            // Vibrant coral-red gradient (Kenji reference style)
            const grad = ctx.createLinearGradient(
                anchorX - nx * hw, anchorY - ny * hw,
                anchorX + nx * hw, anchorY + ny * hw
            );
            grad.addColorStop(0, '#f84f38');
            grad.addColorStop(0.5, '#ef3d27');
            grad.addColorStop(1, '#db2f19');
            ctx.fillStyle = grad;
            ctx.fill();

            // 2. Strap side borders (2px dark Neo-Brutalist border)
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (isSlack && dist < lanyardLength - 4) {
                const sag = Math.min((lanyardLength - dist) * 0.7, 42);
                const mx = (anchorX + slotPos.x) / 2;
                const my = (anchorY + slotPos.y) / 2 + sag;
                ctx.moveTo(anchorX - nx * hw, anchorY - ny * hw);
                ctx.quadraticCurveTo(mx - nx * hw, my - ny * hw, slotPos.x - nx * (hw * 0.85), slotPos.y - ny * (hw * 0.85));
                ctx.moveTo(anchorX + nx * hw, anchorY + ny * hw);
                ctx.quadraticCurveTo(mx + nx * hw, my + ny * hw, slotPos.x + nx * (hw * 0.85), slotPos.y + ny * (hw * 0.85));
            } else {
                const taperHw = hw * 0.85;
                ctx.moveTo(anchorX - nx * hw, anchorY - ny * hw);
                ctx.lineTo(slotPos.x - nx * taperHw, slotPos.y - ny * taperHw);
                ctx.moveTo(anchorX + nx * hw, anchorY + ny * hw);
                ctx.lineTo(slotPos.x + nx * taperHw, slotPos.y + ny * taperHw);
            }
            ctx.stroke();

            // Subtle inner dashed stitch lines along the ribbon
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            const stitchHw = hw - 3.5;
            ctx.beginPath();
            ctx.moveTo(anchorX - nx * stitchHw, anchorY - ny * stitchHw);
            ctx.lineTo(slotPos.x - nx * (stitchHw * 0.85), slotPos.y - ny * (stitchHw * 0.85));
            ctx.moveTo(anchorX + nx * stitchHw, anchorY + ny * stitchHw);
            ctx.lineTo(slotPos.x + nx * (stitchHw * 0.85), slotPos.y + ny * (stitchHw * 0.85));
            ctx.stroke();
            ctx.restore();

            // 3. Render Recruiter Company Name / Repeating Text along the ribbon
            if (!isSlack || dist > 60) {
                ctx.save();
                ctx.translate(anchorX, anchorY);
                ctx.rotate(angle);

                const displayWord = recruiterCompanyName ? recruiterCompanyName.toUpperCase() : "ADD YOUR COMPANY'S NAME";
                const repeatUnit = `${displayWord}  ★  `;

                ctx.font = `bold ${isMobile ? '8px' : '9.5px'} monospace`;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                ctx.shadowBlur = 2;

                const unitWidth = ctx.measureText(repeatUnit).width;
                if (unitWidth > 0 && dist > 45) {
                    const availableLen = dist - 25;
                    const count = Math.max(1, Math.floor(availableLen / unitWidth));
                    const startX = 16 + (availableLen - count * unitWidth) / 2 + unitWidth / 2;

                    for (let i = 0; i < count; i++) {
                        const tx = startX + i * unitWidth;
                        ctx.fillText(repeatUnit, tx, 0);
                    }
                }
                ctx.restore();
            }

            // 4. Top mounting clamp fixture (at navbar seam)
            ctx.fillStyle = '#171717';
            ctx.fillRect(anchorX - hw - 3, anchorY - 4, strapWidth + 6, 8);
            ctx.fillStyle = '#e4e4e7';
            ctx.fillRect(anchorX - 5, anchorY - 1, 10, 2);

            // 5. Metal connector ring through card slot
            ctx.fillStyle = '#171717';
            ctx.beginPath();
            ctx.arc(slotPos.x, slotPos.y, isMobile ? 3.5 : 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f4f4f5';
            ctx.beginPath();
            ctx.arc(slotPos.x, slotPos.y, isMobile ? 1.5 : 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        function render() {
            const slotPos = getSlotPosition();

            // Position Card Element: transform-origin is 50% slotOffset (the punch hole)
            // Placing the origin at (slotPos.x, slotPos.y) locks the card slot to the strap 100%
            const cardLeft = slotPos.x - cardWidth / 2;
            const cardTop = slotPos.y - slotOffset;
            cardEl.style.transform = `translate3d(${cardLeft.toFixed(2)}px, ${cardTop.toFixed(2)}px, 0px) rotate(${cardAngle.toFixed(4)}rad)`;

            // Render Broad Ribbon Canvas
            renderBroadLanyard(slotPos);
        }

        // ================= PHYSICS INTEGRATION LOOP =================
        let lastTime = performance.now();

        function loop(currentTime = performance.now()) {
            if (!isHeroVisible) {
                animFrameId = null;
                return;
            }

            const dt = Math.min((currentTime - lastTime) / 1000, 0.032);
            lastTime = currentTime;

            if (isDragging) {
                // Dragging Dynamics
                const dx = dragPointer.x - anchorX;
                const dy = dragPointer.y - anchorY;
                const dist = Math.hypot(dx, dy);

                if (dy < lanyardLength && dist < lanyardLength) {
                    // Pushed upwards: ribbon is slack
                    isSlack = true;
                    slackPos.x = dragPointer.x;
                    slackPos.y = Math.max(anchorY + 25, dragPointer.y);
                    strapAngle = Math.atan2(dx, Math.max(dy, 10));
                    strapAngularVel = 0;
                } else {
                    // Taut: strictly on radius lanyardLength
                    isSlack = false;
                    const targetAngle = Math.atan2(dx, Math.max(dy, 10));
                    // Clamp swing to realistic maximum angle (~70 degrees)
                    const clampedAngle = Math.max(-1.22, Math.min(1.22, targetAngle));

                    // Estimate drag velocity for realistic release impulse
                    const now = currentTime;
                    const pointerDt = Math.max((now - dragTime) / 1000, 0.001);
                    prevPointer.x = dragPointer.x;
                    prevPointer.y = dragPointer.y;
                    dragTime = now;

                    strapAngularVel = (clampedAngle - strapAngle) / pointerDt;
                    // Clamp initial launch velocity to prevent overshoot
                    strapAngularVel = Math.max(-8, Math.min(8, strapAngularVel));
                    strapAngle = clampedAngle;
                }

                // Card tilts towards cursor with natural rotational spring
                const targetCardAngle = strapAngle + Math.atan2(dragPointer.x - getSlotPosition().x, Math.max(dragPointer.y - getSlotPosition().y, 35)) * 0.6;
                cardAngle += (targetCardAngle - cardAngle) * 0.25;
                cardAngularVel = (targetCardAngle - cardAngle) / Math.max(dt, 0.001);

            } else {
                // Free Flight: Classical Pendulum Euler-Lagrange Physics
                isSlack = false;

                // 1. Strap Pendulum Motion: d²θ/dt² = - (g / L) * sin(θ) - γ * ω
                const strapAcc = - (GRAVITY / lanyardLength) * Math.sin(strapAngle) - STRAP_DAMPING * strapAngularVel;
                strapAngularVel += strapAcc * dt;
                strapAngle += strapAngularVel * dt;

                // Clamp angle to stay within hero section boundary
                if (strapAngle > 1.25) {
                    strapAngle = 1.25;
                    strapAngularVel *= -0.2;
                } else if (strapAngle < -1.25) {
                    strapAngle = -1.25;
                    strapAngularVel *= -0.2;
                }

                // 2. Secondary Card Body Angular Inertia: restoring spring toward strap angle
                const cardTorque = - CARD_STIFFNESS * (cardAngle - strapAngle) - CARD_DAMPING * cardAngularVel;
                cardAngularVel += cardTorque * dt;
                cardAngle += cardAngularVel * dt;

                // 3. Zero Phantom Movement: Clean resting sleep when motion decays
                const totalEnergy = Math.abs(strapAngularVel) + Math.abs(strapAngle) + Math.abs(cardAngularVel) + Math.abs(cardAngle);
                if (totalEnergy < 0.002) {
                    strapAngle = 0;
                    strapAngularVel = 0;
                    cardAngle = 0;
                    cardAngularVel = 0;
                }
            }

            render();

            animFrameId = requestAnimationFrame(loop);
        }

        // ================= VISIBILITY & RESIZE OBSERVERS =================
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    isHeroVisible = entry.isIntersecting;
                    if (isHeroVisible && !animFrameId) {
                        lastTime = performance.now();
                        loop();
                    }
                });
            }, { threshold: 0.05 });
            observer.observe(heroSection);
        }

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                updateDimensions();
                // Clean rest on resize
                strapAngle = 0;
                strapAngularVel = 0;
                cardAngle = 0;
                cardAngularVel = 0;
                render();
            }, 120);
        });

        // Initialize layout and render resting state
        updateDimensions();
        setupInteraction();
        render();
        lastTime = performance.now();
        loop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHangingCard);
    } else {
        initHangingCard();
    }
})();
