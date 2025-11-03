// js/modules/ui.js
import { g } from './game.js';

export function displayAnniversaryMessage() {
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
    message.style.display = 'flex';
    message.style.flexDirection = 'column';
    message.style.alignItems = 'center';

    const line1 = document.createElement('span');
    line1.textContent = "Happy 2 months my love";
    line1.style.fontSize = '36px';
    message.appendChild(line1);

    const line2 = document.createElement('span');
    line2.textContent = "I love you";
    line2.style.fontSize = '24px';
    line2.style.marginTop = '10px';
    message.appendChild(line2);

    document.body.appendChild(message);

    setTimeout(() => {
        message.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
            if (message.parentNode) {
                document.body.removeChild(message);
            }
        }, 1000);
    }, 4000);
}

export function drawTitleScreen() {
    g.x.fillStyle = 'rgba(0, 0, 0, 0.5)';
    g.x.fillRect(0, 0, g.c.width, g.c.height);

    g.x.font = "48px 'Press Start 2P'";
    g.x.fillStyle = 'white';
    g.x.textAlign = 'center';
    g.x.fillText("Serelude", g.c.width / 2, g.c.height / 2 - 100);

    g.startButton = {
        x: g.c.width / 2 - 100,
        y: g.c.height / 2,
        width: 200,
        height: 50
    };

    g.x.fillStyle = 'rgba(255, 255, 255, 0.2)';
    g.x.fillRect(g.startButton.x, g.startButton.y, g.startButton.width, g.startButton.height);
    g.x.font = "24px 'Press Start 2P'";
    g.x.fillStyle = 'white';
    g.x.fillText("Start", g.c.width / 2, g.c.height / 2 + 35);
}
