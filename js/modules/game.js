// js/modules/game.js
export const g = {
    c: null,
    x: null,
    mc: null,
    mx: null,
    minimapBuffer: null,
    minimapBufferCtx: null,
    TILE_SIZE: 20,
    world: [],
    worldWidth: 800,
    worldHeight: 200,
    chunkSizeY: 64,
    biomes: {},
    keys: {
        a: false, d: false, w: false, ' ': false
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
    gameSpeed: 0.35,
    camera: {
        x: 0, y: 0
    },
    backgroundLayers: [
        { color: '#B0D8F0', speed: 0.1 },
        { color: '#87CEEB', speed: 0.2 },
        { color: '#6495ED', speed: 0.3 }
    ],
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
    timePalettes: {
        dawn: { top: '#F2A9A9', bottom: '#F8F8F5' },
        midday: { top: '#D4E6F1', bottom: '#F8F8F5' },
        dusk: { top: '#F2A9A9', bottom: '#FAFAF0' },
        night: { top: '#2E2E2E', bottom: '#4A4A4A' }
    },
};
