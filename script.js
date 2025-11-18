// ========================
// 60 FPS fixed-timestep game
// ========================
const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");
const lukeImg = new Image();
lukeImg.src = "./img/luke1.png";



// ------------------------
// Globals / debug
// ------------------------
let frame = 0;
let framesThisSecond = 0;
const LUKE_FRAME_W = 48;
const LUKE_FRAME_H = 64;
let lukeCol = 0;
let lukeRow = 0; 

lukeImg.onload = () => console.log("Luke loaded");
lukeImg.onerror = () =>
  console.error("Bad path:", new URL(lukeImg.src, document.baseURI).href);





// ------------------------
// Hide cursor when mouse enters the canvas
// ------------------------

canvas.addEventListener("mouseenter", () => {
  canvas.style.cursor = "none";
});

// Show cursor when mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  canvas.style.cursor = "default";
});



// ------------------------
// PLAYER
// ------------------------
class Player {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Movement
    this.speed = 300;
    this.velocityY = 0;
    this.gravity = 2000;
    this.jumpForce = 900;
    this.grounded = false;
    this.jumpCount = 2;
    this.moving = { left: false, right: false };
    this.facing = 1;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.force = 100;
    this.maxForce = 100;

    // Animation system
    this.frameW = 96; 
    this.frameH = 96;
    this.scale = 1.3;

    this.animations = {
      idle: { row: 0, len: 6, fps: 8 },
      run:  { row: 1, len: 8, fps: 12 },
      jump: { row: 2, len: 2, fps: 6 }
    };

    this.state = "idle";
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  setState(next) {
    if (this.state !== next) {
      this.state = next;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  update(dt) {
    // ===========================
    // HORIZONTAL MOVEMENT
    // ===========================
    if (this.moving.left && !this.moving.right) {
      this.x -= this.speed * dt;
      this.facing = -1;
    }
    if (this.moving.right && !this.moving.left) {
      this.x += this.speed * dt;
      this.facing = 1;
    }

    // ===========================
    // GRAVITY
    // ===========================
    this.velocityY += this.gravity * dt;
    this.y += this.velocityY * dt;

    // ===========================
    // GROUND COLLISION
    // ===========================
    if (this.y + this.height >= canvas.height) {
      this.y = canvas.height - this.height;
      this.velocityY = 0;
      this.grounded = true;
      this.jumpCount = 2;
    } else {
      this.grounded = false;
    }

    // Clamp horizontal bounds
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

    // ===========================
    // FORCE REGEN
    // ===========================
    if (frame % 15 === 0 && this.force < this.maxForce && !shield) {
      this.force = Math.min(this.maxForce, this.force + 1);
    }

    // ===========================
    // STATE & ANIMATION
    // ===========================
    if (!this.grounded) this.setState("jump");
    else if (this.moving.left || this.moving.right) this.setState("run");
    else this.setState("idle");

    const { row, len, fps } = this.animations[this.state];
    this.row = row;

    this.frameTimer += dt * 1000;
    if (this.frameTimer >= 1000 / fps) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % len;
    }
  }

  draw() {
    // Draw player hitbox (debug)
    // ctx.fillStyle = "lime";
    // ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw Luke
    if (!lukeImg.complete) return;

    const sx = this.frameIndex * this.frameW;
    const sy = this.row * this.frameH;

    ctx.save();

    if (this.facing === -1) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        lukeImg,
        sx, sy, this.frameW, this.frameH,
        0, 0,
        this.width, this.height
      );
    } else {
      ctx.drawImage(
        lukeImg,
        sx, sy, this.frameW, this.frameH,
        this.x, this.y,
        this.width, this.height
      );
    }

    ctx.restore();

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

let last = performance.now();
function gameLoop(now = performance.now()) {
	const dt = now - last;
	last = now; 

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	player.update(dt);
	player.draw();

	requestAnimationFrame(gameLoop);
}

// Input handling

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
			if (player.grounded && player.jumpCount > 1) {
				player.velocityY = -player.jumpForce;
				player.grounded = false;
				player.jumpCount--;
			} else if (player.jumpCount > 0 && player.force >= 20) {
				player.velocityY = -player.jumpForce;
				player.force -= 20;
				player.jumpCount--;
			}
			break;
		case " ":
			const now = Date.now();
			if (now - lastSwing < attackSpeed) return;
			lastSwing = now;
			saber = new Lightsaber(player, player.direction);
			break;
		case "q":
			if (!shield && player.force >= 50) shield = new ForceShield(player);
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
const fireRate = 200;

const enemyBullets = []; //New

class Bullet {
	constructor(x, y, targetX, targetY) {
		this.x = x;
		this.y = y;
		this.speed = 1200; 
		this.range = 500; 
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


// ------------------------
// CROSSHAIR
// ------------------------
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
		this.swingSpeed = 6; 
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

		const pivotX = this.player.x + (this.direction ? this.player.width : 0);
		const pivotY = this.player.y + this.player.height / 2;

		ctx.translate(pivotX, pivotY);
		ctx.rotate(this.angle);
		ctx.fillStyle = "red";

		ctx.fillRect(0, -this.width / 2, this.length, this.width);
		ctx.restore();
	}
}

// ------------------------
// FORCE SHIELD
// ------------------------
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
		ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.radius, 0, 2 * Math.PI);
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
		this.speed = 180;
		this.angle = 0;
		this.amplitude = 2;
		this.frequency = 0.09;
		this.markedForDeletion = false;
		this.shotCooldown = 1500;  // New
		this.lastShot = 0;  //New

	}

	update(delta) {
		this.x -= this.speed * delta;
		this.y += Math.sin(this.angle) * this.amplitude;
		this.angle += this.frequency;
		if (this.x + this.width < 0) this.markedForDeletion = true;

		const now = Date.now() //New Const
		if(now - this.lastShot > this.shotCooldown){
			enemyBullets.push(new Bullet(
				this.x + this.width /2,
				this.y + this.height /2,
				player.x + player.width /2,
				player.y + player.height /2
				));
			this.lastShot = now;
		}
	}

	draw() {
		ctx.fillStyle = "red";
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

// ------------------------
// COLLISION
// ------------------------
function boxCollision(a, b) {
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

let damageCooldown = 1000;
let lastDamageTime = 0;

// ------------------------
// MAIN GAME LOOP
// ------------------------
const timestep = 1000 / 60;
let lastTime = performance.now();
let accumulator = 0;

function updateGame(delta) {
	frame++;

	player.update(delta);

	// Enemy spawn
	enemyTimer += timestep;
	if (enemyTimer > enemyInterval) {
		let y = Math.random() * (canvas.height / 3);
		enemies.push(new Enemy(canvas.width, y, 50, 50));
		enemyTimer = 0;
	}

	// Enemies update & remove
	for (let i = enemies.length - 1; i >= 0; i--) {
		enemies[i].update(delta);
		if (enemies[i].markedForDeletion) enemies.splice(i, 1);



// ------------------------
//Player bullets hitting enemies in progress
// ------------------------




		// Player collision
		if (boxCollision(player, enemies[i])) {
			const now = Date.now();
			if (now - lastDamageTime > damageCooldown && !shield) {
				player.health -= 30;
				lastDamageTime = now;
				if (enemies[i].x < player.x) player.x += 20;
				else player.x -= 20;
				if (player.health < 0) player.health = 0;
			} else if (now - lastDamageTime > damageCooldown && shield) {
				player.force -= 30;
				lastDamageTime = now;
				if (enemies[i].x < player.x) player.x += 20;
				else player.x -= 20;
				if (player.force < 0) player.force = 0;
			}
		}
	}

	// Enemy bullets update
	for (let i = enemyBullets.length - 1; i >= 0; i--) { // NEW
		enemyBullets[i].update(delta);

		if(enemyBullets [i].distanceTraveled >= enemyBullets[i].range){
			enemyBullets.splice(i,1);
			continue;
		}

		if(boxCollision(player,{
			x:enemyBullets [i].x,
			y:enemyBullets [i].y,
			width: 20,
			height: 5
		}))
		{
			player.health -= 20;
			enemyBullets.splice(i,i);
		}
	}

	// Saber & shield
	if (saber) {
		saber.update(delta);
		if (!saber.active) saber = null;
	}
	if (shield) {
		shield.update(delta);
		if (!shield.active) shield = null;
	}

	// Bullets update & remove
	for (let i = bullets.length - 1; i >= 0; i--) {
		bullets[i].update(delta);
		if (bullets[i].distanceTraveled >= bullets[i].range) bullets.splice(i, 1);
	}
}

function drawGame() {
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	player.draw();
	if (shield) shield.draw(ctx);
	if (saber) saber.draw(ctx);

	enemies.forEach(e => e.draw());
	enemyBullets.forEach(b => b.draw(ctx));
	bullets.forEach(b => b.draw(ctx));
	drawCrosshair(ctx, mouse.x, mouse.y);
}

function gameLoop(timestamp) {
	let frameTime = timestamp - lastTime;
	if (frameTime > 1000) frameTime = 1000;
	lastTime = timestamp;
	accumulator += frameTime;

	while (accumulator >= timestep) {
		updateGame(timestep / 1000);
		accumulator -= timestep;
	}

	drawGame();
	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
