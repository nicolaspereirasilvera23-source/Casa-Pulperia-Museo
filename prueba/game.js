/**
 * NEON CLASH — 2D Fighting Game Prototype
 * Complete game logic: Input, Physics, Combat, Particles, HUD, Rendering
 */

// ===========================
// Constants & Configuration
// ===========================
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const FLOOR_HEIGHT = 50;
const GROUND_Y = GAME_HEIGHT - FLOOR_HEIGHT;

// ===========================
// Game State
// ===========================
let gameState = 'MENU'; // 'MENU' | 'FIGHTING' | 'KO'
let timer = 99;
let lastTimerUpdate = 0;
let winner = null;

// Screen effects
let screenShakeFrames = 0;
let screenShakeIntensity = 0;
let superFlashFrames = 0;

// ===========================
// Input System
// ===========================
const keys = {};
const justPressed = {};

window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) {
        justPressed[e.code] = true;
    }
    keys[e.code] = true;
    // Prevent scrolling from game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
         'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad8'].includes(e.code)) {
        e.preventDefault();
    }
    // State transitions via Enter
    if (e.code === 'Enter') {
        if (gameState === 'MENU') {
            startGame();
        } else if (gameState === 'KO') {
            startGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function clearJustPressed() {
    for (const key in justPressed) {
        delete justPressed[key];
    }
}

// ===========================
// Attack Frame Data
// ===========================
const ATTACK_DATA = {
    light:  { damage: 5,  startup: 3,  active: 3, recovery: 5,  range: 60,  knockback: 8,  hitstun: 8,  superGain: 8  },
    medium: { damage: 10, startup: 5,  active: 4, recovery: 8,  range: 75,  knockback: 14, hitstun: 12, superGain: 12 },
    heavy:  { damage: 18, startup: 8,  active: 5, recovery: 14, range: 90,  knockback: 20, hitstun: 18, superGain: 15 },
    super:  { damage: 55, startup: 12, active: 4, recovery: 20, range: 300, knockback: 30, hitstun: 25, superGain: 0  }
};

// ===========================
// Particle System
// ===========================
let particles = [];

class Particle {
    constructor(x, y, color, vx, vy) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = 20;
        this.maxLife = 20;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.4;
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

function spawnHitParticles(x, y, color) {
    const count = Math.floor(Math.random() * 8) + 8;
    for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 16;
        const vy = (Math.random() - 0.5) * 14 - 5;
        particles.push(new Particle(x, y, color, vx, vy));
    }
}

function spawnBlockParticles(x, y, color) {
    for (let i = 0; i < 7; i++) {
        const vx = (Math.random() - 0.5) * 12;
        const vy = -Math.random() * 7;
        particles.push(new Particle(x, y, i % 2 === 0 ? '#ffffff' : color, vx, vy));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles(ctx) {
    for (const p of particles) {
        p.draw(ctx);
    }
}

// ===========================
// Fighter Class
// ===========================
class Fighter {
    constructor(x, color, name, isPlayer1) {
        this.x = x;
        this.width = 60;
        this.height = 120;
        this.y = GROUND_Y - this.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.gravity = 0.6;
        this.jumpVelocity = -13;

        this.hp = 100;
        this.maxHp = 100;
        this.superMeter = 0;
        this.maxSuper = 100;

        this.color = color;
        this.name = name;
        this.isPlayer1 = isPlayer1;
        this.facingRight = isPlayer1;

        // State machine: 'idle' | 'walking' | 'jumping' | 'crouching' | 'blocking' | 'blockstun' | 'attacking' | 'hitstun'
        this.state = 'idle';
        this.isGrounded = true;
        this.blockstunFrames = 0;

        // Combat
        this.currentAttack = null;
        this.attackType = null;
        this.attackFrame = 0;
        this.hasHit = false;
        this.hitstunFrames = 0;

        // Animation helpers
        this.walkCycle = 0;
        this.flashFrames = 0;

        // Controls mapping
        if (isPlayer1) {
            this.controls = {
                up: 'KeyW', left: 'KeyA', down: 'KeyS', right: 'KeyD',
                light: 'KeyJ', medium: 'KeyK', heavy: 'KeyL', super: 'KeyU', block: 'KeyQ'
            };
        } else {
            this.controls = {
                up: 'ArrowUp', left: 'ArrowLeft', down: 'ArrowDown', right: 'ArrowRight',
                light: 'Numpad1', medium: 'Numpad2', heavy: 'Numpad3', super: 'Numpad0', block: 'KeyZ'
            };
        }
    }

    update(opponent) {
        // Auto-face opponent when free
        if (this.state !== 'attacking' && this.state !== 'hitstun') {
            this.facingRight = this.x < opponent.x;
        }

        // Physics
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Ground collision
        const groundLevel = GROUND_Y - this.height;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            if (!this.isGrounded) {
                this.isGrounded = true;
                if (this.state === 'jumping') this.state = 'idle';
            }
        } else {
            this.isGrounded = false;
        }

        // Screen bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > GAME_WIDTH) this.x = GAME_WIDTH - this.width;

        // Friction on ground
        if (this.isGrounded && this.state !== 'walking' && this.state !== 'hitstun') {
            this.velocityX *= 0.8;
            if (Math.abs(this.velocityX) < 0.5) this.velocityX = 0;
        }

        // Flash timer
        if (this.flashFrames > 0) this.flashFrames--;

        // Walk animation
        if (this.state === 'walking') {
            this.walkCycle += 0.15;
        } else {
            this.walkCycle = 0;
        }

        // === State Machine ===
        if (this.state === 'hitstun') {
            this.hitstunFrames--;
            if (this.hitstunFrames <= 0) this.state = 'idle';
        } else if (this.state === 'blockstun') {
            this.blockstunFrames--;
            if (this.blockstunFrames <= 0) this.state = 'idle';
        } else if (this.state === 'attacking') {
            this.attackFrame++;
            const total = this.currentAttack.startup + this.currentAttack.active + this.currentAttack.recovery;

            // Forward momentum during attacks
            if (this.isGrounded && this.attackFrame < this.currentAttack.startup + this.currentAttack.active) {
                if (this.attackType === 'heavy') {
                    this.velocityX = this.facingRight ? 2 : -2;
                } else if (this.attackType === 'super') {
                    this.velocityX = this.facingRight ? 4 : -4;
                } else {
                    this.velocityX = 0;
                }
            } else if (this.isGrounded) {
                this.velocityX = 0;
            }

            // Super laser muzzle sparks during active frames
            if (this.attackType === 'super' &&
                this.attackFrame >= this.currentAttack.startup &&
                this.attackFrame < this.currentAttack.startup + this.currentAttack.active &&
                this.attackFrame % 2 === 0) {
                const muzzleX = this.facingRight ? this.x + this.width + 5 : this.x - 5;
                for (let i = 0; i < 3; i++) {
                    particles.push(new Particle(
                        muzzleX, this.y + 35,
                        Math.random() > 0.5 ? '#ff3333' : '#ffffff',
                        (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 4
                    ));
                }
            }

            if (this.attackFrame >= total) {
                this.state = 'idle';
                this.currentAttack = null;
                this.attackType = null;
            }
        } else {
            this.handleInput();
        }
    }

    handleInput() {
        if (!this.isGrounded) {
            // Air movement (limited)
            if (keys[this.controls.left]) this.velocityX = -this.speed * 0.7;
            else if (keys[this.controls.right]) this.velocityX = this.speed * 0.7;
        } else {
            // Ground movement
            if (keys[this.controls.block]) {
                // Block: walk backward (away from opponent) while guarding
                this.state = 'blocking';
                const awayDir = this.facingRight ? -1 : 1;
                this.velocityX = awayDir * this.speed * 0.6;
            } else if (keys[this.controls.down]) {
                this.state = 'crouching';
                this.velocityX = 0;
            } else if (keys[this.controls.left]) {
                this.state = 'walking';
                this.velocityX = -this.speed;
            } else if (keys[this.controls.right]) {
                this.state = 'walking';
                this.velocityX = this.speed;
            } else {
                this.state = 'idle';
                this.velocityX = 0;
            }

            // Jump
            if (keys[this.controls.up] && this.isGrounded) {
                this.state = 'jumping';
                this.velocityY = this.jumpVelocity;
                this.isGrounded = false;
            }
        }

        // Attack inputs (use justPressed to prevent held-key spam)
        this.handleAttack();
    }

    handleAttack() {
        if (this.state === 'attacking' || this.state === 'hitstun') return;

        if (justPressed[this.controls.light]) {
            this.startAttack('light');
        } else if (justPressed[this.controls.medium]) {
            this.startAttack('medium');
        } else if (justPressed[this.controls.heavy]) {
            this.startAttack('heavy');
        } else if (justPressed[this.controls.super] && this.superMeter >= this.maxSuper) {
            this.startAttack('super');
            this.superMeter = 0;
            superFlashFrames = 12;
        }
    }

    startAttack(type) {
        this.state = 'attacking';
        this.attackType = type;
        this.currentAttack = ATTACK_DATA[type];
        this.attackFrame = 0;
        this.hasHit = false;
    }

    takeDamage(damage, knockbackDir, knockback, hitstun) {
        // Blocked hit: chip damage, no hitstun, minimal knockback
        if (this.state === 'blocking' || this.state === 'blockstun') {
            const chip = Math.max(1, Math.ceil(damage * 0.2));
            this.hp -= chip;
            if (this.hp < 0) this.hp = 0;

            this.addSuperMeter(damage * 0.1);
            this.state = 'blockstun';
            this.blockstunFrames = 12;
            this.flashFrames = 6;
            this.velocityX = knockbackDir * knockback * 0.15;
            spawnBlockParticles(this.x + this.width / 2, this.y + 35, this.color);
            return;
        }

        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;

        this.state = 'hitstun';
        this.hitstunFrames = hitstun;
        this.flashFrames = hitstun;

        // Knockback
        this.velocityX = knockbackDir * knockback;
        if (this.isGrounded) {
            this.velocityY = -3;
            this.isGrounded = false;
        }

        // Gain super from taking damage
        this.addSuperMeter(damage * 0.5);
    }

    addSuperMeter(amount) {
        this.superMeter = Math.min(this.superMeter + amount, this.maxSuper);
    }

    getHurtbox() {
        if (this.state === 'crouching') {
            return {
                x: this.x - 5,
                y: this.y + this.height * 0.35,
                width: this.width + 10,
                height: this.height * 0.65
            };
        }
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getHitbox() {
        if (this.state !== 'attacking' || !this.currentAttack) return null;

        const isActive = this.attackFrame >= this.currentAttack.startup &&
                         this.attackFrame < this.currentAttack.startup + this.currentAttack.active;
        if (!isActive) return null;

        const w = this.currentAttack.range;
        const h = this.attackType === 'super' ? 45 : 30;
        const yOffset = this.state === 'crouching' ? 60 : 30;
        const hx = this.facingRight ? this.x + this.width : this.x - w;

        return { x: hx, y: this.y + yOffset, width: w, height: h };
    }

    // ===========================
    // Fighter Rendering
    // ===========================
    draw(ctx) {
        ctx.save();

        // Hitstun vibration
        if (this.state === 'hitstun') {
            ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3);
        }

        const hurtbox = this.getHurtbox();
        const bodyX = hurtbox.x;
        const bodyY = hurtbox.y;
        const bodyW = hurtbox.width;
        const bodyH = hurtbox.height;

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, GROUND_Y, this.width / 2 + 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // === Body Color ===
        let bodyColor = this.color;
        if (this.state === 'hitstun' && this.flashFrames % 4 < 2) {
            bodyColor = '#ffffff';
        }

        // Body glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        // === Legs ===
        const legW = 14;
        const legH = 25;
        const legY = bodyY + bodyH - 5;
        let leftLegOffset = 0;
        let rightLegOffset = 0;

        if (this.state === 'walking') {
            leftLegOffset = Math.sin(this.walkCycle) * 8;
            rightLegOffset = Math.sin(this.walkCycle + Math.PI) * 8;
        } else if (this.state === 'jumping') {
            leftLegOffset = -5;
            rightLegOffset = 5;
        }

        ctx.fillStyle = bodyColor;
        ctx.fillRect(bodyX + 8 + leftLegOffset, legY, legW, legH);
        ctx.fillRect(bodyX + bodyW - 22 + rightLegOffset, legY, legW, legH);

        // === Torso ===
        ctx.fillStyle = bodyColor;
        const torsoGrad = ctx.createLinearGradient(bodyX, bodyY, bodyX, bodyY + bodyH);
        torsoGrad.addColorStop(0, bodyColor);
        torsoGrad.addColorStop(1, this.darkenColor(bodyColor, 0.6));
        ctx.fillStyle = torsoGrad;
        ctx.fillRect(bodyX, bodyY, bodyW, bodyH - legH);

        // Torso detail lines
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bodyX + bodyW / 2, bodyY + 10);
        ctx.lineTo(bodyX + bodyW / 2, bodyY + bodyH - legH - 10);
        ctx.stroke();

        // === Head ===
        const headW = this.width * 0.75;
        const headH = 28;
        const headX = this.x + (this.width - headW) / 2;
        const headY = this.state === 'crouching' ? bodyY - headH + 5 : bodyY - headH;

        ctx.fillStyle = bodyColor;
        ctx.fillRect(headX, headY, headW, headH);

        // Visor (eye strip)
        ctx.fillStyle = '#000';
        ctx.fillRect(headX, headY + 10, headW, 8);

        // Visor light
        const visorColor = this.state === 'hitstun' ? '#ff0000' : (this.isPlayer1 ? '#00ffff' : '#ff66aa');
        ctx.fillStyle = visorColor;
        ctx.shadowColor = visorColor;
        ctx.shadowBlur = 10;
        const visorX = this.facingRight ? headX + headW - 14 : headX + 4;
        ctx.fillRect(visorX, headY + 11, 10, 6);
        ctx.shadowBlur = 0;

        // === Block Shield ===
        if (this.state === 'blocking' || this.state === 'blockstun') {
            const shieldAlpha = this.state === 'blockstun' ? 0.45 : 0.75;
            const cx = this.facingRight ? bodyX + bodyW + 4 : bodyX - 4;
            const dir = this.facingRight ? 1 : -1;

            ctx.fillStyle = this.color;
            ctx.globalAlpha = shieldAlpha;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.moveTo(cx, bodyY + 6);
            ctx.lineTo(cx + dir * 22, bodyY + 18);
            ctx.lineTo(cx + dir * 22, bodyY + bodyH - 18);
            ctx.lineTo(cx, bodyY + bodyH - 6);
            ctx.lineTo(cx - dir * 14, bodyY + bodyH - 14);
            ctx.lineTo(cx - dir * 14, bodyY + 14);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = shieldAlpha + 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }

        // === Attack Arm ===
        if (this.state === 'attacking' && this.currentAttack) {
            this.drawAttack(ctx, bodyY);
        }

        // === Non-attack arm (idle arm) ===
        if (this.state !== 'attacking' && this.state !== 'blocking' && this.state !== 'blockstun') {
            ctx.fillStyle = bodyColor;
            const idleArmW = 10;
            const idleArmH = 20;
            const idleArmX = this.facingRight ? bodyX + bodyW - 3 : bodyX - idleArmW + 3;
            ctx.fillRect(idleArmX, bodyY + 15, idleArmW, idleArmH);
        }

        ctx.restore();
    }

    drawAttack(ctx, bodyY) {
        const atk = this.currentAttack;
        const isStartup = this.attackFrame < atk.startup;
        const isActive = this.attackFrame >= atk.startup &&
                         this.attackFrame < atk.startup + atk.active;
        const isRecovery = this.attackFrame >= atk.startup + atk.active;

        const armY = bodyY + 25;
        const armH = this.attackType === 'super' ? 20 : 14;

        // Attack color based on type
        const attackColors = {
            light: '#ffffff',
            medium: '#ffffaa',
            heavy: '#ffaa00',
            super: '#ff3333'
        };
        const atkColor = attackColors[this.attackType] || '#ffffff';

        // Super renders a laser beam instead of a melee arm
        if (this.attackType === 'super') {
            this.drawSuperLaser(ctx, armY, armH, isStartup, isActive, isRecovery, atkColor);
            return;
        }

        let armLen = 0;
        let glowAlpha = 0;

        if (isStartup) {
            const progress = this.attackFrame / atk.startup;
            armLen = atk.range * 0.3 * progress;
            glowAlpha = 0.2;
        } else if (isActive) {
            armLen = atk.range;
            glowAlpha = 0.7;
        } else if (isRecovery) {
            const recFrame = this.attackFrame - (atk.startup + atk.active);
            const recProgress = recFrame / atk.recovery;
            armLen = atk.range * (1 - recProgress);
            glowAlpha = 0.1;
        }

        const armX = this.facingRight ? this.x + this.width : this.x - armLen;

        // Draw arm
        ctx.fillStyle = this.color;
        ctx.fillRect(armX, armY, armLen, armH);

        // Glow overlay
        ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
        ctx.fillRect(armX - 2, armY - 2, armLen + 4, armH + 4);

        // Active frame effects
        if (isActive) {
            // Bright hitbox indicator
            ctx.fillStyle = atkColor;
            ctx.globalAlpha = 0.4;
            const hitbox = this.getHitbox();
            if (hitbox) {
                ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

                // Trail effect
                ctx.globalAlpha = 0.15;
                const trailDir = this.facingRight ? -25 : 25;
                ctx.fillRect(hitbox.x + trailDir, hitbox.y, hitbox.width, hitbox.height);
                ctx.fillRect(hitbox.x + trailDir * 2, hitbox.y, hitbox.width, hitbox.height);
            }
            ctx.globalAlpha = 1.0;
        }
    }

    drawSuperLaser(ctx, armY, armH, isStartup, isActive, isRecovery, atkColor) {
        const atk = this.currentAttack;
        const originX = this.facingRight ? this.x + this.width : this.x;
        const beamCenterY = armY + armH / 2;
        const pulse = 0.6 + Math.sin(this.attackFrame * 0.7) * 0.4;

        let laserAlpha = 0;
        let laserLen = 0;
        if (isStartup) {
            // Charging beam grows from the muzzle
            const progress = this.attackFrame / atk.startup;
            laserAlpha = 0.35 * progress;
            laserLen = Math.max(20, 120 * progress);
        } else if (isActive) {
            laserAlpha = 0.95;
            laserLen = GAME_WIDTH;
        } else {
            // Recovery: beam fades out
            const recProgress = (this.attackFrame - (atk.startup + atk.active)) / atk.recovery;
            laserAlpha = 0.95 * (1 - recProgress);
            laserLen = GAME_WIDTH;
        }

        const lx = this.facingRight ? originX - 4 : originX - laserLen;

        ctx.save();

        // Wide outer glow
        ctx.globalAlpha = laserAlpha * pulse * 0.4;
        ctx.fillStyle = atkColor;
        ctx.shadowColor = atkColor;
        ctx.shadowBlur = 40;
        ctx.fillRect(lx, beamCenterY - 22, laserLen, 44);

        // Mid glow layer
        ctx.globalAlpha = laserAlpha * (0.5 + pulse * 0.5);
        ctx.fillStyle = '#ff5566';
        ctx.shadowBlur = 24;
        ctx.fillRect(lx, beamCenterY - 10, laserLen, 20);

        // White hot core
        ctx.globalAlpha = laserAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffd0d0';
        ctx.shadowBlur = 16;
        ctx.fillRect(lx, beamCenterY - 3, laserLen, 6);

        // Muzzle burst at origin
        ctx.globalAlpha = laserAlpha * (0.8 + pulse * 0.2);
        ctx.fillStyle = '#ffdddd';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(originX, beamCenterY, isActive ? 22 : 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }
}

// ===========================
// Background Rendering
// ===========================
function drawBackground(ctx) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, '#080820');
    sky.addColorStop(0.6, '#150828');
    sky.addColorStop(1, '#1a0520');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid overlay
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke();
    }

    // Distant city buildings
    const buildings = [
        { x: 50,   w: 100, h: 280 },
        { x: 180,  w: 70,  h: 200 },
        { x: 280,  w: 160, h: 380 },
        { x: 500,  w: 90,  h: 250 },
        { x: 620,  w: 50,  h: 180 },
        { x: 700,  w: 180, h: 420 },
        { x: 920,  w: 120, h: 300 },
        { x: 1070, w: 80,  h: 220 },
        { x: 1170, w: 100, h: 350 }
    ];

    for (const b of buildings) {
        const bY = GROUND_Y - b.h;
        // Building body
        ctx.fillStyle = '#0c0818';
        ctx.fillRect(b.x, bY, b.w, b.h);
        // Window lights
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        for (let wy = bY + 15; wy < GROUND_Y - 20; wy += 25) {
            for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 18) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(wx, wy, 8, 10);
                }
            }
        }
    }

    // Neon signs (pulsing)
    const t = Date.now() / 1000;
    ctx.fillStyle = `rgba(255, 0, 102, ${0.4 + Math.sin(t * 2) * 0.2})`;
    ctx.fillRect(310, GROUND_Y - 350, 12, 80);
    ctx.fillStyle = `rgba(0, 240, 255, ${0.4 + Math.sin(t * 3) * 0.2})`;
    ctx.fillRect(730, GROUND_Y - 390, 80, 15);
    ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(t * 1.5) * 0.15})`;
    ctx.fillRect(940, GROUND_Y - 270, 60, 12);

    // Ground / Floor
    const floor = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    floor.addColorStop(0, '#2a0a2a');
    floor.addColorStop(1, '#050010');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, FLOOR_HEIGHT);

    // Floor line
    ctx.strokeStyle = '#ff0066';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(GAME_WIDTH, GROUND_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Floor perspective grid
    ctx.strokeStyle = 'rgba(255, 0, 102, 0.25)';
    ctx.lineWidth = 1;
    const scrollOffset = (Date.now() / 30) % 100;
    for (let i = -GAME_WIDTH; i < GAME_WIDTH * 2; i += 100) {
        ctx.beginPath();
        const xBase = i + scrollOffset;
        ctx.moveTo(xBase, GROUND_Y);
        ctx.lineTo(xBase + (xBase - GAME_WIDTH / 2) * 0.3, GAME_HEIGHT);
        ctx.stroke();
    }
}

// ===========================
// Collision Detection
// ===========================
function rectIntersect(r1, r2) {
    if (!r1 || !r2) return false;
    return !(r2.x > r1.x + r1.width ||
             r2.x + r2.width < r1.x ||
             r2.y > r1.y + r1.height ||
             r2.y + r2.height < r1.y);
}

function handleCollisions() {
    // Attack checks
    checkHit(p1, p2);
    checkHit(p2, p1);

    // Push fighters apart if overlapping
    const h1 = p1.getHurtbox();
    const h2 = p2.getHurtbox();
    if (rectIntersect(h1, h2)) {
        const overlapX = Math.min(h1.x + h1.width, h2.x + h2.width) - Math.max(h1.x, h2.x);
        if (overlapX > 0) {
            const push = overlapX / 2 + 1;
            if (p1.x < p2.x) {
                p1.x -= push;
                p2.x += push;
            } else {
                p1.x += push;
                p2.x -= push;
            }
        }
    }
}

function checkHit(attacker, defender) {
    if (attacker.state !== 'attacking' || attacker.hasHit) return;

    const hitbox = attacker.getHitbox();
    const hurtbox = defender.getHurtbox();

    if (rectIntersect(hitbox, hurtbox)) {
        attacker.hasHit = true;

        const atk = attacker.currentAttack;
        const dir = attacker.facingRight ? 1 : -1;

        defender.takeDamage(atk.damage, dir, atk.knockback, atk.hitstun);
        attacker.addSuperMeter(atk.superGain);

        // Hit particles at impact point
        const hitX = attacker.facingRight ? hitbox.x + hitbox.width * 0.8 : hitbox.x + hitbox.width * 0.2;
        const hitY = hitbox.y + hitbox.height / 2;
        spawnHitParticles(hitX, hitY, attacker.color);

        // Screen shake for heavy/super
        if (attacker.attackType === 'heavy') {
            screenShakeFrames = 8;
            screenShakeIntensity = 6;
        } else if (attacker.attackType === 'super') {
            screenShakeFrames = 15;
            screenShakeIntensity = 12;
        } else if (attacker.attackType === 'medium') {
            screenShakeFrames = 4;
            screenShakeIntensity = 3;
        }
    }
}

// ===========================
// HUD Updates (DOM)
// ===========================
const p1HealthEl = document.getElementById('p1-health');
const p2HealthEl = document.getElementById('p2-health');
const p1SuperEl = document.getElementById('p1-super');
const p2SuperEl = document.getElementById('p2-super');
const p1SuperBarEl = document.getElementById('p1-super-bar');
const p2SuperBarEl = document.getElementById('p2-super-bar');
const timerEl = document.getElementById('timer');
const p1NameEl = document.getElementById('p1-name');
const p2NameEl = document.getElementById('p2-name');
const menuOverlay = document.getElementById('menu-overlay');
const koOverlay = document.getElementById('ko-overlay');
const winnerTextEl = document.getElementById('winner-text');

function updateHUD() {
    // Health bars
    const p1Pct = (p1.hp / p1.maxHp) * 100;
    const p2Pct = (p2.hp / p2.maxHp) * 100;
    p1HealthEl.style.width = p1Pct + '%';
    p2HealthEl.style.width = p2Pct + '%';

    // Low health warning
    const p1BarBg = p1HealthEl.parentElement;
    const p2BarBg = p2HealthEl.parentElement;
    if (p1Pct <= 25) p1BarBg.classList.add('health-low');
    else p1BarBg.classList.remove('health-low');
    if (p2Pct <= 25) p2BarBg.classList.add('health-low');
    else p2BarBg.classList.remove('health-low');

    // Super meters
    p1SuperEl.style.width = (p1.superMeter / p1.maxSuper) * 100 + '%';
    p2SuperEl.style.width = (p2.superMeter / p2.maxSuper) * 100 + '%';

    // Super ready glow
    if (p1.superMeter >= p1.maxSuper) p1SuperBarEl.classList.add('super-full');
    else p1SuperBarEl.classList.remove('super-full');
    if (p2.superMeter >= p2.maxSuper) p2SuperBarEl.classList.add('super-full');
    else p2SuperBarEl.classList.remove('super-full');

    // Timer
    timerEl.textContent = timer;

    // Names
    p1NameEl.textContent = p1.name;
    p2NameEl.textContent = p2.name;

    // Check KO conditions
    if (p1.hp <= 0 || p2.hp <= 0 || timer <= 0) {
        gameState = 'KO';
        if (p1.hp > p2.hp) winner = p1;
        else if (p2.hp > p1.hp) winner = p2;
        else winner = null;
        showKOScreen();
    }
}

function updateTimer() {
    const now = Date.now();
    if (now - lastTimerUpdate >= 1000) {
        timer--;
        if (timer < 0) timer = 0;
        lastTimerUpdate = now;
    }
}

// ===========================
// Overlay Management
// ===========================
function showMenu() {
    menuOverlay.classList.add('active');
    koOverlay.classList.remove('active');
}

function hideOverlays() {
    menuOverlay.classList.remove('active');
    koOverlay.classList.remove('active');
}

function showKOScreen() {
    koOverlay.classList.add('active');
    if (winner) {
        winnerTextEl.textContent = `${winner.name} WINS!`;
        winnerTextEl.className = 'winner-text ' + (winner.isPlayer1 ? 'p1-win' : 'p2-win');
    } else {
        winnerTextEl.textContent = 'DRAW';
        winnerTextEl.className = 'winner-text draw-result';
    }
}

// ===========================
// Game Lifecycle
// ===========================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let p1, p2;

function initFighters() {
    p1 = new Fighter(300, '#00f0ff', 'CYBER', true);
    p2 = new Fighter(900, '#ff0066', 'NEON', false);
}

function resetGame() {
    initFighters();
    timer = 99;
    lastTimerUpdate = Date.now();
    particles = [];
    screenShakeFrames = 0;
    superFlashFrames = 0;
    winner = null;

    // Reset HUD visuals
    p1HealthEl.style.width = '100%';
    p2HealthEl.style.width = '100%';
    p1SuperEl.style.width = '0%';
    p2SuperEl.style.width = '0%';
    p1SuperBarEl.classList.remove('super-full');
    p2SuperBarEl.classList.remove('super-full');
    timerEl.textContent = '99';
}

function startGame() {
    resetGame();
    gameState = 'FIGHTING';
    hideOverlays();
}

// ===========================
// Main Game Loop
// ===========================
function gameLoop() {
    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();

    // Screen shake
    if (screenShakeFrames > 0) {
        screenShakeFrames--;
        const dx = (Math.random() - 0.5) * screenShakeIntensity;
        const dy = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(dx, dy);
    }

    // Background (always drawn)
    drawBackground(ctx);

    // Game logic (only during FIGHTING)
    if (gameState === 'FIGHTING') {
        p1.update(p2);
        p2.update(p1);
        handleCollisions();
        updateParticles();
        updateTimer();
        updateHUD();
    }

    // Draw fighters
    if (p1 && p2) {
        // Draw the attacking fighter on top
        if (p1.state === 'attacking') {
            p2.draw(ctx);
            p1.draw(ctx);
        } else {
            p1.draw(ctx);
            p2.draw(ctx);
        }
    }

    // Particles
    drawParticles(ctx);

    ctx.restore();

    // Super flash overlay
    if (superFlashFrames > 0) {
        superFlashFrames--;
        ctx.fillStyle = `rgba(255, 255, 255, ${superFlashFrames / 12})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Clear justPressed at end of frame
    clearJustPressed();

    requestAnimationFrame(gameLoop);
}

// ===========================
// Initialization
// ===========================
initFighters();
showMenu();
requestAnimationFrame(gameLoop);
