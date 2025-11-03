// js/modules/world.js
import { g } from './game.js';
import { player } from './player.js';
import { PerlinNoise } from './perlin.js';
import { initCreatures } from './creatures.js';

let biomeNoise;

export function initWorld() {
    g.world = [];
    biomeNoise = new PerlinNoise(Math.random());
    generateBiomeMap();

    for (let y = 0; y < g.worldHeight; y++) {
        g.world.push(new Array(g.worldWidth).fill(0));
    }

    const groundLevelY = Math.floor(g.worldHeight * 0.95);

    for (let y = 0; y < g.worldHeight; y++) {
        for (let x = 0; x < g.worldWidth; x++) {
            if (y === groundLevelY) {
                g.world[y][x] = 1;
            } else if (y > groundLevelY) {
                g.world[y][x] = 2;
            } else {
                g.world[y][x] = 0;
            }
        }
    }

    player.x = g.worldWidth * g.TILE_SIZE / 2;
    player.y = groundLevelY * g.TILE_SIZE - player.height;

    const pondStartX = Math.floor(g.worldWidth * 0.3);
    const pondEndX = Math.floor(g.worldWidth * 0.4);
    const pondTopY = groundLevelY;
    const pondBottomY = groundLevelY + 3;

    for (let y = pondTopY; y <= pondBottomY; y++) {
        for (let x = pondStartX; x <= pondEndX; x++) {
            if (y >= pondTopY && y < pondBottomY) {
                g.world[y][x] = 9;
            } else if (y >= pondBottomY) {
                g.world[y][x] = 2;
            }
        }
    }

    generateTrees(groundLevelY);
    generateFlowers(groundLevelY);
    initCreatures(groundLevelY);
}

function generateBiomeMap() {
    g.biomes = {};
    for (let x = 0; x < g.worldWidth; x++) {
        const noiseValue = biomeNoise.noise(x * 0.05, 0, 0);
        if (noiseValue < 0.3) {
            g.biomes[x] = 'forest';
        } else if (noiseValue < 0.6) {
            g.biomes[x] = 'cherry_blossom_forest';
        } else {
            g.biomes[x] = 'desert';
        }
    }
}

function generateTrees(groundLevelY) {
    let x = 5;
    while (x < g.worldWidth - 3) {
        const biome = g.biomes[x];
        if (g.world[groundLevelY][x] === 9) {
            x++;
            continue;
        }

        if (Math.random() < 0.1) {
            if (biome === 'forest') {
                if (Math.random() < 0.5) {
                    generateOakTree(x, groundLevelY);
                } else {
                    generateBirchTree(x, groundLevelY);
                }
            } else if (biome === 'cherry_blossom_forest') {
                generateCherryBlossomTree(x, groundLevelY);
            } else if (biome === 'desert') {
                generateCactus(x, groundLevelY);
            }
            x += Math.floor(Math.random() * 3) + 4;
        } else {
            x++;
        }
    }
}

function generateOakTree(x, groundLevelY) {
    const treeHeight = Math.floor(Math.random() * 4) + 4;
    const treeTopY = groundLevelY - treeHeight;

    for (let i = 1; i < treeHeight; i++) {
        g.world[groundLevelY - i][x] = 4;
    }

    for (let ly = -1; ly <= 1; ly++) {
        for (let lx = -1; lx <= 1; lx++) {
            g.world[treeTopY + ly][x + lx] = 5;
        }
    }
}

function generateBirchTree(x, groundLevelY) {
    const treeHeight = Math.floor(Math.random() * 5) + 5;
    const treeTopY = groundLevelY - treeHeight;

    for (let i = 1; i < treeHeight; i++) {
        g.world[groundLevelY - i][x] = 14;
    }

    for (let ly = -2; ly <= 0; ly++) {
        for (let lx = -2; lx <= 2; lx++) {
            if (Math.random() > 0.3)
                g.world[treeTopY + ly][x + lx] = 15;
        }
    }
}

function generateCherryBlossomTree(x, groundLevelY) {
    const treeHeight = Math.floor(Math.random() * 3) + 4;
    const treeTopY = groundLevelY - treeHeight;

    for (let i = 1; i < treeHeight; i++) {
        g.world[groundLevelY - i][x] = 16;
    }

    for (let ly = -2; ly <= 0; ly++) {
        for (let lx = -3; lx <= 3; lx++) {
            if (Math.random() > 0.2)
                g.world[treeTopY + ly][x + lx] = 17;
        }
    }
}

function generateCactus(x, groundLevelY) {
    const cactusHeight = Math.floor(Math.random() * 3) + 2;
    for (let i = 1; i <= cactusHeight; i++) {
        g.world[groundLevelY - i][x] = 18;
    }
}

function generateFlowers(groundLevelY) {
    let x = 1;
    while (x < g.worldWidth - 1) {
        if (g.world[groundLevelY][x] === 1 && g.world[groundLevelY - 1][x] === 0) {
            if (Math.random() < 0.08) {
                const clusterSize = Math.floor(Math.random() * 3) + 1;
                const flowerType = Math.floor(Math.random() * 3);

                for (let i = 0; i < clusterSize && (x + i) < g.worldWidth - 1; i++) {
                    if (g.world[groundLevelY][x+i] === 1 && g.world[groundLevelY - 1][x+i] === 0) {
                        if (flowerType === 0) {
                            g.world[groundLevelY - 1][x + i] = 6;
                            g.world[groundLevelY - 2][x + i] = 7;
                        } else if (flowerType === 1) {
                            g.world[groundLevelY - 1][x + i] = 10;
                            g.world[groundLevelY - 2][x + i] = 11;
                        } else if (flowerType === 2) {
                            g.world[groundLevelY - 1][x + i] = 12;
                            g.world[groundLevelY - 2][x + i] = 13;
                        }
                    }
                }
                x += clusterSize + Math.floor(Math.random() * 5) + 3;
            }
        }
        x++;
    }
}

export function getTile(x, y) {
    if (x >= 0 && x < g.worldWidth && y >= 0 && y < g.worldHeight) {
        return g.world[y][x];
    }
    return undefined;
}

export function setTile(x, y, type) {
    if (x >= 0 && x < g.worldWidth && y >= 0 && y < g.worldHeight) {
        g.world[y][x] = type;
    }
}

export function isSolid(tileType) {
    return tileType === 1 || tileType === 2 || tileType === 3;
}
