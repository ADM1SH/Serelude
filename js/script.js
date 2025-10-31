const g = {
    c: document.getElementById('animationCanvas'),
    x: null,
    mc: document.getElementById('minimap-canvas'),
    mx: null,
    minimapBuffer: null,
    minimapBufferCtx: null,
    TILE_SIZE: 20,
    world: [],
    worldWidth: 200,
    worldHeight: 60,
    player: {
        x: 0,
        y: 0,
        width: 20,
        height: 40,
        vx: 0,
        vy: 0,
        speed: 4,
        jumpForce: 9,
        onGround: false,
        direction: 'right',
        isWalking: false,
        walkFrame: 0,
        walkFrameTimer: 0
    },
    inventory: {
        items: [
            { type: 'axe', name: 'Axe' },
            { type: 'pickaxe', name: 'Pickaxe' },
            { type: 'stone', name: 'Stone', amount: 0 },
            { type: 'wood', name: 'Wood', amount: 0 },
            { type: 'dirt', name: 'Dirt', amount: 0 },
            { type: 'lily', name: 'Lily', amount: 0 },
            { type: 'sapling', name: 'Sapling', amount: 0 }
        ],
        selectedSlot: 0
    },
    keys: {
        a: false,
        d: false,
        w: false,
        ' ': false
    },
    hearts: [],
    titleScreenHearts: [],
    rainingHearts: [],
    clouds: [],
    creatures: [],
    shootingStars: [],
    celestialBody: { angle: -Math.PI },
    isNight: false,
    isDraggingSunMoon: false,
    currentAnimationId: null,
    gameState: 'title',
    startButton: null,
    camera: {
        x: 0,
        y: 0
    },
    tileColors: {
        sky: 'transparent',
        grass: '#78C04A',
        grassDark: '#5E9A3B',
        dirt: '#8B5A2B',
        dirtLight: '#A97B4F',
        stone: '#6B6B6B',
        stoneLight: '#8A8A8A',
        wood: '#5A3B20',
        leaves: '#3B7D2B',
        flowerStem: '#4CAF50',
        flowerPetal: '#FFEB3B',
        sapling: '#6D4C41'
    },
    timePalettes: {
        dawn: { top: '#F2A9A9', bottom: '#F8F8F5' },
        midday: { top: '#D4E6F1', bottom: '#F8F8F5' },
        dusk: { top: '#F2A9A9', bottom: '#FAFAF0' },
        night: { top: '#2E2E2E', bottom: '#4A4A4A' }
    },

    init: function() {
        this.x = this.c.getContext('2d');
        this.mx = this.mc.getContext('2d');
        this.minimapBuffer = document.createElement('canvas');
        this.minimapBufferCtx = this.minimapBuffer.getContext('2d');

        if (!this.loadGameState()) {
            this.initWorld();
        }
        this.resizeCanvas();
        this.initRainingHearts();
        this.renderMinimapBackground();
        this.mainLoop();

        document.addEventListener('keydown', (e) => {
            if (!isNaN(e.key) && e.key > 0 && e.key <= this.inventory.items.length) {
                this.inventory.selectedSlot = parseInt(e.key) - 1;
                return;
            }
            if (e.key in this.keys) this.keys[e.key] = true;
            if (e.key === 'c') {
                document.getElementById('controls-note').classList.toggle('hidden');
            } else if (e.key === 't') {
                document.getElementById('message1').classList.add('fade-in');
                document.getElementById('message2').classList.add('fade-in');
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key in this.keys) this.keys[e.key] = false;
        });

        this.c.addEventListener('mousedown', (event) => {
            const rect = this.c.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const sunMoonX = this.c.width / 2 + Math.cos(this.celestialBody.angle) * (this.c.width / 2 + 30);
            const sunMoonY = this.c.height * 0.8 + Math.sin(this.celestialBody.angle) * (this.c.height * 0.7);
            const dist = Math.sqrt(Math.pow(mouseX - sunMoonX, 2) + Math.pow(mouseY - sunMoonY, 2));

            if (dist < 40) {
                this.isDraggingSunMoon = true;
            }
        });

        this.c.addEventListener('mouseup', () => {
            this.isDraggingSunMoon = false;
        });

        this.c.addEventListener('mouseleave', () => {
            this.isDraggingSunMoon = false;
        });

        this.c.addEventListener('mousemove', (event) => {
            if (this.isDraggingSunMoon) {
                const rect = this.c.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const dx = mouseX - this.c.width / 2;
                const dy = mouseY - this.c.height * 0.8;
                this.celestialBody.angle = Math.atan2(dy, dx);
                return;
            }
        });

        this.c.addEventListener('click', (event) => {
            if (this.gameState === 'title') {
                const rect = this.c.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                const clickY = event.clientY - rect.top;

                if (this.startButton && clickX >= this.startButton.x && clickX <= this.startButton.x + this.startButton.width &&
                    clickY >= this.startButton.y && clickY <= this.startButton.y + this.startButton.height) {
                    this.startGame();
                }
                return;
            }

            if (this.isDraggingSunMoon) return;
            const rect = this.c.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            const tileX = Math.floor((clickX + this.camera.x) / this.TILE_SIZE);
            const tileY = Math.floor((clickY + this.camera.y) / this.TILE_SIZE);

            if (!this.world[tileY] || this.world[tileY][tileX] === undefined) return;

            const playerTileX = Math.floor((this.player.x + this.player.width / 2) / this.TILE_SIZE);
            const playerTileY = Math.floor((this.player.y + this.player.height / 2) / this.TILE_SIZE);
            const distance = Math.sqrt(Math.pow(tileX - playerTileX, 2) + Math.pow(tileY - playerTileY, 2));

            if (distance > 5) return;

            const selectedItem = this.inventory.items[this.inventory.selectedSlot];
            const clickedTile = this.world[tileY][tileX];
            let worldModified = false;

            if (selectedItem.type === 'axe') {
                if (clickedTile === 4 || clickedTile === 5) {
                    this.destroyTree(tileX, tileY);
                    this.inventory.items.find(i => i.type === 'wood').amount++;
                    worldModified = true;
                }
            }
            else if (selectedItem.type === 'pickaxe') {
                if (clickedTile === 1 || clickedTile === 2) {
                    this.world[tileY][tileX] = 0;
                    this.inventory.items.find(i => i.type === 'dirt').amount++;
                    worldModified = true;
                } else if (clickedTile === 3) {
                    this.world[tileY][tileX] = 0;
                    this.inventory.items.find(i => i.type === 'stone').amount++;
                    worldModified = true;
                }
            }

            if (clickedTile === 6 || clickedTile === 7) {
                if (clickedTile === 6 && this.world[tileY - 1]?.[tileX] === 7) this.world[tileY - 1][tileX] = 0;
                if (clickedTile === 7 && this.world[tileY + 1]?.[tileX] === 6) this.world[tileY + 1][tileX] = 0;
                this.world[tileY][tileX] = 0;
                this.inventory.items.find(i => i.type === 'lily').amount++;
                worldModified = true;
            }

            if (clickedTile === 0) {
                if (selectedItem.type === 'stone') {
                    this.world[tileY][tileX] = 3;
                    worldModified = true;
                } else if (selectedItem.type === 'wood') {
                    this.world[tileY][tileX] = 4;
                    worldModified = true;
                } else if (selectedItem.type === 'dirt') {
                    this.world[tileY][tileX] = 2;
                    worldModified = true;
                } else if (selectedItem.type === 'lily') {
                    if (this.world[tileY + 1]?.[tileX] === 1) {
                        this.world[tileY][tileX] = 6;
                        this.world[tileY - 1][tileX] = 7;
                        worldModified = true;
                    }
                } else if (selectedItem.type === 'sapling') {
                    if (this.world[tileY + 1]?.[tileX] === 1) {
                        this.world[tileY][tileX] = 8;
                        setTimeout(() => this.growTree(tileX, tileY), 30000);
                        worldModified = true;
                    }
                }
            }
            if (worldModified) {
                this.renderMinimapBackground();
            }
        });

        document.getElementById('close-note-btn').addEventListener('click', () => {
            document.getElementById('controls-note').classList.add('hidden');
        });

        document.getElementById('controls-tab').addEventListener('click', () => {
            document.getElementById('controls-note').classList.remove('hidden');
        });

        document.getElementById('save-btn').addEventListener('click', () => this.saveGameState());

        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm("Are you sure you want to start a new world? Your current saved world will be lost.")) {
                localStorage.removeItem('SereludeSaveData');
                this.initWorld();
                this.renderMinimapBackground();
            }
        });

        window.addEventListener('resize', () => this.resizeCanvas());
    },

    resizeCanvas: function() {
        this.c.width = window.innerWidth;
        this.c.height = window.innerHeight;
        this.initRainingHearts();
        this.initClouds();
    },

    initWorld: function() {
        this.world = [];
        for (let y = 0; y < this.worldHeight; y++) {
            this.world.push(new Array(this.worldWidth).fill(0));
        }

        const groundLevelY = Math.floor(this.worldHeight * 0.8);

        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                if (y === groundLevelY) {
                    this.world[y][x] = 1;
                } else if (y > groundLevelY) {
                    this.world[y][x] = 2;
                } else {
                    this.world[y][x] = 0;
                }
            }
        }

        this.player.x = this.worldWidth * this.TILE_SIZE / 2;
        this.player.y = groundLevelY * this.TILE_SIZE - this.player.height;

        this.generateTrees(groundLevelY);
        this.generateFlowers(groundLevelY);
        this.initCreatures(groundLevelY);
    },

    saveGameState: function() {
        const gameState = {
            world: this.world,
            player: {
                x: this.player.x,
                y: this.player.y
            },
            inventory: this.inventory.items,
            celestialBody: this.celestialBody
        };
        localStorage.setItem('SereludeSaveData', JSON.stringify(gameState));
        console.log("World Saved!");
    },

    loadGameState: function() {
        const savedStateJSON = localStorage.getItem('SereludeSaveData');
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                this.world = savedState.world;
                this.player.x = savedState.player.x;
                this.player.y = savedState.player.y;
                this.inventory.items = savedState.inventory;
                this.celestialBody = savedState.celestialBody;

                const groundLevelY = this.findGroundLevel();
                this.initCreatures(groundLevelY);
                console.log("World Loaded!");
                return true;
            } catch (e) {
                console.error("Failed to load saved world:", e);
                return false;
            }
        }
        return false;
    },

    findGroundLevel: function() {
        const midX = Math.floor(this.world.length > 0 ? this.world[0].length / 2 : this.worldWidth / 2);
        for (let y = 0; y < this.worldHeight; y++) {
            if (this.isSolid(this.world[y][midX])) {
                return y;
            }
        }
        return Math.floor(this.worldHeight * 0.8);
    },

    generateTrees: function(groundLevelY) {
        let x = 5;
        while (x < this.worldWidth - 3) {
            if (Math.random() < 0.1) {
                const treeHeight = Math.floor(Math.random() * 4) + 4;
                const treeTopY = groundLevelY - treeHeight;

                for (let i = 1; i < treeHeight; i++) {
                    this.world[groundLevelY - i][x] = 4;
                }

                for (let ly = -1; ly <= 1; ly++) {
                    for (let lx = -1; lx <= 1; lx++) {
                        this.world[treeTopY + ly][x + lx] = 5;
                    }
                }
                x += Math.floor(Math.random() * 3) + 4;
            } else {
                x++;
            }
        }
    },

    generateFlowers: function(groundLevelY) {
        let x = 1;
        while (x < this.worldWidth - 1) {
            if (this.world[groundLevelY][x] === 1 && this.world[groundLevelY - 1][x] === 0) {
                if (Math.random() < 0.08) {
                    const clusterSize = Math.floor(Math.random() * 3) + 1;
                    for (let i = 0; i < clusterSize && (x + i) < this.worldWidth - 1; i++) {
                        if (this.world[groundLevelY][x+i] === 1 && this.world[groundLevelY - 1][x+i] === 0) {
                            this.world[groundLevelY - 1][x + i] = 6;
                            this.world[groundLevelY - 2][x + i] = 7;
                        }
                    }
                    x += clusterSize + Math.floor(Math.random() * 5) + 3;
                }
            }
            x++;
        }
    },

    initCreatures: function(groundLevelY) {
        this.creatures = [];
        for (let i = 0; i < 3; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE;
            this.creatures.push({
                type: 'bunny',
                x: spawnX,
                y: groundLevelY * this.TILE_SIZE - this.TILE_SIZE * 1.5,
                width: this.TILE_SIZE,
                height: this.TILE_SIZE * 1.5,
                vx: 0, vy: 0,
                onGround: false,
                direction: Math.random() < 0.5 ? 'left' : 'right',
                aiTimer: Math.random() * 100 + 50,
                dropCooldown: 0
            });
        }
        for (let i = 0; i < 5; i++) {
            this.creatures.push({
                type: 'bird',
                x: Math.random() * this.worldWidth * this.TILE_SIZE,
                y: Math.random() * this.c.height * 0.4,
                width: this.TILE_SIZE * 0.6,
                height: this.TILE_SIZE * 0.6,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                direction: 'right',
                aiTimer: Math.random() * 100
            });
        }
    },

    isSolid: function(tileType) {
        return tileType === 1 || tileType === 2 || tileType === 3;
    },

    drawGrassTile: function(x, y) {
        this.x.fillStyle = this.tileColors.dirt;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
        this.x.fillStyle = this.tileColors.grass;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE / 2);
        // Add some pixel details for texture
        this.x.fillStyle = this.tileColors.grassDark;
        this.x.fillRect(x + this.TILE_SIZE * 0.1, y + this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.1);
        this.x.fillRect(x + this.TILE_SIZE * 0.7, y + this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.1);
        this.x.fillRect(x + this.TILE_SIZE * 0.4, y, this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.2);
    },

    drawDirtTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.dirt;
        this.x.fillRect(x, y, size, size);
        // Add some pixel details for texture
        this.x.fillStyle = this.tileColors.dirtLight;
        this.x.fillRect(x + size * 0.2, y + size * 0.3, size * 0.2, size * 0.2);
        this.x.fillRect(x + size * 0.6, y + size * 0.1, size * 0.2, size * 0.2);
        this.x.fillRect(x + size * 0.1, y + size * 0.7, size * 0.3, size * 0.2);
    },

    drawStoneTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.stone;
        this.x.fillRect(x, y, size, size);
        // Add some pixel details for texture
        this.x.fillStyle = this.tileColors.stoneLight;
        this.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.3, size * 0.3);
        this.x.fillRect(x + size * 0.6, y + size * 0.4, size * 0.3, size * 0.3);
        this.x.fillRect(x + size * 0.3, y + size * 0.7, size * 0.2, size * 0.2);
    },

    drawWoodTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.wood;
        this.x.fillRect(x, y, size, size);
        this.x.fillStyle = '#a86a32';
        this.x.fillRect(x + size * 0.2, y, size * 0.2, size);
    },

    drawLeavesTile: function(x, y) {
        this.x.fillStyle = this.tileColors.leaves;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
        this.x.fillStyle = '#6b8e23';
        this.x.fillRect(x + this.TILE_SIZE * 0.1, y + this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
        this.x.fillRect(x + this.TILE_SIZE * 0.5, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
    },

    drawFlowerStemTile: function(x, y) {
        this.x.fillStyle = this.tileColors.flowerStem;
        this.x.fillRect(x + this.TILE_SIZE * 0.4, y, this.TILE_SIZE * 0.2, this.TILE_SIZE);
    },

    drawFlowerPetalTile: function(x, y) {
        this.x.fillStyle = this.tileColors.flowerPetal;
        this.x.fillRect(x + this.TILE_SIZE * 0.3, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
        this.x.fillStyle = '#e0e0d1';
        this.x.fillRect(x + this.TILE_SIZE * 0.4, y + this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.2);
    },

    drawBird: function(bird) {
        this.x.save();
        const birdCenterX = bird.x + bird.width / 2;

        if (bird.direction === 'left') {
            this.x.translate(birdCenterX, 0);
            this.x.scale(-1, 1);
            this.x.translate(-birdCenterX, 0);
        }
        
        const pSize = bird.width / 4;
        this.x.fillStyle = '#4a4a4a'; // Body color

        // Body
        this.x.fillRect(bird.x + pSize, bird.y + pSize, pSize * 2, pSize);
        this.x.fillRect(bird.x, bird.y + pSize * 2, pSize * 3, pSize); // Lower body

        // Head
        this.x.fillRect(bird.x + pSize * 3, bird.y, pSize, pSize);

        // Wing
        this.x.fillStyle = '#6a6a6a';
        this.x.fillRect(bird.x, bird.y, pSize * 2, pSize);

        // Beak
        this.x.fillStyle = '#FFD700';
        this.x.fillRect(bird.x + pSize * 4, bird.y + pSize, pSize, pSize / 2);

        // Eye
        this.x.fillStyle = 'white';
        this.x.fillRect(bird.x + pSize * 3.5, bird.y + pSize * 0.5, pSize * 0.5, pSize * 0.5);
        this.x.fillStyle = 'black';
        this.x.fillRect(bird.x + pSize * 3.7, bird.y + pSize * 0.7, pSize * 0.2, pSize * 0.2);

        this.x.restore();
    },

    drawSaplingTile: function(x, y) {
        this.x.fillStyle = this.tileColors.sapling;
        this.x.fillRect(x + this.TILE_SIZE * 0.4, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.5);
        this.x.fillStyle = this.tileColors.leaves;
        this.x.fillRect(x + this.TILE_SIZE * 0.3, y + this.TILE_SIZE * 0.3, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
    },

    drawWorld: function() {
        const startCol = Math.floor(this.camera.x / this.TILE_SIZE);
        const endCol = startCol + (this.c.width / this.TILE_SIZE) + 2;
        const startRow = Math.floor(this.camera.y / this.TILE_SIZE);
        const endRow = startRow + (this.c.height / this.TILE_SIZE) + 2;

        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                if (x < 0 || x >= this.worldWidth || y < 0 || y >= this.worldHeight) continue;

                const tileType = this.world[y][x];
                const tileX = x * this.TILE_SIZE - this.camera.x;
                const tileY = y * this.TILE_SIZE - this.camera.y;

                switch (tileType) {
                    case 1: this.drawGrassTile(tileX, tileY); break;
                    case 2: this.drawDirtTile(tileX, tileY); break;
                    case 3: this.drawStoneTile(tileX, tileY); break;
                    case 4: this.drawWoodTile(tileX, tileY); break;
                    case 5: this.drawLeavesTile(tileX, tileY); break;
                    case 6: this.drawFlowerStemTile(tileX, tileY); break;
                    case 7: this.drawFlowerPetalTile(tileX, tileY); break;
                    case 8: this.drawSaplingTile(tileX, tileY); break;
                }
            }
        }
    },

    initRainingHearts: function() {
        this.rainingHearts = [];
        for (let i = 0; i < 50; i++) {
            this.rainingHearts.push({
                x: Math.random() * this.c.width,
                y: Math.random() * this.c.height - this.c.height, // Start above canvas
                size: Math.random() * 5 + 5,
                vy: Math.random() * 1 + 0.5
            });
        }
    },

    initClouds: function() {
        this.clouds = [];
        const cloudPixelSize = 15;
        for (let i = 0; i < 5; i++) {
            const cloud = {
                x: Math.random() * this.c.width,
                y: Math.random() * this.c.height * 0.3 + 20,
                speed: Math.random() * 0.2 + 0.1,
                blocks: [],
                width: 0
            };

            const cloudLength = Math.floor(Math.random() * 4) + 3;
            let currentX = 0;
            for (let j = 0; j < cloudLength; j++) {
                const blockWidth = (Math.random() * 1.5 + 0.5) * cloudPixelSize;
                const blockHeight = (Math.random() * 1.5 + 0.5) * cloudPixelSize;
                const blockYOffset = (Math.random() - 0.5) * cloudPixelSize;
                cloud.blocks.push({ rx: currentX, ry: blockYOffset, width: blockWidth, height: blockHeight });
                currentX += blockWidth * 0.7; // Overlap blocks slightly
            }
            cloud.width = currentX;

            this.clouds.push(cloud);
        }
    },

    lerpColor: function(color1, color2, factor) {
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
    },

    drawSky: function() {
        const angle = this.celestialBody.angle;
        this.isNight = Math.sin(angle) >= 0;

        let topColor, bottomColor;
        const transitionFactor = Math.abs(Math.sin(angle));

        if (angle > -Math.PI && angle < -Math.PI / 2) {
            topColor = this.lerpColor(this.timePalettes.night.top, this.timePalettes.dawn.top, transitionFactor);
            bottomColor = this.lerpColor(this.timePalettes.night.bottom, this.timePalettes.dawn.bottom, transitionFactor);
        } else if (angle > -Math.PI / 2 && angle < 0) {
            topColor = this.lerpColor(this.timePalettes.dawn.top, this.timePalettes.midday.top, 1 - transitionFactor);
            bottomColor = this.lerpColor(this.timePalettes.dawn.bottom, this.timePalettes.midday.bottom, 1 - transitionFactor);
        } else if (angle > 0 && angle < Math.PI / 2) {
            topColor = this.lerpColor(this.timePalettes.midday.top, this.timePalettes.dusk.top, transitionFactor);
            bottomColor = this.lerpColor(this.timePalettes.midday.bottom, this.timePalettes.dusk.bottom, transitionFactor);
        } else {
            topColor = this.lerpColor(this.timePalettes.dusk.top, this.timePalettes.night.top, 1 - transitionFactor);
            bottomColor = this.lerpColor(this.timePalettes.dusk.bottom, this.timePalettes.night.bottom, 1 - transitionFactor);
        }

        const skyGradient = this.x.createLinearGradient(0, 0, 0, this.c.height * 0.8);
        skyGradient.addColorStop(0, topColor);
        skyGradient.addColorStop(1, bottomColor);
        this.x.fillStyle = skyGradient;
        this.x.fillRect(0, 0, this.c.width, this.c.height);

        const sunMoonX = this.c.width / 2 + Math.cos(this.celestialBody.angle) * (this.c.width / 2 + 30);
        const sunMoonY = this.c.height * 0.8 + Math.sin(this.celestialBody.angle) * (this.c.height * 0.7);
        const sunMoonRadius = 30;
        
        if (this.isNight) {
            this.x.fillStyle = '#FAFAF0';
            this.x.shadowBlur = 20;
            this.x.shadowColor = '#FAFAF0';
        } else {
            this.x.fillStyle = '#F2A9A9';
            this.x.shadowBlur = 30;
            this.x.shadowColor = 'rgba(242, 169, 169, 0.8)';
        }
        this.x.beginPath();
        this.x.arc(sunMoonX, sunMoonY, sunMoonRadius, 0, Math.PI * 2);
        this.x.fill();
        this.x.shadowBlur = 0;

        this.clouds.forEach(cloud => {
            this.x.fillStyle = 'rgba(250, 250, 240, 0.7)';
            cloud.blocks.forEach(block => {
                this.x.fillRect(cloud.x + block.rx, cloud.y + block.ry, block.width, block.height);
            });

            cloud.x += cloud.speed;
            if (cloud.x > this.c.width) {
                cloud.x = -cloud.width;
            }
        });

        if (this.isNight) {
            if (Math.random() < 0.01) {
                this.shootingStars.push({
                    x: Math.random() * this.c.width,
                    y: Math.random() * this.c.height * 0.5,
                    len: Math.random() * 80 + 20,
                    speed: Math.random() * 5 + 5,
                    life: 100
                });
            }
        }

        this.shootingStars.forEach((star, index) => {
            this.x.strokeStyle = 'rgba(250, 250, 240, 0.8)';
            this.x.lineWidth = 2;
            this.x.beginPath();
            this.x.moveTo(star.x, star.y);
            this.x.lineTo(star.x - star.len, star.y + star.len);
            this.x.stroke();
            star.x -= star.speed;
            star.y += star.speed;
            star.life--;
            if (star.life <= 0) {
                this.shootingStars.splice(index, 1);
            }
        });

        if (!this.isDraggingSunMoon) {
            this.celestialBody.angle += 0.0003;
            if (this.celestialBody.angle > Math.PI) {
                this.celestialBody.angle = -Math.PI;
            }
        }
    },

    drawRainingHearts: function() {
        this.rainingHearts.forEach(heart => {
            this.drawHeart(heart.x, heart.y, heart.size);
            heart.y += heart.vy;
            if (heart.y > this.c.height) {
                heart.y = -heart.size; // Reset above canvas
                heart.x = Math.random() * this.c.width;
            }
        });
    },

    checkCollision: function(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    drawPlayer: function() {
        this.x.save();
        const playerCenterX = this.player.x - this.camera.x + this.player.width / 2;
        
        if (this.player.direction === 'left') {
            this.x.translate(playerCenterX, 0);
            this.x.scale(-1, 1);
            this.x.translate(-playerCenterX, 0);
        }

        const pSize = this.TILE_SIZE / 5;

        const skin = '#f2d3ab';
        const hair = '#5d4037';
        const shirt = '#a9c8b6';
        const pants = '#6a6a6a';
        const shoes = '#4a4a4a';

        // Head
        this.x.fillStyle = skin;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y, pSize * 3, pSize * 4);
        this.x.fillStyle = hair;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y, pSize * 4, pSize * 2);
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 2, pSize, pSize);
        this.x.fillStyle = '#2E2E2E'; // Eyes
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 2, pSize, pSize);

        // Body
        this.x.fillStyle = shirt;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 4, pSize * 3, pSize * 3);
        this.x.fillRect(this.player.x - this.camera.x + pSize * 4, this.player.y - this.camera.y + pSize * 4, pSize, pSize * 2); // Arm
        this.x.fillStyle = skin;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 4, this.player.y - this.camera.y + pSize * 6, pSize, pSize); // Hand

        // Legs
        this.x.fillStyle = pants;
        if (this.player.isWalking) {
            if (this.player.walkFrame === 0) {
                this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
                this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 7, pSize, pSize); // Leg 2 shorter
            } else {
                this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 7, pSize, pSize); // Leg 1 shorter
                this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
            }
        } else {
            this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
            this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
        }

        // Shoes
        this.x.fillStyle = shoes;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 9, pSize, pSize);
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 9, pSize, pSize);

        this.x.restore();
    },

    drawHeart: function(cx, cy, size) {
        this.x.fillStyle = '#F2A9A9'; // Main heart color
        const s = size / 5;

        // Top left lobe
        this.x.fillRect(cx - s * 2, cy - s * 1.5, s * 2, s * 2);
        // Top right lobe
        this.x.fillRect(cx, cy - s * 1.5, s * 2, s * 2);
        // Bottom point
        this.x.fillRect(cx - s * 1.5, cy + s * 0.5, s * 3, s * 3);
        this.x.fillRect(cx - s, cy + s * 1.5, s * 2, s * 2);
        this.x.fillRect(cx - s * 0.5, cy + s * 2.5, s, s);

        // Outline/Shading (optional, for more detail)
        this.x.fillStyle = '#D46A6A'; // Darker shade for outline
        this.x.fillRect(cx - s * 2.5, cy - s * 1, s * 0.5, s * 2.5);
        this.x.fillRect(cx + s * 2, cy - s * 1, s * 0.5, s * 2.5);
        this.x.fillRect(cx - s * 1.5, cy + s * 3.5, s * 3, s * 0.5);
    },

    drawBunny: function(bunny) {
        this.x.save();
        const bunnyCenterX = bunny.x - this.camera.x + bunny.width / 2;

        if (bunny.direction === 'left') {
            this.x.translate(bunnyCenterX, 0);
            this.x.scale(-1, 1);
            this.x.translate(-bunnyCenterX, 0);
        }

        const pSize = this.TILE_SIZE / 5;

        const bodyColor = '#d3c5b3';
        const earColor = '#e0d6c7';
        const eyeColor = '#2E2E2E';
        const tailColor = '#FAFAF0';

        // Body
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize, bunny.y - this.camera.y + pSize * 4, pSize * 3, pSize * 2);
        this.x.fillRect(bunny.x - this.camera.x + pSize * 2, bunny.y - this.camera.y + pSize * 3, pSize * 2, pSize);

        // Tail
        this.x.fillStyle = tailColor;
        this.x.fillRect(bunny.x - this.camera.x, bunny.y - this.camera.y + pSize * 4, pSize, pSize);

        // Head
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3, bunny.y - this.camera.y + pSize * 2, pSize * 2, pSize * 2);

        // Ears
        this.x.fillStyle = earColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3, bunny.y - this.camera.y, pSize, pSize * 3);
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 4, bunny.y - this.camera.y + pSize, pSize, pSize * 2);

        // Eye
        this.x.fillStyle = eyeColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 4, bunny.y - this.camera.y + pSize * 2, pSize, pSize);

        this.x.restore();
    },

    updateCreatures: function() {
        this.creatures.forEach(creature => {
            if (creature.type === 'bunny') {
                creature.vy += 0.5;
                creature.y += creature.vy;

                creature.aiTimer--;
                if (creature.aiTimer <= 0) {
                    const action = Math.random();
                    if (action < 0.4) {
                        if (creature.onGround) {
                            creature.vy = -4;
                            creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 1 + 1);
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
                    const distToPlayer = Math.hypot(this.player.x - creature.x, this.player.y - creature.y);
                    if (distToPlayer < this.TILE_SIZE * 4) {
                        this.hearts.push({ x: creature.x + creature.width / 2, y: creature.y, size: 10, life: 120, vy: -1 });
                        if (creature.onGround) {
                            creature.vy = -6;
                            creature.vx = this.player.x < creature.x ? 3 : -3;
                        }
                        creature.dropCooldown = 60;
                    }
                }

                creature.x += creature.vx;

                creature.onGround = false;
                const startY = Math.floor(creature.y / this.TILE_SIZE);
                const endY = Math.floor((creature.y + creature.height) / this.TILE_SIZE);
                const tileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

                for (let y = startY; y <= endY; y++) {
                    if (this.world[y] && this.isSolid(this.world[y][tileX])) {
                        const tile = { x: tileX * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };
                        if (this.checkCollision(creature, tile)) {
                            if (creature.vy > 0) {
                                creature.y = tile.y - creature.height;
                                creature.vy = 0;
                                creature.onGround = true;
                                creature.vx *= 0.8;
                            }
                        }
                    }
                }

                if (creature.x < 0) { creature.x = 0; creature.direction = 'right'; }
                if (creature.x + creature.width > this.worldWidth * this.TILE_SIZE) { creature.x = this.worldWidth * this.TILE_SIZE - creature.width; creature.direction = 'left'; }
            } else if (creature.type === 'bird') {
                creature.aiTimer--;
                if (creature.aiTimer <= 0) {
                    creature.vx += (Math.random() - 0.5) * 0.5;
                    creature.vy += (Math.random() - 0.5) * 0.5;
                    creature.vx = Math.max(-1, Math.min(1, creature.vx));
                    creature.vy = Math.max(-1, Math.min(1, creature.vy));
                    creature.aiTimer = Math.random() * 100 + 50;
                }

                creature.x += creature.vx;
                creature.y += creature.vy;
                creature.direction = creature.vx >= 0 ? 'right' : 'left';

                if (creature.x < 0 || creature.x + creature.width > this.worldWidth * this.TILE_SIZE) creature.vx *= -1;
                if (creature.y < 0 || creature.y + creature.height > this.worldHeight * this.TILE_SIZE * 0.6) creature.vy *= -1;
            }
        });
    },

    updatePlayer: function() {
        if (this.keys.a) {
            this.player.vx = -this.player.speed;
            this.player.direction = 'left';
            this.player.isWalking = true;
        } else if (this.keys.d) {
            this.player.vx = this.player.speed;
            this.player.direction = 'right';
            this.player.isWalking = true;
        } else {
            this.player.vx = 0;
            this.player.isWalking = false;
        }

        this.player.walkFrameTimer++;
        if (this.player.walkFrameTimer > 8) { this.player.walkFrame = 1 - this.player.walkFrame; this.player.walkFrameTimer = 0; }

        if ((this.keys.w || this.keys[' ']) && this.player.onGround) {
            this.player.vy = -this.player.jumpForce;
            this.player.onGround = false;
        }

        this.player.vy += 0.4;

        this.player.x += this.player.vx;

        let startX = Math.floor(this.player.x / this.TILE_SIZE);
        let endX = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        let startY = Math.floor(this.player.y / this.TILE_SIZE);
        let endY = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.world[y] && this.isSolid(this.world[y][x])) {
                    if (y < 0 || y >= this.worldHeight || x < 0 || x >= this.worldWidth) {
                        continue;
                    }
                    const tile = { x: x * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };
                    if (this.checkCollision(this.player, tile)) {
                        if (this.player.vx > 0) {
                            this.player.x = tile.x - this.player.width;
                        } else if (this.player.vx < 0) {
                            this.player.x = tile.x + tile.width;
                        }
                        this.player.vx = 0;
                    }
                }
            }
        }

        this.player.y += this.player.vy;
        this.player.onGround = false;

        startX = Math.floor(this.player.x / this.TILE_SIZE);
        endX = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        startY = Math.floor(this.player.y / this.TILE_SIZE);
        endY = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.world[y] && this.isSolid(this.world[y][x])) {
                    if (y < 0 || y >= this.worldHeight || x < 0 || x >= this.worldWidth) {
                        continue;
                    }
                    const tile = { x: x * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };
                    if (this.checkCollision(this.player, tile)) {
                        if (this.player.vy > 0) {
                            this.player.y = tile.y - this.player.height;
                            this.player.vy = 0;
                            this.player.onGround = true;
                        } else if (this.player.vy < 0) {
                            this.player.y = tile.y + tile.height;
                            this.player.vy = 0;
                        }
                    }
                }
            }
        }

        if (this.player.x < 0) {
            this.player.x = 0;
        }
        if (this.player.x + this.player.width > this.worldWidth * this.TILE_SIZE) {
            this.player.x = this.worldWidth * this.TILE_SIZE - this.player.width;
        }
    },

    drawItemIcon: function(item, x, y, size) {
        const p = size / 16;
        this.x.save();
        this.x.translate(x, y);

        switch (item.type) {
            case 'axe':
                this.x.fillStyle = '#a86a32';
                this.x.fillRect(p * 7, p * 5, p * 2, p * 9);
                this.x.fillRect(p * 6, p * 6, p, p * 7);
                this.x.fillStyle = '#8B5A2B';
                this.x.fillRect(p * 8, p * 5, p, p * 8);
                this.x.fillStyle = '#6a6a6a';
                this.x.fillRect(p * 5, p * 2, p * 6, p * 5);
                this.x.fillRect(p * 6, p * 1, p * 4, p * 6);
                this.x.fillStyle = '#808080';
                this.x.fillRect(p * 6, p * 2, p * 4, p * 4);
                this.x.fillStyle = '#9a9a9a';
                this.x.fillRect(p * 5, p * 3, p, p * 2);
                this.x.fillRect(p * 10, p * 3, p, p * 2);
                break;
            case 'pickaxe':
                this.x.fillStyle = '#a86a32';
                this.x.fillRect(p * 7, p * 4, p * 2, p * 10);
                this.x.fillStyle = '#8B5A2B';
                this.x.fillRect(p * 8, p * 4, p, p * 9);
                this.x.fillStyle = '#6a6a6a';
                this.x.fillRect(p * 4, p * 3, p * 8, p * 3);
                this.x.fillRect(p * 3, p * 4, p * 10, p);
                this.x.fillStyle = '#808080';
                this.x.fillRect(p * 5, p * 4, p * 6, p);
                this.x.fillStyle = '#9a9a9a';
                this.x.fillRect(p * 3, p * 3, p * 2, p);
                this.x.fillRect(p * 11, p * 3, p * 2, p);
                break;
            case 'stone':
                this.drawStoneTile(0, 0, size);
                break;
            case 'wood':
                this.drawWoodTile(0, 0, size);
                break;
            case 'dirt':
                this.drawDirtTile(0, 0, size);
                break;
            case 'lily':
                this.x.fillStyle = this.tileColors.flowerStem;
                this.x.fillRect(p * 7, p * 5, p * 2, p * 8);
                this.x.fillStyle = this.tileColors.flowerPetal;
                this.x.fillRect(p * 6, p * 4, p * 4, p * 2);
                this.x.fillRect(p * 5, p * 5, p * 2, p * 2);
                this.x.fillRect(p * 9, p * 5, p * 2, p * 2);
                this.x.fillStyle = '#e0e0d1';
                this.x.fillRect(p * 7, p * 5, p * 2, p);
                break;
            case 'sapling':
                this.x.fillStyle = this.tileColors.sapling;
                this.x.fillRect(p * 7, p * 8, p * 2, p * 6);
                this.x.fillStyle = this.tileColors.leaves;
                this.x.fillRect(p * 6, p * 5, p * 4, p * 4);
                break;
        }
        this.x.restore();
    },

    drawInventory: function() {
        const slotSize = 50;
        const padding = 10;
        const startX = (this.c.width - (this.inventory.items.length * (slotSize + padding))) / 2;
        const startY = 20;

        this.inventory.items.forEach((item, index) => {
            const slotX = startX + index * (slotSize + padding);
            
            if (index === this.inventory.selectedSlot) {
                this.x.shadowColor = 'rgba(242, 169, 169, 0.8)';
                this.x.shadowBlur = 15;
            }

            this.x.fillStyle = 'rgba(46, 46, 46, 0.6)';
            this.x.fillRect(slotX, startY, slotSize, slotSize);
            this.x.shadowBlur = 0;

            if (index === this.inventory.selectedSlot) {
                this.x.strokeStyle = '#F2A9A9';
                this.x.lineWidth = 3;
                this.x.strokeRect(slotX, startY, slotSize, slotSize);
            }

            this.drawItemIcon(item, slotX, startY, slotSize);

            if (item.amount !== undefined) {
                this.x.font = '10px "Press Start 2P"';
                this.x.textAlign = 'right';
                this.x.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.x.fillText(item.amount, slotX + slotSize - 6, startY + slotSize - 5);
                this.x.fillStyle = 'white';
                this.x.fillText(item.amount, slotX + slotSize - 7, startY + slotSize - 6);
                this.x.textAlign = 'center';
            }
        });
    },

    renderMinimapBackground: function() {
        const minimapDisplayWidth = 200;
        const minimapDisplayHeight = Math.floor(this.worldHeight * (minimapDisplayWidth / this.worldWidth));
        this.minimapBuffer.width = this.worldWidth;
        this.minimapBuffer.height = this.worldHeight;

        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const tileType = this.world[y][x];
                let color = 'transparent';
                switch (tileType) {
                    case 1: color = this.tileColors.grass; break;
                    case 2: color = this.tileColors.dirt; break;
                    case 3: color = this.tileColors.stone; break;
                    case 4: color = this.tileColors.wood; break;
                    case 5: color = this.tileColors.leaves; break;
                }
                if (color !== 'transparent') {
                    this.minimapBufferCtx.fillStyle = color;
                    this.minimapBufferCtx.fillRect(x, y, 1, 1);
                }
            }
        }
    },

    drawMinimap: function() {
        const minimapDisplayWidth = 200;
        const minimapDisplayHeight = Math.floor(this.worldHeight * (minimapDisplayWidth / this.worldWidth));

        this.mc.width = minimapDisplayWidth;
        this.mc.height = minimapDisplayHeight;

        this.mx.clearRect(0, 0, minimapDisplayWidth, minimapDisplayHeight);
        this.mx.drawImage(this.minimapBuffer, 0, 0, minimapDisplayWidth, minimapDisplayHeight);

        const playerMinimapX = (this.player.x / this.TILE_SIZE) * (minimapDisplayWidth / this.worldWidth);
        const playerMinimapY = (this.player.y / this.TILE_SIZE) * (minimapDisplayHeight / this.worldHeight);

        this.mx.fillStyle = 'white';
        this.mx.fillRect(playerMinimapX - 3, playerMinimapY - 3, 6, 6);
    },

    destroyTree: function(x, y) {
        const queue = [[x, y]];
        const visited = new Set([`${x},${y}`]);

        const processQueue = () => {
            if (queue.length === 0) {
                this.renderMinimapBackground();
                return;
            }

            const [cx, cy] = queue.shift();
            const tileType = this.world[cy]?.[cx];

            if (tileType === 4 || tileType === 5) {
                this.world[cy][cx] = 0;
                if (tileType === 5 && Math.random() < 0.05) {
                    this.inventory.items.find(i => i.type === 'sapling').amount++;
                }

                for (const [dx, dy] of [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    if (!visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        queue.push([nx, ny]);
                    }
                }
            }
            setTimeout(processQueue, 20);
        };
        processQueue();
    },

    growTree: function(x, y) {
        if (this.world[y]?.[x] !== 8) return;

        const treeHeight = Math.floor(Math.random() * 4) + 4;
        const treeTopY = y - treeHeight + 1;

        for (let i = 0; i < treeHeight; i++) this.world[y - i][x] = 4;
        for (let ly = -1; ly <= 1; ly++) {
            for (let lx = -1; lx <= 1; lx++) this.world[treeTopY + ly][x + lx] = 5;
        }
        this.renderMinimapBackground();
    },

    drawGameWorld: function() {
        this.x.clearRect(0, 0, this.c.width, this.c.height);

        this.updatePlayer();
        this.updateCreatures();

        this.camera.x = this.player.x - this.c.width / 2;
        this.camera.y = this.player.y - this.c.height / 2;

        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth * this.TILE_SIZE - this.c.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight * this.TILE_SIZE - this.c.height));

        this.drawSky();
        this.drawWorld();
        this.drawPlayer();
        this.creatures.forEach(creature => {
            if (creature.type === 'bunny') this.drawBunny(creature);
            else if (creature.type === 'bird') this.drawBird(creature);
        });

        this.drawInventory();
        this.drawMinimap();
        this.drawRainingHearts();

        this.hearts.forEach((heart, index) => {
            heart.y += heart.vy;
            heart.vy += 0.05;
            heart.life--;
            if (heart.life <= 0) {
                this.hearts.splice(index, 1);
            }
            this.drawHeart(heart.x - this.camera.x, heart.y - this.camera.y, heart.size);
        });
    },

    animateTitleScreen: function() {
        this.drawGameWorld();

        const pixelSize = 4;
        const textWidth = 'SERELUDE'.length * 6 * pixelSize;
        const heartWidth = 7 * pixelSize;
        const gap = 2 * pixelSize;
        const totalWidth = textWidth + gap + heartWidth;
        const startX = (this.c.width - totalWidth) / 2;
        this.drawPixelText(this.x, 'SERELUDE', startX, this.c.height / 2 - 150, pixelSize, 'white');
        
        const heartData = [[1,0],[5,0],[0,1],[2,1],[4,1],[6,1],[0,2],[6,2],[0,3],[6,3],[1,4],[5,4],[2,5],[4,5],[3,6]];
        const pulseFactor = (Math.sin(Date.now() / 400) + 1) / 2;
        const heartSize = pixelSize * (1 + pulseFactor * 0.1);
        const heartX = startX + textWidth + gap + (7 * pixelSize - 7 * heartSize) / 2;
        const heartY = this.c.height / 2 - 150 + (7 * pixelSize - 7 * heartSize) / 2;
        this.x.fillStyle = '#F2A9A9';
        heartData.forEach(p => {
            this.x.fillRect(heartX + p[0] * heartSize, heartY + p[1] * heartSize, heartSize, heartSize);
        });

        this.x.fillStyle = 'white';
        this.x.font = 'italic 16px "Press Start 2P"';
        this.x.textAlign = 'center';
        const poem = [
            'A quiet song between blossoms.',
            'Each petal a note, each line of code a heartbeat.',
            'What began as a prelude now blooms softly in light',
            'a serenade that lingers, looping endlessly,',
            'for love that grows in silence and glows in rhythm.'
        ];
        poem.forEach((line, index) => {
            this.x.fillText(line, this.c.width / 2, this.c.height / 2 - 50 + index * 20);
        });

        this.x.font = '14px "Press Start 2P"';
        this.x.fillText('Explore a dynamic world with a day/night cycle, mine and place blocks, meet friendly creatures, and save your creations.', this.c.width / 2, this.c.height / 2 + 80);

        this.startButton = {
            x: this.c.width / 2 - 100,
            y: this.c.height / 2 + 120,
            width: 200,
            height: 50
        };
        this.x.fillStyle = '#F2A9A9';
        this.x.fillRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
        this.x.fillStyle = 'white';
        this.x.font = '20px "Press Start 2P"';
        this.x.fillText('Start Game', this.c.width / 2, this.c.height / 2 + 155);
    },

    drawPixelText: function(x, text, startX, startY, pixelSize, color) {
        const font = {
            'S': [[1,0],[2,0],[3,0],[0,1],[1,2],[2,2],[3,2],[4,3],[1,4],[2,4],[3,4]],
            'E': [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[1,2],[2,2],[0,3],[0,4],[1,4],[2,4],[3,4]],
            'R': [[0,0],[1,0],[2,0],[0,1],[3,1],[0,2],[1,2],[0,3],[2,3],[0,4],[3,4]],
            'L': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4]],
            'U': [[0,0],[3,0],[0,1],[3,1],[0,2],[3,2],[0,3],[3,3],[1,4],[2,4]],
            'D': [[0,0],[1,0],[2,0],[0,1],[3,1],[0,2],[3,2],[0,3],[3,3],[0,4],[1,4],[2,4]],
            'heart': [[1,0],[5,0],[0,1],[2,1],[4,1],[6,1],[0,2],[6,2],[0,3],[6,3],[1,4],[5,4],[2,5],[4,5],[3,6]]
        };

        x.fillStyle = color;
        let currentX = startX;

        for (const char of text.toUpperCase()) {
            if (font[char]) {
                font[char].forEach(p => {
                    x.fillRect(currentX + p[0] * pixelSize, startY + p[1] * pixelSize, pixelSize, pixelSize);
                });
                currentX += 6 * pixelSize;
            }
        }
        return currentX;
    },

    startGame: function() {
        this.gameState = 'playing';
        if (!this.loadGameState()) {
            this.initWorld();
        }
        this.resizeCanvas();
        this.renderMinimapBackground();
    },

    animate: function() {
        if (this.gameState === 'title') {
            this.animateTitleScreen();
        } else if (this.gameState === 'playing') {
            this.animatePlayingScreen();
        }
    },

    mainLoop: function() {
        this.currentAnimationId = requestAnimationFrame(() => {
            this.animate();
            this.mainLoop();
        });
    },

    animatePlayingScreen: function() {
        this.drawGameWorld();
    }
};

g.init();