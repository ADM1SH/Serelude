// js/modules/player.js
export const player = {
    x: 0, y: 0,
    width: 20, height: 40,
    vx: 0, vy: 0,
    speed: 4,
    jumpForce: 9,
    onGround: false,
    direction: 'right',
    isWalking: false,
    walkFrame: 0,
    walkFrameTimer: 0
};

export const inventory = {
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
    selectedSlot: 0
};
