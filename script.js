const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const distanceElement = document.getElementById("distance");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restartButton");

const keys = {};
const worldWidth = 5200;
const gravity = 0.72;
const player = { x: 120, y: 380, w: 30, h: 46, vx: 0, vy: 0, speed: 4.8, jump: 13.5, grounded: false, direction: 1, attacking: 0, invincible: 0 };
const platforms = [
    { x: 0, y: 470, w: 860, h: 70 }, { x: 980, y: 425, w: 540, h: 115 },
    { x: 1660, y: 470, w: 640, h: 70 }, { x: 2440, y: 390, w: 460, h: 150 },
    { x: 3050, y: 470, w: 810, h: 70 }, { x: 4010, y: 420, w: 600, h: 120 },
    { x: 4740, y: 470, w: 460, h: 70 }
];
const enemies = [
    { x: 560, y: 434, w: 26, h: 36, min: 430, max: 760, vx: 1.15, alive: true },
    { x: 1200, y: 389, w: 26, h: 36, min: 1040, max: 1430, vx: -1.1, alive: true },
    { x: 1870, y: 434, w: 26, h: 36, min: 1730, max: 2170, vx: 1.3, alive: true },
    { x: 2680, y: 354, w: 26, h: 36, min: 2490, max: 2820, vx: -1.2, alive: true },
    { x: 3440, y: 434, w: 26, h: 36, min: 3200, max: 3740, vx: 1.4, alive: true },
    { x: 4270, y: 384, w: 26, h: 36, min: 4100, max: 4500, vx: -1.15, alive: true }
];
const stars = Array.from({ length: 80 }, (_, i) => ({ x: (i * 137) % worldWidth, y: 35 + (i * 71) % 235, r: i % 4 === 0 ? 2 : 1 }));
let cameraX = 0, score = 0, lives = 3, gameState = "playing";

function resetGame() {
    Object.assign(player, { x: 120, y: 380, vx: 0, vy: 0, direction: 1, attacking: 0, invincible: 0 });
    enemies.forEach((enemy, i) => Object.assign(enemy, { alive: true, x: [560, 1200, 1870, 2680, 3440, 4270][i] }));
    cameraX = 0; score = 0; lives = 3; gameState = "playing"; messageElement.hidden = true; updateHud();
}

function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function setMessage(title, detail) { messageElement.innerHTML = `<h2>${title}</h2><p>${detail}</p>`; messageElement.hidden = false; }
function updateHud() {
    scoreElement.textContent = String(score).padStart(6, "0");
    distanceElement.textContent = Math.max(0, Math.floor(player.x / 10));
    document.querySelectorAll(".hearts span").forEach((heart, i) => heart.classList.toggle("empty", i >= lives));
}

function hurt() {
    if (player.invincible > 0) return;
    lives--; player.invincible = 90; player.vy = -7; player.vx = -player.direction * 4;
    if (lives <= 0) { gameState = "lost"; setMessage("GAME OVER", "RESTART または R キーで再挑戦"); }
}

function update() {
    if (gameState !== "playing") return;
    const left = keys.ArrowLeft || keys.a, right = keys.ArrowRight || keys.d;
    player.vx = (right ? player.speed : 0) - (left ? player.speed : 0);
    if (player.vx !== 0) player.direction = Math.sign(player.vx);
    if ((keys[" "] || keys.w || keys.ArrowUp) && player.grounded) { player.vy = -player.jump; player.grounded = false; keys[" "] = false; }
    player.vy += gravity; player.x = Math.max(0, Math.min(worldWidth - player.w, player.x + player.vx)); player.y += player.vy; player.grounded = false;
    for (const platform of platforms) {
        if (player.x + player.w > platform.x && player.x < platform.x + platform.w && player.y + player.h >= platform.y && player.y + player.h - player.vy <= platform.y) {
            player.y = platform.y - player.h; player.vy = 0; player.grounded = true;
        }
    }
    if (player.y > canvas.height + 80) { lives = 0; gameState = "lost"; setMessage("GAME OVER", "落下してしまった！ RESTART で再挑戦"); }
    if (player.attacking > 0) player.attacking--;
    if (player.invincible > 0) player.invincible--;
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemy.vx;
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        const hitbox = { x: player.x + (player.direction > 0 ? player.w : -34), y: player.y + 8, w: 34, h: 25 };
        if (player.attacking > 0 && overlaps(hitbox, enemy)) { enemy.alive = false; score += 100; }
        else if (overlaps(player, enemy)) hurt();
    });
    if (player.x > 4930) { gameState = "won"; score += 500; setMessage("STAGE CLEAR!", `SCORE ${String(score).padStart(6, "0")} ・ よくやった！`); }
    cameraX += (player.x - cameraX - 260) * 0.08; cameraX = Math.max(0, Math.min(worldWidth - canvas.width, cameraX)); updateHud();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8cdce0"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-cameraX, 0);
    ctx.fillStyle = "#b5e8e3"; stars.forEach(star => { ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#65c2ca"; for (let x = -100; x < worldWidth; x += 300) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 150, 300); ctx.lineTo(x + 350, 470); ctx.fill(); }
    platforms.forEach(platform => { ctx.fillStyle = "#283e49"; ctx.fillRect(platform.x, platform.y, platform.w, platform.h); ctx.fillStyle = "#d8f36a"; ctx.fillRect(platform.x, platform.y, platform.w, 7); });
    ctx.fillStyle = "#f3724d"; ctx.fillRect(4950, 310, 7, 160); ctx.fillStyle = "#d8f36a"; ctx.beginPath(); ctx.moveTo(4957, 315); ctx.lineTo(5040, 340); ctx.lineTo(4957, 365); ctx.fill();
    enemies.forEach(enemy => { if (!enemy.alive) return; ctx.fillStyle = "#f3724d"; ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h); ctx.fillStyle = "#172833"; ctx.fillRect(enemy.x + 5, enemy.y + 8, 5, 5); ctx.fillRect(enemy.x + 16, enemy.y + 8, 5, 5); ctx.fillStyle = "#172833"; ctx.fillRect(enemy.x - 3, enemy.y + enemy.h, enemy.w + 6, 5); });
    if (!(player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0)) {
        ctx.fillStyle = "#172833"; ctx.fillRect(player.x, player.y + 12, player.w, player.h - 12); ctx.fillStyle = "#f9d2a7"; ctx.fillRect(player.x + 5, player.y, 20, 19); ctx.fillStyle = "#f3724d"; ctx.fillRect(player.x + 3, player.y - 4, 24, 7); ctx.fillStyle = "#d8f36a"; ctx.fillRect(player.x + (player.direction > 0 ? 22 : -8), player.y + 20, 16, 5);
        if (player.attacking > 0) { ctx.fillStyle = "#fff5b5"; ctx.fillRect(player.x + (player.direction > 0 ? 27 : -30), player.y + 8, 30, 4); }
    }
    ctx.restore();
    requestAnimationFrame(() => { update(); draw(); });
}

window.addEventListener("keydown", event => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault(); keys[event.key] = true; if (event.key.toLowerCase() === "j" && gameState === "playing") player.attacking = 14; if (event.key.toLowerCase() === "r") resetGame(); });
window.addEventListener("keyup", event => { keys[event.key] = false; });
restartButton.addEventListener("click", resetGame);
updateHud(); draw();
