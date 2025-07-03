const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.lineWidth = 5;
ctx.lineCap = "round";

const resultText = document.getElementById("result");

let isDrawing = false;
let path = [];
let gamePaused = false;
let lastAngle = 0;
let direction = 0;
const MIN_POINTS_FOR_DIRECTION = 15;
const ANGLE_CHANGE_TOLERANCE = 0.2;
let highScore = parseFloat(localStorage.getItem("perfectCircleHighScore")) || 0;

function updateHighScoreDisplay() {
  const display = document.getElementById("high-score");
  display.innerText = `🏆 High Score: ${highScore.toFixed(2)} / 100`;
}
updateHighScoreDisplay();
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
    resultText.innerText = "Keep drawing...";
    path = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
          resultText.innerHTML = `<span style="color: red; font-weight: bold;">❌ Wrong Way! Please draw in a consistent direction.</span>`;
          alert("You're drawing in the wrong direction! Try again.");
          return;
        }
      }
    }
    lastAngle = currentAngle;
  }

  path.push({ x: pos.x, y: pos.y, color });

  // Redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 1; i < path.length; i++) {
    ctx.beginPath();
    ctx.moveTo(path[i - 1].x, path[i - 1].y);
    ctx.lineTo(path[i].x, path[i].y);
    ctx.strokeStyle = path[i].color;
    ctx.stroke();
  }

  updateScore();
  checkIfCircleCompleted();
}

function stopDrawing(e) {
  e.preventDefault();

  if (gamePaused) return; // If game is already paused (e.g., due to wrong direction or completion), don't do anything

  isDrawing = false;
  gamePaused = true; // Pause the game when finger is lifted

  if (path.length >= 10) {
    const center = getCenter(path);
    const radii = path.map(p => distance(p, center));
    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;

    const variance = radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length;
    const stdDev = Math.sqrt(variance);
    const score = Math.max(0, 100 - stdDev);
    const roundedScore = score.toFixed(2);
    const color = getColorForScore(score);

    // No high score update here. This is only for displaying the current accuracy when lifted.
    resultText.innerHTML = `<span style="color: ${color}; font-weight: bold;">Final Accuracy: ${roundedScore} / 100 ⏸️ Finger lifted.</span>`;
  } else {
    resultText.innerHTML = `<span style="color: gray;">Too short to calculate accuracy.</span>`;
  }
}


function updateScore() {
  if (path.length < 10) {
    resultText.innerHTML = `<span style="color: gray;">Keep drawing...</span>`;
    return;
  }

  const center = getCenter(path);
  const radii = path.map(p => distance(p, center));
  const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
  const variance = radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length;
  const stdDev = Math.sqrt(variance);
  const score = Math.max(0, 100 - stdDev);
  const roundedScore = score.toFixed(2);
  const color = getColorForScore(score);

  resultText.innerHTML = `<span style="color: ${color}; font-weight: bold;">Live Accuracy: ${roundedScore} / 100</span>`;
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
    const curr = path[i];
    const angle = Math.atan2(curr.y - center.y, curr.x - center.x);
    let delta = angle - prevAngle;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    totalAngleChange += delta;
    prevAngle = angle;
  }

  const start = path[0];
  const end = path[path.length - 1];
  const loopClosed = distance(start, end) < 50; // This condition might need tweaking based on desired closure

  // Check if a full circle is completed (at least 360 degrees of rotation)
  if (Math.abs(totalAngleChange) >= 2 * Math.PI) {
    isDrawing = false;
    gamePaused = true; // Pause the game when a circle is completed

    const variance = radii.reduce((a, b) => a + Math.pow(b - avgRadius, 2), 0) / radii.length;
    const stdDev = Math.sqrt(variance);
    const score = Math.max(0, 100 - stdDev);
    const roundedScore = score.toFixed(2);
    const color = getColorForScore(score);

    // ✅ Update high score ONLY if beaten AND circle is completed
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("perfectCircleHighScore", highScore.toFixed(2));
      updateHighScoreDisplay();
    }

    if (avgRadius < 50) {
      resultText.innerHTML = `<span style="color: ${color}; font-weight: bold;">Live Accuracy: ${roundedScore} / 100 ❌ Too small! Try a bigger circle.</span>`;
    } else {
      resultText.innerHTML = `<span style="color: ${color}; font-weight: bold;">Live Accuracy: ${roundedScore} / 100 🎯 Circle completed!</span>`;
      if (score >= 90) launchConfetti();
    }
  }
}

// Confetti CSS
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
