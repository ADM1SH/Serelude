const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

// Terraria-like world properties
const TILE_SIZE = 20;
let world = [];
let worldWidth, worldHeight;

const player = {
    x: 0,
    y: 0,
    width: TILE_SIZE,
    height: TILE_SIZE * 2,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpForce: 9,
    onGround: false,
    direction: 'right',
    isWalking: false,
    walkFrame: 0,
    walkFrameTimer: 0
};

const inventory = {
    items: [
        { type: 'axe', name: 'Axe' },
        { type: 'pickaxe', name: 'Pickaxe' },
        { type: 'stone', name: 'Stone', amount: 0 },
        { type: 'wood', name: 'Wood', amount: 0 },
        { type: 'dirt', name: 'Dirt', amount: 0 },
        { type: 'lily', name: 'Lily', amount: 0 }
    ],
    selectedSlot: 0
};

const keys = {
    a: false,
    d: false,
    w: false,
    ' ': false
};

let hearts = [];
let backgroundParticles = [];
let clouds = [];
let creatures = [];
let shootingStars = [];
let celestialBody = { angle: -Math.PI };
let isNight = false;
let isDraggingSunMoon = false;

const tileColors = {
    sky: 'transparent',
    grass: '#B6C8A9',
    dirt: '#A9907E',
    stone: '#808080',
    wood: '#8B5A2B',
    leaves: '#556B2F',
    flowerStem: '#6B8E23', // Olive Drab
    flowerPetal: '#FAFAF0' // Cream
};

const timePalettes = {
    dawn: { top: '#F2A9A9', bottom: '#F8F8F5' },
    midday: { top: '#D4E6F1', bottom: '#F8F8F5' },
    dusk: { top: '#F2A9A9', bottom: '#FAFAF0' },
    night: { top: '#2E2E2E', bottom: '#4A4A4A' }
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // When resizing, we just want to update the canvas dimensions.
  // The world itself shouldn't change. We'll re-init visual elements
  // that depend on screen size.
  initBackgroundParticles(); // Re-scatter particles for new size
  initClouds(); // Re-create clouds for new size
}

function initWorld() {
  world = [];
  for (let y = 0; y < worldHeight; y++) {
    world.push(new Array(worldWidth).fill(0));
  }

  const groundLevelY = Math.floor(worldHeight * 0.8); // A fixed level for the ground

  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      if (y === groundLevelY) {
        world[y][x] = 1; // Grass on top
      } else if (y > groundLevelY) {
        world[y][x] = 2; // Dirt below
      } else {
        world[y][x] = 0; // Sky
      }
    }
  }

  // Set player start position on the flat ground
  player.x = worldWidth * TILE_SIZE / 2;
  player.y = groundLevelY * TILE_SIZE - player.height;

  generateTrees(groundLevelY);
  generateFlowers(groundLevelY);
  initCreatures(groundLevelY);
}

function saveGameState() {
    const gameState = {
        world: world,
        player: {
            x: player.x,
            y: player.y
        },
        inventory: inventory.items,
        celestialBody: celestialBody
    };
    localStorage.setItem('sereludeSaveData', JSON.stringify(gameState));
    console.log("World Saved!");
    // Optional: Add a visual confirmation
}

function loadGameState() {
    const savedStateJSON = localStorage.getItem('sereludeSaveData');
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            world = savedState.world;
            player.x = savedState.player.x;
            player.y = savedState.player.y;
            inventory.items = savedState.inventory;
            celestialBody = savedState.celestialBody;

            // Update dimensions based on loaded world
            worldHeight = world.length;
            worldWidth = world[0].length;
            canvas.height = worldHeight * TILE_SIZE;
            canvas.width = worldWidth * TILE_SIZE;

            const groundLevelY = findGroundLevel();
            initCreatures(groundLevelY);
            console.log("World Loaded!");
            return true;
        } catch (e) {
            console.error("Failed to load saved world:", e);
            return false;
        }
    }
    return false;
}

function findGroundLevel() {
    // Find the first solid block from the middle of the world down.
    const midX = Math.floor(worldWidth / 2);
    for (let y = 0; y < worldHeight; y++) {
        if (isSolid(world[y][midX])) {
            return y;
        }
    }
    return Math.floor(worldHeight * 0.8); // Fallback
}

function generateTrees(groundLevelY) {
    let x = 3; // Start away from the edge
    while (x < worldWidth - 3) {
        // Use Math.random() to decide whether to plant a tree
        if (Math.random() < 0.1) { // 10% chance to plant a tree
            const treeHeight = Math.floor(Math.random() * 4) + 4; // Tree height between 4 and 7
            const treeTopY = groundLevelY - treeHeight;

            // Create the trunk
            for (let i = 1; i < treeHeight; i++) {
                world[groundLevelY - i][x] = 4; // Wood
            }

            // Create the leaves (a simple 3x3 canopy)
            for (let ly = -1; ly <= 1; ly++) {
                for (let lx = -1; lx <= 1; lx++) {
                    world[treeTopY + ly][x + lx] = 5; // Leaves
                }
            }
            x += Math.floor(Math.random() * 3) + 4; // Skip 4-6 tiles to create space
        } else {
            x++;
        }
    }
}

function generateFlowers(groundLevelY) {
    let x = 1;
    while (x < worldWidth - 1) {
        // Check if the ground is grass and there's empty space above
        if (world[groundLevelY][x] === 1 && world[groundLevelY - 1][x] === 0) {
            // 8% chance to start a flower cluster
            if (Math.random() < 0.08) {
                const clusterSize = Math.floor(Math.random() * 3) + 1; // 1 to 3 flowers
                for (let i = 0; i < clusterSize && (x + i) < worldWidth - 1; i++) {
                    if (world[groundLevelY][x+i] === 1 && world[groundLevelY - 1][x+i] === 0) {
                        world[groundLevelY - 1][x + i] = 6; // flowerStem
                        world[groundLevelY - 2][x + i] = 7; // flowerPetal
                    }
                }
                x += clusterSize + Math.floor(Math.random() * 5) + 3; // Skip a few tiles after the cluster
            }
        }
        x++;
    }
}

function initCreatures(groundLevelY) {
    creatures = [];
    for (let i = 0; i < 3; i++) { // Spawn 3 bunnies
        const spawnX = Math.random() * canvas.width;
        creatures.push({
            type: 'bunny',
            x: spawnX,
            y: groundLevelY * TILE_SIZE - TILE_SIZE * 1.5,
            width: TILE_SIZE,
            height: TILE_SIZE * 1.5,
            vx: 0, vy: 0,
            onGround: false,
            direction: Math.random() < 0.5 ? 'left' : 'right',
            aiTimer: Math.random() * 100 + 50,
            dropCooldown: 0
        });
    }
}

function isSolid(tileType) {
    // 1: grass, 2: dirt, 3: stone are solid.
    // 4: wood, 5: leaves are background tiles and not solid.
    return tileType === 1 || tileType === 2 || tileType === 3;
}

function drawGrassTile(x, y) {
    ctx.fillStyle = tileColors.dirt; // Dirt base
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = tileColors.grass; // Grass top
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE / 2);
    // Add some darker green "blades"
    ctx.fillStyle = '#8a9e7c';
    ctx.fillRect(x + TILE_SIZE * 0.2, y, TILE_SIZE * 0.2, TILE_SIZE * 0.5);
    ctx.fillRect(x + TILE_SIZE * 0.7, y, TILE_SIZE * 0.2, TILE_SIZE * 0.5);
}

function drawDirtTile(x, y) {
    ctx.fillStyle = tileColors.dirt;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Add darker specks for texture
    ctx.fillStyle = '#8c7365';
    ctx.fillRect(x + TILE_SIZE * 0.3, y + TILE_SIZE * 0.2, 4, 4);
    ctx.fillRect(x + TILE_SIZE * 0.7, y + TILE_SIZE * 0.6, 4, 4);
}

function drawStoneTile(x, y) {
    ctx.fillStyle = tileColors.stone;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Add darker and lighter specks
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(x + TILE_SIZE * 0.2, y + TILE_SIZE * 0.5, 5, 5);
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(x + TILE_SIZE * 0.6, y + TILE_SIZE * 0.2, 4, 4);
}

function drawWoodTile(x, y) {
    ctx.fillStyle = tileColors.wood;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Add vertical lines for bark texture
    ctx.fillStyle = '#a86a32';
    ctx.fillRect(x + TILE_SIZE * 0.2, y, TILE_SIZE * 0.2, TILE_SIZE);
    ctx.fillRect(x + TILE_SIZE * 0.7, y, TILE_SIZE * 0.1, TILE_SIZE);
}

function drawLeavesTile(x, y) {
    ctx.fillStyle = tileColors.leaves;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Add lighter green specks
    ctx.fillStyle = '#6b8e23';
    ctx.fillRect(x + TILE_SIZE * 0.1, y + TILE_SIZE * 0.1, TILE_SIZE * 0.4, TILE_SIZE * 0.4);
    ctx.fillRect(x + TILE_SIZE * 0.5, y + TILE_SIZE * 0.5, TILE_SIZE * 0.4, TILE_SIZE * 0.4);
}

function drawFlowerStemTile(x, y) {
    ctx.fillStyle = tileColors.flowerStem;
    ctx.fillRect(x + TILE_SIZE * 0.4, y, TILE_SIZE * 0.2, TILE_SIZE);
}

function drawFlowerPetalTile(x, y) {
    // Draw the hanging bell-shaped flower
    ctx.fillStyle = tileColors.flowerPetal;
    ctx.fillRect(x + TILE_SIZE * 0.3, y + TILE_SIZE * 0.5, TILE_SIZE * 0.4, TILE_SIZE * 0.4);
    ctx.fillStyle = '#e0e0d1'; // Slightly darker shade for depth
    ctx.fillRect(x + TILE_SIZE * 0.4, y + TILE_SIZE * 0.4, TILE_SIZE * 0.2, TILE_SIZE * 0.2);
}

function drawWorld() {
    // Draw all tiles with new detailed functions
    for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
            const tileType = world[y][x];
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;

            switch (tileType) {
                case 1: drawGrassTile(tileX, tileY); break;
                case 2: drawDirtTile(tileX, tileY); break;
                case 3: drawStoneTile(tileX, tileY); break;
                case 4: drawWoodTile(tileX, tileY); break;
                case 5: drawLeavesTile(tileX, tileY); break;
                case 6: drawFlowerStemTile(tileX, tileY); break;
                case 7: drawFlowerPetalTile(tileX, tileY); break;
            }
        }
    }
}

function initBackgroundParticles() {
    backgroundParticles = [];
    for (let i = 0; i < 50; i++) {
        backgroundParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            color: 'rgba(250, 250, 240, 0.5)',
            vy: Math.random() * -0.5 - 0.2
        });
    }
}

function initClouds() {
    clouds = [];
    const cloudPixelSize = 15;
    for (let i = 0; i < 5; i++) { // Generate 5 clouds
        const cloud = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.3 + 20, // Higher in the sky
            speed: Math.random() * 0.2 + 0.1,
            blocks: [],
            width: 0
        };

        const cloudLength = Math.floor(Math.random() * 4) + 3; // 3 to 6 blocks wide
        let currentX = 0;
        for (let j = 0; j < cloudLength; j++) {
            const blockHeight = (Math.random() * 2 + 1) * cloudPixelSize;
            const blockY = (Math.random() - 0.5) * cloudPixelSize;
            cloud.blocks.push({ rx: currentX, ry: blockY, width: cloudPixelSize, height: blockHeight });
            currentX += cloudPixelSize;
        }
        cloud.width = currentX; // Total width of the cloud

        clouds.push(cloud);
    }
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

function drawSky() {
    const angle = celestialBody.angle;
    isNight = Math.sin(angle) >= 0;

    let topColor, bottomColor;
    const transitionFactor = Math.abs(Math.sin(angle));

    if (angle > -Math.PI && angle < -Math.PI / 2) { // Dawn
        topColor = lerpColor(timePalettes.night.top, timePalettes.dawn.top, transitionFactor);
        bottomColor = lerpColor(timePalettes.night.bottom, timePalettes.dawn.bottom, transitionFactor);
    } else if (angle > -Math.PI / 2 && angle < 0) { // Midday
        topColor = lerpColor(timePalettes.dawn.top, timePalettes.midday.top, 1 - transitionFactor);
        bottomColor = lerpColor(timePalettes.dawn.bottom, timePalettes.midday.bottom, 1 - transitionFactor);
    } else if (angle > 0 && angle < Math.PI / 2) { // Dusk
        topColor = lerpColor(timePalettes.midday.top, timePalettes.dusk.top, transitionFactor);
        bottomColor = lerpColor(timePalettes.midday.bottom, timePalettes.dusk.bottom, transitionFactor);
    } else { // Night
        topColor = lerpColor(timePalettes.dusk.top, timePalettes.night.top, 1 - transitionFactor);
        bottomColor = lerpColor(timePalettes.dusk.bottom, timePalettes.night.bottom, 1 - transitionFactor);
    }

    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.8);
    skyGradient.addColorStop(0, topColor);
    skyGradient.addColorStop(1, bottomColor);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sunMoonX = canvas.width / 2 + Math.cos(angle) * (canvas.width / 2 + 30);
    const sunMoonY = canvas.height * 0.8 + Math.sin(angle) * (canvas.height * 0.7);
    const sunMoonRadius = 30;
    
    if (isNight) {
        ctx.fillStyle = '#FAFAF0';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FAFAF0';
    } else {
        ctx.fillStyle = '#F2A9A9';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#F2A9A9';
    }
    ctx.beginPath();
    ctx.arc(sunMoonX, sunMoonY, sunMoonRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    clouds.forEach(cloud => {
        ctx.fillStyle = 'rgba(250, 250, 240, 0.7)';
        cloud.blocks.forEach(block => {
            ctx.fillRect(cloud.x + block.rx, cloud.y + block.ry, block.width, block.height);
        });

        cloud.x += cloud.speed;
        if (cloud.x > canvas.width) {
            cloud.x = -cloud.width;
        }
    });

    if (isNight) {
        if (Math.random() < 0.01) {
            shootingStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.5,
                len: Math.random() * 80 + 20,
                speed: Math.random() * 5 + 5,
                life: 100
            });
        }
    }

    shootingStars.forEach((star, index) => {
        ctx.strokeStyle = 'rgba(250, 250, 240, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.len, star.y + star.len);
        ctx.stroke();
        star.x -= star.speed;
        star.y += star.speed;
        star.life--;
        if (star.life <= 0) {
            shootingStars.splice(index, 1);
        }
    });

    if (!isDraggingSunMoon) {
        celestialBody.angle += 0.0003;
        if (celestialBody.angle > Math.PI) {
            celestialBody.angle = -Math.PI;
        }
    }
}

function drawBackground() {
    backgroundParticles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.vy;
        if (p.y < 0) {
            p.y = canvas.height;
            p.x = Math.random() * canvas.width;
        }
    });
}



function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function drawPlayer() {
    ctx.save();
    const playerCenterX = player.x + player.width / 2;
    
    // Flip context if walking left
    if (player.direction === 'left') {
        ctx.translate(playerCenterX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-playerCenterX, 0);
    }

    const pSize = TILE_SIZE / 5; // 4px pixel size for a 20px tile

    // Colors
    const skin = '#f2d3ab';
    const hair = '#5d4037';
    const shirt = '#a9c8b6'; // A soft green to complement the world
    const pants = '#6a6a6a';
    const shoes = '#4a4a4a';

    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(player.x + pSize, player.y, pSize * 3, pSize * 4); // Face (was player.x + pSize)
    ctx.fillStyle = hair;
    ctx.fillRect(player.x + pSize, player.y, pSize * 4, pSize * 2); // Hair top (was player.x)
    ctx.fillRect(player.x + pSize, player.y + pSize * 2, pSize, pSize); // Hair side (was player.x + pSize * 3)

    // Eye
    ctx.fillStyle = '#2E2E2E';
    ctx.fillRect(player.x + pSize * 2, player.y + pSize * 2, pSize, pSize); // Stays the same

    // Body
    ctx.fillStyle = shirt;
    ctx.fillRect(player.x + pSize, player.y + pSize * 4, pSize * 3, pSize * 3);

    // Arm
    ctx.fillRect(player.x + pSize * 4, player.y + pSize * 4, pSize, pSize * 2); // (was player.x)
    ctx.fillStyle = skin;
    ctx.fillRect(player.x + pSize * 4, player.y + pSize * 6, pSize, pSize); // Hand (was player.x)

    // Legs - with walking animation
    ctx.fillStyle = pants;
    if (player.isWalking) {
        if (player.walkFrame === 0) {
            // Leg 1 forward
            ctx.fillRect(player.x + pSize, player.y + pSize * 7, pSize, pSize * 2);
            // Leg 2 back
            ctx.fillRect(player.x + pSize * 2, player.y + pSize * 7, pSize, pSize);
        } else {
            // Leg 1 back
            ctx.fillRect(player.x + pSize, player.y + pSize * 7, pSize, pSize);
            // Leg 2 forward
            ctx.fillRect(player.x + pSize * 2, player.y + pSize * 7, pSize, pSize * 2);
        }
    } else { // Standing still
        ctx.fillRect(player.x + pSize, player.y + pSize * 7, pSize, pSize * 2);
        ctx.fillRect(player.x + pSize * 2, player.y + pSize * 7, pSize, pSize * 2);
    }

    // Shoes
    ctx.fillStyle = shoes;
    ctx.fillRect(player.x + pSize, player.y + pSize * 9, pSize, pSize);
    ctx.fillRect(player.x + pSize * 2, player.y + pSize * 9, pSize, pSize);

    ctx.restore();
}

function drawHeart(cx, cy, size) {
    ctx.fillStyle = '#F2A9A9'; // blush pink
    const s = size / 5; // Use a 5-pixel grid for better shape

    // Top lobes
    ctx.fillRect(cx - s * 1.5, cy - s * 2, s, s);
    ctx.fillRect(cx + s * 0.5, cy - s * 2, s, s);
    // Body
    ctx.fillRect(cx - s * 2.5, cy - s, s * 5, s * 3);
    // Point
    ctx.fillRect(cx - s * 1.5, cy + s * 2, s * 3, s);
    ctx.fillRect(cx - s * 0.5, cy + s * 3, s, s);
}

function drawBunny(bunny) {
    ctx.save();
    const bunnyCenterX = bunny.x + bunny.width / 2;

    if (bunny.direction === 'left') {
        ctx.translate(bunnyCenterX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-bunnyCenterX, 0);
    }

    const pSize = TILE_SIZE / 5; // Pixel size

    // Colors
    const bodyColor = '#d3c5b3'; // A soft, sandy brown
    const earColor = '#e0d6c7'; // Lighter inner ear
    const eyeColor = '#2E2E2E';
    const tailColor = '#FAFAF0'; // Creamy white tail

    // Body - making it more rounded and crouched
    ctx.fillStyle = bodyColor;
    ctx.fillRect(bunny.x + pSize, bunny.y + pSize * 4, pSize * 3, pSize * 2); // Main body
    ctx.fillRect(bunny.x + pSize * 2, bunny.y + pSize * 3, pSize * 2, pSize); // Rounded back

    // Tail
    ctx.fillStyle = tailColor;
    ctx.fillRect(bunny.x, bunny.y + pSize * 4, pSize, pSize);

    // Head
    ctx.fillStyle = bodyColor;
    ctx.fillRect(bunny.x + pSize * 3, bunny.y + pSize * 2, pSize * 2, pSize * 2);

    // Ears - making them longer
    ctx.fillStyle = earColor;
    ctx.fillRect(bunny.x + pSize * 3, bunny.y, pSize, pSize * 3); // Back ear
    ctx.fillStyle = bodyColor;
    ctx.fillRect(bunny.x + pSize * 4, bunny.y + pSize, pSize, pSize * 2); // Front ear

    // Eye
    ctx.fillStyle = eyeColor;
    ctx.fillRect(bunny.x + pSize * 4, bunny.y + pSize * 2, pSize, pSize);

    ctx.restore();
}

function updateCreatures() {
    creatures.forEach(creature => {
        if (creature.type === 'bunny') {
            // Apply gravity
            creature.vy += 0.5;
            creature.y += creature.vy;

            // Simple AI
            creature.aiTimer--;
            if (creature.aiTimer <= 0) {
                const action = Math.random();
                if (action < 0.4) { // Hop
                    if (creature.onGround) {
                        creature.vy = -4; // Hop force
                        creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 1 + 1);
                        creature.onGround = false;
                    }
                } else if (action < 0.7) { // Change direction
                    creature.direction = creature.direction === 'left' ? 'right' : 'left';
                    creature.vx = 0;
                } else { // Idle
                    creature.vx = 0;
                }
                creature.aiTimer = Math.random() * 120 + 60; // Reset timer
            }

            // Player interaction
            if (creature.dropCooldown > 0) {
                creature.dropCooldown--;
            } else {
                const distToPlayer = Math.hypot(player.x - creature.x, player.y - creature.y);
                if (distToPlayer < TILE_SIZE * 4) { // If player is close
                    // Drop a heart
                    hearts.push({ x: creature.x + creature.width / 2, y: creature.y, size: 10, life: 120, vy: -1 });
                    // Hop away
                    if (creature.onGround) {
                        creature.vy = -6;
                        creature.vx = player.x < creature.x ? 3 : -3; // Hop away from player
                    }
                    creature.dropCooldown = 300; // 5 second cooldown
                }
            }

            // Horizontal movement
            creature.x += creature.vx;

            // World collision
            creature.onGround = false;
            const startY = Math.floor(creature.y / TILE_SIZE);
            const endY = Math.floor((creature.y + creature.height) / TILE_SIZE);
            const tileX = Math.floor((creature.x + creature.width / 2) / TILE_SIZE);

            for (let y = startY; y <= endY; y++) {
                if (world[y] && isSolid(world[y][tileX])) {
                    const tile = { x: tileX * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
                    if (checkCollision(creature, tile)) {
                        if (creature.vy > 0) {
                            creature.y = tile.y - creature.height;
                            creature.vy = 0;
                            creature.onGround = true;
                            creature.vx *= 0.8; // Friction
                        }
                    }
                }
            }

            // Screen bounds
            if (creature.x < 0) { creature.x = 0; creature.direction = 'right'; }
            if (creature.x + creature.width > canvas.width) { creature.x = canvas.width - creature.width; creature.direction = 'left'; }
        }
    });
}

function updatePlayer() {
  // Horizontal movement
  if (keys.a) {
      player.vx = -player.speed;
      player.direction = 'left';
      player.isWalking = true;
  } else if (keys.d) {
      player.vx = player.speed;
      player.direction = 'right';
      player.isWalking = true;
  } else {
      player.vx = 0;
      player.isWalking = false;
  }

  // Animation timing
  player.walkFrameTimer++;
  if (player.walkFrameTimer > 8) { player.walkFrame = 1 - player.walkFrame; player.walkFrameTimer = 0; }

  // Jumping
  if ((keys.w || keys[' ']) && player.onGround) {
      player.vy = -player.jumpForce;
      player.onGround = false;
  }

  // Apply gravity
  player.vy += 0.4; // Simple gravity

  // --- Horizontal Collision ---
  player.x += player.vx;

  let startX = Math.floor(player.x / TILE_SIZE);
  let endX = Math.floor((player.x + player.width) / TILE_SIZE);
  let startY = Math.floor(player.y / TILE_SIZE);
  let endY = Math.floor((player.y + player.height) / TILE_SIZE);

  for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
          if (world[y] && isSolid(world[y][x])) {
              // Make sure we don't check tiles that are out of bounds
              if (y < 0 || y >= worldHeight || x < 0 || x >= worldWidth) {
                  continue;
              }
              const tile = { x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
              if (checkCollision(player, tile)) {
                  if (player.vx > 0) { // Moving right
                      player.x = tile.x - player.width;
                  } else if (player.vx < 0) { // Moving left
                      player.x = tile.x + tile.width;
                  }
                  player.vx = 0;
              }
          }
      }
  }

  // --- Vertical Collision ---
  player.y += player.vy;
  player.onGround = false;

  // Recalculate tile coordinates for vertical collision with the new player.y
  startX = Math.floor(player.x / TILE_SIZE);
  endX = Math.floor((player.x + player.width) / TILE_SIZE);
  startY = Math.floor(player.y / TILE_SIZE);
  endY = Math.floor((player.y + player.height) / TILE_SIZE);

  for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
          if (world[y] && isSolid(world[y][x])) {
              if (y < 0 || y >= worldHeight || x < 0 || x >= worldWidth) {
                  continue;
              }
              const tile = { x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
              if (checkCollision(player, tile)) {
                  if (player.vy > 0) { // Moving down
                      player.y = tile.y - player.height;
                      player.vy = 0;
                      player.onGround = true;
                  } else if (player.vy < 0) { // Moving up
                      player.y = tile.y + tile.height;
                      player.vy = 0;
                  }
              }
          }
      }
  }

  // Prevent player from going off-screen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function drawItemIcon(item, x, y, size) {
    const p = size / 10; // Pixel size for icons
    ctx.save();
    ctx.translate(x, y);

    switch (item.type) {
        case 'axe':
            ctx.fillStyle = '#8B5A2B'; // Handle
            ctx.fillRect(p * 4, p * 2, p * 2, p * 7);
            ctx.fillStyle = '#808080'; // Head
            ctx.fillRect(p * 3, p, p * 4, p * 3);
            break;
        case 'pickaxe':
            ctx.fillStyle = '#8B5A2B'; // Handle
            ctx.fillRect(p * 4, p * 2, p * 2, p * 7);
            ctx.fillStyle = '#808080'; // Head
            ctx.fillRect(p * 2, p * 2, p * 6, p * 2);
            break;
        case 'stone':
            drawStoneIcon(0, 0, size);
            break;
        case 'wood':
            drawWoodIcon(p, p, size - 2 * p);
            break;
        case 'dirt':
            drawDirtIcon(p, p, size - 2 * p);
            break;
        case 'lily':
            ctx.fillStyle = tileColors.flowerStem;
            ctx.fillRect(p * 4, p * 2, p * 2, p * 6);
            ctx.fillStyle = tileColors.flowerPetal;
            ctx.fillRect(p * 3, p * 2, p * 4, p * 3);
            break;
    }
    ctx.restore();
}

function drawStoneIcon(x, y, size) {
    const p = size / 10;
    // Main face
    ctx.fillStyle = tileColors.stone;
    ctx.fillRect(x + p, y + p * 2, p * 8, p * 7);
    // Top face
    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.moveTo(x + p, y + p * 2);
    ctx.lineTo(x + p * 3, y);
    ctx.lineTo(x + p * 11, y);
    ctx.lineTo(x + p * 9, y + p * 2);
    ctx.closePath();
    ctx.fill();
}

function drawWoodIcon(x, y, size) {
    drawWoodTile(x, y, size); // The existing 2D version looks good for a stack
}
function drawDirtIcon(x, y, size) {
    drawDirtTile(x, y, size); // The existing 2D version looks good for a stack
}

// Overload tile drawing functions to accept size for icons
function drawStoneTile(x, y, size = TILE_SIZE) {
    ctx.fillStyle = tileColors.stone;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(x + size * 0.2, y + size * 0.5, size * 0.25, size * 0.25);
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(x + size * 0.6, y + size * 0.2, size * 0.2, size * 0.2);
}
function drawWoodTile(x, y, size = TILE_SIZE) {
    ctx.fillStyle = tileColors.wood;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#a86a32';
    ctx.fillRect(x + size * 0.2, y, size * 0.2, size);
}
function drawDirtTile(x, y, size = TILE_SIZE) {
    ctx.fillStyle = tileColors.dirt;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#8c7365';
    ctx.fillRect(x + size * 0.3, y + size * 0.2, size * 0.2, size * 0.2);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function drawInventory() {
    const slotSize = 50;
    const padding = 10;
    const cornerRadius = 8;
    const startX = (canvas.width - (inventory.items.length * (slotSize + padding))) / 2;
    const startY = 20;

    inventory.items.forEach((item, index) => {
        const slotX = startX + index * (slotSize + padding);
        
        // Draw selection highlight first (as a glow)
        if (index === inventory.selectedSlot) {
            ctx.shadowColor = '#F2A9A9';
            ctx.shadowBlur = 15;
        }

        // Draw slot background
        ctx.fillStyle = 'rgba(46, 46, 46, 0.5)'; // Softer, darker grey
        roundRect(ctx, slotX, startY, slotSize, slotSize, cornerRadius);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Draw selection border
        if (index === inventory.selectedSlot) {
            ctx.strokeStyle = '#F2A9A9'; // blush pink
            ctx.lineWidth = 3;
            roundRect(ctx, slotX, startY, slotSize, slotSize, cornerRadius);
            ctx.stroke();
        }

        // Draw item icon
        drawItemIcon(item, slotX, startY, slotSize);
        // Draw amount if applicable
        if (item.amount !== undefined) {
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'right';
            // Draw shadow for text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillText(item.amount, slotX + slotSize - 6, startY + slotSize - 5);
            // Draw text
            ctx.fillStyle = 'white';
            ctx.fillText(item.amount, slotX + slotSize - 7, startY + slotSize - 6);
            ctx.textAlign = 'center'; // Reset alignment
        }
    });
}

function animate() {
  drawSky();
  drawWorld();
  drawBackground();
  updateCreatures();
  updatePlayer();
  drawPlayer();
  creatures.forEach(creature => {
      if (creature.type === 'bunny') drawBunny(creature);
  });
  drawInventory();
    
    // Spawn new falling hearts continuously
    if (Math.random() < 0.05) { // Adjust chance for more/less hearts
        hearts.push({
            x: Math.random() * canvas.width,
            y: -20, // Start above screen
            size: Math.random() * 10 + 5,
            vy: Math.random() * 0.5 + 0.2 // Slower falling speed
        });
    }

    // Update and draw all hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        let alpha = 1.0;

        if (heart.life !== undefined) {
            // It's a heart from a bunny - float up and fade out
            heart.y += heart.vy;
            heart.vy *= 0.98; // Slow down the ascent
            alpha = heart.life / 120; // Fade based on lifetime
            heart.life--;
        } else {
            // It's a falling heart - fade out at the bottom
            heart.y += heart.vy;
            if (heart.y > canvas.height * 0.8) {
                alpha = 1 - (heart.y - canvas.height * 0.8) / (canvas.height * 0.2);
            }
        }

        ctx.globalAlpha = Math.max(0, alpha);
        drawHeart(heart.x, heart.y, heart.size);
        ctx.globalAlpha = 1.0; // Reset global alpha

        // Remove heart if it's off-screen or its life expires
        if (heart.y > canvas.height + 20 || (heart.life !== undefined && heart.life <= 0)) {
            hearts.splice(i, 1);
        }
    }

  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    // For now, resizing with a saved world is complex.
    // We can simply suggest a page refresh for a better experience.
    // A full implementation would require re-rendering, not re-initializing.
});

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const sunMoonX = canvas.width / 2 + Math.cos(celestialBody.angle) * (canvas.width / 2 + 30);
    const sunMoonY = canvas.height * 0.8 + Math.sin(celestialBody.angle) * (canvas.height * 0.7);
    const dist = Math.sqrt(Math.pow(mouseX - sunMoonX, 2) + Math.pow(mouseY - sunMoonY, 2));

    if (dist < 40) {
        isDraggingSunMoon = true;
    }
});

canvas.addEventListener('mouseup', () => {
    isDraggingSunMoon = false;
});

canvas.addEventListener('mouseleave', () => {
    isDraggingSunMoon = false;
});

canvas.addEventListener('mousemove', (event) => {
    if (isDraggingSunMoon) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const dx = mouseX - canvas.width / 2;
        const dy = mouseY - canvas.height * 0.8;
        celestialBody.angle = Math.atan2(dy, dx);
        return;
    }
});

canvas.addEventListener('click', (event) => {
  if (isDraggingSunMoon) return;
  const rect = canvas.getBoundingClientRect();
  let clickX = event.clientX - rect.left;
  let clickY = event.clientY - rect.top;
  
    const tileX = Math.floor(clickX / TILE_SIZE);
    const tileY = Math.floor(clickY / TILE_SIZE);

    if (!world[tileY] || world[tileY][tileX] === undefined) return;

    // Check player range
    const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
    const distance = Math.sqrt(Math.pow(tileX - playerTileX, 2) + Math.pow(tileY - playerTileY, 2));

    if (distance > 5) return; // Mining range of 5 tiles

    const selectedItem = inventory.items[inventory.selectedSlot];
    const clickedTile = world[tileY][tileX];

    // --- Mining Logic ---
    if (selectedItem.type === 'axe') {
        if (clickedTile === 4 || clickedTile === 5) { // Wood or Leaves
            world[tileY][tileX] = 0;
            if (clickedTile === 4) { // Only give wood for the trunk
                inventory.items.find(i => i.type === 'wood').amount++;
            }
        }
    } else if (selectedItem.type === 'pickaxe') {
        if (clickedTile === 1 || clickedTile === 2) { // Grass or Dirt
            world[tileY][tileX] = 0;
            inventory.items.find(i => i.type === 'dirt').amount++;
        } else if (clickedTile === 3) { // Stone
            world[tileY][tileX] = 0;
            inventory.items.find(i => i.type === 'stone').amount++;
        }
    }

    // Picking flowers (can be done with any tool or hand)
    if (clickedTile === 6 || clickedTile === 7) { // Stem or Petal
        // Find the other part of the flower and remove it too
        if (clickedTile === 6 && world[tileY - 1]?.[tileX] === 7) world[tileY - 1][tileX] = 0; // Remove petal
        if (clickedTile === 7 && world[tileY + 1]?.[tileX] === 6) world[tileY + 1][tileX] = 0; // Remove stem
        world[tileY][tileX] = 0;
        inventory.items.find(i => i.type === 'lily').amount++;
    }

    // --- Placing Logic ---
    if (clickedTile === 0) { // Can only place in empty space
        if (selectedItem.type === 'stone' && selectedItem.amount > 0) {
            world[tileY][tileX] = 3; // Place stone
            selectedItem.amount--;
        } else if (selectedItem.type === 'wood' && selectedItem.amount > 0) {
            world[tileY][tileX] = 4; // Place wood
            selectedItem.amount--;
        } else if (selectedItem.type === 'dirt' && selectedItem.amount > 0) {
            world[tileY][tileX] = 2; // Place dirt
            selectedItem.amount--;
        } else if (selectedItem.type === 'lily' && selectedItem.amount > 0) {
            // Check if placing on grass
            if (world[tileY + 1]?.[tileX] === 1) {
                world[tileY][tileX] = 6; // Place stem
                world[tileY - 1][tileX] = 7; // Place petal
                selectedItem.amount--;
            }
        }
    }
});

document.addEventListener('keydown', (e) => {
    // Inventory selection with number keys
    if (!isNaN(e.key) && e.key > 0 && e.key <= inventory.items.length) {
        inventory.selectedSlot = parseInt(e.key) - 1;
        return; // Prevent player movement when changing slots
    }

    if (e.key in keys) keys[e.key] = true;

    if (e.key === 'c') {
        document.getElementById('controls-note').classList.toggle('hidden');
    }
    else if (e.key === 't') {
        document.getElementById('message1').classList.add('fade-in');
        document.getElementById('message2').classList.add('fade-in');
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

document.getElementById('close-note-btn').addEventListener('click', () => {
    document.getElementById('controls-note').classList.add('hidden');
});

document.getElementById('controls-tab').addEventListener('click', () => {
    document.getElementById('controls-note').classList.toggle('hidden');
});

document.getElementById('save-btn').addEventListener('click', saveGameState);

document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to start a new world? Your current saved world will be lost.")) {
        localStorage.removeItem('sereludeSaveData');
        initWorld(); // Generate a brand new world
    }
});

// --- Game Start Logic ---
function startGame() {
    if (!loadGameState()) {
        // If no save file exists, set canvas size and create a new world
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        worldWidth = Math.ceil(canvas.width / TILE_SIZE);
        worldHeight = Math.ceil(canvas.height / TILE_SIZE);
        initWorld();
    }
    resizeCanvas(); // Ensure background elements are sized correctly
    requestAnimationFrame(animate);
}

function drawPixelText(ctx, text, startX, startY, pixelSize, color) {
    const font = {
        'S': [[1,0],[2,0],[3,0],[0,1],[1,2],[2,2],[3,2],[4,3],[1,4],[2,4],[3,4]],
        'E': [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[1,2],[2,2],[0,3],[0,4],[1,4],[2,4],[3,4]],
        'R': [[0,0],[1,0],[2,0],[0,1],[3,1],[0,2],[1,2],[0,3],[2,3],[0,4],[3,4]],
        'L': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4]],
        'U': [[0,0],[3,0],[0,1],[3,1],[0,2],[3,2],[0,3],[3,3],[1,4],[2,4]],
        'D': [[0,0],[1,0],[2,0],[0,1],[3,1],[0,2],[3,2],[0,3],[3,3],[0,4],[1,4],[2,4]],
        'heart': [[1,0],[5,0],[0,1],[2,1],[4,1],[6,1],[0,2],[6,2],[0,3],[6,3],[1,4],[5,4],[2,5],[4,5],[3,6]]
    };

    ctx.fillStyle = color;
    let currentX = startX;

    for (const char of text.toUpperCase()) {
        if (font[char]) {
            font[char].forEach(p => {
                ctx.fillRect(currentX + p[0] * pixelSize, startY + p[1] * pixelSize, pixelSize, pixelSize);
            });
            currentX += 6 * pixelSize; // Advance for next character
        }
    }
    return currentX; // Return position after last char
}

function drawLogo() {
    const logoCanvas = document.getElementById('logo-canvas');
    if (!logoCanvas) return;
    const logoCtx = logoCanvas.getContext('2d');
    const pixelSize = 4;
    
    logoCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);

    // Draw "Serelude"
    const textEndX = drawPixelText(logoCtx, 'SERELUDE', 20, 30, pixelSize, '#2E2E2E');

    // Draw heart
    const heartData = [[1,0],[5,0],[0,1],[2,1],[4,1],[6,1],[0,2],[6,2],[0,3],[6,3],[1,4],[5,4],[2,5],[4,5],[3,6]];
    logoCtx.fillStyle = '#F2A9A9';
    heartData.forEach(p => {
        logoCtx.fillRect(textEndX + p[0] * pixelSize, 30 + p[1] * pixelSize, pixelSize, pixelSize);
    });
}

// --- Game Start Logic ---

// Draw the logo as soon as the script loads
drawLogo();

document.getElementById('start-game-btn').addEventListener('click', () => {
    const titleScreen = document.getElementById('title-screen');
    titleScreen.classList.add('hidden');

    // Wait for fade out animation to finish before starting the game
    titleScreen.addEventListener('transitionend', () => {
        startGame();
    }, { once: true });
});
