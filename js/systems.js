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
        const rand = Math.random();
        if (timeMS > 30000 && rand < 0.3) {
            type = 'fast';
        }
        if (timeMS > 60000 && rand > 0.8) {
            type = 'heavy';
        }

        game.enemies.push(new game.Enemy(x, y, type));
    }
}

export class UpgradeManager {
    constructor() {
        this.availableUpgrades = [
            { id: 'multishot', title: 'Twin Link', desc: 'Fires an additional projectile.', color: 'text-yellow-400' },
            { id: 'firerate', title: 'Overclock', desc: 'Increases firing speed by 20%.', color: 'text-cyan-400' },
            { id: 'damage', title: 'Plasma Core', desc: 'Increases base damage by 25%.', color: 'text-red-400' },
            { id: 'speed', title: 'Thruster Mod', desc: 'Increases ship agility.', color: 'text-blue-400' },
            { id: 'heal', title: 'Nano-Repair', desc: 'Restores 50% Integrity.', color: 'text-green-400' }
        ];
    }

    getUpgrades() {
        const shuffled = [...this.availableUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    applyUpgrade(id, player) {
        switch(id) {
            case 'multishot':
                player.stats.multiShot += 1;
                break;
            case 'firerate':
                player.stats.fireRate *= 0.8;
                break;
            case 'damage':
                player.stats.damage *= 1.25;
                break;
            case 'speed':
                player.stats.speedScale *= 1.2;
                break;
            case 'heal':
                player.health = Math.min(player.maxHealth, player.health + (player.maxHealth * 0.5));
                document.getElementById('healthBar').style.width = `${(player.health / player.maxHealth) * 100}%`;
                break;
        }
    }
}