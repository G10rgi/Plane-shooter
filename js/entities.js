import { MathUtils, CONFIG } from './math.js';

export class Particle {
    constructor(x, y, vx, vy, radius, color, life, glow = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.alpha = 1;
        this.lifeDecay = 1 / life;
        this.glow = glow;
    }
    
    update(dt) {
        this.x += this.vx * (dt * 60);
        this.y += this.vy * (dt * 60);
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.alpha -= this.lifeDecay * (dt * 60);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.radius), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        if(this.glow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        ctx.fill();
        ctx.restore();
    }
}

export class Projectile {
    constructor(x, y, angle, speed, damage, color, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 4;
        this.damage = damage;
        this.color = color;
        this.markedForDeletion = false;
        this.isCrit = false;
        this.isEnemy = isEnemy; 
    }

    update(dt) {
        this.x += this.vx * (dt * 60);
        this.y += this.vy * (dt * 60);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#fff';
        
        if (this.isEnemy) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.roundRect(-8, -2, 16, 4, 2);
            ctx.fill();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.roundRect(-10, -4, 20, 8, 4);
            ctx.fill();
        }
        ctx.restore();
    }
}

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.PLAYER_RADIUS;
        this.angle = 0;
        this.health = CONFIG.PLAYER_MAX_HEALTH;
        this.maxHealth = CONFIG.PLAYER_MAX_HEALTH;
        
        this.stats = {
            fireRate: CONFIG.BASE_FIRE_RATE,
            damage: CONFIG.BASE_DAMAGE,
            multiShot: 1,
            speedScale: 1,
            critChance: 0
        };
        
        this.lastShotTime = 0;
    }

    update(targetX, targetY, dt, isShooting = false) {
        if (!isShooting) {
            this.x = MathUtils.lerp(this.x, targetX, CONFIG.PLAYER_SPEED * this.stats.speedScale * (dt * 60));
            this.y = MathUtils.lerp(this.y, targetY, CONFIG.PLAYER_SPEED * this.stats.speedScale * (dt * 60));
        }
        this.angle = MathUtils.angle(this.x, this.y, targetX, targetY);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = CONFIG.COLORS.playerGlow;
        ctx.fillStyle = CONFIG.COLORS.player;
        
        ctx.beginPath();
        ctx.moveTo(15, 0); 
        ctx.lineTo(-10, 10); 
        ctx.lineTo(-5, 0); 
        ctx.lineTo(-10, -10); 
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Enemy {
    constructor(x, y, type = 'basic', multi = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        this.hitFlashTimer = 0;      
        this.lastShotTime = 0; 
        this.fireRate = 2500; 
        switch(type) {
            case 'fast':
                this.radius = 8;
                this.speed = 2.5;
                this.health = 15; 
                this.color = '#f97316'; 
                this.xpValue = Math.floor(2 * multi);
                break;
            case 'heavy':
                this.radius = 20;
                this.speed = 0.5;
                this.health = 80; 
                this.color = '#8b5cf6'; 
                this.xpValue = Math.floor(10 * multi);
                break;
            case 'elite': 
                this.radius = 16;
                this.speed = 1.6;
                this.health = 120; 
                this.color = '#eab308'; 
                this.xpValue = Math.floor(25 * multi);
                break;
            case 'shooter': 
                this.radius = 14;
                this.speed = 0.6; 
                this.health = 40;
                this.color = '#3b82f6'; 
                this.xpValue = Math.floor(8 * multi);
                break;
            default:
                this.radius = 12;
                this.speed = 1.2;
                this.health = 30; 
                this.color = CONFIG.COLORS.enemy; 
                this.xpValue = Math.floor(5 * multi);
        }
        this.maxHealth = this.health;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlashTimer = 5; 
        if (this.health <= 0) this.markedForDeletion = true;
    }

    update(playerX, playerY, dt) {
        const angle = MathUtils.angle(this.x, this.y, playerX, playerY);
        this.x += Math.cos(angle) * this.speed * (dt * 60);
        this.y += Math.sin(angle) * this.speed * (dt * 60);
        if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const angle = MathUtils.angle(0, 0, this.vx || 1, this.vy || 1);
        ctx.rotate(angle);

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
        
        ctx.beginPath();
        if (this.type === 'heavy') {
            ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else if (this.type === 'elite') {
            for(let i=0; i<6; i++) {
                ctx.lineTo(this.radius * Math.cos(i * Math.PI / 3), this.radius * Math.sin(i * Math.PI / 3));
            }
            ctx.closePath();
        } else if (this.type === 'shooter') {
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius, 0);
            ctx.closePath();
        } else if (this.type === 'fast') {
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius, this.radius);
            ctx.lineTo(-this.radius, -this.radius);
            ctx.closePath();
        } else {
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }
}

export class XPGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = Math.min(12, 4 + Math.sqrt(value));
        this.color = CONFIG.COLORS.xp;
        this.markedForDeletion = false;
        this.magnetized = false;
    }

    update(playerX, playerY, dt) {
        const dist = MathUtils.distance(this.x, this.y, playerX, playerY);
        if (dist < 100 || this.magnetized) {
            this.magnetized = true;
            const angle = MathUtils.angle(this.x, this.y, playerX, playerY);
            this.x += Math.cos(angle) * 8 * (dt * 60);
            this.y += Math.sin(angle) * 8 * (dt * 60);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x + this.radius, this.y);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x - this.radius, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

export class FloatingText {
    constructor(x, y, text, color = '#ffffff', isCrit = false) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.alpha = 1;
        this.vy = -1;
        this.isCrit = isCrit;
    }

    update(dt) {
        this.y += this.vy * (dt * 60);
        this.alpha -= 0.02 * (dt * 60);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.font = this.isCrit ? 'bold 22px Rajdhani' : 'bold 16px Rajdhani';
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}