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
    speed: 5,
    jumpForce: 10,
    onGround: false
};

const inventory = {
    items: [
        { type: 'axe', name: 'Axe' },
        { type: 'pickaxe', name: 'Pickaxe' },
        { type: 'stone', name: 'Stone', amount: 0 },
        { type: 'wood', name: 'Wood', amount: 0 }
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
    leaves: '#556B2F'
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
  worldWidth = Math.ceil(canvas.width / TILE_SIZE);
  worldHeight = Math.ceil(canvas.height / TILE_SIZE);
  initWorld();
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
}

function generateTrees(groundLevelY) {
    for (let x = 0; x < worldWidth; x++) {
        // Use Math.random() to decide whether to plant a tree
        if (Math.random() < 0.1) { // 10% chance to plant a tree
            const treeHeight = Math.floor(Math.random() * 4) + 4; // Tree height between 4 and 7
            const treeTopY = groundLevelY - treeHeight;

            // Don't plant trees too close to the edge
            if (x < 3 || x > worldWidth - 3) continue;

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
        }
    }
}

function isSolid(tileType) {
    // 1: grass, 2: dirt, 3: stone are solid.
    // 4: wood, 5: leaves are background tiles and not solid.
    return tileType === 1 || tileType === 2 || tileType === 3;
}

function drawWorld() {
    // Draw background tiles first (trees)
    for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
            const tileType = world[y][x];
            if (tileType === 4 || tileType === 5) { // Wood or Leaves
                ctx.fillStyle = tileType === 4 ? tileColors.wood : tileColors.leaves;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw foreground tiles (solid ground)
    for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
            const tileType = world[y][x];
            if (isSolid(tileType)) {
                let color = tileType === 1 ? tileColors.grass : (tileType === 2 ? tileColors.dirt : tileColors.stone);
                ctx.fillStyle = color;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
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
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.4,
            radius: Math.random() * 20 + 20,
            speed: Math.random() * 0.2 + 0.1
        });
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
        ctx.beginPath();
        ctx.fillStyle = 'rgba(250, 250, 240, 0.7)';
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.arc(cloud.x + 20, cloud.y + 10, cloud.radius, 0, Math.PI * 2);
        ctx.arc(cloud.x - 20, cloud.y + 10, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.radius * 2) {
            cloud.x = -cloud.radius * 2;
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
        celestialBody.angle += 0.001;
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
  ctx.fillStyle = '#F2A9A9'; // Player color
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawHeart(cx, cy, size) {
    ctx.fillStyle = '#F2A9A9';
    const s = size / 4; // pixel size
    ctx.fillRect(cx - s, cy - s * 2, s, s);
    ctx.fillRect(cx + s, cy - s * 2, s, s);
    ctx.fillRect(cx - s * 2, cy - s, s, s);
    ctx.fillRect(cx, cy - s, s, s);
    ctx.fillRect(cx + s * 2, cy - s, s, s);
    ctx.fillRect(cx - s, cy, s, s);
    ctx.fillRect(cx + s, cy, s, s);
    ctx.fillRect(cx, cy + s, s, s);
}

function updatePlayer() {
  // Horizontal movement
  if (keys.a) player.vx = -player.speed;
  else if (keys.d) player.vx = player.speed;
  else player.vx = 0;

  // Jumping
  if ((keys.w || keys[' ']) && player.onGround) {
      player.vy = -player.jumpForce;
      player.onGround = false;
  }

  // Apply gravity
  player.vy += 0.5; // Simple gravity

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

function drawInventory() {
    const slotSize = 50;
    const padding = 10;
    const startX = (canvas.width - (inventory.items.length * (slotSize + padding))) / 2;
    const startY = 20;

    inventory.items.forEach((item, index) => {
        const slotX = startX + index * (slotSize + padding);
        
        // Draw slot
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(slotX, startY, slotSize, slotSize);

        // Draw selection highlight
        if (index === inventory.selectedSlot) {
            ctx.strokeStyle = '#F2A9A9'; // blush pink
            ctx.lineWidth = 3;
            ctx.strokeRect(slotX, startY, slotSize, slotSize);
        }

        // Draw item name (simplified representation)
        ctx.fillStyle = 'white';
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, slotX + slotSize / 2, startY + 20);

        // Draw amount if applicable
        if (item.amount !== undefined) {
            ctx.font = '10px Segoe UI';
            ctx.fillText(item.amount, slotX + slotSize / 2, startY + 40);
        }
    });
}

function animate() {
  drawSky();
  drawWorld();
  drawBackground();
  updatePlayer();
  drawPlayer();
  drawInventory();

  hearts.forEach(heart => {
    drawHeart(heart.x, heart.y, heart.size);
  });

  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    initBackgroundParticles();
    initClouds();
});
resizeCanvas();
initBackgroundParticles();
initClouds();
requestAnimationFrame(animate);

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

    // Mining trees with an axe
    if ((clickedTile === 4 || clickedTile === 5) && selectedItem.type === 'axe') {
        world[tileY][tileX] = 0; // Remove tile
        const woodItem = inventory.items.find(item => item.type === 'wood');
        if (woodItem) woodItem.amount++;
    }
    // Placing stone (for now, this uses the old logic but could be tied to inventory)
    else if (clickedTile === 0) {
        world[tileY][tileX] = 3; // Place stone
    }
});

document.addEventListener('keydown', (e) => {
    // Inventory selection with number keys
    if (!isNaN(e.key) && e.key > 0 && e.key <= inventory.items.length) {
        inventory.selectedSlot = parseInt(e.key) - 1;
        return; // Prevent player movement when changing slots
    }

    if (e.key in keys) keys[e.key] = true;

    if (e.key === 'h') {
        for (let i = 0; i < 10; i++) {
            hearts.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 10 + 5});
        }
    } else if (e.key === 't') {
        document.getElementById('message1').classList.add('fade-in');
        document.getElementById('message2').classList.add('fade-in');
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});
