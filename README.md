# 🎯 Draw a Perfect Circle Game

**Live Demo** 👉 [Play Now](https://your-username.github.io/draw-a-perfect-circle/)  
_A fun challenge to test your freehand drawing accuracy!_

---

## 🌀 What is this?

**Draw a Perfect Circle** is a browser-based interactive game where your goal is simple — draw a perfect circle freehand using your mouse or finger!  
You'll get:

- 🎯 **Live accuracy score** while drawing
- 🌈 **Smooth color transitions** based on your precision
- ❌ Alerts for wrong direction
- 🏆 Circle completion detection + confetti celebration!
- 💡 Supports both mobile and desktop devices

---

## 🧠 How it Works

- It calculates the **center** of your drawn path.
- Compares distances of all points from that center to compute **standard deviation**.
- The lower the deviation, the more circular your shape — i.e., higher your score.
- Once you complete ~360° around the center, the game **pauses**, shows your score, and resets on next draw.

---

## 🛠️ Features

- ⭕ Real-time circle detection
- 📱 Touch + Mouse support
- 🎨 Color-coded live accuracy (Red → Yellow → Green)
- 🔁 Auto-restart after finger/mouse lifted
- 🚫 "Wrong Way" direction detection (configurable)

---

## 🚀 Deployment

This game is built using **HTML, CSS, and Vanilla JS** — no libraries required.

### Play it live:
**🔗 https://your-username.github.io/draw-a-perfect-circle/**

Or clone and run locally:
```bash
git clone https://github.com/your-username/draw-a-perfect-circle.git
cd draw-a-perfect-circle
open index.html
