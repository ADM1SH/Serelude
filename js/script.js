const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

let flowers = [];
let hearts = [];
let petals = [];
let bloomMode = false;
let backgroundParticles = [];
let clouds = [];
let shootingStars = [];
let celestialBody = { angle: -Math.PI };
let isNight = false;
let isDraggingSunMoon = false;

const timePalettes = {
    dawn: { top: '#F2A9A9', bottom: '#F8F8F5' },
    midday: { top: '#D4E6F1', bottom: '#F8F8F5' },
    dusk: { top: '#F2A9A9', bottom: '#FAFAF0' }, // Changed from #B6C8A9 to #FAFAF0
    night: { top: '#2E2E2E', bottom: '#4A4A4A' }
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
    
        if (!isNight) {        ctx.fillStyle = '#FAFAF0';
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

function drawLandscape() {
    ctx.fillStyle = '#B6C8A9';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, canvas.height * 0.8);
    ctx.quadraticCurveTo(canvas.width * 0.25, canvas.height * 0.7, canvas.width * 0.5, canvas.height * 0.8);
    ctx.quadraticCurveTo(canvas.width * 0.75, canvas.height * 0.9, canvas.width, canvas.height * 0.8);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawStickman(x, y, scale) {
  const stickmanColor = 'rgba(46, 46, 46, 0.7)';
  ctx.strokeStyle = stickmanColor;
  ctx.fillStyle = stickmanColor;
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = 'round';

  // Head
  ctx.beginPath();
  ctx.arc(x, y - 60 * scale, 20 * scale, 0, 2 * Math.PI);
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(x, y - 40 * scale);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(x, y - 30 * scale);
  ctx.lineTo(x - 20 * scale, y - 10 * scale);
  ctx.moveTo(x, y - 30 * scale);
  ctx.lineTo(x + 20 * scale, y - 10 * scale);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 15 * scale, y + 25 * scale);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 15 * scale, y + 25 * scale);
  ctx.stroke();
}

function drawLilyOfValley(x, y, scale, bloomProgress) {
  ctx.strokeStyle = '#2E2E2E'; // Always charcoal gray for contrast
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - 10 * scale, y - 40 * scale, x + 10 * scale, y - 80 * scale, x, y - 120 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 30 * scale, y - 20 * scale, x - 50 * scale, y - 60 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 30 * scale, y - 20 * scale, x + 50 * scale, y - 60 * scale);
  ctx.stroke();
  const numBells = 5;
  for (let i = 0; i < numBells; i++) {
    let pct = (i + 1) / numBells;
    if (bloomProgress >= pct) {
      let bx = x + (Math.sin(pct * Math.PI) * 10 * scale) * (i % 2 ? 1 : -1);
      let by = y - pct * 120 * scale;
      const r = 5 * scale; // radius for the bell
      ctx.beginPath();
      ctx.fillStyle = '#FAFAF0';
      ctx.moveTo(bx - r, by);
      ctx.arc(bx, by, r, Math.PI, 0); // Draws the top half of the bell as a semi-circle
      // Create a lobed, petal-like opening for the bell
      ctx.quadraticCurveTo(bx + r, by + r * 0.7, bx + r * 0.7, by + r);
      ctx.quadraticCurveTo(bx + r * 0.3, by + r * 1.1, bx, by + r);
      ctx.quadraticCurveTo(bx - r * 0.3, by + r * 1.1, bx - r * 0.7, by + r);
      ctx.quadraticCurveTo(bx - r, by + r * 0.7, bx - r, by);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawHeart(cx, cy, size) {
  ctx.fillStyle = '#F2A9A9';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(cx - size / 2, cy - size / 2, cx - size, cy + size / 4, cx, cy + size);
  ctx.bezierCurveTo(cx + size, cy + size / 4, cx + size / 2, cy - size / 2, cx, cy);
  ctx.closePath();
  ctx.fill();
}

function animate() {
  drawSky();
  drawLandscape();
  drawBackground();
  drawStickman(canvas.width / 2, canvas.height * 0.8, 1);

  flowers.forEach(flower => {
    if (flower.bloomProgress < 1) flower.bloomProgress += 0.005;
    drawLilyOfValley(flower.x, flower.y, flower.scale, flower.bloomProgress);
  });

  hearts.forEach(heart => {
    drawHeart(heart.x, heart.y, heart.size);
  });

  if (bloomMode) {
    if (Math.random() < 0.1) {
      petals.push({
        x: Math.random() * canvas.width,
        y: 0,
        vy: 1 + Math.random() * 2,
        size: 3 + Math.random() * 3
      });
    }
    petals.forEach(p => {
      ctx.fillStyle = '#F2A9A9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fill();
      p.y += p.vy;
    });
    petals = petals.filter(p => p.y < canvas.height + 10);
  }

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

    let mouseX = event.clientX;
    let mouseY = event.clientY;
    flowers.forEach(flower => {
      let dx = flower.x - mouseX;
      let dy = flower.y - 120 - mouseY;
      if (Math.sqrt(dx*dx + dy*dy) < 30) {
        if (!flower.glowing) {
            flower.glowing = true;
            for (let i = 0; i < 5; i++) {
                hearts.push({x: flower.x, y: flower.y - 120, size: Math.random() * 5 + 2});
            }
        }
      } else {
        flower.glowing = false;
      }
    });
});

canvas.addEventListener('click', (event) => {
  if (isDraggingSunMoon) return;
  const rect = canvas.getBoundingClientRect();
  let clickX = event.clientX - rect.left;
  flowers.push({ x: clickX, y: canvas.height - 50, scale: 1, bloomProgress: 0 });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'f') {
    flowers.push({ x: Math.random() * canvas.width, y: canvas.height - 50, scale: 1, bloomProgress: 0 });
  } else if (e.key === 'h') {
    for (let i = 0; i < 10; i++) {
        hearts.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 10 + 5});
    }
  } else if (e.key === 't') {
    document.getElementById('message1').classList.add('fade-in');
    document.getElementById('message2').classList.add('fade-in');
  } else if (e.key === 'b') {
    bloomMode = !bloomMode;
  }
});
