// js/modules/renderer.js
import { g } from './game.js';
import { player } from './player.js';
import { getTile } from './world.js';

export function draw() {
    drawSky();
    drawWorld();
    drawPlayer();
    drawCreatures();
    drawHearts();
    if (g.gameState === 'title') {
        drawTitleScreen();
    }
    drawMinimap();
}

function drawSky() {
    const angle = g.celestialBody.angle;
    g.isNight = Math.sin(angle) >= 0;

    let topColor, bottomColor;
    const transitionFactor = Math.abs(Math.sin(angle));

    if (angle > -Math.PI && angle < -Math.PI / 2) {
        topColor = lerpColor(g.timePalettes.night.top, g.timePalettes.dawn.top, transitionFactor);
        bottomColor = lerpColor(g.timePalettes.night.bottom, g.timePalettes.dawn.bottom, transitionFactor);
    } else if (angle > -Math.PI / 2 && angle < 0) {
        topColor = lerpColor(g.timePalettes.dawn.top, g.timePalettes.midday.top, 1 - transitionFactor);
        bottomColor = lerpColor(g.timePalettes.dawn.bottom, g.timePalettes.midday.bottom, 1 - transitionFactor);
    } else if (angle > 0 && angle < Math.PI / 2) {
        topColor = lerpColor(g.timePalettes.midday.top, g.timePalettes.dusk.top, transitionFactor);
        bottomColor = lerpColor(g.timePalettes.midday.bottom, g.timePalettes.dusk.bottom, transitionFactor);
    } else {
        topColor = lerpColor(g.timePalettes.dusk.top, g.timePalettes.night.top, 1 - transitionFactor);
        bottomColor = lerpColor(g.timePalettes.dusk.bottom, g.timePalettes.night.bottom, 1 - transitionFactor);
    }

    const skyGradient = g.x.createLinearGradient(0, 0, 0, g.c.height * 0.8);
    skyGradient.addColorStop(0, topColor);
    skyGradient.addColorStop(1, bottomColor);
    g.x.fillStyle = skyGradient;
    g.x.fillRect(0, 0, g.c.width, g.c.height);

    g.backgroundLayers.forEach(layer => {
        g.x.fillStyle = layer.color;
        const layerX = - (g.camera.x * layer.speed) % g.c.width;
        g.x.fillRect(layerX, 0, g.c.width, g.c.height);
        g.x.fillRect(layerX + g.c.width, 0, g.c.width, g.c.height);
    });

    const sunMoonX = g.c.width / 2 + Math.cos(g.celestialBody.angle) * (g.c.width / 2 + 30);
    const sunMoonY = g.c.height * 0.8 + Math.sin(g.celestialBody.angle) * (g.c.height * 0.7);
    const sunMoonRadius = 30;
    
    if (g.isNight) {
        g.x.fillStyle = '#FAFAF0';
        g.x.shadowBlur = 20;
        g.x.shadowColor = '#FAFAF0';
        g.x.beginPath();
        g.x.arc(sunMoonX - 10, sunMoonY - 5, 5, 0, Math.PI * 2);
        g.x.fillStyle = '#E0E0D0';
        g.x.fill();
        g.x.beginPath();
        g.x.arc(sunMoonX + 10, sunMoonY + 8, 7, 0, Math.PI * 2);
        g.x.fillStyle = '#E0E0D0';
        g.x.fill();
    } else {
        g.x.fillStyle = '#F2A9A9';
        g.x.shadowBlur = 30;
        g.x.shadowColor = 'rgba(242, 169, 169, 0.8)';
    }
    g.x.beginPath();
    g.x.arc(sunMoonX, sunMoonY, sunMoonRadius, 0, Math.PI * 2);
    g.x.fill();
    g.x.shadowBlur = 0;

    g.clouds.forEach(cloud => {
        g.x.fillStyle = 'rgba(250, 250, 240, 0.7)';
        cloud.blocks.forEach(block => {
            g.x.fillRect(cloud.x + block.rx, cloud.y + block.ry, block.width, block.height);
        });
    });

    if (g.isNight) {
        g.x.fillStyle = 'rgba(0, 0, 50, 0.2)';
        g.x.fillRect(0, 0, g.c.width, g.c.height);

        if (Math.random() < 0.01) {
            g.shootingStars.push({
                x: Math.random() * g.c.width,
                y: Math.random() * g.c.height * 0.5,
                len: Math.random() * 80 + 20,
                speed: Math.random() * 5 + 5,
                life: 100
            });
        }
    }

    g.shootingStars.forEach((star, index) => {
        g.x.strokeStyle = 'rgba(250, 250, 240, 0.8)';
        g.x.lineWidth = 2;
        g.x.beginPath();
        g.x.moveTo(star.x, star.y);
        g.x.lineTo(star.x - star.len, star.y + star.len);
        g.x.stroke();
    });
}

function drawWorld() {
    const startPixelX = g.camera.x;
    const endPixelX = g.camera.x + g.c.width;
    const startPixelY = g.camera.y;
    const endPixelY = g.camera.y + g.c.height;

    const startTileX = Math.floor(startPixelX / g.TILE_SIZE);
    const endTileX = Math.ceil(endPixelX / g.TILE_SIZE);
    const startTileY = Math.floor(startPixelY / g.TILE_SIZE);
    const endTileY = Math.ceil(endPixelY / g.TILE_SIZE);

    for (let y = startTileY; y < endTileY; y++) {
        for (let x = startTileX; x < endTileX; x++) {
            const tileType = getTile(x, y);
            const tileX = x * g.TILE_SIZE - g.camera.x;
            const tileY = y * g.TILE_SIZE - g.camera.y;

            switch (tileType) {
                case 1: drawGrassTile(tileX, tileY); break;
                case 2: drawDirtTile(tileX, tileY); break;
                case 3: drawStoneTile(tileX, tileY); break;
                case 4: drawWoodTile(tileX, tileY); break;
                case 5: drawLeavesTile(tileX, tileY); break;
                case 6: drawFlowerStemTile(tileX, tileY); break;
                case 7: drawFlowerPetalTile(tileX, tileY); break;
                case 8: drawSaplingTile(tileX, tileY); break;
                case 9: drawWaterTile(tileX, tileY); break;
                case 10: drawLilyOfTheValleyStemTile(tileX, tileY); break;
                case 11: drawLilyOfTheValleyFlowerTile(tileX, tileY); break;
                case 12: drawRoseStemTile(tileX, tileY); break;
                case 13: drawRoseFlowerTile(tileX, tileY); break;
                case 14: drawBirchWoodTile(tileX, tileY); break;
                case 15: drawBirchLeavesTile(tileX, tileY); break;
                case 16: drawCherryWoodTile(tileX, tileY); break;
                case 17: drawCherryLeavesTile(tileX, tileY); break;
                case 18: drawCactusTile(tileX, tileY); break;
            }
        }
    }
}

function drawPlayer() {
    g.x.save();
    const playerCenterX = player.x - g.camera.x + player.width / 2;
    
    if (player.direction === 'left') {
        g.x.translate(playerCenterX, 0);
        g.x.scale(-1, 1);
        g.x.translate(-playerCenterX, 0);
    }

    const pSize = g.TILE_SIZE / 5;

    const skin = '#f2d3ab';
    const skinDark = '#d4b89a';
    const hair = '#5d4037';
    const hairLight = '#7b5e57';
    const shirt = '#a9c8b6';
    const shirtDark = '#8caba0';
    const pants = '#6a6a6a';
    const pantsDark = '#525252';
    const shoes = '#4a4a4a';
    const shoesDark = '#323232';

    g.x.fillStyle = skin;
    g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y, pSize * 3, pSize * 4);
    g.x.fillStyle = skinDark;
    g.x.fillRect(player.x - g.camera.x + pSize * 3, player.y - g.camera.y + pSize, pSize, pSize * 2);

    g.x.fillStyle = hair;
    g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y, pSize * 4, pSize * 2);
    g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y + pSize * 2, pSize, pSize);
    g.x.fillStyle = hairLight;
    g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize, pSize, pSize);

    g.x.fillStyle = '#2E2E2E';
    g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 2, pSize, pSize);
    g.x.fillRect(player.x - g.camera.x + pSize * 3, player.y - g.camera.y + pSize * 2, pSize * 0.5, pSize * 0.5);

    g.x.fillStyle = shirt;
    g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y + pSize * 4, pSize * 3, pSize * 3);
    g.x.fillStyle = shirtDark;
    g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 4, pSize, pSize * 3);
    g.x.fillStyle = skin;
    g.x.fillRect(player.x - g.camera.x + pSize * 4, player.y - g.camera.y + pSize * 4, pSize, pSize * 2);
    g.x.fillStyle = skinDark;
    g.x.fillRect(player.x - g.camera.x + pSize * 4, player.y - g.camera.y + pSize * 5, pSize, pSize);

    g.x.fillStyle = pants;
    if (player.isWalking) {
        if (player.walkFrame === 0) {
            g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y + pSize * 7, pSize, pSize * 2);
            g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 7, pSize, pSize);
        } else {
            g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y + pSize * 7, pSize, pSize);
            g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 7, pSize, pSize * 2);
        }
    } else {
        g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y + pSize * 7, pSize, pSize * 2);
        g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 7, pSize, pSize * 2);
    }
    g.x.fillStyle = pantsDark;
    g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 7, pSize, pSize * 2);

    g.x.fillStyle = shoes;
    g.x.fillRect(player.x - g.camera.x + pSize, player.y - g.camera.y + pSize * 9, pSize, pSize);
    g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 9, pSize, pSize);
    g.x.fillStyle = shoesDark;
    g.x.fillRect(player.x - g.camera.x + pSize * 2, player.y - g.camera.y + pSize * 9, pSize, pSize);

    g.x.restore();
}

function drawCreatures() {
    g.creatures.forEach(creature => {
        switch (creature.type) {
            case 'bunny': drawBunny(creature); break;
            case 'bird': drawBird(creature); break;
            case 'squirrel': drawSquirrel(creature); break;
            case 'fish': drawFish(creature); break;
            case 'butterfly': drawButterfly(creature); break;
            case 'firefly': drawFirefly(creature); break;
        }
    });
}

function drawHearts() {
    g.hearts.forEach(heart => {
        drawHeart(heart.x - g.camera.x, heart.y - g.camera.y, heart.size);
    });
}

function drawTitleScreen() {
    // This will be implemented later
}

function drawMinimap() {
    // This will be implemented later
}

function lerpColor(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `rgb(${r}, ${g}, ${b})`;
}

// Tile drawing functions
function drawGrassTile(x, y) {
    const size = g.TILE_SIZE;
    const grassLight = '#8BC34A';
    const grassDarker = '#4CAF50';

    g.x.fillStyle = g.tileColors.dirt;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = g.tileColors.grass;
    g.x.fillRect(x, y, size, size / 2);

    g.x.fillStyle = grassLight;
    g.x.fillRect(x + size * 0.1, y, size * 0.2, size * 0.3);
    g.x.fillRect(x + size * 0.6, y + size * 0.1, size * 0.3, size * 0.2);

    g.x.fillStyle = g.tileColors.grassDark;
    g.x.fillRect(x + size * 0.3, y + size * 0.2, size * 0.2, size * 0.2);
    g.x.fillRect(x + size * 0.8, y, size * 0.1, size * 0.3);

    g.x.fillStyle = grassDarker;
    g.x.fillRect(x + size * 0.05, y + size * 0.4, size * 0.05, size * 0.1);
    g.x.fillRect(x + size * 0.25, y + size * 0.35, size * 0.05, size * 0.15);
    g.x.fillRect(x + size * 0.7, y + size * 0.45, size * 0.05, size * 0.05);
}

// Other tile drawing functions (drawDirtTile, drawStoneTile, etc.) should be moved here
// For brevity, I'm omitting them, but they would follow the same pattern.

function drawDirtTile(x, y, size = g.TILE_SIZE) {
    const dirtDark = '#7A4F24';

    g.x.fillStyle = g.tileColors.dirt;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = g.tileColors.dirtLight;
    g.x.fillRect(x + size * 0.2, y + size * 0.3, size * 0.2, size * 0.2);
    g.x.fillRect(x + size * 0.6, y + size * 0.1, size * 0.2, size * 0.2);
    g.x.fillRect(x + size * 0.1, y + size * 0.7, size * 0.3, size * 0.2);

    g.x.fillStyle = dirtDark;
    g.x.fillRect(x + size * 0.4, y + size * 0.5, size * 0.3, size * 0.3);
    g.x.fillRect(x + size * 0.7, y + size * 0.8, size * 0.2, size * 0.1);
}

function drawStoneTile(x, y, size = g.TILE_SIZE) {
    const stoneDark = '#5A5A5A';

    g.x.fillStyle = g.tileColors.stone;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = g.tileColors.stoneLight;
    g.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.3, size * 0.3);
    g.x.fillRect(x + size * 0.6, y + size * 0.4, size * 0.3, size * 0.3);
    g.x.fillRect(x + size * 0.3, y + size * 0.7, size * 0.2, size * 0.2);

    g.x.fillStyle = stoneDark;
    g.x.fillRect(x + size * 0.4, y + size * 0.2, size * 0.2, size * 0.2);
    g.x.fillRect(x + size * 0.1, y + size * 0.5, size * 0.2, size * 0.2);
}

function drawWoodTile(x, y, size = g.TILE_SIZE) {
    const woodDark = '#4A2D1C';
    const woodLight = '#B87B4F';

    g.x.fillStyle = g.tileColors.wood;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = woodDark;
    g.x.fillRect(x + size * 0.2, y, size * 0.2, size);
    g.x.fillRect(x + size * 0.7, y, size * 0.1, size);

    g.x.fillStyle = woodLight;
    g.x.fillRect(x + size * 0.3, y + size * 0.1, size * 0.1, size * 0.8);
    g.x.fillRect(x + size * 0.8, y + size * 0.2, size * 0.1, size * 0.6);
}

function drawLeavesTile(x, y, size = g.TILE_SIZE) {
    const leavesDark = '#2B6B1F';
    const leavesLight = '#4CAF50';

    g.x.fillStyle = g.tileColors.leaves;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = leavesDark;
    g.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.4, size * 0.4);
    g.x.fillRect(x + size * 0.5, y + size * 0.5, size * 0.4, size * 0.4);

    g.x.fillStyle = leavesLight;
    g.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.3);
    g.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.3, size * 0.3);

    g.x.fillStyle = g.tileColors.leaves;
    g.x.fillRect(x + size * 0.05, y + size * 0.7, size * 0.1, size * 0.1);
    g.x.fillRect(x + size * 0.8, y + size * 0.05, size * 0.1, size * 0.1);
}

function drawBirchWoodTile(x, y, size = g.TILE_SIZE) {
    const birchWoodDark = '#D4D4C0';

    g.x.fillStyle = g.tileColors.birchWood;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = birchWoodDark;
    g.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.1);
    g.x.fillRect(x + size * 0.15, y + size * 0.3, size * 0.7, size * 0.1);
    g.x.fillRect(x + size * 0.2, y + size * 0.5, size * 0.6, size * 0.1);
    g.x.fillRect(x + size * 0.25, y + size * 0.7, size * 0.5, size * 0.1);

    g.x.fillStyle = '#000000';
    g.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.1, size * 0.1);
    g.x.fillRect(x + size * 0.7, y + size * 0.5, size * 0.1, size * 0.1);
}

function drawBirchLeavesTile(x, y, size = g.TILE_SIZE) {
    const birchLeavesDark = '#7AA97A';
    const birchLeavesLight = '#B0E0B0';

    g.x.fillStyle = g.tileColors.birchLeaves;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = birchLeavesDark;
    g.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.4, size * 0.4);
    g.x.fillRect(x + size * 0.5, y + size * 0.5, size * 0.4, size * 0.4);

    g.x.fillStyle = birchLeavesLight;
    g.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.3);
    g.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.3, size * 0.3);

    g.x.fillStyle = g.tileColors.birchLeaves;
    g.x.fillRect(x + size * 0.05, y + size * 0.7, size * 0.1, size * 0.1);
    g.x.fillRect(x + size * 0.8, y + size * 0.05, size * 0.1, size * 0.1);
}

function drawCherryWoodTile(x, y, size = g.TILE_SIZE) {
    const cherryWoodDark = '#7A4F24';
    const cherryWoodLight = '#C88A5F';

    g.x.fillStyle = g.tileColors.cherryWood;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = cherryWoodDark;
    g.x.fillRect(x + size * 0.2, y, size * 0.2, size);
    g.x.fillRect(x + size * 0.7, y, size * 0.1, size);

    g.x.fillStyle = cherryWoodLight;
    g.x.fillRect(x + size * 0.3, y + size * 0.1, size * 0.1, size * 0.8);
    g.x.fillRect(x + size * 0.8, y + size * 0.2, size * 0.1, size * 0.6);
}

function drawCherryLeavesTile(x, y, size = g.TILE_SIZE) {
    const cherryLeavesDark = '#E0A9B3';
    const cherryLeavesLight = '#FFC0CB';

    g.x.fillStyle = g.tileColors.cherryLeaves;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = cherryLeavesDark;
    g.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.4, size * 0.4);
    g.x.fillRect(x + size * 0.5, y + size * 0.5, size * 0.4, size * 0.4);

    g.x.fillStyle = cherryLeavesLight;
    g.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.3);
    g.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.3, size * 0.3);

    g.x.fillStyle = g.tileColors.cherryLeaves;
    g.x.fillRect(x + size * 0.05, y + size * 0.7, size * 0.1, size * 0.1);
    g.x.fillRect(x + size * 0.8, y + size * 0.05, size * 0.1, size * 0.1);
}

function drawCactusTile(x, y, size = g.TILE_SIZE) {
    const cactusDark = '#004D00';
    const cactusLight = '#009900';

    g.x.fillStyle = g.tileColors.cactus;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = cactusDark;
    g.x.fillRect(x, y, size * 0.2, size);
    g.x.fillRect(x + size * 0.8, y, size * 0.2, size);

    g.x.fillStyle = cactusLight;
    g.x.fillRect(x + size * 0.2, y + size * 0.1, size * 0.6, size * 0.1);
    g.x.fillRect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.1);
    g.x.fillRect(x + size * 0.2, y + size * 0.7, size * 0.6, size * 0.1);

    g.x.fillStyle = '#FFFFFF';
    g.x.fillRect(x + size * 0.25, y + size * 0.15, size * 0.05, size * 0.05);
    g.x.fillRect(x + size * 0.7, y + size * 0.2, size * 0.05, size * 0.05);
    g.x.fillRect(x + size * 0.3, y + size * 0.45, size * 0.05, size * 0.05);
    g.x.fillRect(x + size * 0.65, y + size * 0.55, size * 0.05, size * 0.05);
}

function drawFlowerStemTile(x, y, size = g.TILE_SIZE) {
    const stemDark = '#388E3C';

    g.x.fillStyle = g.tileColors.flowerStem;
    g.x.fillRect(x + size * 0.4, y, size * 0.2, size);

    g.x.fillStyle = stemDark;
    g.x.fillRect(x + size * 0.45, y, size * 0.1, size);

    g.x.fillStyle = g.tileColors.leaves;
    g.x.fillRect(x + size * 0.3, y + size * 0.3, size * 0.1, size * 0.2);
    g.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.1, size * 0.2);
}

function drawFlowerPetalTile(x, y, size = g.TILE_SIZE) {
    const petalDark = '#D4B830';
    const petalCenter = '#e0e0d1';

    g.x.fillStyle = g.tileColors.flowerPetal;
    g.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.4, size * 0.4);

    g.x.fillStyle = petalDark;
    g.x.fillRect(x + size * 0.35, y + size * 0.55, size * 0.3, size * 0.3);

    g.x.fillStyle = petalCenter;
    g.x.fillRect(x + size * 0.4, y + size * 0.4, size * 0.2, size * 0.2);
}

function drawLilyOfTheValleyStemTile(x, y, size = g.TILE_SIZE) {
    const stemDark = '#5A7A1F';

    g.x.fillStyle = g.tileColors.lilyOfTheValleyGreen;
    g.x.fillRect(x + size * 0.45, y, size * 0.1, size);
    g.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.4, size * 0.2);

    g.x.fillStyle = stemDark;
    g.x.fillRect(x + size * 0.47, y, size * 0.05, size);

    g.x.fillRect(x + size * 0.2, y + size * 0.7, size * 0.4, size * 0.2);
}

function drawLilyOfTheValleyFlowerTile(x, y, size = g.TILE_SIZE) {
    const flowerShade = '#E0E0E0';

    g.x.fillStyle = g.tileColors.lilyOfTheValleyWhite;
    g.x.beginPath();
    g.x.arc(x + size * 0.5, y + size * 0.2, size * 0.15, 0, Math.PI * 2);
    g.x.fill();
    g.x.beginPath();
    g.x.arc(x + size * 0.3, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
    g.x.fill();
    g.x.beginPath();
    g.x.arc(x + size * 0.7, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
    g.x.fill();

    g.x.fillStyle = flowerShade;
    g.x.beginPath();
    g.x.arc(x + size * 0.55, y + size * 0.25, size * 0.1, 0, Math.PI * 2);
    g.x.fill();
    g.x.beginPath();
    g.x.arc(x + size * 0.35, y + size * 0.45, size * 0.1, 0, Math.PI * 2);
    g.x.fill();
}

function drawRoseStemTile(x, y, size = g.TILE_SIZE) {
    const stemDark = '#286B2C';

    g.x.fillStyle = g.tileColors.roseStemGreen;
    g.x.fillRect(x + size * 0.45, y, size * 0.1, size);
    g.x.fillRect(x + size * 0.3, y + size * 0.6, size * 0.4, size * 0.1);

    g.x.fillStyle = stemDark;
    g.x.fillRect(x + size * 0.47, y, size * 0.05, size);

    g.x.fillStyle = '#A0A0A0';
    g.x.fillRect(x + size * 0.4, y + size * 0.4, size * 0.05, size * 0.05);
    g.x.fillRect(x + size * 0.55, y + size * 0.7, size * 0.05, size * 0.05);
}

function drawRoseFlowerTile(x, y, size = g.TILE_SIZE) {
    const roseDark = '#B71C1C';
    const roseCenter = '#FFEB3B';

    g.x.fillStyle = g.tileColors.roseRed;
    g.x.beginPath();
    g.x.arc(x + size * 0.5, y + size * 0.3, size * 0.3, 0, Math.PI * 2);
    g.x.fill();

    g.x.fillStyle = roseDark;
    g.x.beginPath();
    g.x.arc(x + size * 0.5, y + size * 0.3, size * 0.2, 0, Math.PI * 2);
    g.x.fill();

    g.x.fillStyle = g.tileColors.roseRed;
    g.x.beginPath();
    g.x.arc(x + size * 0.5, y + size * 0.3, size * 0.15, 0, Math.PI * 2);
    g.x.fill();

    g.x.fillStyle = roseCenter;
    g.x.beginPath();
    g.x.arc(x + size * 0.5, y + size * 0.3, size * 0.05, 0, Math.PI * 2);
    g.x.fill();
}

function drawWaterTile(x, y, size = g.TILE_SIZE) {
    const waterDark = 'rgba(46, 134, 222, 0.7)';
    const waterLight = 'rgba(93, 173, 226, 0.7)';

    g.x.fillStyle = g.tileColors.water;
    g.x.fillRect(x, y, size, size);

    g.x.fillStyle = 'rgba(255, 255, 255, 0.2)';
    g.x.fillRect(x + size * 0.1, y + size * 0.2, size * 0.8, size * 0.1);
    g.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.6, size * 0.1);

    g.x.fillStyle = 'rgba(0, 0, 0, 0.1)';
    g.x.fillRect(x + size * 0.2, y + size * 0.4, size * 0.7, size * 0.1);
    g.x.fillRect(x + size * 0.4, y + size * 0.7, size * 0.5, size * 0.1);

    g.x.fillStyle = waterDark;
    g.x.fillRect(x, y + size * 0.8, size, size * 0.2);
    g.x.fillStyle = waterLight;
    g.x.fillRect(x, y, size, size * 0.1);
}

function drawBird(bird) {
    g.x.save();
    const birdCenterX = bird.x - g.camera.x + bird.width / 2;

    if (bird.direction === 'left') {
        g.x.translate(birdCenterX, 0);
        g.x.scale(-1, 1);
        g.x.translate(-birdCenterX, 0);
    }
    
    const pSize = bird.width / 4;
    const bodyColor = '#4a4a4a';
    const bodyLight = '#6a6a6a';
    const wingColor = '#3a3a3a';
    const beakColor = '#FFD700';
    const eyeWhite = 'white';
    const eyePupil = 'black';

    g.x.fillStyle = bodyColor;
    g.x.fillRect(bird.x - g.camera.x + pSize, bird.y - g.camera.y + pSize, pSize * 2, pSize);
    g.x.fillRect(bird.x - g.camera.x, bird.y - g.camera.y + pSize * 2, pSize * 3, pSize);
    g.x.fillStyle = bodyLight;
    g.x.fillRect(bird.x - g.camera.x + pSize * 1.5, bird.y - g.camera.y + pSize * 1.5, pSize * 1.5, pSize * 0.5);

    g.x.fillStyle = bodyColor;
    g.x.fillRect(bird.x - g.camera.x + pSize * 3, bird.y - g.camera.y, pSize, pSize);

    g.x.fillStyle = wingColor;
    g.x.fillRect(bird.x - g.camera.x + pSize * 0.5, bird.y - g.camera.y + pSize * 0.5, pSize * 2, pSize * 0.5);

    g.x.fillStyle = beakColor;
    g.x.fillRect(bird.x - g.camera.x + pSize * 4, bird.y - g.camera.y + pSize, pSize, pSize / 2);

    g.x.fillStyle = eyeWhite;
    g.x.fillRect(bird.x - g.camera.x + pSize * 3.5, bird.y - g.camera.y + pSize * 0.5, pSize * 0.5, pSize * 0.5);
    g.x.fillStyle = eyePupil;
    g.x.fillRect(bird.x - g.camera.x + pSize * 3.7, bird.y - g.camera.y + pSize * 0.7, pSize * 0.2, pSize * 0.2);

    g.x.restore();
}

function drawSaplingTile(x, y, size = g.TILE_SIZE) {
    const saplingDark = '#5A3B20';
    const leavesLight = '#4CAF50';

    g.x.fillStyle = g.tileColors.sapling;
    g.x.fillRect(x + size * 0.4, y + size * 0.5, size * 0.2, size * 0.5);

    g.x.fillStyle = saplingDark;
    g.x.fillRect(x + size * 0.45, y + size * 0.5, size * 0.1, size * 0.5);

    g.x.fillStyle = g.tileColors.leaves;
    g.x.fillRect(x + size * 0.3, y + size * 0.3, size * 0.4, size * 0.4);

    g.x.fillStyle = leavesLight;
    g.x.fillRect(x + size * 0.35, y + size * 0.35, size * 0.3, size * 0.3);
}

export function renderMinimapBackground() {
    const minimapWidth = g.worldWidth;
    const minimapHeight = g.worldHeight;
    g.minimapBuffer.width = minimapWidth;
    g.minimapBuffer.height = minimapHeight;

    for (let y = 0; y < g.worldHeight; y++) {
        for (let x = 0; x < g.worldWidth; x++) {
            const tileType = getTile(x, y);
            switch (tileType) {
                case 1: g.minimapBufferCtx.fillStyle = g.tileColors.grass; break;
                case 2: g.minimapBufferCtx.fillStyle = g.tileColors.dirt; break;
                case 3: g.minimapBufferCtx.fillStyle = g.tileColors.stone; break;
                case 4: g.minimapBufferCtx.fillStyle = g.tileColors.wood; break;
                case 5: g.minimapBufferCtx.fillStyle = g.tileColors.leaves; break;
                case 9: g.minimapBufferCtx.fillStyle = g.tileColors.water; break;
                default: g.minimapBufferCtx.fillStyle = g.tileColors.sky; break;
            }
            g.minimapBufferCtx.fillRect(x, y, 1, 1);
        }
    }
}

function drawHeart(cx, cy, size) {
    g.x.fillStyle = '#F2A9A9';
    const s = size / 5;

    g.x.fillRect(cx - s * 2, cy - s * 1.5, s * 2, s * 2);
    g.x.fillRect(cx, cy - s * 1.5, s * 2, s * 2);
    g.x.fillRect(cx - s * 1.5, cy + s * 0.5, s * 3, s * 3);
    g.x.fillRect(cx - s, cy + s * 1.5, s * 2, s * 2);
    g.x.fillRect(cx - s * 0.5, cy + s * 2.5, s, s);

    g.x.fillStyle = '#D46A6A';
    g.x.fillRect(cx - s * 2.5, cy - s * 1, s * 0.5, s * 2.5);
    g.x.fillRect(cx + s * 2, cy - s * 1, s * 0.5, s * 2.5);
    g.x.fillRect(cx - s * 1.5, cy + s * 3.5, s * 3, s * 0.5);
}

function drawBunny(bunny) {
    g.x.save();
    const bunnyCenterX = bunny.x - g.camera.x + bunny.width / 2;

    if (bunny.direction === 'left') {
        g.x.translate(bunnyCenterX, 0);
        g.x.scale(-1, 1);
        g.x.translate(-bunnyCenterX, 0);
    }

    const pSize = g.TILE_SIZE / 5;

    const bodyColor = '#d3c5b3';
    const bodyDark = '#b8a99a';
    const earColor = '#e0d6c7';
    const earInner = '#f2e8dc';
    const eyeColor = '#2E2E2E';
    const tailColor = '#FAFAF0';

    g.x.fillStyle = bodyColor;
    g.x.fillRect(bunny.x - g.camera.x + pSize, bunny.y - g.camera.y + pSize * 4, pSize * 3, pSize * 2);
    g.x.fillRect(bunny.x - g.camera.x + pSize * 2, bunny.y - g.camera.y + pSize * 3, pSize * 2, pSize);
    g.x.fillStyle = bodyDark;
    g.x.fillRect(bunny.x - g.camera.x + pSize * 3, bunny.y - g.camera.y + pSize * 4, pSize, pSize * 2);

    g.x.fillStyle = tailColor;
    g.x.fillRect(bunny.x - g.camera.x, bunny.y - g.camera.y + pSize * 4, pSize, pSize);

    g.x.fillStyle = bodyColor;
    g.x.fillRect(bunny.x - g.camera.x + pSize * 3, bunny.y - g.camera.y + pSize * 2, pSize * 2, pSize * 2);
    g.x.fillStyle = bodyDark;
    g.x.fillRect(bunny.x - g.camera.x + pSize * 4, bunny.y - g.camera.y + pSize * 2, pSize, pSize);

    g.x.fillStyle = earColor;
    g.x.fillRect(bunny.x - g.camera.x + pSize * 3, bunny.y - g.camera.y, pSize, pSize * 3);
    g.x.fillStyle = earInner;
    g.x.fillRect(bunny.x - g.camera.x + pSize * 3.2, bunny.y - g.camera.y + pSize * 0.5, pSize * 0.6, pSize * 2);
    g.x.fillStyle = bodyColor;
    g.x.fillRect(bunny.x - g.camera.x + pSize * 4, bunny.y - g.camera.y + pSize, pSize, pSize * 2);

    g.x.fillStyle = eyeColor;
    g.x.fillRect(bunny.x - g.camera.x + pSize * 4, bunny.y - g.camera.y + pSize * 2, pSize, pSize);

    g.x.restore();
}

function drawSquirrel(squirrel) {
    g.x.save();
    const squirrelCenterX = squirrel.x - g.camera.x + squirrel.width / 2;

    if (squirrel.direction === 'left') {
        g.x.translate(squirrelCenterX, 0);
        g.x.scale(-1, 1);
        g.x.translate(-squirrelCenterX, 0);
    }

    const pSize = g.TILE_SIZE / 5;

    const bodyColor = '#8B5A2B';
    const bodyDark = '#6F4722';
    const bellyColor = '#A97B4F';
    const eyeColor = '#2E2E2E';
    const tailColor = '#A97B4F';

    g.x.fillStyle = bodyColor;
    g.x.fillRect(squirrel.x - g.camera.x + pSize, squirrel.y - g.camera.y + pSize * 3, pSize * 3, pSize * 3);
    g.x.fillStyle = bellyColor;
    g.x.fillRect(squirrel.x - g.camera.x + pSize * 2, squirrel.y - g.camera.y + pSize * 4, pSize, pSize * 2);
    g.x.fillStyle = bodyDark;
    g.x.fillRect(squirrel.x - g.camera.x + pSize * 3, squirrel.y - g.camera.y + pSize * 3, pSize, pSize * 3);

    g.x.fillStyle = bodyColor;
    g.x.fillRect(squirrel.x - g.camera.x + pSize * 3, squirrel.y - g.camera.y + pSize * 2, pSize * 2, pSize * 2);
    g.x.fillRect(squirrel.x - g.camera.x + pSize * 4, squirrel.y - g.camera.y + pSize, pSize, pSize);
    g.x.fillStyle = bodyDark;
    g.x.fillRect(squirrel.x - g.camera.x + pSize * 4, squirrel.y - g.camera.y + pSize * 2, pSize, pSize);

    g.x.fillStyle = bodyColor;
    g.x.fillRect(squirrel.x - g.camera.x, squirrel.y - g.camera.y + pSize * 4, pSize * 2, pSize);
    g.x.fillRect(squirrel.x - g.camera.x + pSize, squirrel.y - g.camera.y + pSize * 3, pSize, pSize);

    g.x.fillStyle = eyeColor;
    g.x.fillRect(squirrel.x - g.camera.x + pSize * 4, squirrel.y - g.camera.y + pSize * 3, pSize, pSize);

    g.x.fillStyle = tailColor;
    g.x.fillRect(squirrel.x - g.camera.x - pSize, squirrel.y - g.camera.y + pSize * 2, pSize, pSize * 3);
    g.x.fillRect(squirrel.x - g.camera.x - pSize * 2, squirrel.y - g.camera.y + pSize * 3, pSize, pSize * 2);

    g.x.restore();
}

function drawFish(fish) {
    g.x.save();
    const fishCenterX = fish.x - g.camera.x + fish.width / 2;

    if (fish.direction === 'left') {
        g.x.translate(fishCenterX, 0);
        g.x.scale(-1, 1);
        g.x.translate(-fishCenterX, 0);
    }

    const pSize = fish.width / 5;

    const bodyColor = '#4CAF50';
    const bodyLight = '#66BB6A';
    const finColor = '#8BC34A';
    const eyeColor = '#2E2E2E';

    g.x.fillStyle = bodyColor;
    g.x.fillRect(fish.x - g.camera.x + pSize, fish.y - g.camera.y + pSize, pSize * 3, pSize * 2);
    g.x.fillRect(fish.x - g.camera.x + pSize * 4, fish.y - g.camera.y + pSize * 1.5, pSize, pSize);
    g.x.fillStyle = bodyLight;
    g.x.fillRect(fish.x - g.camera.x + pSize * 1.5, fish.y - g.camera.y + pSize * 1.5, pSize * 2, pSize);

    g.x.fillStyle = finColor;
    g.x.fillRect(fish.x - g.camera.x, fish.y - g.camera.y + pSize * 1.5, pSize, pSize);
    g.x.fillRect(fish.x - g.camera.x + pSize * 0.5, fish.y - g.camera.y + pSize * 0.5, pSize * 0.5, pSize * 2);
    g.x.fillRect(fish.x - g.camera.x + pSize * 2, fish.y - g.camera.y + pSize * 3, pSize, pSize * 0.5);

    g.x.fillStyle = eyeColor;
    g.x.fillRect(fish.x - g.camera.x + pSize * 3, fish.y - g.camera.y + pSize * 1, pSize * 0.5, pSize * 0.5);

    g.x.restore();
}

function drawButterfly(butterfly) {
    g.x.save();
    const butterflyCenterX = butterfly.x - g.camera.x + butterfly.width / 2;

    if (butterfly.vx < 0) {
        g.x.translate(butterflyCenterX, 0);
        g.x.scale(-1, 1);
        g.x.translate(-butterflyCenterX, 0);
    }

    const pSize = butterfly.width / 4;
    const bodyColor = '#4A4A4A';
    const antennaColor = '#2E2E2E';

    g.x.fillStyle = bodyColor;
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 1.5, butterfly.y - g.camera.y + pSize * 1.5, pSize, pSize);
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 1.7, butterfly.y - g.camera.y + pSize * 1, pSize * 0.6, pSize * 0.5);

    g.x.fillStyle = butterfly.color;
    g.x.fillRect(butterfly.x - g.camera.x + pSize, butterfly.y - g.camera.y + pSize, pSize, pSize);
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 2, butterfly.y - g.camera.y + pSize, pSize, pSize);
    g.x.fillRect(butterfly.x - g.camera.x + pSize, butterfly.y - g.camera.y + pSize * 2, pSize, pSize);
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 2, butterfly.y - g.camera.y + pSize * 2, pSize, pSize);

    const wingDetailColor = g.x.fillStyle.replace('#', '#');
    g.x.fillStyle = wingDetailColor + '80';
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 1.2, butterfly.y - g.camera.y + pSize * 1.2, pSize * 0.6, pSize * 0.6);
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 2.2, butterfly.y - g.camera.y + pSize * 1.2, pSize * 0.6, pSize * 0.6);
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 1.2, butterfly.y - g.camera.y + pSize * 2.2, pSize * 0.6, pSize * 0.6);
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 2.2, butterfly.y - g.camera.y + pSize * 2.2, pSize * 0.6, pSize * 0.6);

    g.x.fillStyle = antennaColor;
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 1.8, butterfly.y - g.camera.y + pSize * 0.5, pSize * 0.2, pSize * 0.5);
    g.x.fillRect(butterfly.x - g.camera.x + pSize * 2.2, butterfly.y - g.camera.y + pSize * 0.5, pSize * 0.2, pSize * 0.5);

    g.x.restore();
}

function drawFirefly(firefly) {
    g.x.save();
    const flickerAlpha = 0.7 + 0.3 * Math.sin(firefly.flicker);
    g.x.globalAlpha = firefly.alpha * flickerAlpha;

    g.x.fillStyle = '#FFD700';
    g.x.fillRect(firefly.x - g.camera.x, firefly.y - g.camera.y, firefly.width, firefly.height);

    g.x.shadowColor = '#FFFF00';
    g.x.shadowBlur = firefly.width * 1.5;
    g.x.fillStyle = '#FFFFE0';
    g.x.fillRect(firefly.x - g.camera.x + firefly.width * 0.25, firefly.y - g.camera.y + firefly.height * 0.25, firefly.width * 0.5, firefly.height * 0.5);
    
    g.x.globalAlpha = 1;
    g.x.shadowBlur = 0;
    g.x.restore();
}

