// The main game object, 'g', holds all the important variables and functions
const g = {
    // Canvas and drawing context
    c: document.getElementById('animationCanvas'), // The main canvas element
    x: null, // The 2D drawing context for the main canvas
    mc: document.getElementById('minimap-canvas'), // The minimap canvas element
    mx: null, // The 2D drawing context for the minimap
    minimapBuffer: null, // A separate canvas for pre-rendering the minimap to improve performance
    minimapBufferCtx: null, // The context for the minimap buffer

    // World settings
    TILE_SIZE: 20, // The size of each tile in pixels
    world: [], // A 2D array that stores the game world
    worldWidth: 800, // The width of the world in tiles
    worldHeight: 200, // The height of the world in tiles
    chunkSizeY: 64, // The height of a chunk (not currently used, but could be for optimization)
    biomes: {}, // An object to store the biome type for each column of the world

    // Player properties
    player: {
        x: 0, y: 0, // Position
        width: 20, height: 40, // Dimensions
        vx: 0, vy: 0, // Velocity (speed and direction)
        speed: 4, // Movement speed
        jumpForce: 9, // How high the player can jump
        onGround: false, // Is the player currently on the ground?
        direction: 'right', // Which way the player is facing
        isWalking: false, // Is the player currently walking?
        walkFrame: 0, // The current frame of the walking animation
        walkFrameTimer: 0 // A timer to control the speed of the walking animation
    },

    // Inventory
    inventory: {
        items: [
            { type: 'axe', name: 'Axe' },
            { type: 'pickaxe', name: 'Pickaxe' },
            { type: 'stone', name: 'Stone', amount: 0 },
            { type: 'wood', name: 'Wood', amount: 0 },
            { type: 'birchWood', name: 'Birch Wood', amount: 0 },
            { type: 'cherryWood', name: 'Cherry Wood', amount: 0 },
            { type: 'cactus', name: 'Cactus', amount: 0 },
            { type: 'dirt', name: 'Dirt', amount: 0 },
            { type: 'lily', name: 'Lily', amount: 0 },
            { type: 'lilyOfTheValley', name: 'Lily of the Valley', amount: 0 },
            { type: 'rose', name: 'Rose', amount: 0 },
            { type: 'sapling', name: 'Sapling', amount: 0, growsInto: [4, 5] },
        ],
        selectedSlot: 0 // The currently selected item slot
    },

    // Input handling
    keys: {
        a: false, d: false, w: false, ' ': false // Tracks which keys are currently pressed
    },

    // Special effects and entities
    hearts: [], // Hearts that pop up from creatures
    titleScreenHearts: [], // Hearts for the title screen
    rainingHearts: [], // Hearts that rain down from the sky
    clouds: [], // Cloud objects
    creatures: [], // All the creatures in the world
    shootingStars: [], // Shooting stars that appear at night

    // Day/night cycle
    celestialBody: { angle: -Math.PI }, // The angle of the sun/moon
    isNight: false, // Is it currently night time?
    isDraggingSunMoon: false, // Is the player currently dragging the sun/moon?

    // Game state
    currentAnimationId: null, // The ID of the current animation frame
    gameState: 'title', // The current state of the game (e.g., 'title', 'playing')
    startButton: null, // The button to start the game from the title screen
    gameSpeed: 0.35,

    // Camera
    camera: {
        x: 0, y: 0 // The position of the camera
    },

    // Colors used for drawing tiles
    tileColors: {
        sky: 'transparent',
        grass: '#78C04A', grassDark: '#5E9A3B',
        dirt: '#8B5A2B', dirtLight: '#A97B4F',
        stone: '#6B6B6B', stoneLight: '#8A8A8A',
        wood: '#5A3B20', leaves: '#3B7D2B',
        cherryLeaves: '#FFC0CB', cherryWood: '#8B5A2B',
        cactus: '#006400',
        birchWood: '#F5F5DC', birchLeaves: '#98FB98',
        flowerStem: '#4CAF50', flowerPetal: '#FFEB3B',
        sapling: '#6D4C41',
        water: 'rgba(66, 165, 245, 0.7)',
        lilyOfTheValleyGreen: '#6B8E23', lilyOfTheValleyWhite: '#F8F8F8',
        roseStemGreen: '#388E3C', roseRed: '#D32F2F'
    },

    // Colors for the sky at different times of day
    timePalettes: {
        dawn: { top: '#F2A9A9', bottom: '#F8F8F5' },
        midday: { top: '#D4E6F1', bottom: '#F8F8F5' },
        dusk: { top: '#F2A9A9', bottom: '#FAFAF0' },
        night: { top: '#2E2E2E', bottom: '#4A4A4A' }
    },

    // This function kicks everything off
    init: function() {
        // Get the drawing contexts for the canvases
        this.x = this.c.getContext('2d');
        this.x.imageSmoothingEnabled = false; // Prevents blurring of pixel art
        this.mx = this.mc.getContext('2d');
        this.mx.imageSmoothingEnabled = false;
        this.minimapBuffer = document.createElement('canvas');
        this.minimapBufferCtx = this.minimapBuffer.getContext('2d');

        // Try to load a saved game, otherwise create a new world
        if (!this.loadGameState()) {
            this.initWorld();
        }
        
        // Set up the canvas and start the game loop
        this.resizeCanvas();
        this.initRainingHearts();
        this.renderMinimapBackground();
        this.mainLoop();

        // Listen for keyboard inputs
        document.addEventListener('keydown', (e) => {
            // Handle number keys for inventory selection
            if (!isNaN(e.key) && e.key > 0 && e.key <= this.inventory.items.length) {
                this.inventory.selectedSlot = parseInt(e.key) - 1;
                return;
            }
            if (e.key === 't') {
                this.displayAnniversaryMessage();
            }
            // Handle movement keys
            if (e.key in this.keys) this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            if (e.key in this.keys) this.keys[e.key] = false;
        });

        // Listen for mouse inputs
        this.c.addEventListener('mousedown', (event) => {
            const rect = this.c.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Check if the player is clicking on the sun/moon
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
            // If the player is dragging the sun/moon, update its position
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
            // If on the title screen, check if the start button is clicked
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
            
            // Get the tile that was clicked on
            const rect = this.c.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            const tileX = Math.floor((clickX + this.camera.x) / this.TILE_SIZE);
            const tileY = Math.floor((clickY + this.camera.y) / this.TILE_SIZE);

            if (this.getTile(tileX, tileY) === undefined) return;

            // Make sure the player is close enough to the clicked tile
            const playerTileX = Math.floor((this.player.x + this.player.width / 2) / this.TILE_SIZE);
            const playerTileY = Math.floor((this.player.y + this.player.height / 2) / this.TILE_SIZE);
            const distance = Math.sqrt(Math.pow(tileX - playerTileX, 2) + Math.pow(tileY - playerTileY, 2));

            if (distance > 5) return;

            // Handle mining and placing blocks
            const selectedItem = this.inventory.items[this.inventory.selectedSlot];
            const clickedTile = this.getTile(tileX, tileY);
            let worldModified = false;

            if (selectedItem.type === 'axe') {
                if (clickedTile === 4 || clickedTile === 5) { // Oak
                    this.destroyTree(tileX, tileY, [4, 5], 'wood');
                    worldModified = true;
                } else if (clickedTile === 14 || clickedTile === 15) { // Birch
                    this.destroyTree(tileX, tileY, [14, 15], 'birchWood');
                    worldModified = true;
                } else if (clickedTile === 16 || clickedTile === 17) { // Cherry
                    this.destroyTree(tileX, tileY, [16, 17], 'cherryWood');
                    worldModified = true;
                } else if (clickedTile === 18) { // Cactus
                    this.setTile(tileX, tileY, 0);
                    this.inventory.items.find(i => i.type === 'cactus').amount++;
                    worldModified = true;
                }
            }
            else if (selectedItem.type === 'pickaxe') {
                if (clickedTile === 1 || clickedTile === 2) {
                    this.setTile(tileX, tileY, 0);
                    this.inventory.items.find(i => i.type === 'dirt').amount++;
                    worldModified = true;
                } else if (clickedTile === 3) {
                    this.setTile(tileX, tileY, 0);
                    this.inventory.items.find(i => i.type === 'stone').amount++;
                    worldModified = true;
                }
            }

            if (clickedTile === 6 || clickedTile === 7 || clickedTile === 10 || clickedTile === 11 || clickedTile === 12 || clickedTile === 13) {
                if (clickedTile === 6 && this.getTile(tileX, tileY - 1) === 7) this.setTile(tileX, tileY - 1, 0);
                if (clickedTile === 7 && this.getTile(tileX, tileY + 1) === 6) this.setTile(tileX, tileY + 1, 0);
                if (clickedTile === 10 && this.getTile(tileX, tileY - 1) === 11) this.setTile(tileX, tileY - 1, 0);
                if (clickedTile === 11 && this.getTile(tileX, tileY + 1) === 10) this.setTile(tileX, tileY + 1, 0);
                if (clickedTile === 12 && this.getTile(tileX, tileY - 1) === 13) this.setTile(tileX, tileY - 1, 0);
                if (clickedTile === 13 && this.getTile(tileX, tileY + 1) === 12) this.setTile(tileX, tileY + 1, 0);
                this.setTile(tileX, tileY, 0);
                if (clickedTile === 6 || clickedTile === 7) this.inventory.items.find(i => i.type === 'lily').amount++;
                else if (clickedTile === 10 || clickedTile === 11) this.inventory.items.find(i => i.type === 'lilyOfTheValley').amount++;
                else if (clickedTile === 12 || clickedTile === 13) this.inventory.items.find(i => i.type === 'rose').amount++;
                worldModified = true;
            }

            if (clickedTile === 0) {
                if (selectedItem.type === 'stone') {
                    this.setTile(tileX, tileY, 3);
                    worldModified = true;
                } else if (selectedItem.type === 'wood') {
                    this.setTile(tileX, tileY, 4);
                    worldModified = true;
                } else if (selectedItem.type === 'dirt') {
                    this.setTile(tileX, tileY, 2);
                    worldModified = true;
                } else if (selectedItem.type === 'lily') {
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 6);
                        this.setTile(tileX, tileY - 1, 7);
                        worldModified = true;
                    }
                } else if (selectedItem.type === 'lilyOfTheValley') {
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 10);
                        this.setTile(tileX, tileY - 1, 11);
                        worldModified = true;
                    }
                } else if (selectedItem.type === 'rose') {
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 12);
                        this.setTile(tileX, tileY - 1, 13);
                        worldModified = true;
                    }
                } else if (selectedItem.type === 'sapling') {
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 8);
                        setTimeout(() => this.growTree(tileX, tileY, selectedItem.growsInto), 30000);
                        worldModified = true;
                    }
                }
            }
            if (worldModified) {
                this.renderMinimapBackground();
            }
        });

        // Resize the canvas if the window size changes
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    // This function is called when the window is resized
    resizeCanvas: function() {
        this.c.width = window.innerWidth;
        this.c.height = window.innerHeight;
        this.initRainingHearts(); // Re-initialize hearts to fit the new screen size
        this.initClouds(); // Re-initialize clouds
    },

    // Creates a new world from scratch
    initWorld: function() {
        this.world = [];
        this.generateBiomeMap();

        // Create an empty 2D array for the world
        for (let y = 0; y < this.worldHeight; y++) {
            this.world.push(new Array(this.worldWidth).fill(0));
        }

        const groundLevelY = Math.floor(this.worldHeight * 0.95);

        // Create the ground
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                if (y === groundLevelY) {
                    this.world[y][x] = 1; // Grass
                } else if (y > groundLevelY) {
                    this.world[y][x] = 2; // Dirt
                } else {
                    this.world[y][x] = 0; // Air
                }
            }
        }

        // Set the player's starting position
        this.player.x = this.worldWidth * this.TILE_SIZE / 2;
        this.player.y = groundLevelY * this.TILE_SIZE - this.player.height;

        // Dig a pond and fill it with water
        const pondStartX = Math.floor(this.worldWidth * 0.3);
        const pondEndX = Math.floor(this.worldWidth * 0.4);
        const pondTopY = groundLevelY;
        const pondBottomY = groundLevelY + 3;

        for (let y = pondTopY; y <= pondBottomY; y++) {
            for (let x = pondStartX; x <= pondEndX; x++) {
                if (y >= pondTopY && y < pondBottomY) {
                    this.world[y][x] = 9; // Water
                } else if (y >= pondBottomY) {
                    this.world[y][x] = 2; // Dirt below water
                }
            }
        }

        // Add trees, flowers, and creatures to the world
        this.generateTrees(groundLevelY);
        this.generateFlowers(groundLevelY);
        this.initCreatures(groundLevelY);
    },

    // Generates a map of biomes using Perlin noise
    generateBiomeMap: function() {
        const biomeNoise = new PerlinNoise(Math.random());
        this.biomes = {};
        for (let x = 0; x < this.worldWidth; x++) {
            const noiseValue = biomeNoise.noise(x * 0.05, 0, 0);
            if (noiseValue < 0.3) {
                this.biomes[x] = 'forest';
            } else if (noiseValue < 0.6) {
                this.biomes[x] = 'cherry_blossom_forest';
            } else {
                this.biomes[x] = 'desert';
            }
        }
    },

    // Saves the current game state to the browser's local storage
    saveGameState: function() {
        const gameState = {
            world: this.world,
            player: {
                x: this.player.x,
                y: this.player.y
            },
            inventory: this.inventory.items,
            celestialBody: this.celestialBody,
            creatures: this.creatures
        };
        localStorage.setItem('SereludeSaveData', JSON.stringify(gameState));
        console.log("World Saved!");
    },

    // Loads the game state from local storage
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
                if (savedState.creatures) {
                    this.creatures = savedState.creatures;
                } else {
                    const groundLevelY = this.findGroundLevel();
                    this.initCreatures(groundLevelY);
                }

                // Add new items to the inventory if they don't exist in the saved data
                if (!this.inventory.items.find(i => i.type === 'birchWood')) {
                    this.inventory.items.push({ type: 'birchWood', name: 'Birch Wood', amount: 0 });
                }
                if (!this.inventory.items.find(i => i.type === 'cherryWood')) {
                    this.inventory.items.push({ type: 'cherryWood', name: 'Cherry Wood', amount: 0 });
                }
                if (!this.inventory.items.find(i => i.type === 'cactus')) {
                    this.inventory.items.push({ type: 'cactus', name: 'Cactus', amount: 0 });
                }

                console.log("World Loaded!");
                return true;
            } catch (e) {
                console.error("Failed to load saved world:", e);
                this.initWorld();
                return false;
            }
        }
        return false;
    },

    // Finds the y-coordinate of the ground at the player's current position
    findGroundLevel: function() {
        const playerTileX = Math.floor(this.player.x / this.TILE_SIZE);
        for (let y = 0; y < this.worldHeight; y++) {
            if (this.isSolid(this.getTile(playerTileX, y))) {
                return y;
            }
        }
        return Math.floor(this.worldHeight * 0.8); // Fallback if no ground is found
    },

    // Generates trees throughout the world
    generateTrees: function(groundLevelY) {
        let x = 5;
        while (x < this.worldWidth - 3) {
            const biome = this.biomes[x];
            if (this.world[groundLevelY][x] === 9) { // Don't grow trees in water
                x++;
                continue;
            }

            if (Math.random() < 0.1) {
                if (biome === 'forest') {
                    if (Math.random() < 0.5) {
                        this.generateOakTree(x, groundLevelY);
                    } else {
                        this.generateBirchTree(x, groundLevelY);
                    }
                } else if (biome === 'cherry_blossom_forest') {
                    this.generateCherryBlossomTree(x, groundLevelY);
                } else if (biome === 'desert') {
                    this.generateCactus(x, groundLevelY);
                }
                x += Math.floor(Math.random() * 3) + 4; // Space out the trees
            } else {
                x++;
            }
        }
    },

    // Generates an oak tree
    generateOakTree: function(x, groundLevelY) {
        const treeHeight = Math.floor(Math.random() * 4) + 4;
        const treeTopY = groundLevelY - treeHeight;

        for (let i = 1; i < treeHeight; i++) {
            this.world[groundLevelY - i][x] = 4; // Wood
        }

        for (let ly = -1; ly <= 1; ly++) {
            for (let lx = -1; lx <= 1; lx++) {
                this.world[treeTopY + ly][x + lx] = 5; // Leaves
            }
        }
    },

    // Generates a birch tree
    generateBirchTree: function(x, groundLevelY) {
        const treeHeight = Math.floor(Math.random() * 5) + 5;
        const treeTopY = groundLevelY - treeHeight;

        for (let i = 1; i < treeHeight; i++) {
            this.world[groundLevelY - i][x] = 14; // Birch Wood
        }

        for (let ly = -2; ly <= 0; ly++) {
            for (let lx = -2; lx <= 2; lx++) {
                if (Math.random() > 0.3)
                    this.world[treeTopY + ly][x + lx] = 15; // Birch Leaves
            }
        }
    },

    // Generates a cherry blossom tree
    generateCherryBlossomTree: function(x, groundLevelY) {
        const treeHeight = Math.floor(Math.random() * 3) + 4;
        const treeTopY = groundLevelY - treeHeight;

        for (let i = 1; i < treeHeight; i++) {
            this.world[groundLevelY - i][x] = 16; // Cherry Wood
        }

        for (let ly = -2; ly <= 0; ly++) {
            for (let lx = -3; lx <= 3; lx++) {
                if (Math.random() > 0.2)
                    this.world[treeTopY + ly][x + lx] = 17; // Cherry Leaves
            }
        }
    },

    // Generates a cactus
    generateCactus: function(x, groundLevelY) {
        const cactusHeight = Math.floor(Math.random() * 3) + 2;
        for (let i = 1; i <= cactusHeight; i++) {
            this.world[groundLevelY - i][x] = 18; // Cactus
        }
    },

    // Generates flowers throughout the world
    generateFlowers: function(groundLevelY) {
        let x = 1;
        while (x < this.worldWidth - 1) {
            if (this.world[groundLevelY][x] === 1 && this.world[groundLevelY - 1][x] === 0) {
                if (Math.random() < 0.08) {
                    const clusterSize = Math.floor(Math.random() * 3) + 1;
                    const flowerType = Math.floor(Math.random() * 3);

                    for (let i = 0; i < clusterSize && (x + i) < this.worldWidth - 1; i++) {
                        if (this.world[groundLevelY][x+i] === 1 && this.world[groundLevelY - 1][x+i] === 0) {
                            if (flowerType === 0) { // Lily
                                this.world[groundLevelY - 1][x + i] = 6;
                                this.world[groundLevelY - 2][x + i] = 7;
                            } else if (flowerType === 1) { // Lily of the Valley
                                this.world[groundLevelY - 1][x + i] = 10;
                                this.world[groundLevelY - 2][x + i] = 11;
                            } else if (flowerType === 2) { // Rose
                                this.world[groundLevelY - 1][x + i] = 12;
                                this.world[groundLevelY - 2][x + i] = 13;
                            }
                        }
                    }
                    x += clusterSize + Math.floor(Math.random() * 5) + 3; // Space out the flowers
                }
            }
            x++;
        }
    },

    // Initializes the creatures in the world
    initCreatures: function(groundLevelY) {
        this.creatures = [];
        // Add bunnies
        for (let i = 0; i < 3; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE;
            this.creatures.push({
                type: 'bunny',
                x: spawnX, y: groundLevelY * this.TILE_SIZE - this.TILE_SIZE * 1.5,
                width: this.TILE_SIZE, height: this.TILE_SIZE * 1.5,
                vx: 0, vy: 0,
                onGround: false,
                direction: Math.random() < 0.5 ? 'left' : 'right',
                aiTimer: Math.random() * 100 + 50,
                dropCooldown: 0
            });
        }
        // Add birds
        for (let i = 0; i < 5; i++) {
            this.creatures.push({
                type: 'bird',
                x: Math.random() * this.worldWidth * this.TILE_SIZE,
                y: Math.random() * this.c.height * 0.4,
                width: this.TILE_SIZE * 0.6, height: this.TILE_SIZE * 0.6,
                vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                direction: 'right',
                aiTimer: Math.random() * 100
            });
        }
        // Add squirrels
        for (let i = 0; i < 4; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE;
            this.creatures.push({
                type: 'squirrel',
                x: spawnX, y: groundLevelY * this.TILE_SIZE - this.TILE_SIZE,
                width: this.TILE_SIZE * 0.8, height: this.TILE_SIZE,
                vx: 0, vy: 0,
                onGround: false,
                direction: Math.random() < 0.5 ? 'left' : 'right',
                aiTimer: Math.random() * 80 + 40,
                climbing: false,
                climbTargetY: null
            });
        }
        // Add fish
        for (let i = 0; i < 8; i++) {
            const pondStartX = Math.floor(this.worldWidth * 0.3);
            const pondEndX = Math.floor(this.worldWidth * 0.4);
            const pondTopY = groundLevelY; 
            const pondBottomY = groundLevelY + 4; 

            let spawnX, spawnY, tileX, tileY;
            let attempts = 0;
            do {
                spawnX = (Math.random() * (pondEndX - pondStartX) + pondStartX) * this.TILE_SIZE;
                spawnY = (Math.random() * (pondBottomY - pondTopY) + pondTopY) * this.TILE_SIZE;
                tileX = Math.floor(spawnX / this.TILE_SIZE);
                tileY = Math.floor(spawnY / this.TILE_SIZE);
                attempts++;
            } while (this.world[tileY]?.[tileX] !== 9 && attempts < 50);

            if (this.world[tileY]?.[tileX] === 9) {
                this.creatures.push({
                    type: 'fish',
                    x: spawnX, y: spawnY,
                    width: this.TILE_SIZE, height: this.TILE_SIZE * 0.6,
                    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                    direction: Math.random() < 0.5 ? 'left' : 'right',
                    aiTimer: Math.random() * 100 + 50,
                    life: 100
                });
            }
        }
        // Add butterflies
        for (let i = 0; i < 5; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE;
            this.creatures.push({
                type: 'butterfly',
                x: spawnX, y: Math.random() * this.c.height * 0.5,
                width: this.TILE_SIZE * 0.5, height: this.TILE_SIZE * 0.5,
                vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                aiTimer: Math.random() * 100 + 50,
                color: Math.random() < 0.5 ? '#FFEB3B' : '#FF9800'
            });
        }
        // Add fireflies
        for (let i = 0; i < 5; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE;
            this.creatures.push({
                type: 'firefly',
                x: spawnX, y: Math.random() * this.c.height * 0.5,
                width: this.TILE_SIZE * 0.3, height: this.TILE_SIZE * 0.3,
                vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                aiTimer: Math.random() * 100 + 50,
                alpha: 0.8,
                flicker: Math.random() * Math.PI * 2
            });
        }
    },

    // Checks if a tile is solid
    isSolid: function(tileType) {
        return tileType === 1 || tileType === 2 || tileType === 3;
    },

    // Draws a grass tile
    drawGrassTile: function(x, y) {
        this.x.fillStyle = this.tileColors.dirt;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
        this.x.fillStyle = this.tileColors.grass;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE / 2);
        this.x.fillStyle = this.tileColors.grassDark;
        this.x.fillRect(x + this.TILE_SIZE * 0.1, y + this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.1);
        this.x.fillRect(x + this.TILE_SIZE * 0.7, y + this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.1);
        this.x.fillRect(x + this.TILE_SIZE * 0.4, y, this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.2);
    },

    // Draws a dirt tile
    drawDirtTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.dirt;
        this.x.fillRect(x, y, size, size);
        this.x.fillStyle = this.tileColors.dirtLight;
        this.x.fillRect(x + size * 0.2, y + size * 0.3, size * 0.2, size * 0.2);
        this.x.fillRect(x + size * 0.6, y + size * 0.1, size * 0.2, size * 0.2);
        this.x.fillRect(x + size * 0.1, y + size * 0.7, size * 0.3, size * 0.2);
    },

    // Draws a stone tile
    drawStoneTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.stone;
        this.x.fillRect(x, y, size, size);
        this.x.fillStyle = this.tileColors.stoneLight;
        this.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.3, size * 0.3);
        this.x.fillRect(x + size * 0.6, y + size * 0.4, size * 0.3, size * 0.3);
        this.x.fillRect(x + size * 0.3, y + size * 0.7, size * 0.2, size * 0.2);
    },

    // Draws a wood tile
    drawWoodTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.wood;
        this.x.fillRect(x, y, size, size);
        this.x.fillStyle = '#a86a32';
        this.x.fillRect(x + size * 0.2, y, size * 0.2, size);
    },

    // Draws a leaves tile
    drawLeavesTile: function(x, y) {
        this.x.fillStyle = this.tileColors.leaves;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
        this.x.fillStyle = '#6b8e23';
        this.x.fillRect(x + this.TILE_SIZE * 0.1, y + this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
        this.x.fillRect(x + this.TILE_SIZE * 0.5, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
    },

    // Draws a birch wood tile
    drawBirchWoodTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.birchWood;
        this.x.fillRect(x, y, size, size);
        this.x.fillStyle = '#000000';
        this.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.1, size * 0.1);
        this.x.fillRect(x + size * 0.7, y + size * 0.5, size * 0.1, size * 0.1);
    },

    // Draws a birch leaves tile
    drawBirchLeavesTile: function(x, y) {
        this.x.fillStyle = this.tileColors.birchLeaves;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
        this.x.fillStyle = '#3CB371';
        this.x.fillRect(x + this.TILE_SIZE * 0.1, y + this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
        this.x.fillRect(x + this.TILE_SIZE * 0.5, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
    },

    // Draws a cherry wood tile
    drawCherryWoodTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.cherryWood;
        this.x.fillRect(x, y, size, size);
    },

    // Draws a cherry leaves tile
    drawCherryLeavesTile: function(x, y) {
        this.x.fillStyle = this.tileColors.cherryLeaves;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
        this.x.fillStyle = '#FFB6C1';
        this.x.fillRect(x + this.TILE_SIZE * 0.1, y + this.TILE_SIZE * 0.1, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
        this.x.fillRect(x + this.TILE_SIZE * 0.5, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
    },

    // Draws a cactus tile
    drawCactusTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.cactus;
        this.x.fillRect(x, y, size, size);
        this.x.fillStyle = '#008000';
        this.x.fillRect(x, y, size * 0.2, size);
        this.x.fillRect(x + size * 0.8, y, size * 0.2, size);
    },

    // Draws a flower stem tile
    drawFlowerStemTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.flowerStem;
        this.x.fillRect(x + size * 0.4, y, size * 0.2, size);
    },

    // Draws a flower petal tile
    drawFlowerPetalTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.flowerPetal;
        this.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.4, size * 0.4);
        this.x.fillStyle = '#e0e0d1';
        this.x.fillRect(x + size * 0.4, y + size * 0.4, size * 0.2, size * 0.2);
    },

    // Draws a lily of the valley stem tile
    drawLilyOfTheValleyStemTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.lilyOfTheValleyGreen;
        this.x.fillRect(x + size * 0.45, y, size * 0.1, size);
        this.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.4, size * 0.2);
    },

    // Draws a lily of the valley flower tile
    drawLilyOfTheValleyFlowerTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.lilyOfTheValleyWhite;
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.x.fill();
        this.x.beginPath();
        this.x.arc(x + size * 0.3, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
        this.x.fill();
        this.x.beginPath();
        this.x.arc(x + size * 0.7, y + size * 0.4, size * 0.15, 0, Math.PI * 2);
        this.x.fill();
    },

    // Draws a rose stem tile
    drawRoseStemTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.roseStemGreen;
        this.x.fillRect(x + size * 0.45, y, size * 0.1, size);
        this.x.fillRect(x + size * 0.3, y + size * 0.6, size * 0.4, size * 0.1);
    },

    // Draws a rose flower tile
    drawRoseFlowerTile: function(x, y, size = this.TILE_SIZE) {
        this.x.fillStyle = this.tileColors.roseRed;
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.3, size * 0.3, 0, Math.PI * 2);
        this.x.fill();
        this.x.fillStyle = '#A52A2A';
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.3, size * 0.1, 0, Math.PI * 2);
        this.x.fill();
    },

    // Draws a water tile
    drawWaterTile: function(x, y) {
        this.x.fillStyle = this.tileColors.water;
        this.x.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
        this.x.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.x.fillRect(x + this.TILE_SIZE * 0.1, y + this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.8, this.TILE_SIZE * 0.1);
        this.x.fillRect(x + this.TILE_SIZE * 0.3, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.6, this.TILE_SIZE * 0.1);
        this.x.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.x.fillRect(x + this.TILE_SIZE * 0.2, y + this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.7, this.TILE_SIZE * 0.1);
        this.x.fillRect(x + this.TILE_SIZE * 0.4, y + this.TILE_SIZE * 0.7, this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.1);
    },

    // Draws a bird
    drawBird: function(bird) {
        this.x.save();
        const birdCenterX = bird.x + bird.width / 2;

        if (bird.direction === 'left') {
            this.x.translate(birdCenterX, 0);
            this.x.scale(-1, 1);
            this.x.translate(-birdCenterX, 0);
        }
        
        const pSize = bird.width / 4;
        this.x.fillStyle = '#4a4a4a';

        this.x.fillRect(bird.x + pSize, bird.y + pSize, pSize * 2, pSize);
        this.x.fillRect(bird.x, bird.y + pSize * 2, pSize * 3, pSize);

        this.x.fillRect(bird.x + pSize * 3, bird.y, pSize, pSize);

        this.x.fillStyle = '#6a6a6a';
        this.x.fillRect(bird.x, bird.y, pSize * 2, pSize);

        this.x.fillStyle = '#FFD700';
        this.x.fillRect(bird.x + pSize * 4, bird.y + pSize, pSize, pSize / 2);

        this.x.fillStyle = 'white';
        this.x.fillRect(bird.x + pSize * 3.5, bird.y + pSize * 0.5, pSize * 0.5, pSize * 0.5);
        this.x.fillStyle = 'black';
        this.x.fillRect(bird.x + pSize * 3.7, bird.y + pSize * 0.7, pSize * 0.2, pSize * 0.2);

        this.x.restore();
    },

    // Draws a sapling tile
    drawSaplingTile: function(x, y) {
        this.x.fillStyle = this.tileColors.sapling;
        this.x.fillRect(x + this.TILE_SIZE * 0.4, y + this.TILE_SIZE * 0.5, this.TILE_SIZE * 0.2, this.TILE_SIZE * 0.5);
        this.x.fillStyle = this.tileColors.leaves;
        this.x.fillRect(x + this.TILE_SIZE * 0.3, y + this.TILE_SIZE * 0.3, this.TILE_SIZE * 0.4, this.TILE_SIZE * 0.4);
    },

    // Draws the entire world
    drawWorld: function() {
        const startPixelX = this.camera.x;
        const endPixelX = this.camera.x + this.c.width;
        const startPixelY = this.camera.y;
        const endPixelY = this.camera.y + this.c.height;

        const startTileX = Math.floor(startPixelX / this.TILE_SIZE);
        const endTileX = Math.ceil(endPixelX / this.TILE_SIZE);
        const startTileY = Math.floor(startPixelY / this.TILE_SIZE);
        const endTileY = Math.ceil(endPixelY / this.TILE_SIZE);

        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tileType = this.getTile(x, y);
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
                    case 9: this.drawWaterTile(tileX, tileY); break;
                    case 10: this.drawLilyOfTheValleyStemTile(tileX, tileY); break;
                    case 11: this.drawLilyOfTheValleyFlowerTile(tileX, tileY); break;
                    case 12: this.drawRoseStemTile(tileX, tileY); break;
                    case 13: this.drawRoseFlowerTile(tileX, tileY); break;
                    case 14: this.drawBirchWoodTile(tileX, tileY); break;
                    case 15: this.drawBirchLeavesTile(tileX, tileY); break;
                    case 16: this.drawCherryWoodTile(tileX, tileY); break;
                    case 17: this.drawCherryLeavesTile(tileX, tileY); break;
                    case 18: this.drawCactusTile(tileX, tileY); break;
                }
            }
        }
    },

    // Initializes the raining hearts effect
    initRainingHearts: function() {
        this.rainingHearts = [];
        for (let i = 0; i < 50; i++) {
            this.rainingHearts.push({
                x: Math.random() * this.c.width,
                y: Math.random() * this.c.height - this.c.height,
                size: Math.random() * 5 + 5,
                vy: Math.random() * 1 + 0.5
            });
        }
    },

    // Initializes the clouds
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
                currentX += blockWidth * 0.7;
            }
            cloud.width = currentX;

            this.clouds.push(cloud);
        }
    },

    // Linearly interpolates between two colors
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

    // Draws the sky, sun/moon, and clouds
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

    // Draws the raining hearts
    drawRainingHearts: function() {
        this.rainingHearts.forEach(heart => {
            this.drawHeart(heart.x, heart.y, heart.size);
            heart.y += heart.vy;
            if (heart.y > this.c.height) {
                heart.y = -heart.size;
                heart.x = Math.random() * this.c.width;
            }
        });
    },

    displayAnniversaryMessage: function() {
        const message = document.createElement('div');
        message.id = 'anniversary-message';
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.fontFamily = "'Press Start 2P', cursive";
        message.style.color = 'white';
        message.style.textShadow = '2px 2px 4px #000000';
        message.style.zIndex = '1000';
        message.style.opacity = '0';
        message.style.transition = 'opacity 1s ease-in-out';
        message.style.display = 'flex'; // Use flexbox for vertical alignment
        message.style.flexDirection = 'column'; // Stack items vertically
        message.style.alignItems = 'center'; // Center items horizontally

        const line1 = document.createElement('span');
        line1.textContent = "Happy 2 months my love";
        line1.style.fontSize = '36px'; // Main message font size
        message.appendChild(line1);

        const line2 = document.createElement('span');
        line2.textContent = "I love you";
        line2.style.fontSize = '24px'; // Smaller font size for the second line
        line2.style.marginTop = '10px'; // Add some space between the lines
        message.appendChild(line2);

        document.body.appendChild(message);

        // Fade in
        setTimeout(() => {
            message.style.opacity = '1';
        }, 10);

        // Fade out and remove
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentNode) {
                    document.body.removeChild(message);
                }
            }, 1000);
        }, 4000);
    },

    // Checks for collision between two rectangles
    checkCollision: function(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    // Draws the player
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

        this.x.fillStyle = skin;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y, pSize * 3, pSize * 4);
        this.x.fillStyle = hair;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y, pSize * 4, pSize * 2);
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 2, pSize, pSize);
        this.x.fillStyle = '#2E2E2E';
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 2, pSize, pSize);

        this.x.fillStyle = shirt;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 4, pSize * 3, pSize * 3);
        this.x.fillRect(this.player.x - this.camera.x + pSize * 4, this.player.y - this.camera.y + pSize * 4, pSize, pSize * 2);
        this.x.fillStyle = skin;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 4, this.player.y - this.camera.y + pSize * 6, pSize, pSize);

        this.x.fillStyle = pants;
        if (this.player.isWalking) {
            if (this.player.walkFrame === 0) {
                this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
                this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 7, pSize, pSize);
            } else {
                this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 7, pSize, pSize);
                this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
            }
        } else {
            this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
            this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2);
        }

        this.x.fillStyle = shoes;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 9, pSize, pSize);
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 9, pSize, pSize);

        this.x.restore();
    },

    // Draws a heart
    drawHeart: function(cx, cy, size) {
        this.x.fillStyle = '#F2A9A9';
        const s = size / 5;

        this.x.fillRect(cx - s * 2, cy - s * 1.5, s * 2, s * 2);
        this.x.fillRect(cx, cy - s * 1.5, s * 2, s * 2);
        this.x.fillRect(cx - s * 1.5, cy + s * 0.5, s * 3, s * 3);
        this.x.fillRect(cx - s, cy + s * 1.5, s * 2, s * 2);
        this.x.fillRect(cx - s * 0.5, cy + s * 2.5, s, s);

        this.x.fillStyle = '#D46A6A';
        this.x.fillRect(cx - s * 2.5, cy - s * 1, s * 0.5, s * 2.5);
        this.x.fillRect(cx + s * 2, cy - s * 1, s * 0.5, s * 2.5);
        this.x.fillRect(cx - s * 1.5, cy + s * 3.5, s * 3, s * 0.5);
    },

    // Draws a bunny
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

        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize, bunny.y - this.camera.y + pSize * 4, pSize * 3, pSize * 2);
        this.x.fillRect(bunny.x - this.camera.x + pSize * 2, bunny.y - this.camera.y + pSize * 3, pSize * 2, pSize);

        this.x.fillStyle = tailColor;
        this.x.fillRect(bunny.x - this.camera.x, bunny.y - this.camera.y + pSize * 4, pSize, pSize);

        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3, bunny.y - this.camera.y + pSize * 2, pSize * 2, pSize * 2);

        this.x.fillStyle = earColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3, bunny.y - this.camera.y, pSize, pSize * 3);
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 4, bunny.y - this.camera.y + pSize, pSize, pSize * 2);

        this.x.fillStyle = eyeColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 4, bunny.y - this.camera.y + pSize * 2, pSize, pSize);

        this.x.restore();
    },

    // Draws a squirrel
    drawSquirrel: function(squirrel) {
        this.x.save();
        const squirrelCenterX = squirrel.x - this.camera.x + squirrel.width / 2;

        if (squirrel.direction === 'left') {
            this.x.translate(squirrelCenterX, 0);
            this.x.scale(-1, 1);
            this.x.translate(-squirrelCenterX, 0);
        }

        const pSize = this.TILE_SIZE / 5;

        const bodyColor = '#8B5A2B';
        const bellyColor = '#A97B4F';
        const eyeColor = '#2E2E2E';

        this.x.fillStyle = bodyColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize, squirrel.y - this.camera.y + pSize * 3, pSize * 3, pSize * 3);
        this.x.fillStyle = bellyColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 2, squirrel.y - this.camera.y + pSize * 4, pSize, pSize * 2);

        this.x.fillStyle = bodyColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 3, squirrel.y - this.camera.y + pSize * 2, pSize * 2, pSize * 2);

        this.x.fillRect(squirrel.x - this.camera.x + pSize * 4, squirrel.y - this.camera.y + pSize, pSize, pSize);

        this.x.fillStyle = bodyColor;
        this.x.fillRect(squirrel.x - this.camera.x, squirrel.y - this.camera.y + pSize * 4, pSize * 2, pSize);
        this.x.fillRect(squirrel.x - this.camera.x + pSize, squirrel.y - this.camera.y + pSize * 3, pSize, pSize);

        this.x.fillStyle = eyeColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 4, squirrel.y - this.camera.y + pSize * 3, pSize, pSize);

        this.x.restore();
    },

    // Draws a fish
    drawFish: function(fish) {
        this.x.save();
        const fishCenterX = fish.x - this.camera.x + fish.width / 2;

        if (fish.direction === 'left') {
            this.x.translate(fishCenterX, 0);
            this.x.scale(-1, 1);
            this.x.translate(-fishCenterX, 0);
        }

        const pSize = fish.width / 5;

        const bodyColor = '#4CAF50';
        const finColor = '#8BC34A';
        const eyeColor = '#2E2E2E';

        this.x.fillStyle = bodyColor;
        this.x.fillRect(fish.x - this.camera.x + pSize, fish.y - this.camera.y + pSize, pSize * 3, pSize * 2);
        this.x.fillRect(fish.x - this.camera.x + pSize * 4, fish.y - this.camera.y + pSize * 1.5, pSize, pSize);

        this.x.fillStyle = finColor;
        this.x.fillRect(fish.x - this.camera.x, fish.y - this.camera.y + pSize * 1.5, pSize, pSize);
        this.x.fillRect(fish.x - this.camera.x + pSize * 0.5, fish.y - this.camera.y + pSize * 0.5, pSize * 0.5, pSize * 2);

        this.x.fillStyle = eyeColor;
        this.x.fillRect(fish.x - this.camera.x + pSize * 3, fish.y - this.camera.y + pSize * 1, pSize * 0.5, pSize * 0.5);

        this.x.restore();
    },

    // Draws a butterfly
    drawButterfly: function(butterfly) {
        this.x.save();
        const butterflyCenterX = butterfly.x - this.camera.x + butterfly.width / 2;

        if (butterfly.vx < 0) {
            this.x.translate(butterflyCenterX, 0);
            this.x.scale(-1, 1);
            this.x.translate(-butterflyCenterX, 0);
        }

        const pSize = butterfly.width / 4;
        this.x.fillStyle = butterfly.color;

        this.x.fillRect(butterfly.x - this.camera.x + pSize * 1.5, butterfly.y - this.camera.y + pSize * 1.5, pSize, pSize);

        this.x.fillRect(butterfly.x - this.camera.x + pSize, butterfly.y - this.camera.y + pSize, pSize, pSize);
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 2, butterfly.y - this.camera.y + pSize, pSize, pSize);
        this.x.fillRect(butterfly.x - this.camera.x + pSize, butterfly.y - this.camera.y + pSize * 2, pSize, pSize);
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 2, butterfly.y - this.camera.y + pSize * 2, pSize, pSize);

        this.x.restore();
    },

    // Draws a firefly
    drawFirefly: function(firefly) {
        this.x.save();
        this.x.globalAlpha = firefly.alpha * (0.5 + 0.5 * Math.sin(firefly.flicker));
        this.x.fillStyle = '#FFFF00';
        this.x.fillRect(firefly.x - this.camera.x, firefly.y - this.camera.y, firefly.width, firefly.height);
        this.x.globalAlpha = 1;
        this.x.restore();
    },

        updateCreatures: function(groundLevelY) {

            this.creatures.forEach((creature, index) => {

                            if (creature.type === 'bunny') {

                                creature.vy += 0.5 * this.gameSpeed;

                                creature.y += creature.vy;

                

                                // Check if bunny is in water

                                const bunnyTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

                                const bunnyTileY = Math.floor((creature.y + creature.height / 2) / this.TILE_SIZE);

                                                            const isBunnyInWater = this.getTile(bunnyTileX, bunnyTileY) === 9;

                                            

                                                            if (isBunnyInWater) {

                                                                creature.vy *= 0.6; // Reduce gravity effect (buoyancy)

                                                                creature.vx *= 0.7; // Slow down horizontal movement

                                                            }

                                            

                                                            creature.aiTimer--;

                                                            if (creature.aiTimer <= 0) {

                                                                const action = Math.random();

                                                                if (action < 0.4) {

                                                                    if (creature.onGround || isBunnyInWater) { // Allow jumping from water

                                                                        creature.vy = -4;

                                                                        creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 1 + 1) * this.gameSpeed;

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

                                                                if (this.isSolid(this.getTile(tileX, y))) {

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

                

                            } else if (creature.type === 'squirrel') {

                                creature.vy += 0.5 * this.gameSpeed; // Gravity

                                creature.y += creature.vy;

                

                                // Check if squirrel is in water

                                const squirrelTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

                                const squirrelTileY = Math.floor((creature.y + creature.height / 2) / this.TILE_SIZE);

                                const isSquirrelInWater = this.getTile(squirrelTileX, squirrelTileY) === 9;

                

                                if (isSquirrelInWater) {

                                    creature.vy *= 0.6; // Reduce gravity effect (buoyancy)

                                    creature.vx *= 0.7; // Slow down horizontal movement

                                }

                

                                creature.aiTimer--;

                                if (creature.aiTimer <= 0) {

                                    const action = Math.random();

                                    if (creature.climbing) {

                                        if (action < 0.5) { // Stop climbing and move horizontally

                                            creature.climbing = false;

                                            creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 0.5 + 0.5) * this.gameSpeed;

                                        } else { // Continue climbing or change direction

                                            creature.vy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1 + 0.5) * this.gameSpeed;

                                            creature.aiTimer = Math.random() * 60 + 30;

                                        }

                                    } else { // On ground or in water

                                        if (action < 0.4) { // Move horizontally

                                            creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 0.5 + 0.5) * this.gameSpeed;

                                        } else if (action < 0.6) { // Jump

                                            if (creature.onGround || isSquirrelInWater) { // Allow jumping from water

                                                creature.vy = -4;

                                                creature.onGround = false;

                                            }

                                        } else if (action < 0.8) { // Change direction

                                            creature.direction = creature.direction === 'left' ? 'right' : 'left';

                                            creature.vx = 0;

                                        } else { // Try to climb a tree

                                            const currentTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

                                            const currentTileY = Math.floor((creature.y + creature.height) / this.TILE_SIZE);

                                            // Check for tree trunk (tile type 4)

                                            if (this.getTile(currentTileX, currentTileY - 1) === 4) {

                                                creature.climbing = true;

                                                creature.vx = 0;

                                                creature.vy = -1; // Start climbing up

                                                creature.climbTargetY = currentTileY * this.TILE_SIZE - this.TILE_SIZE * 4; // Climb up to 4 tiles

                                            }

                                        }

                                    }

                                    creature.aiTimer = Math.random() * 120 + 60;

                                }

                

                                creature.x += creature.vx;

                

                                // Collision with ground/tree

                                creature.onGround = false;

                                const startY = Math.floor(creature.y / this.TILE_SIZE);

                                const endY = Math.floor((creature.y + creature.height) / this.TILE_SIZE);

                                const tileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

                

                                for (let y = startY; y <= endY; y++) {

                                    if (this.getTile(tileX, y) !== 0 && (this.isSolid(this.getTile(tileX, y)) || this.getTile(tileX, y) === 4)) { // Solid or wood

                                        const tile = { x: tileX * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };

                                        if (this.checkCollision(creature, tile)) {

                                            if (creature.vy > 0 && !creature.climbing) { // Land on ground

                                                creature.y = tile.y - creature.height;

                                                creature.vy = 0;

                                                creature.onGround = true;

                                                creature.vx *= 0.8;

                                            } else if (creature.climbing) { // Climbing collision

                                                if (creature.vy < 0 && creature.y <= creature.climbTargetY) { // Reached top of climb

                                                    creature.climbing = false;

                                                    creature.vy = 0;

                                                    creature.onGround = true; // Treat as on ground for horizontal movement

                                                } else if (creature.vy > 0 && this.getTile(tileX, y) === 4) { // Climbing down, hit bottom of tree

                                                    creature.climbing = false;

                                                    creature.y = tile.y - creature.height;

                                                    creature.vy = 0;

                                                    creature.onGround = true;

                                                }

                                            }

                                        }

                                    }

                                }

                

                                // Boundary checks

                                if (creature.x < 0) { creature.x = 0; creature.direction = 'right'; }

                                if (creature.x + creature.width > this.worldWidth * this.TILE_SIZE) { creature.x = this.worldWidth * this.TILE_SIZE - creature.width; creature.direction = 'left'; }

                

                            } else if (creature.type === 'fish') {

                    creature.aiTimer--;

                    if (creature.aiTimer <= 0) {

                        creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 0.5 + 0.2) * this.gameSpeed;

                        creature.vy = (Math.random() - 0.5) * 0.5 * this.gameSpeed;

                        creature.aiTimer = Math.random() * 100 + 50;

                    }

    

                    creature.x += creature.vx;

                    creature.y += creature.vy;

    

                    const currentTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

                    const currentTileY = Math.floor((creature.y + creature.height / 2) / this.TILE_SIZE);

                    const isInWater = this.getTile(currentTileX, currentTileY) === 9;

    

                    if (!isInWater) {

                        creature.life--;

                        if (creature.life <= 0) {

                            this.creatures.splice(index, 1); // Remove fish if life is 0

                            return; // Skip further updates for this fish

                        }

                    } else {

                        creature.life = 100; // Reset life if in water

                    }

    

                    // Keep fish within water boundaries

                    const pondStartX = Math.floor(this.worldWidth * 0.3);

                    const pondEndX = Math.floor(this.worldWidth * 0.4);

                    const pondTopY = groundLevelY; 

                    const pondBottomY = groundLevelY + 4; 

    

                    if (creature.x < pondStartX * this.TILE_SIZE) { creature.x = pondStartX * this.TILE_SIZE; creature.direction = 'right'; creature.vx *= -1; }

                    if (creature.x + creature.width > pondEndX * this.TILE_SIZE) { creature.x = pondEndX * this.TILE_SIZE - creature.width; creature.direction = 'left'; creature.vx *= -1; }

                    if (creature.y < pondTopY * this.TILE_SIZE) { creature.y = pondTopY * this.TILE_SIZE; creature.vy *= -1; }

                    if (creature.y + creature.height > pondBottomY * this.TILE_SIZE) { creature.y = pondBottomY * this.TILE_SIZE - creature.height; creature.vy *= -1; }

    

                    creature.direction = creature.vx >= 0 ? 'right' : 'left';

    

                } else if (creature.type === 'bird') {

    

                                    creature.aiTimer--;

    

                                    if (creature.aiTimer <= 0) {

    

                                        creature.vx += (Math.random() - 0.5) * 0.5;

    

                                        creature.vy += (Math.random() - 0.5) * 0.5;

    

                                        creature.vx = Math.max(-1, Math.min(1, creature.vx));

    

                                        creature.vy = Math.max(-1, Math.min(1, creature.vy));

    

                                        creature.aiTimer = Math.random() * 100 + 50;

    

                                    }

    

                    

    

                                    creature.x += creature.vx * this.gameSpeed;

    

                                    creature.y += creature.vy * this.gameSpeed;

    

                                    creature.direction = creature.vx >= 0 ? 'right' : 'left';

    

                    

    

                                    if (creature.x < 0 || creature.x + creature.width > this.worldWidth * this.TILE_SIZE) creature.vx *= -1;

    

                                    if (creature.y < 0 || creature.y + creature.height > this.worldHeight * this.TILE_SIZE * 0.6) creature.vy *= -1;

    

                                } else if (creature.type === 'butterfly') {

    

                                    creature.aiTimer--;

    

                                    if (creature.aiTimer <= 0) {

    

                                        creature.vx += (Math.random() - 0.5) * 0.3;

    

                                        creature.vy += (Math.random() - 0.5) * 0.3;

    

                                        creature.vx = Math.max(-0.5, Math.min(0.5, creature.vx));

    

                                        creature.vy = Math.max(-0.5, Math.min(0.5, creature.vy));

    

                                        creature.aiTimer = Math.random() * 100 + 50;

    

                                    }

    

                    

    

                                    creature.x += creature.vx * this.gameSpeed;

    

                                    creature.y += creature.vy * this.gameSpeed;

    

                    

    

                                    if (creature.x < 0 || creature.x + creature.width > this.worldWidth * this.TILE_SIZE) creature.vx *= -1;

    

                                    if (creature.y < 0 || creature.y + creature.height > this.c.height * 0.7) creature.vy *= -1;

    

                    

    

                                } else if (creature.type === 'firefly') {

    

                                    creature.aiTimer--;

    

                                    if (creature.aiTimer <= 0) {

    

                                        creature.vx += (Math.random() - 0.5) * 0.2;

    

                                        creature.vy += (Math.random() - 0.5) * 0.2;

    

                                        creature.vx = Math.max(-0.3, Math.min(0.3, creature.vx));

    

                                        creature.vy = Math.max(-0.3, Math.min(0.3, creature.vy));

    

                                        creature.aiTimer = Math.random() * 80 + 40;

    

                                    }

    

                    

    

                                    creature.x += creature.vx * this.gameSpeed;

    

                                    creature.y += creature.vy * this.gameSpeed;

    

                                    creature.flicker += 0.1; // For flickering effect

    

                    

    

                                    if (creature.x < 0 || creature.x + creature.width > this.worldWidth * this.TILE_SIZE) creature.vx *= -1;

    

                                    if (creature.y < 0 || creature.y + creature.height > this.c.height * 0.7) creature.vy *= -1;

    

                                }

    

                            });

                        },
                
                    updatePlayer: function() {
        if (this.keys.a) {
            this.player.vx = -this.player.speed * this.gameSpeed;
            this.player.direction = 'left';
            this.player.isWalking = true;
        } else if (this.keys.d) {
            this.player.vx = this.player.speed * this.gameSpeed;
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

        this.player.vy += 0.6 * this.gameSpeed;

        // Check if player is in water
        const playerTileX = Math.floor((this.player.x + this.player.width / 2) / this.TILE_SIZE);
        const playerTileY = Math.floor((this.player.y + this.player.height / 2) / this.TILE_SIZE);
        const isInWater = this.world[playerTileY]?.[playerTileX] === 9;

        if (isInWater) {
            this.player.vy *= 0.6; // Reduce gravity effect (buoyancy)
            this.player.vx *= 0.7; // Slow down horizontal movement
            if (this.keys.w || this.keys[' ']) { // Allow swimming up
                this.player.vy = -6; // Increased swim force
            }
        }

        this.player.x += this.player.vx;

        let startX = Math.floor(this.player.x / this.TILE_SIZE);
        let endX = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        let startY = Math.floor(this.player.y / this.TILE_SIZE);
        let endY = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.getTile(x, y) !== 0 && this.isSolid(this.getTile(x, y))) { // Check if tile exists and is solid
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

        this.player.y += this.player.vy * this.gameSpeed;
        this.player.onGround = false;

        startX = Math.floor(this.player.x / this.TILE_SIZE);
        endX = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        startY = Math.floor(this.player.y / this.TILE_SIZE);
        endY = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.getTile(x, y) !== 0 && this.isSolid(this.getTile(x, y))) { // Check if tile exists and is solid
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
                this.x.fillRect(size * (7/16), size * (5/16), size * (2/16), size * (9/16));
                this.x.fillRect(size * (6/16), size * (6/16), size * (1/16), size * (7/16));
                this.x.fillStyle = '#8B5A2B';
                this.x.fillRect(size * (8/16), size * (5/16), size * (1/16), size * (8/16));
                this.x.fillStyle = '#6a6a6a';
                this.x.fillRect(size * (5/16), size * (2/16), size * (6/16), size * (5/16));
                this.x.fillRect(size * (6/16), size * (1/16), size * (4/16), size * (6/16));
                this.x.fillStyle = '#808080';
                this.x.fillRect(size * (6/16), size * (2/16), size * (4/16), size * (4/16));
                this.x.fillStyle = '#9a9a9a';
                this.x.fillRect(size * (5/16), size * (3/16), size * (1/16), size * (2/16));
                this.x.fillRect(size * (10/16), size * (3/16), size * (1/16), size * (2/16));
                break;
            case 'pickaxe':
                this.x.fillStyle = '#a86a32';
                this.x.fillRect(size * (7/16), size * (4/16), size * (2/16), size * (10/16));
                this.x.fillStyle = '#8B5A2B';
                this.x.fillRect(size * (8/16), size * (4/16), size * (1/16), size * (9/16));
                this.x.fillStyle = '#6a6a6a';
                this.x.fillRect(size * (4/16), size * (3/16), size * (8/16), size * (3/16));
                this.x.fillRect(size * (3/16), size * (4/16), size * (10/16), size * (1/16));
                this.x.fillStyle = '#808080';
                this.x.fillRect(size * (5/16), size * (4/16), size * (6/16), size * (1/16));
                this.x.fillStyle = '#9a9a9a';
                this.x.fillRect(size * (3/16), size * (3/16), size * (2/16), size * (1/16));
                this.x.fillRect(size * (11/16), size * (3/16), size * (2/16), size * (1/16));
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
                this.x.fillRect(size * (7/16), size * (5/16), size * (2/16), size * (8/16));
                this.x.fillStyle = this.tileColors.flowerPetal;
                this.x.fillRect(size * (6/16), size * (4/16), size * (4/16), size * (2/16));
                this.x.fillRect(size * (5/16), size * (5/16), size * (2/16), size * (2/16));
                this.x.fillRect(size * (9/16), size * (5/16), size * (2/16), size * (2/16));
                this.x.fillStyle = '#e0e0d1';
                this.x.fillRect(size * (7/16), size * (5/16), size * (2/16), size * (1/16));
                break;
            case 'lilyOfTheValley':
                this.x.fillStyle = this.tileColors.lilyOfTheValleyGreen;
                this.x.fillRect(size * (7/16), size * (5/16), size * (2/16), size * (8/16));
                this.x.fillStyle = this.tileColors.lilyOfTheValleyWhite;
                this.x.beginPath();
                this.x.arc(size * (8/16), size * (4/16), size * (1.5/16), 0, Math.PI * 2);
                this.x.fill();
                this.x.beginPath();
                this.x.arc(size * (6/16), size * (6/16), size * (1.5/16), 0, Math.PI * 2);
                this.x.fill();
                break;
            case 'rose':
                this.x.fillStyle = this.tileColors.roseStemGreen;
                this.x.fillRect(size * (7/16), size * (5/16), size * (2/16), size * (8/16));
                this.x.fillStyle = this.tileColors.roseRed;
                this.x.beginPath();
                this.x.arc(size * (8/16), size * (4/16), size * (2/16), 0, Math.PI * 2);
                this.x.fill();
                this.x.fillStyle = '#A52A2A';
                this.x.beginPath();
                this.x.arc(size * (8/16), size * (4/16), size * (1/16), 0, Math.PI * 2);
                this.x.fill();
                break;
            case 'sapling':
                this.x.fillStyle = this.tileColors.sapling;
                this.x.fillRect(size * (7/16), size * (8/16), size * (2/16), size * (6/16));
                this.x.fillStyle = this.tileColors.leaves;
                this.x.fillRect(size * (6/16), size * (5/16), size * (4/16), size * (4/16));
                break;
            case 'birchWood':
                this.drawBirchWoodTile(0, 0, size);
                break;
            case 'cherryWood':
                this.drawCherryWoodTile(0, 0, size);
                break;
            case 'cactus':
                this.drawCactusTile(0, 0, size);
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


        });
    },

    renderMinimapBackground: function() {
        // For now, render a fixed size minimap based on initial world dimensions
        const minimapDisplayWidth = 200; // Smaller minimap
        const minimapViewRange = 100; // How many tiles to show around the player
        const minimapDisplayHeight = Math.floor(minimapViewRange * (minimapDisplayWidth / minimapViewRange));
        this.minimapBuffer.width = minimapDisplayWidth;
        this.minimapBuffer.height = minimapDisplayHeight;

        this.minimapBufferCtx.clearRect(0, 0, minimapDisplayWidth, minimapDisplayHeight);

        const playerTileX = Math.floor(this.player.x / this.TILE_SIZE);
        const playerTileY = Math.floor(this.player.y / this.TILE_SIZE);

        const startWorldX = playerTileX - minimapViewRange / 2;
        const endWorldX = playerTileX + minimapViewRange / 2;
        const startWorldY = playerTileY - minimapViewRange / 2;
        const endWorldY = playerTileY + minimapViewRange / 2;

        for (let y = startWorldY; y < endWorldY; y++) {
            for (let x = startWorldX; x < endWorldX; x++) {
                const tileType = this.getTile(x, y);
                let color = 'transparent';
                switch (tileType) {
                    case 1: color = this.tileColors.grass; break;
                    case 2: color = this.tileColors.dirt; break;
                    case 3: color = this.tileColors.stone; break;
                    case 4: color = this.tileColors.wood; break;
                    case 5: color = this.tileColors.leaves; break;
                    case 9: color = this.tileColors.water; break; // Add water to minimap
                    case 10: color = this.tileColors.lilyOfTheValleyGreen; break;
                    case 11: color = this.tileColors.lilyOfTheValleyWhite; break;
                    case 12: color = this.tileColors.roseStemGreen; break;
                    case 13: color = this.tileColors.roseRed; break;
                }
                if (color !== 'transparent') {
                    const minimapX = Math.floor((x - startWorldX) * (minimapDisplayWidth / minimapViewRange));
                    const minimapY = Math.floor((y - startWorldY) * (minimapDisplayHeight / minimapViewRange));
                    this.minimapBufferCtx.fillStyle = color;
                    this.minimapBufferCtx.fillRect(minimapX, minimapY, 2, 2);
                }
            }
        }
    },

    drawMinimap: function() {
        const minimapDisplayWidth = 200;
        const minimapViewRange = 100;
        const minimapDisplayHeight = Math.floor(minimapViewRange * (minimapDisplayWidth / minimapViewRange));

        this.mc.width = minimapDisplayWidth;
        this.mc.height = minimapDisplayHeight;

        this.mx.clearRect(0, 0, minimapDisplayWidth, minimapDisplayHeight);
        this.mx.drawImage(this.minimapBuffer, 0, 0, minimapDisplayWidth, minimapDisplayHeight);

        // Player is always in the center of the zoomed-in minimap
        const playerMinimapX = minimapDisplayWidth / 2;
        const playerMinimapY = minimapDisplayHeight / 2;

        this.mx.fillStyle = 'white';
        this.mx.fillRect(playerMinimapX - 2, playerMinimapY - 2, 4, 4);
    },

    destroyTree: function(x, y, treeParts, woodType) {
        const queue = [[x, y]];
        const visited = new Set([`${x},${y}`]);

        const processQueue = () => {
            if (queue.length === 0) {
                this.renderMinimapBackground();
                return;
            }

            const [cx, cy] = queue.shift();
            const tileType = this.world[cy]?.[cx];

            if (treeParts.includes(tileType)) {
                this.world[cy][cx] = 0;
                if (tileType === treeParts[0]) { // Wood
                    this.inventory.items.find(i => i.type === woodType).amount++;
                } else if (tileType === treeParts[1] && Math.random() < 0.05) { // Leaves
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

    growTree: function(x, y, treeParts) {
        if (this.world[y]?.[x] !== 8) return;

        const treeHeight = Math.floor(Math.random() * 4) + 4;
        const treeTopY = y - treeHeight + 1;

        for (let i = 0; i < treeHeight; i++) this.world[y - i][x] = treeParts[0];
        for (let ly = -1; ly <= 1; ly++) {
            for (let lx = -1; lx <= 1; lx++) this.world[treeTopY + ly][x + lx] = treeParts[1];
        }
        this.renderMinimapBackground();
    },



    getTile: function(worldX, worldY) {
        if (worldY >= 0 && worldY < this.worldHeight && worldX >= 0 && worldX < this.worldWidth) {
            return this.world[worldY][worldX];
        }
        return 0; // Default to air outside world bounds
    },

    setTile: function(worldX, worldY, type) {
        if (worldY >= 0 && worldY < this.worldHeight && worldX >= 0 && worldX < this.worldWidth) {
            this.world[worldY][worldX] = type;
        }
    },

    drawGameWorld: function() {
        this.x.clearRect(0, 0, this.c.width, this.c.height);

        this.updatePlayer();
        const groundLevelY = this.findGroundLevel();
        this.updateCreatures(groundLevelY);

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
            else if (creature.type === 'squirrel') this.drawSquirrel(creature);
            else if (creature.type === 'fish') this.drawFish(creature);
            else if (creature.type === 'butterfly' && !this.isNight) this.drawButterfly(creature);
            else if (creature.type === 'firefly' && this.isNight) this.drawFirefly(creature);
        });

        this.renderMinimapBackground(); // Update minimap view every frame
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

        this.x.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.x.fillRect(0, this.c.height - 40, this.c.width, 40);
        this.x.fillStyle = 'white';
        this.x.font = '16px "Press Start 2P"';
        this.x.textAlign = 'center';
        this.x.fillText(`Serelude`, this.c.width / 2, this.c.height - 15);
    },

    drawTitleScreen: function() {
        this.x.clearRect(0, 0, this.c.width, this.c.height);
        this.drawSky();

        // Draw "Serelude" title
        this.x.font = '64px "Press Start 2P"';
        this.x.textAlign = 'center';
        this.x.fillStyle = 'white';
        this.x.shadowColor = 'rgba(242, 169, 169, 0.8)';
        this.x.shadowBlur = 15;
        this.x.fillText('Serelude', this.c.width / 2, this.c.height / 2 - 50);
        this.x.shadowBlur = 0;

        // Draw start button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.c.width / 2 - buttonWidth / 2;
        const buttonY = this.c.height / 2 + 50;
        this.startButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };

        this.x.fillStyle = 'rgba(46, 46, 46, 0.6)';
        this.x.fillRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
        this.x.strokeStyle = '#F2A9A9';
        this.x.lineWidth = 3;
        this.x.strokeRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);

        this.x.font = '24px "Press Start 2P"';
        this.x.fillStyle = 'white';
        this.x.fillText('Start', this.c.width / 2, this.c.height / 2 + 85);

        this.drawRainingHearts();
    },

    startGame: function() {
        this.gameState = 'playing';
        document.getElementById('overlay').style.display = 'none';
        this.mainLoop();
    },

    mainLoop: function() {
        if (this.gameState === 'playing') {
            this.drawGameWorld();
        } else if (this.gameState === 'title') {
            this.drawTitleScreen();
        }
        this.currentAnimationId = requestAnimationFrame(() => this.mainLoop());
    },
};

document.addEventListener('DOMContentLoaded', () => {
    g.init();

    document.getElementById('save-btn').addEventListener('click', () => g.saveGameState());
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to create a new world? All unsaved progress will be lost.")) {
            localStorage.removeItem('SereludeSaveData');
            g.initWorld();
            g.renderMinimapBackground();
        }
    });
});
class PerlinNoise {
    constructor(seed) {
        this.p = new Uint8Array(512);
        this.seed = seed > 0 && seed < 1 ? seed : Math.random();
        this.alea = function() {
            let t = 2091639 * this.seed + 2.3283064365386963e-10;
            return this.seed = t - (t | 0);
        };
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        let n = 256;
        while (--n) {
            let k = Math.floor(this.alea() * 256);
            let tmp = this.p[n];
            this.p[n] = this.p[k];
            this.p[k] = tmp;
        }
        for (let i = 0; i < 256; i++) {
            this.p[i + 256] = this.p[i];
        }
    }

    noise(x, y, z) {
        let X = Math.floor(x) & 255;
        let Y = Math.floor(y) & 255;
        let Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        let u = this.fade(x);
        let v = this.fade(y);
        let w = this.fade(z);
        let A = this.p[X] + Y;
        let AA = this.p[A] + Z;
        let AB = this.p[A + 1] + Z;
        let B = this.p[X + 1] + Y;
        let BA = this.p[B] + Z;
        let BB = this.p[B + 1] + Z;
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)), this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        let h = hash & 15;
        let u = h < 8 ? x : y;
        let v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}
