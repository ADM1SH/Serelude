// The main game object, 'g', holds all the important variables and functions and manages the game state.
const g = {
    // --- Canvas and Drawing Contexts ---
    // 'c' is our main canvas element, where all the game action happens.
    c: document.getElementById('animationCanvas'),
    // 'x' is the 2D rendering context for our main canvas. Think of it as our paintbrush for drawing on 'c'.
    x: null,
    // 'mc' is the canvas specifically for our minimap, giving players a bird's-eye view.
    mc: document.getElementById('minimap-canvas'),
    // 'mx' is the 2D rendering context for the minimap canvas, our paintbrush for the minimap.
    mx: null,
    // 'minimapBuffer' is a secret, offscreen canvas. We draw the minimap here first to keep things running smoothly.
    minimapBuffer: null,
    // 'minimapBufferCtx' is the paintbrush for our secret minimap canvas.
    minimapBufferCtx: null,

    // --- World Settings and Generation ---
    // 'TILE_SIZE' defines how big each little square (tile) in our world is, in pixels.
    TILE_SIZE: 20,
    // 'world' is a big grid (a 2D array) that stores what kind of tile is at each spot in our game world.
    world: [],
    // 'worldWidth' tells us how many tiles wide our game world is.
    worldWidth: 800,
    // 'worldHeight' tells us how many tiles tall our game world is.
    worldHeight: 200,
    // 'chunkSizeY' is a placeholder for future optimizations, like loading parts of the world as needed.
    chunkSizeY: 64,
    // 'biomes' keeps track of what kind of environment (like a forest or desert) each column of our world has.
    biomes: {},

    // --- Player Properties ---
    player: {
        // 'x' and 'y' are the player's current coordinates in the vast game world.
        x: 0, y: 0,
        // 'width' and 'height' define how big our player character looks on screen.
        width: 20, height: 40,
        // 'vx' and 'vy' are the player's horizontal and vertical speeds.
        vx: 0, vy: 0,
        // 'speed' is how fast our player can move around.
        speed: 4,
        // 'jumpForce' is how high our player springs into the air when they jump.
        jumpForce: 9,
        // 'onGround' is a true/false switch that tells us if the player is currently standing on something solid.
        onGround: false,
        // 'direction' tells us if the player is looking 'left' or 'right'.
        direction: 'right',
        // 'isWalking' is true when the player is moving, false otherwise.
        isWalking: false,
        // 'walkFrame' helps us animate the player's walking motion, alternating between leg positions.
        walkFrame: 0,
        // 'walkFrameTimer' is a little clock that helps control how fast the walking animation plays.
        walkFrameTimer: 0
    },

    // --- Inventory System ---
    inventory: {
        // 'items' is a list of all the cool stuff our player can carry.
        items: [
            { type: 'axe', name: 'Axe' }, // A trusty tool for chopping down trees.
            { type: 'pickaxe', name: 'Pickaxe' }, // Essential for mining rocks and digging dirt.
            { type: 'stone', name: 'Stone', amount: 0 }, // A basic building block or crafting material.
            { type: 'wood', name: 'Wood', amount: 0 }, // Gathered from oak trees, great for building.
            { type: 'birchWood', name: 'Birch Wood', amount: 0 }, // Lighter wood from birch trees.
            { type: 'cherryWood', name: 'Cherry Wood', amount: 0 }, // Beautiful wood from cherry trees.
            { type: 'cactus', name: 'Cactus', amount: 0 }, // A prickly plant that can be placed.
            { type: 'dirt', name: 'Dirt', amount: 0 }, // The most common block, good for terraforming.
            { type: 'lily', name: 'Lily', amount: 0 }, // A lovely flower to decorate with.
            { type: 'lilyOfTheValley', name: 'Lily of the Valley', amount: 0 }, // Another beautiful flower.
            { type: 'rose', name: 'Rose', amount: 0 }, // A classic flower, watch out for thorns!
            { type: 'sapling', name: 'Sapling', amount: 0, growsInto: [4, 5] }, // Plant this to grow a new tree! (type 4: wood, type 5: leaves).
        ],
        // 'selectedSlot' tells us which item in the inventory the player currently has chosen.
        selectedSlot: 0
    },

    // --- Input Handling ---
    // 'keys' keeps track of which movement keys (A, D, W, Spacebar) are currently being held down.
    keys: {
        a: false, d: false, w: false, ' ': false
    },

    // --- Special Effects and Entities ---
    // 'hearts' is where we store all the little heart animations that float up from creatures.
    hearts: [],
    // 'titleScreenHearts' are hearts specifically for the game's starting screen.
    titleScreenHearts: [],
    // 'rainingHearts' are for a special effect where hearts gently fall from the sky.
    rainingHearts: [],
    // 'clouds' are fluffy objects that drift across the background, adding depth.
    clouds: [],
    // 'creatures' is a list of all the animals and other living things roaming our world.
    creatures: [],
    // 'shootingStars' are dazzling streaks of light that appear in the night sky.
    shootingStars: [],

    // --- Day/Night Cycle ---
    // 'celestialBody' represents our sun or moon, and its 'angle' tells us where it is in the sky.
    celestialBody: { angle: -Math.PI },
    // 'isNight' is a true/false switch that tells us if it's currently dark outside.
    isNight: false,
    // 'isDraggingSunMoon' is true when the player is actively pulling the sun/moon across the sky.
    isDraggingSunMoon: false,

    // --- Game State Management ---
    // 'currentAnimationId' stores a special ID that lets us stop and start the game's main animation loop.
    currentAnimationId: null,
    // 'gameState' tells us what the game is currently doing (e.g., showing the 'title' screen, 'playing', or 'paused').
    gameState: 'title',
    // 'startButton' is a reference to the button players click to begin the game.
    startButton: null,
    // 'gameSpeed' is a master control for how fast everything in the game moves and animates.
    gameSpeed: 0.35,

    // --- Camera System ---
    camera: {
        // 'x' and 'y' define where our camera is currently looking in the vast game world.
        x: 0, y: 0
    },

    // --- Parallax Background Layers ---
    // 'backgroundLayers' creates a cool 3D effect by having different background elements move at different speeds.
    backgroundLayers: [
        { color: '#B0D8F0', speed: 0.1 }, // The farthest layer, it moves the slowest.
        { color: '#87CEEB', speed: 0.2 }, // A middle layer, moving a bit faster.
        { color: '#6495ED', speed: 0.3 }  // The closest layer, it zips by the fastest.
    ],

    // --- Tile Colors ---
    // 'tileColors' is a handy collection of all the colors we use for different types of tiles in our world.
    tileColors: {
        sky: 'transparent', // The color for empty space, like the sky.
        grass: '#78C04A', grassDark: '#5E9A3B', // Shades of green for our grassy areas.
        dirt: '#8B5A2B', dirtLight: '#A97B4F', // Earthy browns for dirt and soil.
        stone: '#6B6B6B', stoneLight: '#8A8A8A', // Grays for rocky terrain.
        wood: '#5A3B20', leaves: '#3B7D2B', // Colors for sturdy oak wood and its lush green leaves.
        cherryLeaves: '#FFC0CB', cherryWood: '#8B5A2B', // Pretty pinks for cherry blossoms and their wood.
        cactus: '#006400', // A deep green for our desert cacti.
        birchWood: '#F5F5DC', birchLeaves: '#98FB98', // Light colors for birch trees and their gentle leaves.
        flowerStem: '#4CAF50', flowerPetal: '#FFEB3B', // Green for flower stems and bright yellow for petals.
        sapling: '#6D4C41', // The color of a young tree, waiting to grow.
        water: 'rgba(66, 165, 245, 0.7)', // A translucent blue for our water bodies.
        lilyOfTheValleyGreen: '#6B8E23', lilyOfTheValleyWhite: '#F8F8F8', // Colors for the delicate lily of the valley.
        roseStemGreen: '#388E3C', roseRed: '#D32F2F' // Vibrant greens and reds for our beautiful roses.
    },

    // --- Time-based Sky Color Palettes ---
    // 'timePalettes' defines the colors of the sky at different times of day, creating beautiful gradients.
    timePalettes: {
        dawn: { top: '#F2A9A9', bottom: '#F8F8F5' }, // Soft, warm colors for when the sun first peeks out.
        midday: { top: '#D4E6F1', bottom: '#F8F8F5' }, // Bright, clear blues for the middle of the day.
        dusk: { top: '#F2A9A9', bottom: '#FAFAF0' }, // Warm, fading colors as the sun sets.
        night: { top: '#2E2E2E', bottom: '#4A4A4A' } // Deep, dark colors for the mysterious night sky.
    },

    // This function is like the game's grand opening! It sets up everything we need to start playing.
    init: function() {
        // First, we grab the 2D drawing tools (contexts) for our main game canvas and the minimap.
        this.x = this.c.getContext('2d');
        this.x.imageSmoothingEnabled = false; // We turn off image smoothing for that crisp, pixel-art look.
        this.mx = this.mc.getContext('2d');
        this.mx.imageSmoothingEnabled = false; // Same for the minimap, keep it sharp!
        // We create a hidden canvas just for the minimap. This helps us draw it efficiently without slowing down the main game.
        this.minimapBuffer = document.createElement('canvas');
        this.minimapBufferCtx = this.minimapBuffer.getContext('2d');

        // We try to load any game progress saved from before. If there's no save, we start a brand new world!
        if (!this.loadGameState()) {
            this.initWorld();
        }
        
        // Now, we get our canvas ready, set up some fun raining hearts and clouds, draw the minimap's background, and kick off the main game loop!
        this.resizeCanvas();
        this.initRainingHearts();
        this.initClouds();
        this.renderMinimapBackground();
        this.mainLoop();

        // --- Event Listeners: These are like our game's ears, listening for player actions! ---
        // We listen for when keys are pressed down.
        document.addEventListener('keydown', (e) => {
            // If a number key (1-9) is pressed, it means the player wants to select an item in their inventory.
            if (!isNaN(e.key) && e.key > 0 && e.key <= this.inventory.items.length) {
                this.inventory.selectedSlot = parseInt(e.key) - 1;
                return; // We stop here if an inventory slot was selected, no need to check other keys.
            }
            // If the 't' key is pressed, we show a special anniversary message! Shhh, it's a secret.
            if (e.key === 't') {
                this.displayAnniversaryMessage();
            }
            // For movement keys (A, D, W, Spacebar), we mark them as 'pressed' so the game knows to move the player.
            if (e.key in this.keys) this.keys[e.key] = true;
        });

        // We also listen for when keys are released.
        document.addEventListener('keyup', (e) => {
            // When a movement key is let go, we mark it as 'not pressed'.
            if (e.key in this.keys) this.keys[e.key] = false;
        });

        // We listen for mouse clicks on our main game canvas.
        this.c.addEventListener('mousedown', (event) => {
            const rect = this.c.getBoundingClientRect(); // We figure out where our canvas is on the screen.
            const mouseX = event.clientX - rect.left; // Calculate the mouse's X position relative to the canvas.
            const mouseY = event.clientY - rect.top; // Calculate the mouse's Y position relative to the canvas.

            // We calculate where the sun/moon is currently drawn.
            const sunMoonX = this.c.width / 2 + Math.cos(this.celestialBody.angle) * (this.c.width / 2 + 30);
            const sunMoonY = this.c.height * 0.8 + Math.sin(this.celestialBody.angle) * (this.c.height * 0.7);
            // Then, we see how far away the mouse click was from the sun/moon.
            const dist = Math.sqrt(Math.pow(mouseX - sunMoonX, 2) + Math.pow(mouseY - sunMoonY, 2));

            // If the click was close enough to the sun/moon, we let the player drag it across the sky!
            if (dist < 40) {
                this.isDraggingSunMoon = true;
            }
        });

        // We listen for when the mouse button is released on the canvas.
        this.c.addEventListener('mouseup', () => {
            this.isDraggingSunMoon = false; // Stop dragging the sun/moon.
        });

        // If the mouse leaves the canvas area, we also stop dragging the sun/moon.
        this.c.addEventListener('mouseleave', () => {
            this.isDraggingSunMoon = false; // No more sun/moon dragging if the mouse wanders off.
        });

        // We listen for when the mouse moves across the canvas.
        this.c.addEventListener('mousemove', (event) => {
            // If the player is currently dragging the sun/moon, we update its position based on the mouse.
            if (this.isDraggingSunMoon) {
                const rect = this.c.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const dx = mouseX - this.c.width / 2;
                const dy = mouseY - this.c.height * 0.8;
                this.celestialBody.angle = Math.atan2(dy, dx); // We adjust the sun/moon's angle to follow the mouse.
                return; // We stop here, as we're busy dragging.
            }
        });

        // We listen for general mouse clicks on the canvas.
        this.c.addEventListener('click', (event) => {
            // If we're on the title screen, we check if the player clicked the 'Start' button.
            if (this.gameState === 'title') {
                const rect = this.c.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                const clickY = event.clientY - rect.top;

                // If the click was within the start button's area, we begin the game!
                if (this.startButton && clickX >= this.startButton.x && clickX <= this.startButton.x + this.startButton.width &&
                    clickY >= this.startButton.y && clickY <= this.startButton.y + this.startButton.height) {
                    this.startGame(); // Time to play!
                }
                return; // If we're on the title screen, we don't do anything else with the click.
            }

            // If the sun/moon is being dragged, we ignore other clicks.
            if (this.isDraggingSunMoon) return;
            
            // We figure out which tile in the game world the player clicked on.
            const rect = this.c.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            const tileX = Math.floor((clickX + this.camera.x) / this.TILE_SIZE);
            const tileY = Math.floor((clickY + this.camera.y) / this.TILE_SIZE);

            // If the clicked tile is outside our world, we do nothing.
            if (this.getTile(tileX, tileY) === undefined) return;

            // We find out where the player is standing in terms of tiles.
            const playerTileX = Math.floor((this.player.x + this.player.width / 2) / this.TILE_SIZE);
            const playerTileY = Math.floor((this.player.y + this.player.height / 2) / this.TILE_SIZE);
            // We calculate how far the player is from the clicked tile.
            const distance = Math.sqrt(Math.pow(tileX - playerTileX, 2) + Math.pow(tileY - playerTileY, 2));

            // If the player is too far away to interact with the tile, we do nothing.
            if (distance > 5) return;

            // --- Time to Mine or Place Blocks! ---
            const selectedItem = this.inventory.items[this.inventory.selectedSlot]; // What item does the player have in hand?
            const clickedTile = this.getTile(tileX, tileY); // What kind of tile did they click on?
            let worldModified = false; // A flag to remember if we changed anything in the world.

            // If the player has an axe, they can chop down trees or cacti!
            if (selectedItem.type === 'axe') {
                if (clickedTile === 4 || clickedTile === 5) { // If it's oak wood or leaves...
                    this.destroyTree(tileX, tileY, [4, 5], 'wood'); // ...chop down the oak tree!
                    worldModified = true;
                } else if (clickedTile === 14 || clickedTile === 15) { // If it's birch wood or leaves...
                    this.destroyTree(tileX, tileY, [14, 15], 'birchWood'); // ...chop down the birch tree!
                    worldModified = true;
                } else if (clickedTile === 16 || clickedTile === 17) { // If it's cherry wood or leaves...
                    this.destroyTree(tileX, tileY, [16, 17], 'cherryWood'); // ...chop down the cherry tree!
                    worldModified = true;
                } else if (clickedTile === 18) { // If it's a cactus...
                    this.setTile(tileX, tileY, 0); // ...make it disappear!
                    this.inventory.items.find(i => i.type === 'cactus').amount++; // And add a cactus to the inventory.
                    worldModified = true;
                }
            }
            // If the player has a pickaxe, they can dig up dirt or stone!
            else if (selectedItem.type === 'pickaxe') {
                if (clickedTile === 1 || clickedTile === 2) { // If it's grass or dirt...
                    this.setTile(tileX, tileY, 0); // ...dig it up!
                    this.inventory.items.find(i => i.type === 'dirt').amount++; // And add dirt to the inventory.
                    worldModified = true;
                } else if (clickedTile === 3) { // If it's stone...
                    this.setTile(tileX, tileY, 0); // ...mine it!
                    this.inventory.items.find(i => i.type === 'stone').amount++; // And add stone to the inventory.
                    worldModified = true;
                }
            }

            // Handling the destruction of flowers (lilies, lilies of the valley, roses).
            if (clickedTile === 6 || clickedTile === 7 || clickedTile === 10 || clickedTile === 11 || clickedTile === 12 || clickedTile === 13) {
                // We carefully remove both parts of the flower (stem and petals).
                if (clickedTile === 6 && this.getTile(tileX, tileY - 1) === 7) this.setTile(tileX, tileY - 1, 0);
                if (clickedTile === 7 && this.getTile(tileX, tileY + 1) === 6) this.setTile(tileX, tileY + 1, 0);
                if (clickedTile === 10 && this.getTile(tileX, tileY - 1) === 11) this.setTile(tileX, tileY - 1, 0);
                if (clickedTile === 11 && this.getTile(tileX, tileY + 1) === 10) this.setTile(tileX, tileY + 1, 0);
                if (clickedTile === 12 && this.getTile(tileX, tileY - 1) === 13) this.setTile(tileX, tileY - 1, 0);
                if (clickedTile === 13 && this.getTile(tileX, tileY + 1) === 12) this.setTile(tileX, tileY + 1, 0);
                this.setTile(tileX, tileY, 0); // Remove the clicked part of the flower.
                // Add the flower to the player's inventory based on its type.
                if (clickedTile === 6 || clickedTile === 7) this.inventory.items.find(i => i.type === 'lily').amount++;
                else if (clickedTile === 10 || clickedTile === 11) this.inventory.items.find(i => i.type === 'lilyOfTheValley').amount++;
                else if (clickedTile === 12 || clickedTile === 13) this.inventory.items.find(i => i.type === 'rose').amount++;
                worldModified = true;
            }

            // If the clicked spot is empty (air), the player can try to place a block!
            if (clickedTile === 0) {
                if (selectedItem.type === 'stone') {
                    this.setTile(tileX, tileY, 3); // Place a stone block.
                    worldModified = true;
                } else if (selectedItem.type === 'wood') {
                    this.setTile(tileX, tileY, 4); // Place a wood block.
                    worldModified = true;
                } else if (selectedItem.type === 'dirt') {
                    this.setTile(tileX, tileY, 2); // Place a dirt block.
                    worldModified = true;
                } else if (selectedItem.type === 'lily') {
                    // If there's solid ground below, place a lily (stem and petals).
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 6);
                        this.setTile(tileX, tileY - 1, 7);
                        worldModified = true;
                    }
                } else if (selectedItem.type === 'lilyOfTheValley') {
                    // If there's solid ground below, place a lily of the valley.
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 10);
                        this.setTile(tileX, tileY - 1, 11);
                        worldModified = true;
                    }
                } else if (selectedItem.type === 'rose') {
                    // If there's solid ground below, place a rose.
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 12);
                        this.setTile(tileX, tileY - 1, 13);
                        worldModified = true;
                    }
                } else if (selectedItem.type === 'sapling') {
                    // If there's solid ground below, plant a sapling and schedule it to grow into a tree later!
                    if (this.getTile(tileX, tileY + 1) === 1) {
                        this.setTile(tileX, tileY, 8);
                        setTimeout(() => this.growTree(tileX, tileY, selectedItem.growsInto), 30000); // It'll grow in 30 seconds!
                        worldModified = true;
                    }
                }
            }
            // If we changed anything in the world, we need to update our minimap background.
            if (worldModified) {
                this.renderMinimapBackground();
            }
        });

        // We listen for when the browser window changes size, so our canvas can adjust.
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    // This function is called whenever the browser window changes size. It makes sure our canvas always fits perfectly.
    resizeCanvas: function() {
        this.c.width = window.innerWidth; // We make our main canvas as wide as the browser window.
        this.c.height = window.innerHeight; // And as tall as the browser window.
        this.initRainingHearts(); // We reset the raining hearts so they cover the new screen size.
        this.initClouds(); // And we reposition our clouds to look good with the new dimensions.
    },

    // This function builds our entire game world from scratch, like a digital architect!
    initWorld: function() {
        this.world = []; // First, we clear out any old world data to start fresh.
        this.generateBiomeMap(); // Then, we decide where our forests, deserts, and other biomes will be.

        // We fill our world with empty air tiles, ready for terrain.
        for (let y = 0; y < this.worldHeight; y++) {
            this.world.push(new Array(this.worldWidth).fill(0)); // Each row gets filled with '0' (which means air).
        }

        const groundLevelY = Math.floor(this.worldHeight * 0.95); // We figure out where the main ground level will be, usually near the bottom.

        // Now, we lay down the ground! Grass on top, dirt underneath.
        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                if (y === groundLevelY) {
                    this.world[y][x] = 1; // This is where the green grass goes!
                } else if (y > groundLevelY) {
                    this.world[y][x] = 2; // And below the grass, we put brown dirt.
                } else {
                    this.world[y][x] = 0; // Everything above ground level stays as air.
                }
            }
        }

        // We place our player character right in the middle of the world, just above the ground.
        this.player.x = this.worldWidth * this.TILE_SIZE / 2;
        this.player.y = groundLevelY * this.TILE_SIZE - this.player.height;

        // --- Let's Add a Lovely Pond! ---
        const pondStartX = Math.floor(this.worldWidth * 0.3);
        const pondEndX = Math.floor(this.worldWidth * 0.4);
        const pondTopY = groundLevelY; // The top surface of our pond.
        const pondBottomY = groundLevelY + 3; // The deepest part of our pond.

        // We dig out the area for the pond and fill it with refreshing water.
        for (let y = pondTopY; y <= pondBottomY; y++) {
            for (let x = pondStartX; x <= pondEndX; x++) {
                if (y >= pondTopY && y < pondBottomY) {
                    this.world[y][x] = 9; // Splash! Water tiles go here.
                } else if (y >= pondBottomY) {
                    this.world[y][x] = 2; // And we make sure there's dirt beneath the water.
                }
            }
        }

        // Finally, we populate our brand new world with beautiful trees, colorful flowers, and lively creatures!
        this.generateTrees(groundLevelY);
        this.generateFlowers(groundLevelY);
        this.initCreatures(groundLevelY);
    },

    // This function creates a map of different environments (biomes) across our world, making it feel more natural.
    generateBiomeMap: function() {
        const biomeNoise = new PerlinNoise(Math.random()); // We use a special noise generator to create varied terrain.
        this.biomes = {}; // We clear any old biome data to start fresh.
        // We go through each column of our world and decide what biome it will be.
        for (let x = 0; x < this.worldWidth; x++) {
            const noiseValue = biomeNoise.noise(x * 0.05, 0, 0); // We get a unique value for each spot.
            // Based on this value, we assign a biome: forest, cherry blossom forest, or desert.
            if (noiseValue < 0.3) {
                this.biomes[x] = 'forest';
            } else if (noiseValue < 0.6) {
                this.biomes[x] = 'cherry_blossom_forest';
            } else {
                this.biomes[x] = 'desert';
            }
        }
    },

    // This function is super important! It saves all our game progress so we can come back to it later.
    saveGameState: function() {
        // We gather all the important bits of our game: the world, player's spot, inventory, sun/moon, and all our creatures.
        const gameState = {
            world: this.world, // The entire world, tile by tile.
            player: {
                x: this.player.x, // Where the player is horizontally.
                y: this.player.y // Where the player is vertically.
            },
            inventory: this.inventory.items, // All the cool stuff in the player's pockets.
            celestialBody: this.celestialBody, // The current position of the sun/moon.
            creatures: this.creatures // All the animals roaming around.
        };
        // We turn this game data into a special text format (JSON) and store it in the browser's memory.
        localStorage.setItem('SereludeSaveData', JSON.stringify(gameState));
        console.log("World Saved!"); // A little message to let us know it worked!
    },

    // This function tries to load a game we saved earlier. If it finds one, it brings our world back to life!
    loadGameState: function() {
        const savedStateJSON = localStorage.getItem('SereludeSaveData'); // We check the browser's memory for our saved game.
        if (savedStateJSON) { // If we find something...
            try {
                const savedState = JSON.parse(savedStateJSON); // We turn the special text back into game data.
                // And then we put everything back where it was: the world, player, inventory, and sun/moon.
                this.world = savedState.world;
                this.player.x = savedState.player.x;
                this.player.y = savedState.player.y;
                this.inventory.items = savedState.inventory;
                this.celestialBody = savedState.celestialBody;
                // We also bring back our creatures, or create new ones if the save data is old.
                if (savedState.creatures) {
                    this.creatures = savedState.creatures;
                } else {
                    const groundLevelY = this.findGroundLevel(); // We need to know where the ground is to spawn new creatures.
                    this.initCreatures(groundLevelY);
                }

                // If we've added new items to the game since the last save, we make sure the player gets them.
                if (!this.inventory.items.find(i => i.type === 'birchWood')) {
                    this.inventory.items.push({ type: 'birchWood', name: 'Birch Wood', amount: 0 });
                }
                if (!this.inventory.items.find(i => i.type === 'cherryWood')) {
                    this.inventory.items.push({ type: 'cherryWood', name: 'Cherry Wood', amount: 0 });
                }
                if (!this.inventory.items.find(i => i.type === 'cactus')) {
                    this.inventory.items.push({ type: 'cactus', name: 'Cactus', amount: 0 });
                }

                console.log("World Loaded!"); // Hooray, our world is back!
                return true; // We tell the game that loading was a success.
            } catch (e) {
                console.error("Failed to load saved world:", e); // Uh oh, something went wrong! We tell the console.
                this.initWorld(); // If loading fails, we just start a new world.
                return false; // We tell the game that loading failed.
            }
        }
        return false; // If there was no saved data to begin with, we say so.
    },

    // This function helps us find the ground level right beneath our player, so they don't fall through the world!
    findGroundLevel: function() {
        const playerTileX = Math.floor(this.player.x / this.TILE_SIZE); // We get the player's horizontal tile position.
        // We look down from the sky until we hit something solid.
        for (let y = 0; y < this.worldHeight; y++) {
            if (this.isSolid(this.getTile(playerTileX, y))) {
                return y; // Found solid ground! We return its vertical position.
            }
        }
        return Math.floor(this.worldHeight * 0.8); // If we can't find ground, we just guess a reasonable spot.
    },

    // This function sprinkles trees and cacti all over our world, making it look lively!
    generateTrees: function(groundLevelY) {
        let x = 5; // We start planting trees a little way into the world.
        while (x < this.worldWidth - 3) { // We keep planting until near the end of the world.
            const biome = this.biomes[x]; // We check what kind of environment we're in.
            if (this.world[groundLevelY][x] === 9) { // If we hit water, we can't plant a tree there, so we skip it.
                x++;
                continue;
            }

            if (Math.random() < 0.1) { // There's a 10% chance to plant a tree or cactus at each spot.
                if (biome === 'forest') {
                    if (Math.random() < 0.5) {
                        this.generateOakTree(x, groundLevelY); // In a forest, it's either an oak...
                    } else {
                        this.generateBirchTree(x, groundLevelY); // ...or a birch tree!
                    }
                } else if (biome === 'cherry_blossom_forest') {
                    this.generateCherryBlossomTree(x, groundLevelY); // In a cherry blossom forest, we get beautiful cherry trees.
                } else if (biome === 'desert') {
                    this.generateCactus(x, groundLevelY); // In the desert, we get prickly cacti.
                }
                x += Math.floor(Math.random() * 3) + 4; // We move a bit further to space out our trees nicely.
            } else {
                x++; // No tree this time, let's check the next spot.
            }
        }
    },

    // This function creates a sturdy oak tree at a specific spot in our world.
    generateOakTree: function(x, groundLevelY) {
        const treeHeight = Math.floor(Math.random() * 4) + 4; // We give each tree a random height, between 4 and 7 tiles tall.
        const treeTopY = groundLevelY - treeHeight; // This is where the very top of the tree trunk will be.

        // We draw the tree's trunk, stacking wood tiles upwards.
        for (let i = 1; i < treeHeight; i++) {
            this.world[groundLevelY - i][x] = 4; // Tile type 4 is our trusty wood.
        }

        // Then, we add a leafy canopy around the top of the trunk.
        for (let ly = -1; ly <= 1; ly++) {
            for (let lx = -1; lx <= 1; lx++) {
                this.world[treeTopY + ly][x + lx] = 5; // Tile type 5 is for our green leaves.
            }
        }
    },

    // This function creates a graceful birch tree at a specific spot.
    generateBirchTree: function(x, groundLevelY) {
        const treeHeight = Math.floor(Math.random() * 5) + 5; // Birch trees are a bit taller, 5 to 9 tiles.
        const treeTopY = groundLevelY - treeHeight; // Top of the birch trunk.

        // We draw the birch tree's distinctive white trunk.
        for (let i = 1; i < treeHeight; i++) {
            this.world[groundLevelY - i][x] = 14; // Tile type 14 is for birch wood.
        }

        // Then, we add a slightly sparse canopy of birch leaves.
        for (let ly = -2; ly <= 0; ly++) {
            for (let lx = -2; lx <= 2; lx++) {
                if (Math.random() > 0.3) // Only 70% chance for a leaf, making it look less dense.
                    this.world[treeTopY + ly][x + lx] = 15; // Tile type 15 is for birch leaves.
            }
        }
    },

    // This function creates a beautiful cherry blossom tree.
    generateCherryBlossomTree: function(x, groundLevelY) {
        const treeHeight = Math.floor(Math.random() * 3) + 4; // Cherry trees are usually 4 to 6 tiles tall.
        const treeTopY = groundLevelY - treeHeight; // Top of the cherry trunk.

        // We draw the cherry tree's trunk.
        for (let i = 1; i < treeHeight; i++) {
            this.world[groundLevelY - i][x] = 16; // Tile type 16 is for cherry wood.
        }

        // Then, we add a lush, pink canopy of cherry leaves.
        for (let ly = -2; ly <= 0; ly++) {
            for (let lx = -3; lx <= 3; lx++) {
                if (Math.random() > 0.2) // 80% chance for a leaf, making it quite dense.
                    this.world[treeTopY + ly][x + lx] = 17; // Tile type 17 is for cherry leaves.
            }
        }
    },

    // This function creates a spiky cactus in the desert.
    generateCactus: function(x, groundLevelY) {
        const cactusHeight = Math.floor(Math.random() * 3) + 2; // Cacti are 2 to 4 tiles tall.
        // We draw the cactus, stacking its segments upwards.
        for (let i = 1; i <= cactusHeight; i++) {
            this.world[groundLevelY - i][x] = 18; // Tile type 18 is for cactus.
        }
    },

    // This function scatters pretty flowers across the grassy areas of our world.
    generateFlowers: function(groundLevelY) {
        let x = 1; // We start looking for places to plant flowers a little way in.
        while (x < this.worldWidth - 1) { // We continue until near the end of the world.
            // We only plant flowers on grass tiles that have air above them.
            if (this.world[groundLevelY][x] === 1 && this.world[groundLevelY - 1][x] === 0) {
                if (Math.random() < 0.08) { // There's an 8% chance to plant a cluster of flowers.
                    const clusterSize = Math.floor(Math.random() * 3) + 1; // A cluster can have 1 to 3 flowers.
                    const flowerType = Math.floor(Math.random() * 3); // We randomly pick a type: Lily, Lily of the Valley, or Rose.

                    // We plant each flower in the cluster.
                    for (let i = 0; i < clusterSize && (x + i) < this.worldWidth - 1; i++) {
                        // We double-check that the spot is still good for a flower.
                        if (this.world[groundLevelY][x+i] === 1 && this.world[groundLevelY - 1][x+i] === 0) {
                            if (flowerType === 0) { // If it's a Lily...
                                this.world[groundLevelY - 1][x + i] = 6; // ...we place its stem...
                                this.world[groundLevelY - 2][x + i] = 7; // ...and its petals.
                            } else if (flowerType === 1) { // If it's a Lily of the Valley...
                                this.world[groundLevelY - 1][x + i] = 10; // ...we place its stem...
                                this.world[groundLevelY - 2][x + i] = 11; // ...and its delicate flowers.
                            } else if (flowerType === 2) { // If it's a Rose...
                                this.world[groundLevelY - 1][x + i] = 12; // ...we place its stem...
                                this.world[groundLevelY - 2][x + i] = 13; // ...and its beautiful bloom.
                            }
                        }
                    }
                    x += clusterSize + Math.floor(Math.random() * 5) + 3; // We move ahead to space out the next flower cluster.
                }
            }
            x++; // We move to the next spot to check for flowers.
        }
    },

    // This function brings our world to life by adding various creatures!
    initCreatures: function(groundLevelY) {
        this.creatures = []; // We clear out any old creatures to start fresh.
        // --- Let's Add Some Bunnies! ---
        for (let i = 0; i < 3; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE; // We pick a random spot for each bunny.
            this.creatures.push({
                type: 'bunny', // It's a cute bunny!
                x: spawnX, y: groundLevelY * this.TILE_SIZE - this.TILE_SIZE * 1.5, // They start just above the ground.
                width: this.TILE_SIZE, height: this.TILE_SIZE * 1.5, // How big our bunny is.
                vx: 0, vy: 0, // They start still.
                onGround: false, // Not on the ground yet, they're falling into place.
                direction: Math.random() < 0.5 ? 'left' : 'right', // They randomly face left or right.
                aiTimer: Math.random() * 100 + 50, // A timer for when they'll decide what to do next.
                dropCooldown: 0 // How long until they can drop another heart.
            });
        }
        // --- Let's Add Some Birds! ---
        for (let i = 0; i < 5; i++) {
            this.creatures.push({
                type: 'bird', // It's a graceful bird!
                x: Math.random() * this.worldWidth * this.TILE_SIZE, // They appear randomly across the sky.
                y: Math.random() * this.c.height * 0.4, // And in the upper part of the screen.
                width: this.TILE_SIZE * 0.6, height: this.TILE_SIZE * 0.6, // How big our bird is.
                vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, // They start with a little random movement.
                direction: 'right', // They start facing right.
                aiTimer: Math.random() * 100 // A timer for their next decision.
            });
        }
        // --- Let's Add Some Squirrels! ---
        for (let i = 0; i < 4; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE; // Random spot for our bushy-tailed friends.
            this.creatures.push({
                type: 'squirrel', // It's a playful squirrel!
                x: spawnX, y: groundLevelY * this.TILE_SIZE - this.TILE_SIZE, // They start just above the ground.
                width: this.TILE_SIZE * 0.8, height: this.TILE_SIZE, // How big our squirrel is.
                vx: 0, vy: 0, // They start still.
                onGround: false, // Not on the ground yet.
                direction: Math.random() < 0.5 ? 'left' : 'right', // They randomly face left or right.
                aiTimer: Math.random() * 80 + 40, // A timer for their next decision.
                climbing: false, // Are they climbing a tree?
                climbTargetY: null // Where they want to climb to.
            });
        }
        // --- Let's Add Some Fish! ---
        for (let i = 0; i < 8; i++) {
            // We define the boundaries of our pond so fish stay in the water.
            const pondStartX = Math.floor(this.worldWidth * 0.3);
            const pondEndX = Math.floor(this.worldWidth * 0.4);
            const pondTopY = groundLevelY; 
            const pondBottomY = groundLevelY + 4; 

            let spawnX, spawnY, tileX, tileY;
            let attempts = 0;
            // We try to find a good spot in the water for our fish to spawn.
            do {
                spawnX = (Math.random() * (pondEndX - pondStartX) + pondStartX) * this.TILE_SIZE;
                spawnY = (Math.random() * (pondBottomY - pondTopY) + pondTopY) * this.TILE_SIZE;
                tileX = Math.floor(spawnX / this.TILE_SIZE);
                tileY = Math.floor(spawnY / this.TILE_SIZE);
                attempts++;
            } while (this.world[tileY]?.[tileX] !== 9 && attempts < 50); // Keep trying until we find water or run out of tries.

            // If we found a watery spot, we add a fish!
            if (this.world[tileY]?.[tileX] === 9) {
                this.creatures.push({
                    type: 'fish', // It's a swimming fish!
                    x: spawnX, y: spawnY,
                    width: this.TILE_SIZE, height: this.TILE_SIZE * 0.6, // How big our fish is.
                    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, // They start with a gentle swim.
                    direction: Math.random() < 0.5 ? 'left' : 'right', // They randomly face left or right.
                    aiTimer: Math.random() * 100 + 50, // A timer for their next swim move.
                    life: 100 // Fish have a life counter, they don't like being out of water!
                });
            }
        }
        // --- Let's Add Some Butterflies! ---
        for (let i = 0; i < 5; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE; // Random spot for our fluttering friends.
            this.creatures.push({
                type: 'butterfly', // It's a beautiful butterfly!
                x: spawnX, y: Math.random() * this.c.height * 0.5, // They appear in the upper half of the screen.
                width: this.TILE_SIZE * 0.5, height: this.TILE_SIZE * 0.5, // How big our butterfly is.
                vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, // They start with a gentle flutter.
                aiTimer: Math.random() * 100 + 50, // A timer for their next flutter.
                color: Math.random() < 0.5 ? '#FFEB3B' : '#FF9800' // They can be yellow or orange.
            });
        }
        // --- Let's Add Some Fireflies! ---
        for (let i = 0; i < 5; i++) {
            const spawnX = Math.random() * this.worldWidth * this.TILE_SIZE; // Random spot for our glowing friends.
            this.creatures.push({
                type: 'firefly', // It's a magical firefly!
                x: spawnX, y: Math.random() * this.c.height * 0.5, // They appear in the upper half of the screen.
                width: this.TILE_SIZE * 0.3, height: this.TILE_SIZE * 0.3, // How big our firefly is.
                vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, // They drift gently.
                aiTimer: Math.random() * 100 + 50, // A timer for their next drift.
                alpha: 0.8, // They start a little transparent.
                flicker: Math.random() * Math.PI * 2 // A special value to make them twinkle.
            });
        }
    },

    // This little helper function tells us if a tile is solid, meaning players and creatures can stand on it.
    isSolid: function(tileType) {
        // Our grass (1), dirt (2), and stone (3) tiles are all solid!
        return tileType === 1 || tileType === 2 || tileType === 3;
    },

    // This function draws a beautiful, detailed grass tile at a specific spot on our canvas.
    drawGrassTile: function(x, y) {
        const size = this.TILE_SIZE; // We get the standard size for our tiles.
        const grassLight = '#8BC34A'; // A brighter green for sunny grass patches.
        const grassDarker = '#4CAF50'; // A deeper green for shaded grass.

        this.x.fillStyle = this.tileColors.dirt; // We start by painting the whole tile with a dirt base.
        this.x.fillRect(x, y, size, size); // Fill the entire tile area with that dirt color.

        // Then, we lay down the main grass layer on top of the dirt.
        this.x.fillStyle = this.tileColors.grass;
        this.x.fillRect(x, y, size, size / 2); // The top half gets our main grass color.

        // We add some lighter patches to make the grass look varied and natural.
        this.x.fillStyle = grassLight;
        this.x.fillRect(x + size * 0.1, y, size * 0.2, size * 0.3); // A little light patch here.
        this.x.fillRect(x + size * 0.6, y + size * 0.1, size * 0.3, size * 0.2); // And another one there.

        // And some darker patches for depth and shadow.
        this.x.fillStyle = this.tileColors.grassDark;
        this.x.fillRect(x + size * 0.3, y + size * 0.2, size * 0.2, size * 0.2); // A dark patch for contrast.
        this.x.fillRect(x + size * 0.8, y, size * 0.1, size * 0.3); // Another dark patch.

        // Finally, tiny strokes to simulate individual blades of grass, adding fine detail.
        this.x.fillStyle = grassDarker;
        this.x.fillRect(x + size * 0.05, y + size * 0.4, size * 0.05, size * 0.1); // A small blade.
        this.x.fillRect(x + size * 0.25, y + size * 0.35, size * 0.05, size * 0.15); // A taller blade.
        this.x.fillRect(x + size * 0.7, y + size * 0.45, size * 0.05, size * 0.05); // A tiny tuft.
    },

    // This function draws a rich, earthy dirt tile.
    drawDirtTile: function(x, y, size = this.TILE_SIZE) {
        const dirtDark = '#7A4F24'; // A deeper brown for the darker parts of the dirt.

        this.x.fillStyle = this.tileColors.dirt; // We start with our main dirt color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We add lighter patches to give the dirt some texture and variation.
        this.x.fillStyle = this.tileColors.dirtLight;
        this.x.fillRect(x + size * 0.2, y + size * 0.3, size * 0.2, size * 0.2); // A light spot here.
        this.x.fillRect(x + size * 0.6, y + size * 0.1, size * 0.2, size * 0.2); // Another light spot there.
        this.x.fillRect(x + size * 0.1, y + size * 0.7, size * 0.3, size * 0.2); // And one more.

        // And some darker patches to add depth and make it look like real soil.
        this.x.fillStyle = dirtDark;
        this.x.fillRect(x + size * 0.4, y + size * 0.5, size * 0.3, size * 0.3); // A dark clump.
        this.x.fillRect(x + size * 0.7, y + size * 0.8, size * 0.2, size * 0.1); // Another dark spot.
    },

    // This function draws a rugged stone tile.
    drawStoneTile: function(x, y, size = this.TILE_SIZE) {
        const stoneDark = '#5A5A5A'; // A darker gray for the shadowy parts of the stone.

        this.x.fillStyle = this.tileColors.stone; // We start with our main stone color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We add lighter patches to give the stone a rough, textured look.
        this.x.fillStyle = this.tileColors.stoneLight;
        this.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.3, size * 0.3); // A light rock face.
        this.x.fillRect(x + size * 0.6, y + size * 0.4, size * 0.3, size * 0.3); // Another light patch.
        this.x.fillRect(x + size * 0.3, y + size * 0.7, size * 0.2, size * 0.2); // And a smaller one.

        // And some darker patches to add depth and make it look like a solid, ancient rock.
        this.x.fillStyle = stoneDark;
        this.x.fillRect(x + size * 0.4, y + size * 0.2, size * 0.2, size * 0.2); // A dark crevice.
        this.x.fillRect(x + size * 0.1, y + size * 0.5, size * 0.2, size * 0.2); // Another dark spot.
    },

    // This function draws a sturdy wood tile, perfect for tree trunks or cabins.
    drawWoodTile: function(x, y, size = this.TILE_SIZE) {
        const woodDark = '#4A2D1C'; // A deep brown for the wood grain.
        const woodLight = '#B87B4F'; // A warm, lighter brown for highlights.

        this.x.fillStyle = this.tileColors.wood; // We start with our main wood color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We add darker vertical stripes to mimic the natural grain of wood.
        this.x.fillStyle = woodDark;
        this.x.fillRect(x + size * 0.2, y, size * 0.2, size); // A dark stripe running down.
        this.x.fillRect(x + size * 0.7, y, size * 0.1, size); // Another thinner dark stripe.

        // And some lighter stripes to show off the texture and highlights.
        this.x.fillStyle = woodLight;
        this.x.fillRect(x + size * 0.3, y + size * 0.1, size * 0.1, size * 0.8); // A light stripe.
        this.x.fillRect(x + size * 0.8, y + size * 0.2, size * 0.1, size * 0.6); // Another light stripe.
    },

    // This function draws a lush leaves tile, full of green goodness.
    drawLeavesTile: function(x, y, size = this.TILE_SIZE) {
        const leavesDark = '#2B6B1F'; // A deep, shadowy green for dense leaf clusters.
        const leavesLight = '#4CAF50'; // A brighter green for sunlit leaves.

        this.x.fillStyle = this.tileColors.leaves; // We start with our main leaf color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We draw larger, darker clusters to give the impression of depth within the foliage.
        this.x.fillStyle = leavesDark;
        this.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.4, size * 0.4); // A big dark cluster.
        this.x.fillRect(x + size * 0.5, y + size * 0.5, size * 0.4, size * 0.4); // Another big dark cluster.

        // Then, smaller, lighter clusters for highlights and individual leaves.
        this.x.fillStyle = leavesLight;
        this.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.3); // A small light cluster.
        this.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.3, size * 0.3); // Another small light cluster.

        // And tiny individual leaves for that extra touch of detail.
        this.x.fillStyle = this.tileColors.leaves;
        this.x.fillRect(x + size * 0.05, y + size * 0.7, size * 0.1, size * 0.1); // A tiny leaf.
        this.x.fillRect(x + size * 0.8, y + size * 0.05, size * 0.1, size * 0.1); // Another tiny leaf.
    },

    // This function draws a distinctive birch wood tile, with its pale bark.
    drawBirchWoodTile: function(x, y, size = this.TILE_SIZE) {
        const birchWoodDark = '#D4D4C0'; // A slightly darker shade for the subtle patterns in birch bark.

        this.x.fillStyle = this.tileColors.birchWood; // We start with the main pale birch wood color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We add horizontal lines to simulate the unique texture of birch bark.
        this.x.fillStyle = birchWoodDark;
        this.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.1); // A horizontal line.
        this.x.fillRect(x + size * 0.15, y + size * 0.3, size * 0.7, size * 0.1); // Another horizontal line.
        this.x.fillRect(x + size * 0.2, y + size * 0.5, size * 0.6, size * 0.1); // And another.
        this.x.fillRect(x + size * 0.25, y + size * 0.7, size * 0.5, size * 0.1); // One more horizontal line.

        // And some small dark spots for those characteristic birch bark markings.
        this.x.fillStyle = '#000000'; // Black for the little spots.
        this.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.1, size * 0.1); // A dark spot.
        this.x.fillRect(x + size * 0.7, y + size * 0.5, size * 0.1, size * 0.1); // Another dark spot.
    },

    // This function draws a delicate birch leaves tile.
    drawBirchLeavesTile: function(x, y, size = this.TILE_SIZE) {
        const birchLeavesDark = '#7AA97A'; // A darker green for the shaded parts of the birch leaves.
        const birchLeavesLight = '#B0E0B0'; // A lighter green for sun-kissed birch leaves.

        this.x.fillStyle = this.tileColors.birchLeaves; // We start with the main birch leaf color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We draw larger, darker clusters to give the impression of depth within the foliage.
        this.x.fillStyle = birchLeavesDark;
        this.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.4, size * 0.4); // A big dark cluster.
        this.x.fillRect(x + size * 0.5, y + size * 0.5, size * 0.4, size * 0.4); // Another big dark cluster.

        // Then, smaller, lighter clusters for highlights and individual leaves.
        this.x.fillStyle = birchLeavesLight;
        this.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.3); // A small light cluster.
        this.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.3, size * 0.3); // Another small light cluster.

        // And tiny individual leaves for that extra touch of detail.
        this.x.fillStyle = this.tileColors.birchLeaves;
        this.x.fillRect(x + size * 0.05, y + size * 0.7, size * 0.1, size * 0.1); // A tiny leaf.
        this.x.fillRect(x + size * 0.8, y + size * 0.05, size * 0.1, size * 0.1); // Another tiny leaf.
    },

    // This function draws a rich cherry wood tile.
    drawCherryWoodTile: function(x, y, size = this.TILE_SIZE) {
        const cherryWoodDark = '#7A4F24'; // A darker brown for the grain of cherry wood.
        const cherryWoodLight = '#C88A5F'; // A lighter, reddish-brown for highlights.

        this.x.fillStyle = this.tileColors.cherryWood; // We start with the main cherry wood color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We add darker vertical stripes to simulate the natural grain of cherry wood.
        this.x.fillStyle = cherryWoodDark;
        this.x.fillRect(x + size * 0.2, y, size * 0.2, size); // A dark stripe.
        this.x.fillRect(x + size * 0.7, y, size * 0.1, size); // Another dark stripe.

        // And some lighter stripes for highlights and texture.
        this.x.fillStyle = cherryWoodLight;
        this.x.fillRect(x + size * 0.3, y + size * 0.1, size * 0.1, size * 0.8); // A light stripe.
        this.x.fillRect(x + size * 0.8, y + size * 0.2, size * 0.1, size * 0.6); // Another light stripe.
    },

    // This function draws a beautiful cherry blossom leaves tile, full of pink petals.
    drawCherryLeavesTile: function(x, y, size = this.TILE_SIZE) {
        const cherryLeavesDark = '#E0A9B3'; // A deeper pink for shaded cherry blossoms.
        const cherryLeavesLight = '#FFC0CB'; // A brighter pink for sunlit petals.

        this.x.fillStyle = this.tileColors.cherryLeaves; // We start with the main cherry blossom pink.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We draw larger, darker clusters of petals for depth.
        this.x.fillStyle = cherryLeavesDark;
        this.x.fillRect(x + size * 0.1, y + size * 0.1, size * 0.4, size * 0.4); // A big dark cluster.
        this.x.fillRect(x + size * 0.5, y + size * 0.5, size * 0.4, size * 0.4); // Another big dark cluster.

        // Then, smaller, lighter clusters for highlights and individual petals.
        this.x.fillStyle = cherryLeavesLight;
        this.x.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.3); // A small light cluster.
        this.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.3, size * 0.3); // Another small light cluster.

        // And tiny individual petals for that extra touch of detail.
        this.x.fillStyle = this.tileColors.cherryLeaves;
        this.x.fillRect(x + size * 0.05, y + size * 0.7, size * 0.1, size * 0.1); // A tiny petal.
        this.x.fillRect(x + size * 0.8, y + size * 0.05, size * 0.1, size * 0.1); // Another tiny petal.
    },

    // This function draws a spiky cactus tile, ready for the desert.
    drawCactusTile: function(x, y, size = this.TILE_SIZE) {
        const cactusDark = '#004D00'; // A deep, shadowy green for the cactus body.
        const cactusLight = '#009900'; // A brighter green for sunlit parts.

        this.x.fillStyle = this.tileColors.cactus; // We start with the main cactus green.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We draw darker vertical strips to give the cactus its segmented look.
        this.x.fillStyle = cactusDark;
        this.x.fillRect(x, y, size * 0.2, size); // A dark strip on the left.
        this.x.fillRect(x + size * 0.8, y, size * 0.2, size); // A dark strip on the right.

        // Then, lighter horizontal lines to define the segments.
        this.x.fillStyle = cactusLight;
        this.x.fillRect(x + size * 0.2, y + size * 0.1, size * 0.6, size * 0.1); // A horizontal segment line.
        this.x.fillRect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.1); // Another horizontal segment line.
        this.x.fillRect(x + size * 0.2, y + size * 0.7, size * 0.6, size * 0.1); // And one more.

        // And finally, tiny white squares for the sharp spines!
        this.x.fillStyle = '#FFFFFF'; // White for the spines.
        this.x.fillRect(x + size * 0.25, y + size * 0.15, size * 0.05, size * 0.05); // A little spine.
        this.x.fillRect(x + size * 0.7, y + size * 0.2, size * 0.05, size * 0.05); // Another little spine.
        this.x.fillRect(x + size * 0.3, y + size * 0.45, size * 0.05, size * 0.05); // And another.
        this.x.fillRect(x + size * 0.65, y + size * 0.55, size * 0.05, size * 0.05); // One last spine.
    },

    // This function draws a simple flower stem tile.
    drawFlowerStemTile: function(x, y, size = this.TILE_SIZE) {
        const stemDark = '#388E3C'; // A darker green for the shaded side of the stem.

        this.x.fillStyle = this.tileColors.flowerStem; // We start with the main stem green.
        this.x.fillRect(x + size * 0.4, y, size * 0.2, size); // Draw the main stem.

        // We add a darker stripe for a bit of dimension.
        this.x.fillStyle = stemDark;
        this.x.fillRect(x + size * 0.45, y, size * 0.1, size); // A darker stripe down the middle.

        // And some small leaves on the stem.
        this.x.fillStyle = this.tileColors.leaves;
        this.x.fillRect(x + size * 0.3, y + size * 0.3, size * 0.1, size * 0.2); // A small leaf.
        this.x.fillRect(x + size * 0.6, y + size * 0.6, size * 0.1, size * 0.2); // Another small leaf.
    },

    // This function draws a vibrant flower petal tile.
    drawFlowerPetalTile: function(x, y, size = this.TILE_SIZE) {
        const petalDark = '#D4B830'; // A darker yellow for the shaded parts of the petals.
        const petalCenter = '#e0e0d1'; // A creamy color for the very center of the flower.

        this.x.fillStyle = this.tileColors.flowerPetal; // We start with the main petal color.
        this.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.4, size * 0.4); // Draw the main petal shape.

        // We add a darker inner part for more detail.
        this.x.fillStyle = petalDark;
        this.x.fillRect(x + size * 0.35, y + size * 0.55, size * 0.3, size * 0.3); // A darker inner section.

        // And finally, the bright center of the flower.
        this.x.fillStyle = petalCenter;
        this.x.fillRect(x + size * 0.4, y + size * 0.4, size * 0.2, size * 0.2); // The flower's heart.
    },

    // This function draws a lily of the valley stem tile, with its distinctive leaves.
    drawLilyOfTheValleyStemTile: function(x, y, size = this.TILE_SIZE) {
        const stemDark = '#5A7A1F'; // A darker green for the shaded parts of the stem.

        this.x.fillStyle = this.tileColors.lilyOfTheValleyGreen; // We start with the main stem green.
        this.x.fillRect(x + size * 0.45, y, size * 0.1, size); // Draw the main stem.
        this.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.4, size * 0.2); // Add a leaf.

        // We add a darker stripe for a bit of dimension.
        this.x.fillStyle = stemDark;
        this.x.fillRect(x + size * 0.47, y, size * 0.05, size); // A darker stripe down the middle.

        // And some additional leaves.
        this.x.fillRect(x + size * 0.2, y + size * 0.7, size * 0.4, size * 0.2); // Another leaf.
    },

    // This function draws a delicate lily of the valley flower tile.
    drawLilyOfTheValleyFlowerTile: function(x, y, size = this.TILE_SIZE) {
        const flowerShade = '#E0E0E0'; // A light gray for subtle shading on the white flowers.

        this.x.fillStyle = this.tileColors.lilyOfTheValleyWhite; // We start with the main white color for the bells.
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.2, size * 0.15, 0, Math.PI * 2); // Draw a little bell.
        this.x.fill();
        this.x.beginPath();
        this.x.arc(x + size * 0.3, y + size * 0.4, size * 0.15, 0, Math.PI * 2); // Draw another little bell.
        this.x.fill();
        this.x.beginPath();
        this.x.arc(x + size * 0.7, y + size * 0.4, size * 0.15, 0, Math.PI * 2); // And a third little bell.
        this.x.fill();

        // We add some subtle shading to make the flowers look more rounded.
        this.x.fillStyle = flowerShade;
        this.x.beginPath();
        this.x.arc(x + size * 0.55, y + size * 0.25, size * 0.1, 0, Math.PI * 2); // Shading for the first bell.
        this.x.fill();
        this.x.beginPath();
        this.x.arc(x + size * 0.35, y + size * 0.45, size * 0.1, 0, Math.PI * 2); // Shading for the second bell.
        this.x.fill();
    },

    // This function draws a rose stem tile, complete with thorns.
    drawRoseStemTile: function(x, y, size = this.TILE_SIZE) {
        const stemDark = '#286B2C'; // A darker green for the shaded parts of the rose stem.

        this.x.fillStyle = this.tileColors.roseStemGreen; // We start with the main stem green.
        this.x.fillRect(x + size * 0.45, y, size * 0.1, size); // Draw the main stem.
        this.x.fillRect(x + size * 0.3, y + size * 0.6, size * 0.4, size * 0.1); // Add a leaf.

        // We add a darker stripe for a bit of dimension.
        this.x.fillStyle = stemDark;
        this.x.fillRect(x + size * 0.47, y, size * 0.05, size); // A darker stripe down the middle.

        // And some tiny thorns!
        this.x.fillStyle = '#A0A0A0'; // Gray for the thorns.
        this.x.fillRect(x + size * 0.4, y + size * 0.4, size * 0.05, size * 0.05); // A little thorn.
        this.x.fillRect(x + size * 0.55, y + size * 0.7, size * 0.05, size * 0.05); // Another little thorn.
    },

    // This function draws a vibrant rose flower tile.
    drawRoseFlowerTile: function(x, y, size = this.TILE_SIZE) {
        const roseDark = '#B71C1C'; // A deeper red for the shaded petals of the rose.
        const roseCenter = '#FFEB3B'; // A bright yellow for the heart of the rose.

        this.x.fillStyle = this.tileColors.roseRed; // We start with the main rose red.
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.3, size * 0.3, 0, Math.PI * 2); // Draw the outer petals.
        this.x.fill();

        // We add layers of petals, getting darker towards the center.
        this.x.fillStyle = roseDark;
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.3, size * 0.2, 0, Math.PI * 2); // A darker layer of petals.
        this.x.fill();

        this.x.fillStyle = this.tileColors.roseRed;
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.3, size * 0.15, 0, Math.PI * 2); // Another layer, slightly lighter.
        this.x.fill();

        // And finally, the bright, beautiful center of the rose.
        this.x.fillStyle = roseCenter;
        this.x.beginPath();
        this.x.arc(x + size * 0.5, y + size * 0.3, size * 0.05, 0, Math.PI * 2); // The tiny, glowing center.
        this.x.fill();
    },

    // This function draws a shimmering water tile.
    drawWaterTile: function(x, y, size = this.TILE_SIZE) {
        const waterDark = 'rgba(46, 134, 222, 0.7)'; // A deeper blue for the darker parts of the water.
        const waterLight = 'rgba(93, 173, 226, 0.7)'; // A lighter blue for sunlit ripples.

        this.x.fillStyle = this.tileColors.water; // We start with our main translucent water color.
        this.x.fillRect(x, y, size, size); // Fill the whole tile with this base color.

        // We add some white ripples and highlights to make the water look reflective.
        this.x.fillStyle = 'rgba(255, 255, 255, 0.2)'; // White with a bit of transparency.
        this.x.fillRect(x + size * 0.1, y + size * 0.2, size * 0.8, size * 0.1); // A ripple here.
        this.x.fillRect(x + size * 0.3, y + size * 0.5, size * 0.6, size * 0.1); // Another ripple there.

        // And some dark shadows to give the water depth.
        this.x.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Black with a bit of transparency.
        this.x.fillRect(x + size * 0.2, y + size * 0.4, size * 0.7, size * 0.1); // A shadow here.
        this.x.fillRect(x + size * 0.4, y + size * 0.7, size * 0.5, size * 0.1); // Another shadow there.

        // A deeper water effect at the bottom.
        this.x.fillStyle = waterDark;
        this.x.fillRect(x, y + size * 0.8, size, size * 0.2); // The deepest part of the water.
        this.x.fillStyle = waterLight;
        this.x.fillRect(x, y, size, size * 0.1); // A bright highlight on the very top surface.
    },

    // This function draws a cute little bird, ready to fly across the sky.
    drawBird: function(bird) {
        this.x.save(); // We save the current drawing state so we can mess with it without affecting other drawings.
        const birdCenterX = bird.x - this.camera.x + bird.width / 2; // We find the center of the bird for flipping.

        if (bird.direction === 'left') {
            this.x.translate(birdCenterX, 0); // Move to the bird's center.
            this.x.scale(-1, 1); // Flip horizontally to make it face left.
            this.x.translate(-birdCenterX, 0); // Move back so it draws in the right spot.
        }
        
        const pSize = bird.width / 4; // A base size unit for drawing bird parts.
        const bodyColor = '#4a4a4a'; // Dark gray for the bird's body.
        const bodyLight = '#6a6a6a'; // Lighter gray for highlights.
        const wingColor = '#3a3a3a'; // Even darker gray for the wings.
        const beakColor = '#FFD700'; // Golden yellow for the beak.
        const eyeWhite = 'white'; // White for the eye.
        const eyePupil = 'black'; // Black for the pupil.

        // Body of the bird.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bird.x - this.camera.x + pSize, bird.y - this.camera.y + pSize, pSize * 2, pSize);
        this.x.fillRect(bird.x - this.camera.x, bird.y - this.camera.y + pSize * 2, pSize * 3, pSize);
        this.x.fillStyle = bodyLight;
        this.x.fillRect(bird.x - this.camera.x + pSize * 1.5, bird.y - this.camera.y + pSize * 1.5, pSize * 1.5, pSize * 0.5); // Body highlight.

        // Head of the bird.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bird.x - this.camera.x + pSize * 3, bird.y - this.camera.y, pSize, pSize);

        // Wing of the bird.
        this.x.fillStyle = wingColor;
        this.x.fillRect(bird.x - this.camera.x + pSize * 0.5, bird.y - this.camera.y + pSize * 0.5, pSize * 2, pSize * 0.5); // The wing.

        // Beak of the bird.
        this.x.fillStyle = beakColor;
        this.x.fillRect(bird.x - this.camera.x + pSize * 4, bird.y - this.camera.y + pSize, pSize, pSize / 2);

        // Eye of the bird.
        this.x.fillStyle = eyeWhite;
        this.x.fillRect(bird.x - this.camera.x + pSize * 3.5, bird.y - this.camera.y + pSize * 0.5, pSize * 0.5, pSize * 0.5);
        this.x.fillStyle = eyePupil;
        this.x.fillRect(bird.x - this.camera.x + pSize * 3.7, bird.y - this.camera.y + pSize * 0.7, pSize * 0.2, pSize * 0.2);

        this.x.restore(); // We restore the drawing state, undoing our flip.
    },

    // This function draws a tiny sapling tile, waiting to grow into a mighty tree.
    drawSaplingTile: function(x, y, size = this.TILE_SIZE) {
        const saplingDark = '#5A3B20'; // A darker brown for the shaded part of the sapling stem.
        const leavesLight = '#4CAF50'; // A brighter green for the young leaves.

        this.x.fillStyle = this.tileColors.sapling; // We start with the main sapling stem color.
        this.x.fillRect(x + size * 0.4, y + size * 0.5, size * 0.2, size * 0.5); // Draw the little stem.

        // We add a darker stripe for a bit of dimension.
        this.x.fillStyle = saplingDark;
        this.x.fillRect(x + size * 0.45, y + size * 0.5, size * 0.1, size * 0.5); // A darker stripe on the stem.

        // And some fresh, green leaves.
        this.x.fillStyle = this.tileColors.leaves;
        this.x.fillRect(x + size * 0.3, y + size * 0.3, size * 0.4, size * 0.4); // The main leaf cluster.

        // With some lighter variations for highlights.
        this.x.fillStyle = leavesLight;
        this.x.fillRect(x + size * 0.35, y + size * 0.35, size * 0.3, size * 0.3); // A lighter part of the leaves.
    },

    // This function is responsible for drawing our entire game world, tile by tile.
    drawWorld: function() {
        // We calculate which part of the world is currently visible on the screen.
        const startPixelX = this.camera.x;
        const endPixelX = this.camera.x + this.c.width;
        const startPixelY = this.camera.y;
        const endPixelY = this.camera.y + this.c.height;

        // We convert those pixel coordinates into tile coordinates.
        const startTileX = Math.floor(startPixelX / this.TILE_SIZE);
        const endTileX = Math.ceil(endPixelX / this.TILE_SIZE);
        const startTileY = Math.floor(startPixelY / this.TILE_SIZE);
        const endTileY = Math.ceil(endPixelY / this.TILE_SIZE);

        // Now, we loop through all the visible tiles and draw each one according to its type.
        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tileType = this.getTile(x, y); // What kind of tile is this?
                const tileX = x * this.TILE_SIZE - this.camera.x; // Calculate its screen X position.
                const tileY = y * this.TILE_SIZE - this.camera.y; // Calculate its screen Y position.

                // Based on the tile type, we call the appropriate drawing function.
                switch (tileType) {
                    case 1: this.drawGrassTile(tileX, tileY); break; // Green grass!
                    case 2: this.drawDirtTile(tileX, tileY); break; // Brown dirt!
                    case 3: this.drawStoneTile(tileX, tileY); break; // Gray stone!
                    case 4: this.drawWoodTile(tileX, tileY); break; // Sturdy wood!
                    case 5: this.drawLeavesTile(tileX, tileY); break; // Green leaves!
                    case 6: this.drawFlowerStemTile(tileX, tileY); break; // Flower stem!
                    case 7: this.drawFlowerPetalTile(tileX, tileY); break; // Flower petals!
                    case 8: this.drawSaplingTile(tileX, tileY); break; // A tiny sapling!
                    case 9: this.drawWaterTile(tileX, tileY); break; // Shimmering water!
                    case 10: this.drawLilyOfTheValleyStemTile(tileX, tileY); break; // Lily of the valley stem!
                    case 11: this.drawLilyOfTheValleyFlowerTile(tileX, tileY); break; // Lily of the valley flower!
                    case 12: this.drawRoseStemTile(tileX, tileY); break; // Rose stem!
                    case 13: this.drawRoseFlowerTile(tileX, tileY); break; // Rose flower!
                    case 14: this.drawBirchWoodTile(tileX, tileY); break; // Birch wood!
                    case 15: this.drawBirchLeavesTile(tileX, tileY); break; // Birch leaves!
                    case 16: this.drawCherryWoodTile(tileX, tileY); break; // Cherry wood!
                    case 17: this.drawCherryLeavesTile(tileX, tileY); break; // Cherry leaves!
                    case 18: this.drawCactusTile(tileX, tileY); break; // Spiky cactus!
                }
            }
        }
    },

    // This function sets up the magical raining hearts effect.
    initRainingHearts: function() {
        this.rainingHearts = []; // We clear any old hearts.
        for (let i = 0; i < 50; i++) { // We create 50 new hearts.
            this.rainingHearts.push({
                x: Math.random() * this.c.width, // Random horizontal position.
                y: Math.random() * this.c.height - this.c.height, // Start above the screen.
                size: Math.random() * 5 + 5, // Random size.
                vy: Math.random() * 1 + 0.5 // Random falling speed.
            });
        }
    },

    // This function creates our fluffy, drifting clouds.
    initClouds: function() {
        this.clouds = []; // We clear any old clouds.
        const cloudPixelSize = 15; // A base size for cloud parts.
        for (let i = 0; i < 5; i++) { // We create 5 clouds.
            const cloud = {
                x: Math.random() * this.c.width, // Random horizontal position.
                y: Math.random() * this.c.height * 0.3 + 20, // Random vertical position in the upper sky.
                speed: Math.random() * 0.2 + 0.1, // Random drifting speed.
                blocks: [], // The individual parts that make up the cloud.
                width: 0 // The total width of the cloud.
            };

            const cloudLength = Math.floor(Math.random() * 4) + 3; // Each cloud has 3 to 6 parts.
            let currentX = 0;
            for (let j = 0; j < cloudLength; j++) {
                const blockWidth = (Math.random() * 1.5 + 0.5) * cloudPixelSize; // Random width for each part.
                const blockHeight = (Math.random() * 1.5 + 0.5) * cloudPixelSize; // Random height for each part.
                const blockYOffset = (Math.random() - 0.5) * cloudPixelSize; // Random vertical offset.
                cloud.blocks.push({ rx: currentX, ry: blockYOffset, width: blockWidth, height: blockHeight });
                currentX += blockWidth * 0.7;
            }
            cloud.width = currentX;

            this.clouds.push(cloud);
        }
    },

    // This function smoothly blends two colors together, like mixing paint!
    lerpColor: function(color1, color2, factor) {
        // We break down the colors into their red, green, and blue components.
        const r1 = parseInt(color1.substring(1, 3), 16);
        const g1 = parseInt(color1.substring(3, 5), 16);
        const b1 = parseInt(color1.substring(5, 7), 16);
        const r2 = parseInt(color2.substring(1, 3), 16);
        const g2 = parseInt(color2.substring(3, 5), 16);
        const b2 = parseInt(color2.substring(5, 7), 16);

        // We calculate the new red, green, and blue values based on the 'factor' (how much of each color to mix).
        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));

        return `rgb(${r}, ${g}, ${b})`; // And return the new, blended color!
    },

    // This function paints our beautiful sky, complete with sun/moon, and drifting clouds.
    drawSky: function() {
        const angle = this.celestialBody.angle; // We get the current position of our sun/moon.
        this.isNight = Math.sin(angle) >= 0; // We figure out if it's daytime or nighttime based on the angle.

        let topColor, bottomColor; // These will be the colors for our sky gradient.
        const transitionFactor = Math.abs(Math.sin(angle)); // How far along we are in the day/night transition.

        // We smoothly transition between different sky palettes (dawn, midday, dusk, night) based on the sun/moon's position.
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

        // We create a beautiful gradient for our sky, from top to bottom.
        const skyGradient = this.x.createLinearGradient(0, 0, 0, this.c.height * 0.8);
        skyGradient.addColorStop(0, topColor);
        skyGradient.addColorStop(1, bottomColor);
        this.x.fillStyle = skyGradient;
        this.x.fillRect(0, 0, this.c.width, this.c.height);

        // We draw our parallax background layers, creating a sense of depth as they move at different speeds.
        this.backgroundLayers.forEach(layer => {
            this.x.fillStyle = layer.color;
            const layerX = - (this.camera.x * layer.speed) % this.c.width;
            this.x.fillRect(layerX, 0, this.c.width, this.c.height);
            this.x.fillRect(layerX + this.c.width, 0, this.c.width, this.c.height);
        });

        // We calculate where to draw our sun or moon.
        const sunMoonX = this.c.width / 2 + Math.cos(this.celestialBody.angle) * (this.c.width / 2 + 30);
        const sunMoonY = this.c.height * 0.8 + Math.sin(this.celestialBody.angle) * (this.c.height * 0.7);
        const sunMoonRadius = 30;
        
        // If it's night, we draw the moon with some craters and a glow.
        if (this.isNight) {
            this.x.fillStyle = '#FAFAF0'; // Moon color.
            this.x.shadowBlur = 20;
            this.x.shadowColor = '#FAFAF0';
            // Adding some moon craters for realism.
            this.x.beginPath();
            this.x.arc(sunMoonX - 10, sunMoonY - 5, 5, 0, Math.PI * 2);
            this.x.fillStyle = '#E0E0D0';
            this.x.fill();
            this.x.beginPath();
            this.x.arc(sunMoonX + 10, sunMoonY + 8, 7, 0, Math.PI * 2);
            this.x.fillStyle = '#E0E0D0';
            this.x.fill();
        } else { // Otherwise, we draw the sun with a warm glow.
            this.x.fillStyle = '#F2A9A9'; // Sun color.
            this.x.shadowBlur = 30;
            this.x.shadowColor = 'rgba(242, 169, 169, 0.8)';
        }
        this.x.beginPath();
        this.x.arc(sunMoonX, sunMoonY, sunMoonRadius, 0, Math.PI * 2);
        this.x.fill();
        this.x.shadowBlur = 0; // Reset shadow blur so it doesn't affect other drawings.

        // We draw our clouds, making them drift across the sky.
        this.clouds.forEach(cloud => {
            this.x.fillStyle = 'rgba(250, 250, 240, 0.7)'; // A soft, slightly transparent white for clouds.
            cloud.blocks.forEach(block => {
                this.x.fillRect(cloud.x + block.rx, cloud.y + block.ry, block.width, block.height);
            });

            cloud.x += cloud.speed; // Move the cloud.
            if (cloud.x > this.c.width) { // If it drifts off screen, bring it back to the other side.
                cloud.x = -cloud.width;
            }
        });

        // If it's night, we add a subtle tint and maybe some shooting stars!
        if (this.isNight) {
            // A dark blue tint to make the night sky feel deeper.
            this.x.fillStyle = 'rgba(0, 0, 50, 0.2)';
            this.x.fillRect(0, 0, this.c.width, this.c.height);

            if (Math.random() < 0.01) { // A small chance for a shooting star to appear.
                this.shootingStars.push({
                    x: Math.random() * this.c.width, // Random starting X position.
                    y: Math.random() * this.c.height * 0.5, // Random starting Y position.
                    len: Math.random() * 80 + 20, // Random length for the star's tail.
                    speed: Math.random() * 5 + 5, // Random speed.
                    life: 100 // How long the star will be visible.
                });
            }
        }

        // We draw and update our shooting stars.
        this.shootingStars.forEach((star, index) => {
            this.x.strokeStyle = 'rgba(250, 250, 240, 0.8)'; // A bright, slightly transparent white for the star.
            this.x.lineWidth = 2;
            this.x.beginPath();
            this.x.moveTo(star.x, star.y);
            this.x.lineTo(star.x - star.len, star.y + star.len); // Draw the star's tail.
            this.x.stroke();
            star.x -= star.speed; // Move the star.
            star.y += star.speed;
            star.life--; // Decrease its lifespan.
            if (star.life <= 0) { // If it's gone, remove it.
                this.shootingStars.splice(index, 1);
            }
        });

        // If the sun/moon isn't being dragged, we make it slowly move across the sky on its own.
        if (!this.isDraggingSunMoon) {
            this.celestialBody.angle += 0.0003;
            if (this.celestialBody.angle > Math.PI) { // If it goes too far, reset its position.
                this.celestialBody.angle = -Math.PI;
            }
        }
    },

    // This function draws and animates our lovely raining hearts.
    drawRainingHearts: function() {
        this.rainingHearts.forEach(heart => {
            this.drawHeart(heart.x, heart.y, heart.size); // Draw each heart.
            heart.y += heart.vy; // Make it fall.
            if (heart.y > this.c.height) { // If it falls off screen, bring it back to the top.
                heart.y = -heart.size;
                heart.x = Math.random() * this.c.width;
            }
        });
    },

    // This function displays a special anniversary message on the screen.
    displayAnniversaryMessage: function() {
        const message = document.createElement('div'); // We create a new div element for our message.
        message.id = 'anniversary-message';
        message.style.position = 'fixed'; // Keep it in place on the screen.
        message.style.top = '50%'; // Center it vertically.
        message.style.left = '50%'; // Center it horizontally.
        message.style.transform = 'translate(-50%, -50%)'; // Fine-tune centering.
        message.style.fontFamily = "'Press Start 2P', cursive"; // A cool retro font.
        message.style.color = 'white'; // White text.
        message.style.textShadow = '2px 2px 4px #000000'; // A subtle shadow for readability.
        message.style.zIndex = '1000'; // Make sure it's on top of everything else.
        message.style.opacity = '0'; // Start invisible.
        message.style.transition = 'opacity 1s ease-in-out'; // Smooth fade in/out.
        message.style.display = 'flex'; // Use flexbox for easy alignment.
        message.style.flexDirection = 'column'; // Stack lines vertically.
        message.style.alignItems = 'center'; // Center lines horizontally.

        const line1 = document.createElement('span');
        line1.textContent = "Happy 2 months my love"; // The main message.
        line1.style.fontSize = '36px'; // Big font for the main message.
        message.appendChild(line1);

        const line2 = document.createElement('span');
        line2.textContent = "I love you"; // The sweet follow-up.
        line2.style.fontSize = '24px'; // Smaller font for the second line.
        line2.style.marginTop = '10px'; // A little space between the lines.
        message.appendChild(line2);

        document.body.appendChild(message); // Add the message to our webpage.

        // Make the message fade in smoothly.
        setTimeout(() => {
            message.style.opacity = '1';
        }, 10);

        // After a few seconds, make it fade out and then remove it from the page.
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentNode) {
                    document.body.removeChild(message);
                }
            }, 1000);
        }, 4000);
    },

    // This function checks if two rectangular objects are overlapping (colliding).
    checkCollision: function(rect1, rect2) {
        // It's a collision if their sides overlap on both X and Y axes.
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    // This function draws our main character, the player!
    drawPlayer: function() {
        this.x.save(); // We save the current drawing state.
        const playerCenterX = this.player.x - this.camera.x + this.player.width / 2; // Find the player's center for flipping.
        
        if (this.player.direction === 'left') {
            this.x.translate(playerCenterX, 0); // Move to center.
            this.x.scale(-1, 1); // Flip horizontally.
            this.x.translate(-playerCenterX, 0); // Move back.
        }

        const pSize = this.TILE_SIZE / 5; // A base size unit for drawing player parts.

        const skin = '#f2d3ab'; // Player's skin color.
        const skinDark = '#d4b89a'; // Darker skin for shadows.
        const hair = '#5d4037'; // Hair color.
        const hairLight = '#7b5e57'; // Lighter hair for highlights.
        const shirt = '#a9c8b6'; // Shirt color.
        const shirtDark = '#8caba0'; // Darker shirt for shadows.
        const pants = '#6a6a6a'; // Pants color.
        const pantsDark = '#525252'; // Darker pants for shadows.
        const shoes = '#4a4a4a'; // Shoes color.
        const shoesDark = '#323232'; // Darker shoes for shadows.

        // Head of the player.
        this.x.fillStyle = skin;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y, pSize * 3, pSize * 4);
        this.x.fillStyle = skinDark;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 3, this.player.y - this.camera.y + pSize, pSize, pSize * 2); // Shadow on face.

        // Hair of the player.
        this.x.fillStyle = hair;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y, pSize * 4, pSize * 2);
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 2, pSize, pSize);
        this.x.fillStyle = hairLight;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize, pSize, pSize); // Hair highlight.

        // Eyes and mouth.
        this.x.fillStyle = '#2E2E2E'; // Black for eyes.
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 2, pSize, pSize);
        this.x.fillRect(this.player.x - this.camera.x + pSize * 3, this.player.y - this.camera.y + pSize * 2, pSize * 0.5, pSize * 0.5); // Mouth.

        // Body of the player.
        this.x.fillStyle = shirt;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 4, pSize * 3, pSize * 3);
        this.x.fillStyle = shirtDark;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 4, pSize, pSize * 3); // Shirt shadow.
        this.x.fillStyle = skin; // Arms.
        this.x.fillRect(this.player.x - this.camera.x + pSize * 4, this.player.y - this.camera.y + pSize * 4, pSize, pSize * 2);
        this.x.fillStyle = skinDark;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 4, this.player.y - this.camera.y + pSize * 5, pSize, pSize); // Arm shadow.

        // Legs of the player, with a walking animation!
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
        this.x.fillStyle = pantsDark;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 7, pSize, pSize * 2); // Leg shadow.

        // Shoes of the player.
        this.x.fillStyle = shoes;
        this.x.fillRect(this.player.x - this.camera.x + pSize, this.player.y - this.camera.y + pSize * 9, pSize, pSize);
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 9, pSize, pSize);
        this.x.fillStyle = shoesDark;
        this.x.fillRect(this.player.x - this.camera.x + pSize * 2, this.player.y - this.camera.y + pSize * 9, pSize, pSize); // Shoe shadow.

        this.x.restore(); // Restore the drawing state.
    },

    // This function draws a lovely pixel-art heart.
    drawHeart: function(cx, cy, size) {
        this.x.fillStyle = '#F2A9A9'; // A soft pink for the heart.
        const s = size / 5; // A base size unit for drawing heart parts.

        // We draw several rectangles to form the heart shape.
        this.x.fillRect(cx - s * 2, cy - s * 1.5, s * 2, s * 2);
        this.x.fillRect(cx, cy - s * 1.5, s * 2, s * 2);
        this.x.fillRect(cx - s * 1.5, cy + s * 0.5, s * 3, s * 3);
        this.x.fillRect(cx - s, cy + s * 1.5, s * 2, s * 2);
        this.x.fillRect(cx - s * 0.5, cy + s * 2.5, s, s);

        // And some darker shades for depth and contour.
        this.x.fillStyle = '#D46A6A'; // A deeper red for shadows.
        this.x.fillRect(cx - s * 2.5, cy - s * 1, s * 0.5, s * 2.5);
        this.x.fillRect(cx + s * 2, cy - s * 1, s * 0.5, s * 2.5);
        this.x.fillRect(cx - s * 1.5, cy + s * 3.5, s * 3, s * 0.5);
    },

    // This function draws an adorable bunny!
    drawBunny: function(bunny) {
        this.x.save(); // Save drawing state.
        const bunnyCenterX = bunny.x - this.camera.x + bunny.width / 2; // Find bunny's center for flipping.

        if (bunny.direction === 'left') {
            this.x.translate(bunnyCenterX, 0); // Move to center.
            this.x.scale(-1, 1); // Flip horizontally.
            this.x.translate(-bunnyCenterX, 0); // Move back.
        }

        const pSize = this.TILE_SIZE / 5; // Base size unit.

        const bodyColor = '#d3c5b3'; // Light brown for bunny body.
        const bodyDark = '#b8a99a'; // Darker brown for shadows.
        const earColor = '#e0d6c7'; // Lighter ear color.
        const earInner = '#f2e8dc'; // Even lighter for inner ear.
        const eyeColor = '#2E2E2E'; // Black for eyes.
        const tailColor = '#FAFAF0'; // White for fluffy tail.

        // Body of the bunny.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize, bunny.y - this.camera.y + pSize * 4, pSize * 3, pSize * 2);
        this.x.fillRect(bunny.x - this.camera.x + pSize * 2, bunny.y - this.camera.y + pSize * 3, pSize * 2, pSize);
        this.x.fillStyle = bodyDark;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3, bunny.y - this.camera.y + pSize * 4, pSize, pSize * 2);

        // Tail of the bunny.
        this.x.fillStyle = tailColor;
        this.x.fillRect(bunny.x - this.camera.x, bunny.y - this.camera.y + pSize * 4, pSize, pSize);

        // Head of the bunny.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3, bunny.y - this.camera.y + pSize * 2, pSize * 2, pSize * 2);
        this.x.fillStyle = bodyDark;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 4, bunny.y - this.camera.y + pSize * 2, pSize, pSize); // Head shadow.

        // Ears of the bunny.
        this.x.fillStyle = earColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3, bunny.y - this.camera.y, pSize, pSize * 3);
        this.x.fillStyle = earInner;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 3.2, bunny.y - this.camera.y + pSize * 0.5, pSize * 0.6, pSize * 2);
        this.x.fillStyle = bodyColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 4, bunny.y - this.camera.y + pSize, pSize, pSize * 2);

        // Eye of the bunny.
        this.x.fillStyle = eyeColor;
        this.x.fillRect(bunny.x - this.camera.x + pSize * 4, bunny.y - this.camera.y + pSize * 2, pSize, pSize);

        this.x.restore(); // Restore drawing state.
    },

    // This function draws a busy squirrel!
    drawSquirrel: function(squirrel) {
        this.x.save(); // Save drawing state.
        const squirrelCenterX = squirrel.x - this.camera.x + squirrel.width / 2; // Find squirrel's center for flipping.

        if (squirrel.direction === 'left') {
            this.x.translate(squirrelCenterX, 0); // Move to center.
            this.x.scale(-1, 1); // Flip horizontally.
            this.x.translate(-squirrelCenterX, 0); // Move back.
        }

        const pSize = this.TILE_SIZE / 5; // Base size unit.

        const bodyColor = '#8B5A2B'; // Brown for squirrel body.
        const bodyDark = '#6F4722'; // Darker brown for shadows.
        const bellyColor = '#A97B4F'; // Lighter brown for belly.
        const eyeColor = '#2E2E2E'; // Black for eyes.
        const tailColor = '#A97B4F'; // Bushy tail color.

        // Body of the squirrel.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize, squirrel.y - this.camera.y + pSize * 3, pSize * 3, pSize * 3);
        this.x.fillStyle = bellyColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 2, squirrel.y - this.camera.y + pSize * 4, pSize, pSize * 2);
        this.x.fillStyle = bodyDark;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 3, squirrel.y - this.camera.y + pSize * 3, pSize, pSize * 3); // Body shadow.

        // Head of the squirrel.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 3, squirrel.y - this.camera.y + pSize * 2, pSize * 2, pSize * 2);
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 4, squirrel.y - this.camera.y + pSize, pSize, pSize);
        this.x.fillStyle = bodyDark;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 4, squirrel.y - this.camera.y + pSize * 2, pSize, pSize); // Head shadow.

        // Arms/Legs of the squirrel.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(squirrel.x - this.camera.x, squirrel.y - this.camera.y + pSize * 4, pSize * 2, pSize);
        this.x.fillRect(squirrel.x - this.camera.x + pSize, squirrel.y - this.camera.y + pSize * 3, pSize, pSize);

        // Eye of the squirrel.
        this.x.fillStyle = eyeColor;
        this.x.fillRect(squirrel.x - this.camera.x + pSize * 4, squirrel.y - this.camera.y + pSize * 3, pSize, pSize);

        // Tail of the squirrel.
        this.x.fillStyle = tailColor;
        this.x.fillRect(squirrel.x - this.camera.x - pSize, squirrel.y - this.camera.y + pSize * 2, pSize, pSize * 3); // Tail base.
        this.x.fillRect(squirrel.x - this.camera.x - pSize * 2, squirrel.y - this.camera.y + pSize * 3, pSize, pSize * 2); // Tail tip.

        this.x.restore(); // Restore drawing state.
    },

    // This function draws a swimming fish!
    drawFish: function(fish) {
        this.x.save(); // Save drawing state.
        const fishCenterX = fish.x - this.camera.x + fish.width / 2; // Find fish's center for flipping.

        if (fish.direction === 'left') {
            this.x.translate(fishCenterX, 0); // Move to center.
            this.x.scale(-1, 1); // Flip horizontally.
            this.x.translate(-fishCenterX, 0); // Move back.
        }

        const pSize = fish.width / 5; // Base size unit.

        const bodyColor = '#4CAF50'; // Green for fish body.
        const bodyLight = '#66BB6A'; // Lighter green for highlights.
        const finColor = '#8BC34A'; // Even lighter green for fins.
        const eyeColor = '#2E2E2E'; // Black for eyes.

        // Body of the fish.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(fish.x - this.camera.x + pSize, fish.y - this.camera.y + pSize, pSize * 3, pSize * 2);
        this.x.fillRect(fish.x - this.camera.x + pSize * 4, fish.y - this.camera.y + pSize * 1.5, pSize, pSize);
        this.x.fillStyle = bodyLight;
        this.x.fillRect(fish.x - this.camera.x + pSize * 1.5, fish.y - this.camera.y + pSize * 1.5, pSize * 2, pSize); // Body highlight.

        // Fins of the fish.
        this.x.fillStyle = finColor;
        this.x.fillRect(fish.x - this.camera.x, fish.y - this.camera.y + pSize * 1.5, pSize, pSize); // Tail fin.
        this.x.fillRect(fish.x - this.camera.x + pSize * 0.5, fish.y - this.camera.y + pSize * 0.5, pSize * 0.5, pSize * 2); // Top fin.
        this.x.fillRect(fish.x - this.camera.x + pSize * 2, fish.y - this.camera.y + pSize * 3, pSize, pSize * 0.5); // Bottom fin.

        // Eye of the fish.
        this.x.fillStyle = eyeColor;
        this.x.fillRect(fish.x - this.camera.x + pSize * 3, fish.y - this.camera.y + pSize * 1, pSize * 0.5, pSize * 0.5);

        this.x.restore(); // Restore drawing state.
    },

    // This function draws a fluttering butterfly!
    drawButterfly: function(butterfly) {
        this.x.save(); // Save drawing state.
        const butterflyCenterX = butterfly.x - this.camera.x + butterfly.width / 2; // Find butterfly's center for flipping.

        if (butterfly.vx < 0) { // If moving left, flip it.
            this.x.translate(butterflyCenterX, 0); // Move to center.
            this.x.scale(-1, 1); // Flip horizontally.
            this.x.translate(-butterflyCenterX, 0); // Move back.
        }

        const pSize = butterfly.width / 4; // Base size unit.
        const bodyColor = '#4A4A4A'; // Dark gray for body.
        const antennaColor = '#2E2E2E'; // Black for antennas.

        // Body of the butterfly.
        this.x.fillStyle = bodyColor;
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 1.5, butterfly.y - this.camera.y + pSize * 1.5, pSize, pSize); // Body segment.
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 1.7, butterfly.y - this.camera.y + pSize * 1, pSize * 0.6, pSize * 0.5); // Head.

        // Wings of the butterfly.
        this.x.fillStyle = butterfly.color;
        this.x.fillRect(butterfly.x - this.camera.x + pSize, butterfly.y - this.camera.y + pSize, pSize, pSize); // Top-left wing.
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 2, butterfly.y - this.camera.y + pSize, pSize, pSize); // Top-right wing.
        this.x.fillRect(butterfly.x - this.camera.x + pSize, butterfly.y - this.camera.y + pSize * 2, pSize, pSize); // Bottom-left wing.
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 2, butterfly.y - this.camera.y + pSize * 2, pSize, pSize); // Bottom-right wing.

        // Wing details (a slightly darker, transparent shade of the wing color).
        const wingDetailColor = this.x.fillStyle.replace('#', '#'); // Simple way to get a slightly darker shade.
        this.x.fillStyle = wingDetailColor + '80'; // Add some transparency.
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 1.2, butterfly.y - this.camera.y + pSize * 1.2, pSize * 0.6, pSize * 0.6);
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 2.2, butterfly.y - this.camera.y + pSize * 1.2, pSize * 0.6, pSize * 0.6);
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 1.2, butterfly.y - this.camera.y + pSize * 2.2, pSize * 0.6, pSize * 0.6);
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 2.2, butterfly.y - this.camera.y + pSize * 2.2, pSize * 0.6, pSize * 0.6);

        // Antennas of the butterfly.
        this.x.fillStyle = antennaColor;
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 1.8, butterfly.y - this.camera.y + pSize * 0.5, pSize * 0.2, pSize * 0.5);
        this.x.fillRect(butterfly.x - this.camera.x + pSize * 2.2, butterfly.y - this.camera.y + pSize * 0.5, pSize * 0.2, pSize * 0.5);

        this.x.restore(); // Restore drawing state.
    },

    // This function draws a glowing firefly!
    drawFirefly: function(firefly) {
        this.x.save(); // Save drawing state.
        // We make the firefly flicker by changing its transparency.
        const flickerAlpha = 0.7 + 0.3 * Math.sin(firefly.flicker); // Flickers between 70% and 100% opaque.
        this.x.globalAlpha = firefly.alpha * flickerAlpha; // Apply the flicker to its overall transparency.

        // Draw the main body of the firefly.
        this.x.fillStyle = '#FFD700'; // A golden color for its body.
        this.x.fillRect(firefly.x - this.camera.x, firefly.y - this.camera.y, firefly.width, firefly.height);

        // Draw a beautiful glowing effect around the firefly.
        this.x.shadowColor = '#FFFF00'; // A bright yellow for the glow.
        this.x.shadowBlur = firefly.width * 1.5; // A soft, wide blur for a gentle glow.
        this.x.fillStyle = '#FFFFE0'; // A lighter yellow for the core of the glow.
        this.x.fillRect(firefly.x - this.camera.x + firefly.width * 0.25, firefly.y - this.camera.y + firefly.height * 0.25, firefly.width * 0.5, firefly.height * 0.5);
        
        this.x.globalAlpha = 1; // Reset transparency for other drawings.
        this.x.shadowBlur = 0; // Reset shadow blur.
        this.x.restore(); // Restore drawing state.
    },

            // This function updates all our creatures: where they are, what they're doing, and how they interact with the world.

            updateCreatures: function(groundLevelY) {

        

                this.creatures.forEach((creature, index) => {

        

                                if (creature.type === 'bunny') {

        

                                    creature.vy += 0.5 * this.gameSpeed; // Gravity pulls the bunny down.

        

                                    creature.y += creature.vy; // Update bunny's vertical position.

        

                    

        

                                    // Check if the bunny is in water.

        

                                    const bunnyTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

        

                                    const bunnyTileY = Math.floor((creature.y + creature.height / 2) / this.TILE_SIZE);

        

                                                                const isBunnyInWater = this.getTile(bunnyTileX, bunnyTileY) === 9; // Is the tile water?

        

                                                

        

                                                                if (isBunnyInWater) {

        

                                                                    creature.vy *= 0.6; // Water slows vertical movement (buoyancy!).

        

                                                                    creature.vx *= 0.7; // Water slows horizontal movement.

        

                                                                }

        

                                                

        

                                                                creature.aiTimer--; // Count down for the bunny's next decision.

        

                                                                if (creature.aiTimer <= 0) {

        

                                                                    const action = Math.random(); // What will the bunny do?

        

                                                                    if (action < 0.4) {

        

                                                                        if (creature.onGround || isBunnyInWater) { // If on ground or in water, the bunny might jump!

        

                                                                            creature.vy = -4; // Jump up!

        

                                                                            creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 1 + 1) * this.gameSpeed; // A little horizontal hop.

        

                                                                            creature.onGround = false; // They're in the air now!

        

                                                                        }

        

                                                                    } else if (action < 0.7) {

        

                                                                        creature.direction = creature.direction === 'left' ? 'right' : 'left'; // Turn around!

        

                                                                        creature.vx = 0; // Stop moving horizontally for a moment.

        

                                                                    } else {

        

                                                                        creature.vx = 0; // Just stand still.

        

                                                                    }

        

                                                                    creature.aiTimer = Math.random() * 120 + 60; // Set a new timer for the next decision.

        

                                                                }

        

                                                

        

                                                                if (creature.dropCooldown > 0) {

        

                                                                    creature.dropCooldown--; // Count down until the bunny can drop a heart again.

        

                                                                } else {

        

                                                                    const distToPlayer = Math.hypot(this.player.x - creature.x, this.player.y - creature.y); // How far is the player?

        

                                                                    if (distToPlayer < this.TILE_SIZE * 4) { // If the player is close...

        

                                                                        this.hearts.push({ x: creature.x + creature.width / 2, y: creature.y, size: 10, life: 120, vy: -1 }); // Drop a heart!

        

                                                                        if (creature.onGround) {

        

                                                                            creature.vy = -6; // The bunny jumps up in surprise/excitement!

        

                                                                            creature.vx = this.player.x < creature.x ? 3 : -3; // And hops towards or away from the player.

        

                                                                        }

        

                                                                        creature.dropCooldown = 60; // Set cooldown for dropping hearts.

        

                                                                    }

        

                                                                }

        

                                                

        

                                                                creature.x += creature.vx; // Update bunny's horizontal position.

        

                                                

        

                                                                creature.onGround = false; // Assume not on ground until collision check.

        

                                                                const startY = Math.floor(creature.y / this.TILE_SIZE);

        

                                                                const endY = Math.floor((creature.y + creature.height) / this.TILE_SIZE);

        

                                                                const tileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

        

                                                

        

                                                                for (let y = startY; y <= endY; y++) {

        

                                                                    if (this.isSolid(this.getTile(tileX, y))) { // If it hits something solid...

        

                                            const tile = { x: tileX * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };

        

                                            if (this.checkCollision(creature, tile)) {

        

                                                if (creature.vy > 0) { // If falling...

        

                                                    creature.y = tile.y - creature.height; // Land on top of the tile.

        

                                                    creature.vy = 0; // Stop falling.

        

                                                    creature.onGround = true; // Now it's on the ground!

        

                                                    creature.vx *= 0.8; // Slow down horizontal movement a bit.

        

                                                }

        

                                            }

        

                                        }

        

                                    }

        

                    

        

                                    if (creature.x < 0) { creature.x = 0; creature.direction = 'right'; } // Don't go off the left edge!

        

                                    if (creature.x + creature.width > this.worldWidth * this.TILE_SIZE) { creature.x = this.worldWidth * this.TILE_SIZE - creature.width; creature.direction = 'left'; } // Don't go off the right edge!

        

                    

        

                                } else if (creature.type === 'squirrel') {

        

                                    creature.vy += 0.5 * this.gameSpeed; // Gravity pulls the squirrel down.

        

                                    creature.y += creature.vy; // Update squirrel's vertical position.

        

                    

        

                                    // Check if the squirrel is in water.

        

                                    const squirrelTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

        

                                    const squirrelTileY = Math.floor((creature.y + creature.height / 2) / this.TILE_SIZE);

        

                                    const isSquirrelInWater = this.getTile(squirrelTileX, squirrelTileY) === 9;

        

                    

        

                                    if (isSquirrelInWater) {

        

                                        creature.vy *= 0.6; // Water slows vertical movement.

        

                                        creature.vx *= 0.7; // Water slows horizontal movement.

        

                                    }

        

                    

        

                                    creature.aiTimer--; // Count down for the squirrel's next decision.

        

                                    if (creature.aiTimer <= 0) {

        

                                        const action = Math.random(); // What will the squirrel do?

        

                                        if (creature.climbing) {

        

                                            if (action < 0.5) { // Stop climbing and move horizontally.

        

                                                creature.climbing = false;

        

                                                creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 0.5 + 0.5) * this.gameSpeed;

        

                                            } else { // Continue climbing or change vertical direction.

        

                                                creature.vy = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1 + 0.5) * this.gameSpeed;

        

                                                creature.aiTimer = Math.random() * 60 + 30;

        

                                            }

        

                                        } else { // On ground or in water.

        

                                            if (action < 0.4) { // Move horizontally.

        

                                                creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 0.5 + 0.5) * this.gameSpeed;

        

                                            } else if (action < 0.6) { // Jump!

        

                                                if (creature.onGround || isSquirrelInWater) { // Can jump from ground or water.

        

                                                    creature.vy = -4; // Jump up!

        

                                                    creature.onGround = false;

        

                                                }

        

                                            } else if (action < 0.8) { // Change direction.

        

                                                creature.direction = creature.direction === 'left' ? 'right' : 'left';

        

                                                creature.vx = 0;

        

                                            } else { // Try to climb a tree.

        

                                                const currentTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

        

                                                const currentTileY = Math.floor((creature.y + creature.height) / this.TILE_SIZE);

        

                                                // Check for a tree trunk (tile type 4).

        

                                                if (this.getTile(currentTileX, currentTileY - 1) === 4) {

        

                                                    creature.climbing = true;

        

                                                    creature.vx = 0;

        

                                                    creature.vy = -1; // Start climbing up.

        

                                                    creature.climbTargetY = currentTileY * this.TILE_SIZE - this.TILE_SIZE * 4; // Climb up to 4 tiles.

        

                                                }

        

                                            }

        

                                        }

        

                                        creature.aiTimer = Math.random() * 120 + 60; // Set a new timer.

        

                                    }

        

                    

        

                                    creature.x += creature.vx; // Update squirrel's horizontal position.

        

                    

        

                                    // Collision with ground/tree.

        

                                    creature.onGround = false;

        

                                    const startY = Math.floor(creature.y / this.TILE_SIZE);

        

                                    const endY = Math.floor((creature.y + creature.height) / this.TILE_SIZE);

        

                                    const tileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

        

                                    for (let y = startY; y <= endY; y++) {

        

                                        if (this.getTile(tileX, y) !== 0 && (this.isSolid(this.getTile(tileX, y)) || this.getTile(tileX, y) === 4)) { // If it hits something solid or wood...

        

                                            const tile = { x: tileX * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };

        

                                            if (this.checkCollision(creature, tile)) {

        

                                                if (creature.vy > 0 && !creature.climbing) { // If falling and not climbing...

        

                                                    creature.y = tile.y - creature.height; // Land on the tile.

        

                                                    creature.vy = 0; // Stop falling.

        

                                                    creature.onGround = true; // Now on the ground!

        

                                                    creature.vx *= 0.8; // Slow down.

        

                                                } else if (creature.climbing) { // If climbing and it hits something.

        

                                                    if (creature.vy < 0 && creature.y <= creature.climbTargetY) { // Reached the top of the climb.

        

                                                        creature.climbing = false;

        

                                                        creature.vy = 0;

        

                                                        creature.onGround = true; // Treat as on ground for horizontal movement.

        

                                                    } else if (creature.vy > 0 && this.getTile(tileX, y) === 4) { // Climbing down, hit bottom of tree.

        

                                                        creature.climbing = false;

        

                                                        creature.y = tile.y - creature.height;

        

                                                        creature.vy = 0;

        

                                                        creature.onGround = true;

        

                                                    }

        

                                                }

        

                                            }

        

                                        }

        

                                    }

        

                    

        

                                    // Boundary checks.

        

                                    if (creature.x < 0) { creature.x = 0; creature.direction = 'right'; } // Don't go off the left.

        

                                    if (creature.x + creature.width > this.worldWidth * this.TILE_SIZE) { creature.x = this.worldWidth * this.TILE_SIZE - creature.width; creature.direction = 'left'; } // Don't go off the right.

        

                    

        

                                } else if (creature.type === 'fish') {

        

                                        creature.aiTimer--; // Count down for the fish's next swim.

        

                                        if (creature.aiTimer <= 0) {

        

                                            creature.vx = (creature.direction === 'left' ? -1 : 1) * (Math.random() * 0.5 + 0.2) * this.gameSpeed; // Random horizontal swim speed.

        

                                            creature.vy = (Math.random() - 0.5) * 0.5 * this.gameSpeed; // Random vertical swim speed.

        

                                            creature.aiTimer = Math.random() * 100 + 50; // Set a new timer.

        

                                        }

        

                        

        

                                        creature.x += creature.vx; // Update fish's horizontal position.

        

                                        creature.y += creature.vy; // Update fish's vertical position.

        

                        

        

                                        const currentTileX = Math.floor((creature.x + creature.width / 2) / this.TILE_SIZE);

        

                                        const currentTileY = Math.floor((creature.y + creature.height / 2) / this.TILE_SIZE);

        

                                        const isInWater = this.getTile(currentTileX, currentTileY) === 9; // Is the fish in water?

        

                        

        

                                        if (!isInWater) {

        

                                            creature.life--; // If out of water, life decreases!

        

                                            if (creature.life <= 0) {

        

                                                this.creatures.splice(index, 1); // Remove fish if it dies.

        

                                                return; // Skip further updates for this fish.

        

                                            }

        

                                        } else {

        

                                            creature.life = 100; // Reset life if it's safe in the water.

        

                                        }

        

                        

        

                                        // Keep fish within water boundaries.

        

                                        const pondStartX = Math.floor(this.worldWidth * 0.3);

        

                                        const pondEndX = Math.floor(this.worldWidth * 0.4);

        

                                        const pondTopY = groundLevelY; 

        

                                        const pondBottomY = groundLevelY + 4; 

        

                        

        

                                        if (creature.x < pondStartX * this.TILE_SIZE) { creature.x = pondStartX * this.TILE_SIZE; creature.direction = 'right'; creature.vx *= -1; } // Bounce off left wall.

        

                                        if (creature.x + creature.width > pondEndX * this.TILE_SIZE) { creature.x = pondEndX * this.TILE_SIZE - creature.width; creature.direction = 'left'; creature.vx *= -1; } // Bounce off right wall.

        

                                        if (creature.y < pondTopY * this.TILE_SIZE) { creature.y = pondTopY * this.TILE_SIZE; creature.vy *= -1; } // Bounce off top.

        

                                        if (creature.y + creature.height > pondBottomY * this.TILE_SIZE) { creature.y = pondBottomY * this.TILE_SIZE - creature.height; creature.vy *= -1; } // Bounce off bottom.

        

                        

        

                                        creature.direction = creature.vx >= 0 ? 'right' : 'left'; // Update fish direction.

        

                        

        

                                    } else if (creature.type === 'bird') {

        

                                        creature.aiTimer--; // Count down for the bird's next flight move.

        

                                        if (creature.aiTimer <= 0) {

        

                                            creature.vx += (Math.random() - 0.5) * 0.5; // Random little horizontal adjustment.

        

                                            creature.vy += (Math.random() - 0.5) * 0.5; // Random little vertical adjustment.

        

                                            creature.vx = Math.max(-1, Math.min(1, creature.vx)); // Keep horizontal speed in check.

        

                                            creature.vy = Math.max(-1, Math.min(1, creature.vy)); // Keep vertical speed in check.

        

                                            creature.aiTimer = Math.random() * 100 + 50; // Set a new timer.

        

                                        }

        

                        

        

                                        creature.x += creature.vx * this.gameSpeed; // Update bird's horizontal position.

        

                                        creature.y += creature.vy * this.gameSpeed; // Update bird's vertical position.

        

                                        creature.direction = creature.vx >= 0 ? 'right' : 'left'; // Update bird direction based on movement.

        

                        

        

                                        if (creature.x < 0 || creature.x + creature.width > this.worldWidth * this.TILE_SIZE) creature.vx *= -1; // Bounce off world edges.

        

                                        if (creature.y < 0 || creature.y + creature.height > this.worldHeight * this.TILE_SIZE * 0.6) creature.vy *= -1; // Bounce off top/bottom of sky area.

        

                                    } else if (creature.type === 'butterfly') {

        

                                        creature.aiTimer--; // Count down for the butterfly's next flutter.

        

                                        if (creature.aiTimer <= 0) {

        

                                            creature.vx += (Math.random() - 0.5) * 0.3; // Gentle horizontal drift.

        

                                            creature.vy += (Math.random() - 0.5) * 0.3; // Gentle vertical drift.

        

                                            creature.vx = Math.max(-0.5, Math.min(0.5, creature.vx)); // Keep horizontal speed gentle.

        

                                            creature.vy = Math.max(-0.5, Math.min(0.5, creature.vy)); // Keep vertical speed gentle.

        

                                            creature.aiTimer = Math.random() * 100 + 50; // Set a new timer.

        

                                        }

        

                        

        

                                        creature.x += creature.vx * this.gameSpeed; // Update butterfly's horizontal position.

        

                                        creature.y += creature.vy * this.gameSpeed; // Update butterfly's vertical position.

        

                        

        

                                        if (creature.x < 0 || creature.x + creature.width > this.worldWidth * this.TILE_SIZE) creature.vx *= -1; // Bounce off world edges.

        

                                        if (creature.y < 0 || creature.y + creature.height > this.c.height * 0.7) creature.vy *= -1; // Bounce off top/bottom of air area.

        

                                    } else if (creature.type === 'firefly') {

        

                                        creature.aiTimer--; // Count down for the firefly's next shimmer.

        

                                        if (creature.aiTimer <= 0) {

        

                                            creature.vx += (Math.random() - 0.5) * 0.2; // Tiny horizontal drift.

        

                                            creature.vy += (Math.random() - 0.5) * 0.2; // Tiny vertical drift.

        

                                            creature.vx = Math.max(-0.3, Math.min(0.3, creature.vx)); // Keep horizontal speed tiny.

        

                                            creature.vy = Math.max(-0.3, Math.min(0.3, creature.vy)); // Keep vertical speed tiny.

        

                                            creature.aiTimer = Math.random() * 80 + 40; // Set a new timer.

        

                                        }

        

                        

        

                                        creature.x += creature.vx * this.gameSpeed; // Update firefly's horizontal position.

        

                                        creature.y += creature.vy * this.gameSpeed; // Update firefly's vertical position.

        

                                        creature.flicker += 0.1; // Make it flicker!.

        

                        

        

                                        if (creature.x < 0 || creature.x + creature.width > this.worldWidth * this.TILE_SIZE) creature.vx *= -1; // Bounce off world edges.

        

                                        if (creature.y < 0 || creature.y + creature.height > this.c.height * 0.7) creature.vy *= -1; // Bounce off top/bottom of air area.

        

                                    }

        

                                });

        

                            },

        
                
                    // This function handles all the player's movements and interactions in the game world.
    updatePlayer: function() {
        if (this.keys.a) { // If 'A' is pressed...
            this.player.vx = -this.player.speed * this.gameSpeed; // Move left.
            this.player.direction = 'left'; // Face left.
            this.player.isWalking = true; // Start walking animation.
        } else if (this.keys.d) { // If 'D' is pressed...
            this.player.vx = this.player.speed * this.gameSpeed; // Move right.
            this.player.direction = 'right'; // Face right.
            this.player.isWalking = true; // Start walking animation.
        } else {
            this.player.vx = 0; // If no movement keys, stop horizontal movement.
            this.player.isWalking = false; // Stop walking animation.
        }

        this.player.walkFrameTimer++; // Advance the walking animation timer.
        if (this.player.walkFrameTimer > 8) { this.player.walkFrame = 1 - this.player.walkFrame; this.player.walkFrameTimer = 0; } // Switch walk frames for animation.

        if ((this.keys.w || this.keys[' ']) && this.player.onGround) { // If 'W' or space is pressed and on ground...
            this.player.vy = -this.player.jumpForce; // Jump up!
            this.player.onGround = false; // No longer on the ground.
        }

        this.player.vy += 0.6 * this.gameSpeed; // Gravity pulls the player down.

        // Check if the player is in water.
        const playerTileX = Math.floor((this.player.x + this.player.width / 2) / this.TILE_SIZE);
        const playerTileY = Math.floor((this.player.y + this.player.height / 2) / this.TILE_SIZE);
        const isInWater = this.world[playerTileY]?.[playerTileX] === 9; // Is the tile water?

        if (isInWater) {
            this.player.vy *= 0.6; // Water makes falling slower (buoyancy).
            this.player.vx *= 0.7; // Water makes horizontal movement slower.
            if (this.keys.w || this.keys[' ']) { // If jumping in water...
                this.player.vy = -6; // Swim up!
            }
        }

        this.player.x += this.player.vx; // Update player's horizontal position.

        let startX = Math.floor(this.player.x / this.TILE_SIZE);
        let endX = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        let startY = Math.floor(this.player.y / this.TILE_SIZE);
        let endY = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);

        // Check for horizontal collisions with solid tiles.
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.getTile(x, y) !== 0 && this.isSolid(this.getTile(x, y))) { // If it's a solid tile.
                    const tile = { x: x * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };
                    if (this.checkCollision(this.player, tile)) {
                        if (this.player.vx > 0) { // If moving right and hit something.
                            this.player.x = tile.x - this.player.width; // Stop at its left edge.
                        } else if (this.player.vx < 0) { // If moving left and hit something.
                            this.player.x = tile.x + tile.width; // Stop at its right edge.
                        }
                        this.player.vx = 0; // Stop horizontal movement.
                    }
                }
            }
        }

        this.player.y += this.player.vy * this.gameSpeed; // Update player's vertical position.
        this.player.onGround = false; // Assume not on ground until collision is checked.

        startX = Math.floor(this.player.x / this.TILE_SIZE);
        endX = Math.floor((this.player.x + this.player.width) / this.TILE_SIZE);
        startY = Math.floor(this.player.y / this.TILE_SIZE);
        endY = Math.floor((this.player.y + this.player.height) / this.TILE_SIZE);

        // Check for vertical collisions with solid tiles.
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.getTile(x, y) !== 0 && this.isSolid(this.getTile(x, y))) { // If it's a solid tile.
                    const tile = { x: x * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };
                    if (this.checkCollision(this.player, tile)) {
                        if (this.player.vy > 0) { // If falling and hit something.
                            this.player.y = tile.y - this.player.height; // Land on it.
                            this.player.vy = 0; // Stop falling.
                            this.player.onGround = true; // Now on the ground!
                        } else if (this.player.vy < 0) { // If jumping up and hit something.
                            this.player.y = tile.y + tile.height; // Hit head on its bottom.
                            this.player.vy = 0; // Stop upward movement.
                        }
                    }
                }
            }
        }

        // Keep the player within the world boundaries.
        if (this.player.x < 0) {
            this.player.x = 0;
        }
        if (this.player.x + this.player.width > this.worldWidth * this.TILE_SIZE) {
            this.player.x = this.worldWidth * this.TILE_SIZE - this.player.width;
        }
    },

    // This function draws the little icon for an item in the inventory.
    drawItemIcon: function(item, x, y, size) {
        const p = size / 16; // A base size unit for drawing item icons.
        this.x.save(); // Save drawing state.
        this.x.translate(x, y); // Move the drawing origin to the item slot.

        // Draw different icons based on the item type.
        switch (item.type) {
            case 'axe':
                this.x.fillStyle = '#a86a32'; // Handle color.
                this.x.fillRect(size * (7/16), size * (5/16), size * (2/16), size * (9/16));
                this.x.fillRect(size * (6/16), size * (6/16), size * (1/16), size * (7/16));
                this.x.fillStyle = '#8B5A2B'; // Slightly darker handle.
                this.x.fillRect(size * (8/16), size * (5/16), size * (1/16), size * (8/16));
                this.x.fillStyle = '#6a6a6a'; // Axe head color.
                this.x.fillRect(size * (5/16), size * (2/16), size * (6/16), size * (5/16));
                this.x.fillRect(size * (6/16), size * (1/16), size * (4/16), size * (6/16));
                this.x.fillStyle = '#808080'; // Lighter axe head.
                this.x.fillRect(size * (6/16), size * (2/16), size * (4/16), size * (4/16));
                this.x.fillStyle = '#9a9a9a'; // Even lighter highlights.
                this.x.fillRect(size * (5/16), size * (3/16), size * (1/16), size * (2/16));
                this.x.fillRect(size * (10/16), size * (3/16), size * (1/16), size * (2/16));
                break;
            case 'pickaxe':
                this.x.fillStyle = '#a86a32'; // Handle color.
                this.x.fillRect(size * (7/16), size * (4/16), size * (2/16), size * (10/16));
                this.x.fillStyle = '#8B5A2B'; // Slightly darker handle.
                this.x.fillRect(size * (8/16), size * (4/16), size * (1/16), size * (9/16));
                this.x.fillStyle = '#6a6a6a'; // Pickaxe head color.
                this.x.fillRect(size * (4/16), size * (3/16), size * (8/16), size * (3/16));
                this.x.fillRect(size * (3/16), size * (4/16), size * (10/16), size * (1/16));
                this.x.fillStyle = '#808080'; // Lighter pickaxe head.
                this.x.fillRect(size * (5/16), size * (4/16), size * (6/16), size * (1/16));
                this.x.fillStyle = '#9a9a9a'; // Even lighter highlights.
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
        this.x.restore(); // Restore drawing state.
    },

    // This function draws the player's inventory bar at the bottom of the screen.
    drawInventory: function() {
        const slotSize = 50;
        const padding = 10;
        const startX = (this.c.width - (this.inventory.items.length * (slotSize + padding))) / 2; // Center the inventory bar.
        const startY = 20; // Position it near the top.

        this.inventory.items.forEach((item, index) => {
            const slotX = startX + index * (slotSize + padding); // Calculate each slot's position.
            
            // Draw the background for each inventory slot.
            this.x.fillStyle = 'rgba(46, 46, 46, 0.7)'; // A dark, transparent background.
            this.x.fillRect(slotX, startY, slotSize, slotSize);

            // Draw a subtle border around each slot.
            this.x.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.x.lineWidth = 2;
            this.x.strokeRect(slotX, startY, slotSize, slotSize);

            // Highlight the currently selected slot with a glowing border.
            if (index === this.inventory.selectedSlot) {
                this.x.shadowColor = '#F2A9A9'; // A lovely pink glow.
                this.x.shadowBlur = 10;
                this.x.strokeStyle = '#F2A9A9';
                this.x.lineWidth = 3;
                this.x.strokeRect(slotX - 1, startY - 1, slotSize + 2, slotSize + 2); // A slightly larger border for emphasis.
                this.x.shadowBlur = 0; // Reset shadow so it doesn't affect other drawings.
            }

            this.drawItemIcon(item, slotX, startY, slotSize); // Draw the actual item icon in the slot.

            // If the item has an amount (like a stack of dirt), draw that number on top.
            if (item.amount !== undefined && item.amount > 0) {
                this.x.fillStyle = 'white';
                this.x.font = '10px "Press Start 2P"'; // Small, pixelated font for the amount.
                this.x.textAlign = 'right'; // Align to the right of the slot.
                this.x.textBaseline = 'bottom'; // Align to the bottom of the slot.
                this.x.fillText(item.amount, slotX + slotSize - 2, startY + slotSize - 2);
            }
        });
    },

    // This function pre-renders the background of our minimap to an offscreen canvas for performance.
    renderMinimapBackground: function() {
        // We set a fixed size for our minimap and how many tiles it will show around the player.
        const minimapDisplayWidth = 200; // The width of our minimap on screen.
        const minimapViewRange = 100; // How many tiles wide the minimap will show.
        const minimapDisplayHeight = Math.floor(minimapViewRange * (minimapDisplayWidth / minimapViewRange)); // Calculate minimap height to maintain aspect ratio.
        this.minimapBuffer.width = minimapDisplayWidth; // Set the offscreen buffer's width.
        this.minimapBuffer.height = minimapDisplayHeight; // Set its height.

        this.minimapBufferCtx.clearRect(0, 0, minimapDisplayWidth, minimapDisplayHeight); // Clear the old minimap background.

        const playerTileX = Math.floor(this.player.x / this.TILE_SIZE); // Player's current tile X position.
        const playerTileY = Math.floor(this.player.y / this.TILE_SIZE); // Player's current tile Y position.

        // Calculate the range of world tiles to display on the minimap.
        const startWorldX = playerTileX - minimapViewRange / 2;
        const endWorldX = playerTileX + minimapViewRange / 2;
        const startWorldY = playerTileY - minimapViewRange / 2;
        const endWorldY = playerTileY + minimapViewRange / 2;

        // Loop through these world tiles and draw a tiny colored square for each on the minimap.
        for (let y = startWorldY; y < endWorldY; y++) {
            for (let x = startWorldX; x < endWorldX; x++) {
                const tileType = this.getTile(x, y); // What kind of tile is this?
                let color = 'transparent'; // Default to transparent if no specific color.
                switch (tileType) {
                    case 1: color = this.tileColors.grass; break; // Grass is green!
                    case 2: color = this.tileColors.dirt; break; // Dirt is brown!
                    case 3: color = this.tileColors.stone; break; // Stone is gray!
                    case 4: color = this.tileColors.wood; break; // Wood is woody!
                    case 5: color = this.tileColors.leaves; break; // Leaves are green!
                    case 9: color = this.tileColors.water; break; // Water is blue!
                    case 10: color = this.tileColors.lilyOfTheValleyGreen; break;
                    case 11: color = this.tileColors.lilyOfTheValleyWhite; break;
                    case 12: color = this.tileColors.roseStemGreen; break;
                    case 13: color = this.tileColors.roseRed; break;
                }
                if (color !== 'transparent') { // If it has a color, draw it!
                    const minimapX = Math.floor((x - startWorldX) * (minimapDisplayWidth / minimapViewRange)); // Calculate screen X for minimap.
                    const minimapY = Math.floor((y - startWorldY) * (minimapDisplayHeight / minimapViewRange)); // Calculate screen Y for minimap.
                    this.minimapBufferCtx.fillStyle = color;
                    this.minimapBufferCtx.fillRect(minimapX, minimapY, 2, 2); // Draw a tiny rectangle for the tile.
                }
            }
        }
    },

    // This function draws the complete minimap, showing the player's surroundings.
    drawMinimap: function() {
        const minimapDisplayWidth = 200;
        const minimapViewRange = 100;
        const minimapDisplayHeight = Math.floor(minimapViewRange * (minimapDisplayWidth / minimapViewRange));

        this.mc.width = minimapDisplayWidth; // Set minimap canvas width.
        this.mc.height = minimapDisplayHeight; // Set minimap canvas height.

        this.mx.clearRect(0, 0, minimapDisplayWidth, minimapDisplayHeight); // Clear the minimap.
        this.mx.drawImage(this.minimapBuffer, 0, 0, minimapDisplayWidth, minimapDisplayHeight); // Draw the pre-rendered background.

        // Draw a neat border around the minimap.
        this.mx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // A transparent white border.
        this.mx.lineWidth = 2;
        this.mx.strokeRect(0, 0, minimapDisplayWidth, minimapDisplayHeight);

        // The player is always in the very center of the minimap.
        const playerMinimapX = minimapDisplayWidth / 2;
        const playerMinimapY = minimapDisplayHeight / 2;

        // Draw a clear indicator for the player's position on the minimap.
        this.mx.fillStyle = '#F2A9A9'; // Pink color for our hero!
        this.mx.beginPath();
        this.mx.arc(playerMinimapX, playerMinimapY, 3, 0, Math.PI * 2); // A small pink circle.
        this.mx.fill();
        this.mx.strokeStyle = 'white'; // A white outline.
        this.mx.lineWidth = 1;
        this.mx.stroke();
    },

    // This function handles the satisfying destruction of trees or cacti, and adds items to inventory.
    destroyTree: function(x, y, treeParts, woodType) {
        const queue = [[x, y]]; // We start a queue to find all parts of the tree.
        const visited = new Set([`${x},${y}`]); // Keep track of already processed parts.

        const processQueue = () => {
            if (queue.length === 0) {
                this.renderMinimapBackground(); // Once the tree is gone, update the minimap.
                return;
            }

            const [cx, cy] = queue.shift(); // Get the next part of the tree to process.
            const tileType = this.world[cy]?.[cx]; // What kind of tile is it?

            if (treeParts.includes(tileType)) { // If it's part of the tree we're destroying.
                this.world[cy][cx] = 0; // Turn it into air!
                if (tileType === treeParts[0]) { // If it's wood...
                    this.inventory.items.find(i => i.type === woodType).amount++; // Add wood to inventory.
                } else if (tileType === treeParts[1] && Math.random() < 0.05) { // If it's leaves, with a small chance...
                    this.inventory.items.find(i => i.type === 'sapling').amount++; // Drop a sapling!
                }

                // Add neighboring tiles to the queue to find more tree parts.
                for (const [dx, dy] of [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    if (!visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        queue.push([nx, ny]);
                    }
                }
            }
            setTimeout(processQueue, 20); // Process the next part after a short delay to spread out the work.
        };
        processQueue(); // Start the destruction process.
    },

    // This function makes a sapling grow into a full-sized tree after a while.
    growTree: function(x, y, treeParts) {
        if (this.world[y]?.[x] !== 8) return; // Only grow if it's actually a sapling.

        const treeHeight = Math.floor(Math.random() * 4) + 4; // Give the new tree a random height.
        const treeTopY = y - treeHeight + 1; // Calculate where the top of the tree will be.

        for (let i = 0; i < treeHeight; i++) this.world[y - i][x] = treeParts[0]; // Draw the tree's trunk.
        for (let ly = -1; ly <= 1; ly++) {
            for (let lx = -1; lx <= 1; lx++) this.world[treeTopY + ly][x + lx] = treeParts[1]; // Draw its leaves.
        }
        this.renderMinimapBackground(); // Update the minimap to show the new tree.
    },



    // This is a helper function to get the type of tile at a specific world coordinate.
    getTile: function(worldX, worldY) {
        // Make sure we're asking for a tile within our world's boundaries.
        if (worldY >= 0 && worldY < this.worldHeight && worldX >= 0 && worldX < this.worldWidth) {
            return this.world[worldY][worldX]; // Return the tile type.
        }
        return 0; // If outside the world, it's just empty air (type 0).
    },

    // This is a helper function to change the type of tile at a specific world coordinate.
    setTile: function(worldX, worldY, type) {
        // Only change the tile if it's within our world's boundaries.
        if (worldY >= 0 && worldY < this.worldHeight && worldX >= 0 && worldX < this.worldWidth) {
            this.world[worldY][worldX] = type; // Set the new tile type.
        }
    },

    // This is the main drawing function for our game when it's in the 'playing' state.
    drawGameWorld: function() {
        this.x.clearRect(0, 0, this.c.width, this.c.height); // Clear the entire canvas for a fresh frame.

        this.updatePlayer(); // First, update the player's position and state.
        const groundLevelY = this.findGroundLevel(); // Find the ground level.
        this.updateCreatures(groundLevelY); // Then, update all the creatures.

        // Adjust the camera to follow the player, keeping the player centered.
        this.camera.x = this.player.x - this.c.width / 2;
        this.camera.y = this.player.y - this.c.height / 2;

        // Make sure the camera doesn't go outside the boundaries of our world.
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth * this.TILE_SIZE - this.c.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight * this.TILE_SIZE - this.c.height));

        this.drawSky(); // Draw the beautiful sky with sun/moon and clouds.
        this.drawWorld(); // Draw all the tiles in our game world.
        this.drawPlayer(); // Draw our hero, the player!
        // Draw all the creatures, making sure butterflies only appear during the day and fireflies at night.
        this.creatures.forEach(creature => {
            if (creature.type === 'bunny') this.drawBunny(creature);
            else if (creature.type === 'bird') this.drawBird(creature);
            else if (creature.type === 'squirrel') this.drawSquirrel(creature);
            else if (creature.type === 'fish') this.drawFish(creature);
            else if (creature.type === 'butterfly' && !this.isNight) this.drawButterfly(creature);
            else if (creature.type === 'firefly' && this.isNight) this.drawFirefly(creature);
        });

        this.renderMinimapBackground(); // Update the minimap's background regularly.
        this.drawInventory(); // Draw the player's inventory bar.
        this.drawMinimap(); // Draw the minimap itself.
        this.drawRainingHearts(); // Draw any falling hearts, if the effect is active.

        // Update and draw floating hearts that appear from creatures.
        this.hearts.forEach((heart, index) => {
            heart.y += heart.vy; // Make the heart float up or down.
            heart.vy += 0.05; // Gravity affects hearts too (slightly).
            heart.life--; // Decrease its lifespan.
            if (heart.life <= 0) { // If its time is up...
                this.hearts.splice(index, 1); // ...remove it!
            }
            this.drawHeart(heart.x - this.camera.x, heart.y - this.camera.y, heart.size); // Draw the heart.
        });

        // Draw a semi-transparent black rectangle at the bottom, perhaps for a footer or UI elements.
        this.x.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.x.fillRect(0, this.c.height - 40, this.c.width, 40);
        // Display the game title or other information in the footer.
        this.x.fillStyle = 'white';
        this.x.font = '16px "Press Start 2P"'; // Pixelated font for the title.
        this.x.textAlign = 'center'; // Center the text.
        this.x.fillText(`Serelude`, this.c.width / 2, this.c.height - 15); // Draw the game title.
    },

    // This function draws the beautiful title screen where our adventure begins.
    drawTitleScreen: function() {
        this.x.clearRect(0, 0, this.c.width, this.c.height); // Clear the canvas.
        this.drawSky(); // Draw the sky, setting the mood.

        // Draw the game's main title, \"Serelude\".
        this.x.font = '64px "Press Start 2P"'; // A large, pixelated font for the title.
        this.x.textAlign = 'center'; // Center the text.
        this.x.fillStyle = 'white'; // White text.
        this.x.shadowColor = 'rgba(242, 169, 169, 0.8)'; // A pinkish glow around the text.
        this.x.shadowBlur = 15;
        this.x.fillText('Serelude', this.c.width / 2, this.c.height / 2 - 50); // Draw the title.
        this.x.shadowBlur = 0; // Reset shadow.

        // Draw the \"Start\" button.
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.c.width / 2 - buttonWidth / 2;
        const buttonY = this.c.height / 2 + 50;
        this.startButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight }; // Store button dimensions for click detection.

        this.x.fillStyle = 'rgba(46, 46, 46, 0.6)'; // Dark, transparent background for the button.
        this.x.fillRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
        this.x.strokeStyle = '#F2A9A9'; // A pink border.
        this.x.lineWidth = 3;
        this.x.strokeRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);

        this.x.font = '24px "Press Start 2P"'; // Smaller font for the button text.
        this.x.fillStyle = 'white'; // White text.
        this.x.fillText('Start', this.c.width / 2, this.c.height / 2 + 85); // Draw the \"Start\" text.

        this.drawRainingHearts(); // Add some extra charm with raining hearts on the title screen.
    },

    // This function transitions the game from the title screen to the actual gameplay.
    startGame: function() {
        this.gameState = 'playing'; // Change the game state to 'playing'.
        document.getElementById('overlay').style.display = 'none'; // Hide any overlay elements.
        this.mainLoop(); // Kick off the main game loop!
    },

    // This is the heart of our game! It runs constantly, updating and redrawing everything.
    mainLoop: function() {
        if (this.gameState === 'playing') { // If we're playing...
            this.drawGameWorld(); // ...draw the game world and handle all gameplay updates.
        } else if (this.gameState === 'title') { // If we're on the title screen...
            this.drawTitleScreen(); // ...draw the title screen.
        }
        this.currentAnimationId = requestAnimationFrame(() => this.mainLoop()); // We ask the browser to run this function again very soon, for smooth animation!
    },
};

// This code runs once the entire web page has finished loading.
document.addEventListener('DOMContentLoaded', () => {
    g.init(); // We kick off our game by calling its initialization function.

    // When the 'Save' button is clicked, we save the current game progress.
    document.getElementById('save-btn').addEventListener('click', () => g.saveGameState());
    // When the 'Reset' button is clicked, we ask for confirmation before creating a brand new world.
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to create a new world? All unsaved progress will be lost.")) {
            localStorage.removeItem('SereludeSaveData'); // Clear any saved game data.
            g.initWorld(); // Create a new world.
            g.renderMinimapBackground(); // Update the minimap for the new world.
        }
    });
});

// This is a special class that generates Perlin noise, which helps us create natural-looking, random terrain and biomes.
class PerlinNoise {
    // The constructor sets up our noise generator with a random seed.
    constructor(seed) {
        this.p = new Uint8Array(512);
        this.seed = seed > 0 && seed < 1 ? seed : Math.random(); // Use provided seed or a new random one.
        // This is a simple random number generator used internally.
        this.alea = function() {
            let t = 2091639 * this.seed + 2.3283064365386963e-10;
            return this.seed = t - (t | 0);
        };
        // Initialize a permutation array.
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        // Shuffle the permutation array randomly.
        let n = 256;
        while (--n) {
            let k = Math.floor(this.alea() * 256);
            let tmp = this.p[n];
            this.p[n] = this.p[k];
            this.p[k] = tmp;
        }
        // Duplicate the array to avoid boundary checks later.
        for (let i = 0; i < 256; i++) {
            this.p[i + 256] = this.p[i];
        }
    }

    // This is the core function that generates 3D Perlin noise for a given (x, y, z) coordinate.
    noise(x, y, z) {
        // Find the unit cube that contains the point.
        let X = Math.floor(x) & 255;
        let Y = Math.floor(y) & 255;
        let Z = Math.floor(z) & 255;
        // Find the relative x, y, z coordinates of the point within the cube.
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        // Compute fade curves for each of x, y, z.
        let u = this.fade(x);
        let v = this.fade(y);
        let w = this.fade(z);
        // Hash coordinates of the 8 cube corners.
        let A = this.p[X] + Y;
        let AA = this.p[A] + Z;
        let AB = this.p[A + 1] + Z;
        let B = this.p[X + 1] + Y;
        let BA = this.p[B] + Z;
        let BB = this.p[B + 1] + Z;
        // And now, the magic happens! We blend the 8 corner gradients.
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)), this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
    }

    // This function creates a smooth S-curve for interpolation, making the noise look more natural.
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // This function linearly interpolates between two values, 'a' and 'b', based on a 't' factor.
    lerp(t, a, b) {
        return a + t * (b - a);
    }

    // This function calculates the gradient vector for a given hash and coordinates.
    grad(hash, x, y, z) {
        let h = hash & 15; // Get the last 4 bits of the hash.
        let u = h < 8 ? x : y; // Select x or y based on hash.
        let v = h < 4 ? y : h === 12 || h === 14 ? x : z; // Select y, x, or z based on hash.
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v); // Apply signs based on hash bits.
    }
}
