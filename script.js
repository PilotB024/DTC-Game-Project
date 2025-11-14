// ========================
// 60 FPS fixed-timestep game
// ========================
const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

// ------------------------
// Globals / debug
// ------------------------
let frame = 0;
let fps = 0;
let framesThisSecond = 0;
let lastFpsUpdate = performance.now();

// ------------------------
// PLAYER
// ------------------------
class Player {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		// units in pixels / second (time-based)
		this.speed = 300;      // horizontal speed (px/s)
		this.velocityY = 0;
		this.gravity = 2000;   // px / s^2
		this.jumpForce = 900;  // initial jump impulse (px/s)
		this.grounded = false;
		this.jumpCount = 2;

		this.moving = { left: false, right: false };
		this.direction = true; // true => right, false => left

		this.health = 100;
		this.maxHealth = 100;
		this.force = 100;
		this.maxForce = 100;
	}

	update(delta) {
		// delta is seconds (e.g. 1/60)
		// horizontal
		if (this.moving.left && !this.moving.right) this.x -= this.speed * delta;
		if (this.moving.right && !this.moving.left) this.x += this.speed * delta;

		// gravity / vertical
		this.velocityY += this.gravity * delta;
		this.y += this.velocityY * delta;

		// ground collision
		if (this.y + this.height >= canvas.height) {
			this.y = canvas.height - this.height;
			this.velocityY = 0;
			this.grounded = true;
			this.jumpCount = 2;
		} else {
			this.grounded = false;
		}

		// bounds
		this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

		// force regen every 15 frames of the fixed update
		if (frame % 15 === 0 && this.force < this.maxForce && !shield) {
			this.force = Math.min(this.maxForce, this.force + 1);
		}
	}

	draw() {
		// player
		ctx.fillStyle = "lime";
		ctx.fillRect(this.x, this.y, this.width, this.height);

		// HUD
		ctx.font = "18px monospace";
		ctx.fillStyle = "white";
		ctx.fillText(`HP: ${this.health}/${this.maxHealth}`, 10, 22);
		ctx.fillText(`Force: ${this.force}/${this.maxForce}`, 10, 42);
	}
}

const player = new Player(100, 100, 50, 50);

// ------------------------
// INPUT
// ------------------------
let lastSwing = 0;
let attackSpeed = 400;
let saber = null;
let shield = null;

window.addEventListener("keydown", (e) => {
    const blocked = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
    if (blocked.includes(e.key)) e.preventDefault();
});

window.addEventListener("keydown", (e) => {
	switch (e.key.toLowerCase()) {
		case "a":
		case "arrowleft":
			player.moving.left = true;
			player.direction = false;
			break;
		case "d":
		case "arrowright":
			player.moving.right = true;
			player.direction = true;
			break;
		case "w":
		case "arrowup":
			// primary jump (ground) or double jump using force
			if (player.grounded && player.jumpCount > 1) {
				player.velocityY = -player.jumpForce;
				player.grounded = false;
				player.jumpCount--;
			} else if (player.jumpCount > 0 && player.force >= 20) {
				player.velocityY = -player.jumpForce;
				player.jumpCount--;
				player.force -= 20;
			}
			break;
		case " ":
			const now = Date.now();
			if (now - lastSwing < attackSpeed) return;
			lastSwing = now;
			saber = new Lightsaber(player, player.direction);
			break;
		case "q":
			if (!shield && player.force >= 50) {
				shield = new ForceShield(player);
			}
			break;
	}
});
window.addEventListener("keyup", (e) => {
	switch (e.key.toLowerCase()) {
		case "a": 
		case "arrowleft":
			player.moving.left = false; 
			break;
		case "d": 
		case "arrowright":
			player.moving.right = false; 
			break;
		case "q":
			if (shield) shield.active = false;
			shield = null;
			break;
	}
});

// ------------------------
// BULLETS
// ------------------------
const bullets = [];
let lastShotTime = 0;
const fireRate = 200; // ms between shots

class Bullet {
	constructor(x, y, targetX, targetY) {
		this.x = x;
		this.y = y;
		this.speed = 1200; // px/s
		this.range = 500; // px
		this.distanceTraveled = 0;

		const diffX = targetX - x;
		const diffY = targetY - y;
		const length = Math.sqrt(diffX * diffX + diffY * diffY) || 1;
		this.dx = diffX / length;
		this.dy = diffY / length;
	}

	update(delta) {
		const distance = this.speed * delta;
		this.x += this.dx * distance;
		this.y += this.dy * distance;
		this.distanceTraveled += distance;
	}

	draw(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(Math.atan2(this.dy, this.dx));
		ctx.fillStyle = "red";
		ctx.fillRect(0, -2, 20, 5);
		ctx.restore();
	}
}

canvas.addEventListener("mousedown", (event) => {
	const now = Date.now();
	if (now - lastShotTime < fireRate || saber) return;
	lastShotTime = now;

	// use offsetX/Y which are canvas coordinates
	bullets.push(new Bullet(
		player.x + player.width / 2,
		player.y + player.height / 2,
		event.offsetX,
		event.offsetY
	));
});

const mouse = { x: 0, y: 0 };
canvas.addEventListener("mousemove", (event) => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;
});

function drawCrosshair(ctx, x, y) {
	ctx.strokeStyle = "orange";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x - 10, y);
	ctx.lineTo(x + 10, y);
	ctx.moveTo(x, y - 10);
	ctx.lineTo(x, y + 10);
	ctx.stroke();
}

// ------------------------
// LIGHTSABER
// ------------------------
class Lightsaber {
	constructor(player, direction) {
		this.player = player;
		this.length = 60;
		this.width = 10;
		this.swingSpeed = 6; // radians per second
		this.direction = direction;
		this.active = true;

		if (direction) {
			this.angle = -Math.PI / 4;
			this.endAngle = Math.PI / 4;
		} else {
			this.angle = Math.PI + Math.PI / 4;
			this.endAngle = Math.PI - Math.PI / 4;
		}
	}

	update(delta) {
		const step = this.swingSpeed * delta;
		if (this.direction) {
			this.angle += step;
			if (this.angle >= this.endAngle) this.active = false;
		} else {
			this.angle -= step;
			if (this.angle <= this.endAngle) this.active = false;
		}
	}

	draw(ctx) {
		if (!this.active) return;
		ctx.save();
		// pivot near player's hand (right or left)
		const pivotX = this.player.x + (this.direction ? this.player.width : 0);
		const pivotY = this.player.y + this.player.height / 2;
		ctx.translate(pivotX, pivotY);
		ctx.rotate(this.angle);
		ctx.fillStyle = "red";
		// draw outward from pivot
		ctx.fillRect(0, -this.width / 2, this.length, this.width);
		ctx.restore();
	}
}


class ForceShield {
	constructor(player) {
		this.player = player;
		this.radius = 50;
		
		this.cost = 1;
		this.costInterval = 1000 / 5;
		this.timer = 0;

		this.active = true;
	}

	update(delta) {
		if (!this.active) return;

		this.timer += delta * 1000;

		while (this.timer >= this.costInterval) {
			this.timer -= this.costInterval;

			this.player.force -= this.cost;

			if (this.player.force <= 0) {
				this.player.force = 0;
				this.active = false;
				break;
			}
		}
	}

	draw(ctx) {
		if (!this.active) return;

		ctx.save();
		ctx.globalAlpha = 0.25;
		ctx.fillStyle = "cyan";

		ctx.beginPath();
		ctx.arc(
			this.player.x + player.width / 2, 
			this.player.y + player.height / 2, 
			this.radius, 
			0, 
			2 * Math.PI
		);
		ctx.fill();

		ctx.restore();
	}
}

// ------------------------
// ENEMIES
// ------------------------
const enemies = [];
let enemyTimer = 0;
let enemyInterval = 3000;

class Enemy {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.speed = 180; // px/s
		this.angle = 0;
		this.amplitude = 2;
		this.frequency = 0.09;
		this.markedForDeletion = false;
	}

	update(delta) {
		this.x -= this.speed * delta;
		this.y += Math.sin(this.angle) * this.amplitude;
		this.angle += this.frequency;
		if (this.x + this.width < 0) this.markedForDeletion = true;
	}

	draw() {
		ctx.fillStyle = "red";
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

// ------------------------
// Update loop (fixed timestep)
// ------------------------
const timestep = 1000 / 60; // ms per update (60 FPS)
let lastTime = performance.now();
let accumulator = 0;

function updateGame(delta) {
	// delta is seconds (timestep / 1000)
	frame++;
	// player
	player.update(delta);

	// enemy spawn (use ms timestep for timer)
	enemyTimer += timestep;
	if (enemyTimer > enemyInterval) {
		let y = Math.random() * (canvas.height / 3);
		enemies.push(new Enemy(canvas.width, y, 50, 50));
		enemyTimer = 0;
	}

	// enemies update & in-place removal
	for (let i = enemies.length - 1; i >= 0; i--) {
		enemies[i].update(delta);
		if (enemies[i].markedForDeletion) enemies.splice(i, 1);
	}

	// saber update
	if (saber) {
		saber.update(delta);
		if (!saber.active) saber = null;
	}

	if (shield) {
    	shield.update(delta);
    	if (!shield.active) shield = null;
	}


	// bullets update & removal
	for (let i = bullets.length - 1; i >= 0; i--) {
		bullets[i].update(delta);
		if (bullets[i].distanceTraveled >= bullets[i].range) bullets.splice(i, 1);
	}
}

// ------------------------
// Draw function (always called once per RAF frame)
// ------------------------
function drawGame() {
	// background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// player
	player.draw();
	if (shield) shield.draw(ctx);

	// enemies
	enemies.forEach(e => e.draw());

	// bullets
	bullets.forEach(b => b.draw(ctx));

	// saber drawn on top
	if (saber) saber.draw(ctx);

	// crosshair
	drawCrosshair(ctx, mouse.x, mouse.y);
}

// ------------------------
// Main loop (requestAnimationFrame + fixed updates)
// ------------------------
function gameLoop(timestamp) {
	// timestamp provided by RAF (ms)
	let frameTime = timestamp - lastTime;
	if (frameTime > 1000) frameTime = 1000; // clamp to avoid spiral death
	lastTime = timestamp;
	accumulator += frameTime;

	// fixed-step updates: timestep is ms per update
	while (accumulator >= timestep) {
		const delta = timestep / 1000; // seconds per fixed update
		updateGame(delta);
		accumulator -= timestep;
	}

	// FPS tracking (per RAF)
	framesThisSecond++;
	if (timestamp - lastFpsUpdate >= 1000) {
		fps = framesThisSecond;
		framesThisSecond = 0;
		lastFpsUpdate = timestamp;
	}

	// draw once per RAF
	drawGame();

	requestAnimationFrame(gameLoop);
}

// start loop
requestAnimationFrame(gameLoop);
