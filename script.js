const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.lineWidth = 5;
ctx.lineCap = "round";

let isDrawing = false;
let path = [];
let gamePaused = false;
let lastAngle = 0;
let direction = 0;
const MIN_POINTS_FOR_DIRECTION = 15;
const ANGLE_CHANGE_TOLERANCE = 0.2;
let highScore = parseFloat(localStorage.getItem("perfectCircleHighScore")) || 0;

// 🖼 Resize Canvas to Fullscreen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawStaticText();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 🖊️ Static Text: Title & High Score
function drawStaticText() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, 80);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("Draw a Perfect Circle", canvas.width / 2, 40);
  ctx.font = "20px sans-serif";
  ctx.fillText(`🏆 High Score: ${highScore.toFixed(2)} / 100`, canvas.width / 2, 70);
  ctx.restore();
}

function drawOverlayText(text, color = 'white') {
  ctx.save();

  const safePadding = 90; // height to clear, and where to draw the text
  const bottomTextY = canvas.height - 30;

  ctx.clearRect(0, canvas.height - safePadding, canvas.width, safePadding);
  ctx.fillStyle = color;
  ctx.textAlign = "center";

  // Responsive font size
  const fontSize = Math.max(16, canvas.width * 0.045); // ~24px on desktop, scales down on mobile
  ctx.font = `bold ${fontSize}px sans-serif`;

  // Make sure we only draw if height is tall enough
  if (bottomTextY > 0) {
    ctx.fillText(text, canvas.width / 2, bottomTextY);
  }

  ctx.restore();
}



// 🎉 Confetti
function launchConfetti() {
  const duration = 1000;
  const animationEnd = Date.now() + duration;
  const colors = ['#00FF00', '#FFD700', '#FF6347'];

  function frame() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;

    for (let i = 0; i < 5; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.top = "-10px";
      confetti.style.animationDuration = (Math.random() * 2 + 1) + "s";
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 2000);
    }
    requestAnimationFrame(frame);
  }
  frame();
}

// ✏️ Drawing Helpers
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return e.touches
    ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    : { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startDrawing(e) {
  e.preventDefault();
  if (gamePaused) {
    gamePaused = false;
    path = [];
    ctx.clearRect(0, 80, canvas.width, canvas.height - 130);
    drawStaticText();
    lastAngle = 0;
    direction = 0;
  }
  isDrawing = true;
  const pos = getPos(e);
  path.push(pos);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  updateScore();
}

function draw(e) {
  if (!isDrawing || gamePaused) return;
  e.preventDefault();

  const pos = getPos(e);
  const center = getCenter(path.length > 1 ? path : [pos]);
  const radii = path.map(p => distance(p, center));
  const avgRadius = radii.length ? radii.reduce((a, b) => a + b, 0) / radii.length : 1;
  const stdDev = radii.length ? Math.sqrt(radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length) : 0;
  const score = Math.max(0, 100 - stdDev);
  const color = getColorForScore(score);

  // 🔄 Wrong Way Detection
  if (path.length > 0) {
    const currentAngle = Math.atan2(pos.y - center.y, pos.x - center.x);
    if (path.length >= MIN_POINTS_FOR_DIRECTION) {
      let angleChange = currentAngle - lastAngle;
      if (angleChange > Math.PI) angleChange -= 2 * Math.PI;
      if (angleChange < -Math.PI) angleChange += 2 * Math.PI;

      if (direction === 0) {
        if (angleChange > 0.05) direction = 1;
        else if (angleChange < -0.05) direction = -1;
      } else {
        if ((direction === 1 && angleChange < -ANGLE_CHANGE_TOLERANCE) ||
            (direction === -1 && angleChange > ANGLE_CHANGE_TOLERANCE)) {
          gamePaused = true;
          alert("You're drawing in the wrong direction! Try again.");
          drawOverlayText("❌ Wrong Direction!", "red");
          return;
        }
      }
    }
    lastAngle = currentAngle;
  }

  path.push({ x: pos.x, y: pos.y, color });

  ctx.clearRect(0, 80, canvas.width, canvas.height - 130); // Clear drawing area
  drawStaticText();

  for (let i = 1; i < path.length; i++) {
    ctx.beginPath();
    ctx.moveTo(path[i - 1].x, path[i - 1].y);
    ctx.lineTo(path[i].x, path[i].y);
    ctx.strokeStyle = path[i].color;
    ctx.stroke();
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
  }

  updateScore();
  checkIfCircleCompleted();
}

function stopDrawing(e) {
  e.preventDefault();
  if (gamePaused) return;
  isDrawing = false;
  gamePaused = true;

  if (path.length >= 10) {
    const center = getCenter(path);
    const radii = path.map(p => distance(p, center));
    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
    const stdDev = Math.sqrt(radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length);
    const score = Math.max(0, 100 - stdDev);
    const roundedScore = score.toFixed(2);
    const color = getColorForScore(score);
    drawOverlayText(`Final Accuracy: ${roundedScore} / 100`, color);
  } else {
    drawOverlayText("Too short to calculate accuracy.", "gray");
  }
}

function updateScore() {
  if (path.length < 10) {
    drawOverlayText("Keep drawing...", "gray");
    return;
  }

  const center = getCenter(path);
  const radii = path.map(p => distance(p, center));
  const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
  const stdDev = Math.sqrt(radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length);
  const score = Math.max(0, 100 - stdDev);
  const roundedScore = score.toFixed(2);
  const color = getColorForScore(score);

  drawOverlayText(`Live Accuracy: ${roundedScore} / 100`, color);
}

function getColorForScore(score) {
  const clamped = Math.max(0, Math.min(score, 100));
  if (clamped <= 70) {
    const lightness = 20 + ((clamped / 70) * 20);
    return `hsl(0, 100%, ${lightness}%)`;
  } else if (clamped <= 80) {
    const ratio = (clamped - 70) / 10;
    const hue = 0 + ratio * 50;
    return `hsl(${hue}, 100%, 40%)`;
  } else {
    const ratio = (clamped - 80) / 20;
    const hue = 50 + ratio * 70;
    return `hsl(${hue}, 100%, 40%)`;
  }
}

function getCenter(points) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
}

function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function checkIfCircleCompleted() {
  if (path.length < 50) return;

  const center = getCenter(path);
  const radii = path.map(p => distance(p, center));
  const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;

  let totalAngleChange = 0;
  let prevAngle = Math.atan2(path[0].y - center.y, path[0].x - center.x);

  for (let i = 1; i < path.length; i++) {
    const angle = Math.atan2(path[i].y - center.y, path[i].x - center.x);
    let delta = angle - prevAngle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    totalAngleChange += delta;
    prevAngle = angle;
  }

  const loopClosed = distance(path[0], path[path.length - 1]) < 50;

  if (Math.abs(totalAngleChange) >= 2 * Math.PI) {
    isDrawing = false;
    gamePaused = true;

    const variance = radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length;
    const stdDev = Math.sqrt(variance);
    const score = Math.max(0, 100 - stdDev);
    const roundedScore = score.toFixed(2);
    const color = getColorForScore(score);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("perfectCircleHighScore", highScore.toFixed(2));
    }

    if (avgRadius < 50) {
      drawOverlayText(`❌ Too small! Try a bigger circle. (${roundedScore}/100)`, color);
    } else {
      drawOverlayText(`🎯 Circle completed! Accuracy: ${roundedScore} / 100`, color);
      if (score >= 90) launchConfetti();
    }
  }
}

// 🎉 Confetti CSS
const style = document.createElement('style');
style.innerHTML = `
.confetti {
  position: fixed;
  width: 10px;
  height: 10px;
  opacity: 0.9;
  border-radius: 50%;
  z-index: 9999;
  animation: fall 2s linear forwards;
}
@keyframes fall {
  to {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}`;
document.head.appendChild(style);

// Event Listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);

canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stopDrawing, { passive: false });
