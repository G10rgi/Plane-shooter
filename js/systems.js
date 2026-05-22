export class EnemySpawner {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.spawnTimer = 0;
    }

    update(dt, survivalTimeMS, game) {
        this.spawnTimer += dt * 1000;

        const pulseRate = survivalTimeMS > 180000 ? 1800 : 2500;
        const squadSize = survivalTimeMS > 180000 ? 4 : 3;

        if (this.spawnTimer > pulseRate) {
            this.spawnTimer = 0;
            for(let i = 0; i < squadSize; i++) {
                this.spawnEnemy(game, survivalTimeMS);
            }
        }
    }

    spawnEnemy(game, timeMS) {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -30 : this.width + 30;
            y = Math.random() * this.height;
        } else {
            x = Math.random() * this.width;
            y = Math.random() < 0.5 ? -30 : this.height + 30;
        }

        let type = 'basic';
        const rand = Math.random();
        
        const activeShooters = game.enemies.filter(e => e.type === 'shooter').length;
        const activeShields = game.enemies.filter(e => e.type === 'shield').length;

        if (timeMS < 120000) {
            if (rand < 0.20) type = 'fast';
            else if (rand < 0.30 && timeMS > 60000) type = 'heavy'; 
            else type = 'basic';
        } 
        else if (timeMS < 240000) {
            if (rand < 0.15 && activeShooters < 3) type = 'shooter'; 
            else if (rand < 0.35 && activeShields < 5) type = 'shield';
            else if (rand < 0.55) type = 'heavy';
            else if (rand < 0.75) type = 'fast';
            else type = 'basic';
        } 
        else {
            if (rand < 0.20) type = 'elite';
            else if (rand < 0.40 && activeShooters < 5) type = 'shooter'; 
            else if (rand < 0.60 && activeShields < 5) type = 'shield';
            else if (rand < 0.80) type = 'heavy';
            else type = 'fast'; 
        }

        game.enemies.push(new game.Enemy(x, y, type, timeMS));
    }
}

export class UpgradeManager {
    constructor() {
        this.availableUpgrades = [
            { id: 'multishot', title: 'Twin Link', desc: 'Fires an additional projectile.', color: 'text-yellow-400' },
            { id: 'firerate', title: 'Overclock', desc: 'Increases firing speed by 20%.', color: 'text-cyan-400' },
            { id: 'damage', title: 'Plasma Core', desc: 'Increases base damage by 25%.', color: 'text-red-400' },
            { id: 'crit', title: 'Targeting Matrix', desc: '+15% chance to deal DOUBLE damage.', color: 'text-purple-400' },
            { id: 'heal', title: 'Nano-Repair', desc: 'Restores 50% Integrity.', color: 'text-green-400' }
        ];
    }

    getUpgrades(gameMode) {
        let pool = this.availableUpgrades;
        if (gameMode === 'hardcore') {
            pool = pool.filter(u => u.id !== 'heal');
        }
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    applyUpgrade(id, player) {
        switch(id) {
            case 'multishot': player.stats.multiShot += 1; break;
            case 'firerate': player.stats.fireRate *= 0.80; break;
            case 'damage': player.stats.damage *= 1.25; break;
            case 'crit': player.stats.critChance += 0.15; break;
            case 'heal':
                player.health = Math.min(player.maxHealth, player.health + (player.maxHealth * 0.5));
                document.getElementById('healthBar').style.width = `${(player.health / player.maxHealth) * 100}%`;
                break;
        }
    }
}