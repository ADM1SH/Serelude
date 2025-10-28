const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let flowers = [];
let hearts = [];
let petals = [];
let bloomMode = false;

function drawStickman(x, y, scale) {
  ctx.strokeStyle = '#2E2E2E';
  ctx.lineWidth = 2;
  // Head
  ctx.beginPath();
  ctx.arc(x, y - 60 * scale, 20 * scale, 0, 2 * Math.PI);
  ctx.stroke();
  // Body
  ctx.moveTo(x, y - 40 * scale);
  ctx.lineTo(x, y);
  // Arms
  ctx.moveTo(x, y - 20 * scale);
  ctx.lineTo(x - 15 * scale, y - 10 * scale);
  ctx.moveTo(x, y - 20 * scale);
  ctx.lineTo(x + 15 * scale, y - 10 * scale);
  // Legs
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10 * scale, y + 20 * scale);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 10 * scale, y + 20 * scale);
  ctx.stroke();
}

function drawLilyOfValley(x, y, scale, bloomProgress) {
  ctx.strokeStyle = '#B6C8A9';
  ctx.lineWidth = 2 * scale;
  // Stem
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - 10 * scale, y - 40 * scale, x + 10 * scale, y - 80 * scale, x, y - 120 * scale);
  ctx.stroke();
  // Leaves
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 30 * scale, y - 20 * scale, x - 50 * scale, y - 60 * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 30 * scale, y - 20 * scale, x + 50 * scale, y - 60 * scale);
  ctx.stroke();
  // Bells
  const numBells = 5;
  for (let i = 0; i < numBells; i++) {
    let pct = (i + 1) / numBells;
    if (bloomProgress >= pct) {
      let bx = x + (Math.sin(pct * Math.PI) * 10 * scale) * (i % 2 ? 1 : -1);
      let by = y - pct * 120 * scale;
      ctx.beginPath();
      ctx.fillStyle = '#FAFAF0';
      ctx.arc(bx, by, 5 * scale, 0, 2 * Math.PI);
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
requestAnimationFrame(animate);

canvas.addEventListener('click', (event) => {
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

canvas.addEventListener('mousemove', (event) => {
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
