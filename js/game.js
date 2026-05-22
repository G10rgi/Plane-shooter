import { MathUtils, CONFIG } from './math.js';
import { Player, Projectile, Particle, Enemy, XPGem, FloatingText } from './entities.js';
import { EnemySpawner, UpgradeManager } from './systems.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        this.spawner = new EnemySpawner(window.innerWidth, window.innerHeight);
        this.upgrades = new UpgradeManager();
        
        this.isRunning = false;
        this.isPaused = false;
        this.isCountingDown = false;
        
        this.lastTime = 0;
        this.gameTime = 0; 
        this.slowMoTimer = 0; 
        
        this.shakeAmount = 0;
        this.score = 0;
        
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 20;
        this.currentChoices = []; 
        this.currentMode = 'standard'; 
        this.currentSkin = 0; 
        
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, isDown: false };
        this.isTouch = false;
        
        this.Enemy = Enemy;
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => {
            this.resize();
            this.spawner.width = this.canvas.width;
            this.spawner.height = this.canvas.height;
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', () => this.mouse.isDown = true);
        window.addEventListener('mouseup', () => this.mouse.isDown = false);

        window.addEventListener('touchstart', (e) => {
            this.isTouch = true;
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY - 100; 
            this.mouse.isDown = true;
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY - 100; 
            e.preventDefault(); 
        }, { passive: false });
        window.addEventListener('touchend', () => { this.mouse.isDown = false; });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRunning && !this.isCountingDown && document.getElementById('upgradeScreen').classList.contains('hidden')) {
                this.togglePause();
            }

            if (this.isPaused && !document.getElementById('upgradeScreen').classList.contains('hidden')) {
                if (e.key === '1' && this.currentChoices.length >= 1) this.selectUpgrade(0);
                if (e.key === '2' && this.currentChoices.length >= 2) this.selectUpgrade(1);
                if (e.key === '3' && this.currentChoices.length >= 3) this.selectUpgrade(2);
            }
        });
        
        document.getElementById('btnStandard').addEventListener('click', () => this.start('standard'));
        document.getElementById('btnHardcore').addEventListener('click', () => this.start('hardcore'));
        
        document.getElementById('restartBtn').addEventListener('click', () => this.start(this.currentMode));
        document.getElementById('homeBtn').addEventListener('click', () => this.goHome());

        document.getElementById('hudPauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeWithCountdown());
        document.getElementById('pauseHomeBtn').addEventListener('click', () => this.goHome());

        const skinButtons = document.querySelectorAll('.skin-btn');
        skinButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                skinButtons.forEach(b => {
                    b.classList.remove(b.dataset.color);
                    b.classList.add('border-transparent');
                    b.classList.remove('shadow-[0_0_15px_rgba(6,182,212,0.6)]'); 
                });
                
                const clicked = e.currentTarget;
                clicked.classList.remove('border-transparent');
                clicked.classList.add(clicked.dataset.color);
                
                this.currentSkin = parseInt(clicked.dataset.skin);
            });
        });
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeWithCountdown();
        } else {
            this.isPaused = true;
            document.getElementById('pauseScreen').classList.remove('hidden');
        }
    }

    resumeWithCountdown() {
        document.getElementById('pauseScreen').classList.add('hidden');
        
        this.isCountingDown = true;
        const cdScreen = document.getElementById('countdownScreen');
        const cdText = document.getElementById('countdownText');
        cdScreen.classList.remove('hidden');
        
        this.mouse.x = this.player.x;
        this.mouse.y = this.player.y;

        let count = 2;
        cdText.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                cdText.innerText = count;
            } else if (count === 0) {
                cdText.innerText = 'GO!';
            } else {
                clearInterval(interval);
                cdScreen.classList.add('hidden');
                this.isCountingDown = false;
                this.isPaused = false;
                
                requestAnimationFrame((time) => {
                    this.lastTime = time;
                    this.loop(time);
                });
            }
        }, 800); 
    }

    goHome() {
        this.isRunning = false;
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
        
        this.ctx.fillStyle = '#0f172a'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    start(mode = 'standard') {
        this.currentMode = mode;

        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('upgradeScreen').classList.add('hidden'); 
        document.getElementById('pauseScreen').classList.add('hidden'); 
        document.getElementById('hud').classList.remove('hidden');
        
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.currentSkin);
        
        if (mode === 'hardcore') {
            this.player.health = 1;
            this.player.maxHealth = 1;
        }

        this.mouse.x = this.canvas.width / 2;
        this.mouse.y = this.canvas.height / 2;

        this.projectiles = [];
        this.particles = [];
        this.enemies = [];
        this.gems = [];
        this.floatingTexts = [];
        
        this.score = 0;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 20;
        this.updateHUD();
        
        this.isRunning = true;
        this.isPaused = false;
        this.isCountingDown = false;
        this.gameTime = 0; 
        this.slowMoTimer = 0; 

        requestAnimationFrame((time) => {
            this.lastTime = time;
            this.loop(time);
        });
    }

    triggerShake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }
    
    spawnParticles(x, y, count, color, speedScale = 1) {
        for(let i=0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 * speedScale;
            this.particles.push(new Particle(
                x, y, 
                Math.cos(angle) * speed, Math.sin(angle) * speed, 
                Math.random() * 3 + 1, color, Math.random() * 20 + 20, true
            ));
        }
    }

    damagePlayer(amount) {
        if (!this.isRunning) return; 

        this.player.health -= amount;
        this.triggerShake(10);
        
        const overlay = document.getElementById('damageOverlay');
        overlay.style.opacity = '0.4';
        setTimeout(() => overlay.style.opacity = '0', 100);

        document.getElementById('healthBar').style.width = `${Math.max(0, (this.player.health / this.player.maxHealth) * 100)}%`;

        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    gainXP(amount) {
        if (!this.isRunning) return; 

        if (this.currentMode === 'hardcore') amount *= 2;

        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.levelUp();
        }
        document.getElementById('xpBar').style.width = `${(this.xp / this.xpToNextLevel) * 100}%`;
    }

    levelUp() {
        if (!this.isRunning) return; 

        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        document.getElementById('levelDisplay').innerText = this.level;
        
        this.isPaused = true;
        const upgradeScreen = document.getElementById('upgradeScreen');
        const container = document.getElementById('upgradeCards');
        container.innerHTML = ''; 
        
        this.currentChoices = this.upgrades.getUpgrades(this.currentMode);
        
        this.currentChoices.forEach((choice, index) => {
            const card = document.createElement('div');
            card.className = 'upgrade-card p-6 rounded-lg text-center relative';
            card.innerHTML = `
                <div class="absolute top-2 left-2 bg-gray-800 text-gray-400 font-mono text-xs px-2 py-1 rounded border border-gray-600">[${index + 1}]</div>
                <h3 class="text-xl font-bold mb-2 ${choice.color}">${choice.title}</h3>
                <p class="text-sm text-gray-300">${choice.desc}</p>
            `;
            card.onclick = () => this.selectUpgrade(index);
            container.appendChild(card);
        });
        
        upgradeScreen.classList.remove('hidden');
    }

    selectUpgrade(index) {
        const choice = this.currentChoices[index];
        if (!choice) return;

        this.upgrades.applyUpgrade(choice.id, this.player);
        
        document.getElementById('upgradeScreen').classList.add('hidden');
        this.isPaused = false;
        
        this.mouse.x = this.player.x;
        this.mouse.y = this.player.y;
        this.slowMoTimer = 3000; 

        requestAnimationFrame((time) => {
            this.lastTime = time;
            this.loop(time);
        });
    }

    updateHUD() {
        document.getElementById('scoreDisplay').innerText = this.score;
        document.getElementById('levelDisplay').innerText = this.level;
        document.getElementById('xpBar').style.width = `${(this.xp / this.xpToNextLevel) * 100}%`;
        document.getElementById('healthBar').style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        const timeAlive = Math.floor(this.gameTime / 1000);
        const mins = String(Math.floor(timeAlive / 60)).padStart(2, '0');
        const secs = String(timeAlive % 60).padStart(2, '0');
        
        document.getElementById('finalTime').innerText = `${mins}:${secs}`;
        document.getElementById('finalScore').innerText = this.score;
    }
    
    loop(currentTime) {
        if (!this.isRunning || this.isPaused || this.isCountingDown) return;
        
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame((time) => this.loop(time));
    }
    
    update(dt) {
        let gameDt = dt;
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt * 1000;
            gameDt = dt * 0.15; 
        }

        this.gameTime += gameDt * 1000;
        
        const seconds = Math.floor(this.gameTime / 1000);
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        document.getElementById('timeDisplay').innerText = `${mins}:${secs}`;

        this.spawner.update(gameDt, this.gameTime, this);
        
        const shouldStopToShoot = this.mouse.isDown && !this.isTouch;
        this.player.update(this.mouse.x, this.mouse.y, dt, shouldStopToShoot);
        
        if (this.mouse.isDown && this.gameTime - this.player.lastShotTime > this.player.stats.fireRate) {
            const spread = 0.15;
            const startAngle = this.player.angle - (spread * (this.player.stats.multiShot - 1)) / 2;
            const currentProjSpeed = this.slowMoTimer > 0 ? CONFIG.PROJECTILE_SPEED * 1.8 : CONFIG.PROJECTILE_SPEED;

            for(let i = 0; i < this.player.stats.multiShot; i++) {
                const angle = startAngle + (i * spread);
                const tipX = this.player.x + Math.cos(this.player.angle) * 15;
                const tipY = this.player.y + Math.sin(this.player.angle) * 15;
                
                const isCrit = Math.random() < this.player.stats.critChance;
                const finalDamage = isCrit ? this.player.stats.damage * 2 : this.player.stats.damage;
                const bulletColor = isCrit ? '#a855f7' : CONFIG.COLORS.projectile;

                this.projectiles.push(new Projectile(
                    tipX, tipY, angle, currentProjSpeed, finalDamage, bulletColor, false
                ));
                this.projectiles[this.projectiles.length - 1].isCrit = isCrit;
            }
            this.player.lastShotTime = this.gameTime;
            this.triggerShake(1.5);
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            
            p.update(p.isEnemy ? gameDt : dt);
            
            if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height || p.markedForDeletion) {
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.isEnemy) {
                if (MathUtils.distance(p.x, p.y, this.player.x, this.player.y) < p.radius + this.player.radius) {
                    this.damagePlayer(p.damage);
                    p.markedForDeletion = true;
                    this.spawnParticles(p.x, p.y, 5, p.color, 0.5);
                }
            } else {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const e = this.enemies[j];
                    if (MathUtils.distance(p.x, p.y, e.x, e.y) < p.radius + e.radius) {
                        
                        let isProtected = false;
                        if (e.type !== 'shield') {
                            isProtected = this.enemies.some(drone => 
                                drone.type === 'shield' && 
                                !drone.markedForDeletion && 
                                MathUtils.distance(e.x, e.y, drone.x, drone.y) <= 60 
                            );
                        }

                        if (isProtected) {
                            p.markedForDeletion = true;
                            this.spawnParticles(p.x, p.y, 3, '#2dd4bf', 0.5); 
                            this.floatingTexts.push(new FloatingText(e.x, e.y - 15, "BLOCKED", '#2dd4bf', false));
                        } else {
                            e.takeDamage(p.damage);
                            p.markedForDeletion = true;
                            this.spawnParticles(p.x, p.y, 5, p.color, 0.5); 
                            
                            const textColor = p.isCrit ? '#a855f7' : '#ffffff';
                            this.floatingTexts.push(new FloatingText(e.x, e.y - 15, Math.floor(p.damage), textColor, p.isCrit));
                        }
                        break;
                    }
                }
            }
        }

        const activeEnemyBullets = this.projectiles.filter(p => p.isEnemy).length;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            
            e.update(this.player.x, this.player.y, gameDt, this.enemies);
            
            if (e.type === 'shooter') {
                if (!e.isCharging && this.gameTime - e.lastShotTime > e.fireRate) {
                    if (activeEnemyBullets < 30) {
                        e.isCharging = true;
                        e.chargeProgress = 0;
                        e.chargeStartTime = this.gameTime;
                        e.fireRate = 3000 + Math.random() * 1000; 
                    }
                }

                if (e.isCharging) {
                    let chargeTime = this.gameTime - e.chargeStartTime;
                    e.chargeProgress = Math.min(1, chargeTime / 1000); 
                    
                    if (chargeTime >= 1000) { 
                        const angleToPlayer = MathUtils.angle(e.x, e.y, this.player.x, this.player.y);
                        this.projectiles.push(new Projectile(e.x, e.y, angleToPlayer, 3.5, 15, '#ef4444', true));
                        e.lastShotTime = this.gameTime;
                        e.isCharging = false;
                        e.chargeProgress = 0;
                    }
                }
            }
            
            if (MathUtils.distance(e.x, e.y, this.player.x, this.player.y) < e.radius + this.player.radius) {
                this.damagePlayer(15);
                e.markedForDeletion = true; 
            }

            if (e.markedForDeletion) {
                this.spawnParticles(e.x, e.y, 15, e.color, 2); 
                this.triggerShake(3);
                this.score += 10;
                document.getElementById('scoreDisplay').innerText = this.score;
                
                this.gems.push(new XPGem(e.x, e.y, e.xpValue));
                this.enemies.splice(i, 1);
            }
        }

        for (let i = this.gems.length - 1; i >= 0; i--) {
            const g = this.gems[i];
            g.update(this.player.x, this.player.y, gameDt); 
            
            if (MathUtils.distance(g.x, g.y, this.player.x, this.player.y) < g.radius + this.player.radius) {
                this.gainXP(g.value);
                this.spawnParticles(g.x, g.y, 3, g.color, 0.3);
                this.gems.splice(i, 1);
            }
        }

        this.floatingTexts = this.floatingTexts.filter(t => {
            t.update(gameDt); 
            return t.alpha > 0;
        });

        this.particles = this.particles.filter(p => {
            p.update(gameDt); 
            return p.alpha > 0;
        });
        
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }
    }
    
    draw() {
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        if (this.shakeAmount > 0) {
            const dx = (Math.random() - 0.5) * this.shakeAmount;
            const dy = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(dx, dy);
        }
        
        this.gems.forEach(g => g.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.player.draw(this.ctx);
        this.floatingTexts.forEach(t => t.draw(this.ctx));
        
        if (this.slowMoTimer > 0) {
            this.ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = 'bold 20px Rajdhani';
            this.ctx.fillStyle = `rgba(6, 182, 212, ${Math.min(1, this.slowMoTimer / 1000)})`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText("TACTICAL OVERDRIVE", this.player.x, this.player.y + 45);
        }
        
        this.ctx.restore();
    }
}

window.onload = () => {
    window.game = new GameEngine();
};