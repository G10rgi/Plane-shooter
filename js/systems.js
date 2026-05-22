export class EnemySpawner {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.spawnTimer = 0;
        this.baseSpawnRate = 1000; 
    }

    update(dt, survivalTimeMS, game) {
        this.spawnTimer += dt * 1000;
        const currentSpawnRate = Math.max(200, this.baseSpawnRate - (survivalTimeMS * 0.005));

        if (this.spawnTimer > currentSpawnRate) {
            this.spawnTimer = 0;
            this.spawnEnemy(game, survivalTimeMS);
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
        let multi = 1 + (timeMS / 60000); 
        const rand = Math.random();
        
        if (timeMS < 45000) {
            if (rand < 0.1) type = 'fast';
            else type = 'basic';
        } else if (timeMS < 90000) {
            if (rand < 0.15) type = 'heavy';
            else if (rand < 0.35) type = 'fast';
            else type = 'basic';
        } else if (timeMS < 180000) {
            if (rand < 0.15) type = 'elite';
            else if (rand < 0.30) type = 'shooter'; 
            else if (rand < 0.50) type = 'heavy';
            else if (rand < 0.70) type = 'fast';
            else type = 'basic';
        } else {
            if (rand < 0.3) type = 'elite';
            else if (rand < 0.5) type = 'shooter';
            else if (rand < 0.7) type = 'heavy';
            else type = 'fast';
        }

        game.enemies.push(new game.Enemy(x, y, type, multi));
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
            case 'multishot':
                player.stats.multiShot += 1;
                break;
            case 'firerate':
                player.stats.fireRate *= 0.80; 
                break;
            case 'damage':
                player.stats.damage *= 1.25; 
                break;
            case 'crit': 
                player.stats.critChance += 0.15; 
                break;
            case 'heal':
                player.health = Math.min(player.maxHealth, player.health + (player.maxHealth * 0.5));
                document.getElementById('healthBar').style.width = `${(player.health / player.maxHealth) * 100}%`;
                break;
        }
    }
}