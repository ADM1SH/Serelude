// js/modules/input.js
import { g } from './game.js';
import { inventory } from './player.js';
import { displayAnniversaryMessage } from './ui.js';
import { getTile, setTile } from './world.js';
import { renderMinimapBackground } from '../modules/renderer.js';
import { startGame, resizeCanvas } from '../script.js';

export function setupInputListeners() {
    document.addEventListener('keydown', (e) => {
        if (!isNaN(e.key) && e.key > 0 && e.key <= inventory.items.length) {
            inventory.selectedSlot = parseInt(e.key) - 1;
            return;
        }
        if (e.key === 't') {
            displayAnniversaryMessage();
        }
        if (e.key in g.keys) g.keys[e.key] = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.key in g.keys) g.keys[e.key] = false;
    });

    g.c.addEventListener('mousedown', (event) => {
        const rect = g.c.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const sunMoonX = g.c.width / 2 + Math.cos(g.celestialBody.angle) * (g.c.width / 2 + 30);
        const sunMoonY = g.c.height * 0.8 + Math.sin(g.celestialBody.angle) * (g.c.height * 0.7);
        const dist = Math.sqrt(Math.pow(mouseX - sunMoonX, 2) + Math.pow(mouseY - sunMoonY, 2));

        if (dist < 40) {
            g.isDraggingSunMoon = true;
        }
    });

    g.c.addEventListener('mouseup', () => {
        g.isDraggingSunMoon = false;
    });

    g.c.addEventListener('mouseleave', () => {
        g.isDraggingSunMoon = false;
    });

    g.c.addEventListener('mousemove', (event) => {
        if (g.isDraggingSunMoon) {
            const rect = g.c.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const dx = mouseX - g.c.width / 2;
            const dy = mouseY - g.c.height * 0.8;
            g.celestialBody.angle = Math.atan2(dy, dx);
            return;
        }
    });

    g.c.addEventListener('click', (event) => {
        if (g.gameState === 'title') {
            const rect = g.c.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            if (g.startButton && clickX >= g.startButton.x && clickX <= g.startButton.x + g.startButton.width &&
                clickY >= g.startButton.y && clickY <= g.startButton.y + g.startButton.height) {
                startGame();
            }
            return;
        }

        if (g.isDraggingSunMoon) return;
        
        const rect = g.c.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const tileX = Math.floor((clickX + g.camera.x) / g.TILE_SIZE);
        const tileY = Math.floor((clickY + g.camera.y) / g.TILE_SIZE);

        if (getTile(tileX, tileY) === undefined) return;

        const playerTileX = Math.floor((player.x + player.width / 2) / g.TILE_SIZE);
        const playerTileY = Math.floor((player.y + player.height / 2) / g.TILE_SIZE);
        const distance = Math.sqrt(Math.pow(tileX - playerTileX, 2) + Math.pow(tileY - playerTileY, 2));

        if (distance > 5) return;

        const selectedItem = inventory.items[inventory.selectedSlot];
        const clickedTile = getTile(tileX, tileY);
        let worldModified = false;

        if (selectedItem.type === 'axe') {
            if (clickedTile === 4 || clickedTile === 5) {
                destroyTree(tileX, tileY, [4, 5], 'wood');
                worldModified = true;
            } else if (clickedTile === 14 || clickedTile === 15) {
                destroyTree(tileX, tileY, [14, 15], 'birchWood');
                worldModified = true;
            } else if (clickedTile === 16 || clickedTile === 17) {
                destroyTree(tileX, tileY, [16, 17], 'cherryWood');
                worldModified = true;
            } else if (clickedTile === 18) {
                setTile(tileX, tileY, 0);
                inventory.items.find(i => i.type === 'cactus').amount++;
                worldModified = true;
            }
        }
        else if (selectedItem.type === 'pickaxe') {
            if (clickedTile === 1 || clickedTile === 2) {
                setTile(tileX, tileY, 0);
                inventory.items.find(i => i.type === 'dirt').amount++;
                worldModified = true;
            } else if (clickedTile === 3) {
                setTile(tileX, tileY, 0);
                inventory.items.find(i => i.type === 'stone').amount++;
                worldModified = true;
            }
        }

        if (clickedTile === 6 || clickedTile === 7 || clickedTile === 10 || clickedTile === 11 || clickedTile === 12 || clickedTile === 13) {
            if (clickedTile === 6 && getTile(tileX, tileY - 1) === 7) setTile(tileX, tileY - 1, 0);
            if (clickedTile === 7 && getTile(tileX, tileY + 1) === 6) setTile(tileX, tileY + 1, 0);
            if (clickedTile === 10 && getTile(tileX, tileY - 1) === 11) setTile(tileX, tileY - 1, 0);
            if (clickedTile === 11 && getTile(tileX, tileY + 1) === 10) setTile(tileX, tileY + 1, 0);
            if (clickedTile === 12 && getTile(tileX, tileY - 1) === 13) setTile(tileX, tileY - 1, 0);
            if (clickedTile === 13 && getTile(tileX, tileY + 1) === 12) setTile(tileX, tileY + 1, 0);
            setTile(tileX, tileY, 0);
            if (clickedTile === 6 || clickedTile === 7) inventory.items.find(i => i.type === 'lily').amount++;
            else if (clickedTile === 10 || clickedTile === 11) inventory.items.find(i => i.type === 'lilyOfTheValley').amount++;
            else if (clickedTile === 12 || clickedTile === 13) inventory.items.find(i => i.type === 'rose').amount++;
            worldModified = true;
        }

        if (clickedTile === 0) {
            if (selectedItem.type === 'stone') {
                setTile(tileX, tileY, 3);
                worldModified = true;
            } else if (selectedItem.type === 'wood') {
                setTile(tileX, tileY, 4);
                worldModified = true;
            } else if (selectedItem.type === 'dirt') {
                setTile(tileX, tileY, 2);
                worldModified = true;
            } else if (selectedItem.type === 'lily') {
                if (getTile(tileX, tileY + 1) === 1) {
                    setTile(tileX, tileY, 6);
                    setTile(tileX, tileY - 1, 7);
                    worldModified = true;
                }
            } else if (selectedItem.type === 'lilyOfTheValley') {
                if (getTile(tileX, tileY + 1) === 1) {
                    setTile(tileX, tileY, 10);
                    setTile(tileX, tileY - 1, 11);
                    worldModified = true;
                }
            } else if (selectedItem.type === 'rose') {
                if (getTile(tileX, tileY + 1) === 1) {
                    setTile(tileX, tileY, 12);
                    setTile(tileX, tileY - 1, 13);
                    worldModified = true;
                }
            } else if (selectedItem.type === 'sapling') {
                if (getTile(tileX, tileY + 1) === 1) {
                    setTile(tileX, tileY, 8);
                    setTimeout(() => growTree(tileX, tileY, selectedItem.growsInto), 30000);
                    worldModified = true;
                }
            }
        }
        if (worldModified) {
            renderMinimapBackground();
        }
    });

    window.addEventListener('resize', () => resizeCanvas());
}

function destroyTree(x, y, treeTiles, woodType) {
    const tilesToDestroy = [{x, y}];
    const visited = new Set();
    visited.add(`${x},${y}`);

    let i = 0;
    while (i < tilesToDestroy.length) {
        const {x: currentX, y: currentY} = tilesToDestroy[i];
        i++;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const newX = currentX + dx;
                const newY = currentY + dy;
                const tile = getTile(newX, newY);

                if (treeTiles.includes(tile) && !visited.has(`${newX},${newY}`)) {
                    tilesToDestroy.push({x: newX, y: newY});
                    visited.add(`${newX},${newY}`);
                }
            }
        }
    }

    tilesToDestroy.forEach(tile => {
        setTile(tile.x, tile.y, 0);
    });

    const wood = inventory.items.find(i => i.type === woodType);
    if (wood) {
        wood.amount += tilesToDestroy.length;
    }
}

function growTree(x, y, growsInto) {
    const groundTile = getTile(x, y + 1);
    if (groundTile === 1) { // Only grow on grass
        const treeHeight = Math.floor(Math.random() * 3) + 4;
        for (let i = 0; i < treeHeight; i++) {
            setTile(x, y - i, growsInto[0]);
        }
        for (let ly = -1; ly <= 1; ly++) {
            for (let lx = -1; lx <= 1; lx++) {
                setTile(x + lx, y - treeHeight + ly, growsInto[1]);
            }
        }
    }
}
