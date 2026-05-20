export const MathUtils = {
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    randomBetween: (min, max) => Math.random() * (max - min) + min,
    lerp: (start, end, amt) => (1 - amt) * start + amt * end,
    clamp: (val, min, max) => Math.min(Math.max(val, min), max)
};

export const CONFIG = {
    PLAYER_SPEED: 0.15,
    PLAYER_RADIUS: 14,
    PLAYER_MAX_HEALTH: 100,

    BASE_FIRE_RATE: 150,
    BASE_DAMAGE: 10,
    PROJECTILE_SPEED: 12,

    COLORS: {
        player: '#06b6d4',
        playerGlow: 'rgba(6, 182, 212, 0.5)',
        enemy: '#ef4444',
        enemyElite: '#a855f7',
        projectile: '#fde047',
        xp: '#10b981'
    }
};