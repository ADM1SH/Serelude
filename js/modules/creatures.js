// js/modules/creatures.js
import { g } from './game.js';
import { getTile } from './world.js';
import { player } from './player.js';

export function initCreatures(groundLevelY) {
    g.creatures = [];
    // Bunnies
    for (let i = 0; i < 3; i++) {
        const spawnX = Math.random() * g.worldWidth * g.TILE_SIZE;
        g.creatures.push({
            type: 'bunny',
            x: spawnX, y: groundLevelY * g.TILE_SIZE - g.TILE_SIZE * 1.5,
            width: g.TILE_SIZE, height: g.TILE_SIZE * 1.5,
            vx: 0, vy: 0,
            onGround: false,
            direction: Math.random() < 0.5 ? 'left' : 'right',
            aiTimer: Math.random() * 100 + 50,
            dropCooldown: 0
        });
    }
    // Birds
    for (let i = 0; i < 5; i++) {
        g.creatures.push({
            type: 'bird',
            x: Math.random() * g.worldWidth * g.TILE_SIZE,
            y: Math.random() * g.c.height * 0.4,
            width: g.TILE_SIZE * 0.6, height: g.TILE_SIZE * 0.6,
            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
            direction: 'right',
            aiTimer: Math.random() * 100
        });
    }
    // Squirrels
    for (let i = 0; i < 4; i++) {
        const spawnX = Math.random() * g.worldWidth * g.TILE_SIZE;
        g.creatures.push({
            type: 'squirrel',
            x: spawnX, y: groundLevelY * g.TILE_SIZE - g.TILE_SIZE,
            width: g.TILE_SIZE * 0.8, height: g.TILE_SIZE,
            vx: 0, vy: 0,
            onGround: false,
            direction: Math.random() < 0.5 ? 'left' : 'right',
            aiTimer: Math.random() * 80 + 40,
            climbing: false,
            climbTargetY: null
        });
    }
    // Fish
    for (let i = 0; i < 8; i++) {
        const pondStartX = Math.floor(g.worldWidth * 0.3);
        const pondEndX = Math.floor(g.worldWidth * 0.4);
        const pondTopY = groundLevelY; 
        const pondBottomY = groundLevelY + 10; 

        let spawnX, spawnY, tileX, tileY;
        let attempts = 0;
        do {
            spawnX = (Math.random() * (pondEndX - pondStartX) + pondStartX) * g.TILE_SIZE;
            spawnY = (Math.random() * (pondBottomY - pondTopY) + pondTopY) * g.TILE_SIZE;
            tileX = Math.floor(spawnX / g.TILE_SIZE);
            tileY = Math.floor(spawnY / g.TILE_SIZE);
            attempts++;
        } while (g.world[tileY]?.[tileX] !== 9 && attempts < 50);

        if (g.world[tileY]?.[tileX] === 9) {
            g.creatures.push({
                type: 'fish',
                x: spawnX, y: spawnY,
                width: g.TILE_SIZE, height: g.TILE_SIZE * 0.6,
                vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                direction: Math.random() < 0.5 ? 'left' : 'right',
                aiTimer: Math.random() * 100 + 50,
                life: 100
            });
        }
    }
    // Butterflies
    for (let i = 0; i < 5; i++) {
        const spawnX = Math.random() * g.worldWidth * g.TILE_SIZE;
        g.creatures.push({
            type: 'butterfly',
            x: spawnX, y: Math.random() * g.c.height * 0.5,
            width: g.TILE_SIZE * 0.5, height: g.TILE_SIZE * 0.5,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
            aiTimer: Math.random() * 100 + 50,
            color: Math.random() < 0.5 ? '#FFEB3B' : '#FF9800'
        });
    }
    // Fireflies
    for (let i = 0; i < 5; i++) {
        const spawnX = Math.random() * g.worldWidth * g.TILE_SIZE;
        g.creatures.push({
            type: 'firefly',
            x: spawnX, y: Math.random() * g.c.height * 0.5,
            width: g.TILE_SIZE * 0.3, height: g.TILE_SIZE * 0.3,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
            aiTimer: Math.random() * 100 + 50,
            alpha: 0.8,
            flicker: Math.random() * Math.PI * 2
        });
    }
}

export function updateCreatures(groundLevelY) {
    for (const creature of g.creatures) {
        if (creature.type === 'bunny') {
            creature.vy += 0.5 * g.gameSpeed;
            creature.y += creature.vy;

            const bunnyTileX = Math.floor((creature.x + creature.width / 2) / g.TILE_SIZE);
            const bunnyTileY = Math.floor((creature.y + creature.height / 2) / g.TILE_SIZE);
            const isBunnyInWater = getTile(bunnyTileX, bunnyTileY) === 9;
            
            if (isBunnyInWater) {
                creature.vy *= 0.6;
                creature.vx *= 0.7;
            }

            creature.aiTimer--;
            if (creature.aiTimer <= 0) {
                const action = Math.random();
                if (action < 0.4) {
                    if (creature.onGround || isBunnyInWater) {
                        creature.vy = -4;
                        creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 1 + 1) * g.gameSpeed;
                        creature.onGround = false;
                    }
                } else if (action < 0.7) {
                    creature.direction = creature.direction === 'left' ? 'right' : 'left';
                    creature.vx = 0;
                } else {
                    creature.vx = 0;
                }
                creature.aiTimer = Math.random() * 120 + 60;
            }

            if (creature.dropCooldown > 0) {
                creature.dropCooldown--;
            } else {
                const distToPlayer = Math.hypot(player.x - creature.x, player.y - creature.y);
                if (distToPlayer < g.TILE_SIZE * 4) {
                    g.hearts.push({ x: creature.x + creature.width / 2, y: creature.y, size: 10, life: 120, vy: -1 });
                    if (creature.onGround) {
                        creature.vy = -6;
                        creature.vx = player.x < creature.x ? 3 : -3;
                    }
                    creature.dropCooldown = 60;
                }
            }
        } else if (creature.type === 'bird') {
            creature.aiTimer--;
            if (creature.aiTimer <= 0) {
                creature.vx = (Math.random() - 0.5) * 2 * g.gameSpeed;
                creature.vy = (Math.random() - 0.5) * 2 * g.gameSpeed;
                creature.aiTimer = Math.random() * 100 + 50;
            }
            creature.x += creature.vx;
            creature.y += creature.vy;

            if (creature.vx < 0) creature.direction = 'left';
            else if (creature.vx > 0) creature.direction = 'right';

            if (creature.x < -creature.width) creature.x = g.worldWidth * g.TILE_SIZE;
            if (creature.x > g.worldWidth * g.TILE_SIZE) creature.x = -creature.width;
            if (creature.y < 0) creature.y = g.c.height * 0.4;
            if (creature.y > g.c.height * 0.4) creature.y = 0;

        } else if (creature.type === 'squirrel') {
            creature.vy += 0.5 * g.gameSpeed;
            creature.y += creature.vy;

            creature.aiTimer--;
            if (creature.aiTimer <= 0) {
                const action = Math.random();
                if (action < 0.3) {
                    creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 1 + 0.5) * g.gameSpeed;
                } else if (action < 0.6) {
                    const currentTileX = Math.floor((creature.x + creature.width / 2) / g.TILE_SIZE);
                    const currentTileY = Math.floor((creature.y + creature.height) / g.TILE_SIZE);
                    if (getTile(currentTileX, currentTileY) === 4 || getTile(currentTileX, currentTileY) === 14 || getTile(currentTileX, currentTileY) === 16) {
                        creature.climbing = true;
                        creature.climbTargetY = creature.y - (Math.random() * 3 + 2) * g.TILE_SIZE;
                        creature.vx = 0;
                    }
                } else {
                    creature.vx = 0;
                    creature.direction = creature.direction === 'left' ? 'right' : 'left';
                }
                creature.aiTimer = Math.random() * 80 + 40;
            }

            if (creature.climbing) {
                if (creature.y > creature.climbTargetY) {
                    creature.y -= 1 * g.gameSpeed;
                    creature.vy = 0;
                } else {
                    creature.climbing = false;
                    creature.vy = -2;
                }
            }

            creature.x += creature.vx;

        } else if (creature.type === 'fish') {
            creature.aiTimer--;
            if (creature.aiTimer <= 0) {
                creature.vx = (Math.random() - 0.5) * 0.5 * g.gameSpeed;
                creature.vy = (Math.random() - 0.5) * 0.5 * g.gameSpeed;
                creature.aiTimer = Math.random() * 100 + 50;
            }
            creature.x += creature.vx;
            creature.y += creature.vy;

            if (creature.vx < 0) creature.direction = 'left';
            else if (creature.vx > 0) creature.direction = 'right';

            const fishTileX = Math.floor((creature.x + creature.width / 2) / g.TILE_SIZE);
            const fishTileY = Math.floor((creature.y + creature.height / 2) / g.TILE_SIZE);
            const isFishInWater = getTile(fishTileX, fishTileY) === 9;

            if (!isFishInWater) {
                creature.life--;
                if (creature.life <= 0) {
                    g.creatures = g.creatures.filter(c => c.life > 0);
                }
                creature.vy += 0.2 * g.gameSpeed;
            } else {
                creature.life = 100;
            }

            const pondStartX = Math.floor(g.worldWidth * 0.3) * g.TILE_SIZE;
            const pondEndX = Math.floor(g.worldWidth * 0.4) * g.TILE_SIZE;
            const pondTopY = groundLevelY;
            const pondBottomY = groundLevelY + 4;

            if (creature.x < pondStartX) creature.x = pondStartX;
            if (creature.x + creature.width > pondEndX) creature.x = pondEndX - creature.width;
            if (creature.y < pondTopY) creature.y = pondTopY;
            if (creature.y + creature.height > pondBottomY) creature.y = pondBottomY - creature.height;

        } else if (creature.type === 'butterfly') {
            creature.aiTimer--;
            if (creature.aiTimer <= 0) {
                creature.vx = (Math.random() - 0.5) * 0.5 * g.gameSpeed;
                creature.vy = (Math.random() - 0.5) * 0.5 * g.gameSpeed;
                creature.aiTimer = Math.random() * 100 + 50;
            }
            creature.x += creature.vx;
            creature.y += creature.vy;

            if (creature.x < -creature.width) creature.x = g.worldWidth * g.TILE_SIZE;
            if (creature.x > g.worldWidth * g.TILE_SIZE) creature.x = -creature.width;
            if (creature.y < 0) creature.y = g.c.height * 0.5;
            if (creature.y > g.c.height * 0.5) creature.y = 0;

        } else if (creature.type === 'firefly') {
            creature.aiTimer--;
            if (creature.aiTimer <= 0) {
                creature.vx = (Math.random() - 0.5) * 0.3 * g.gameSpeed;
                creature.vy = (Math.random() - 0.5) * 0.3 * g.gameSpeed;
                creature.aiTimer = Math.random() * 100 + 50;
            }
            creature.x += creature.vx;
            creature.y += creature.vy;
            creature.flicker += 0.1;

            if (creature.x < -creature.width) creature.x = g.worldWidth * g.TILE_SIZE;
            if (creature.x > g.worldWidth * g.TILE_SIZE) creature.x = -creature.width;
            if (creature.y < 0) creature.y = g.c.height * 0.5;
            if (creature.y > g.c.height * 0.5) creature.y = 0;
        }
    }
}
