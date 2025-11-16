const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

ctx.fillRect(0, 0, 200, 100);

class Player {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		this.speed = 7;
		this.velocityY = 0;
		this.gravity = 1;      // pull down strength
		this.jumpForce = 20;   // how powerful the jump is
		this.grounded = false;
		this.jumpCount = 2;

		this.moving = { left: false, right: false };
		this.direction = true;

		this.health = 100;
		this.maxHealth = 100;
		this.force = 100;
		this.maxForce = 100;
	}

	update() {
		frame++;
		// --- Horizontal movement ---
		if (this.moving.left && !this.moving.right) this.x -= this.speed;
		if (this.moving.right && !this.moving.left) this.x += this.speed;

		// --- Apply gravity ---
		this.velocityY += this.gravity;
		this.y += this.velocityY;

		// --- Ground collision ---
		if (this.y + this.height >= canvas.height) {
			this.y = canvas.height - this.height; // snap to ground
			this.velocityY = 0;
			this.grounded = true;
			this.jumpCount = 2;
		} else {
			this.grounded = false;
		}

		// --- Keep player within horizontal bounds ---
		this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

		if (this.force < this.maxForce && frame % 15 == 0) this.force += 1;
	}

	draw() {
		ctx.fillStyle = "lime";
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.font = "24px sans-serif";
		ctx.strokeText(`Health: ${this.health}/${this.maxHealth}`, 10, 30);
		ctx.strokeText(`Force: ${this.force}/${this.maxForce}`, 10, 60);
	}
}

const player = new Player(100, 100, 50, 50);

// Input handling
window.addEventListener("keydown", (e) => {
	switch (e.key.toLowerCase()) {
		case "a": 
			player.moving.left = true; 
			player.direction = false;
			break;
		case "d": 
			player.moving.right = true; 
			player.direction = true;
			break;
		case "w":
			if (player.grounded && player.jumpCount > 1) {
				player.velocityY = -player.jumpForce; // jump impulse
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
			console.log(player.direction);
			break;
	}
});

window.addEventListener("keyup", (e) => {
	switch (e.key.toLowerCase()) {
		case "a": player.moving.left = false; break;
		case "d": player.moving.right = false; break;
	}
});

const bullets = [];
class Bullet {
	constructor(x, y, targetX, targetY) {
		this.x = x;
		this.y = y;
		this.speed = 20;
		this.range = 500;
		this.distanceTraveled = 0;

		const diffX = targetX - x;
		const diffY = targetY - y;
		const length = Math.sqrt(diffX * diffX + diffY * diffY);
		this.dx = diffX / length;
		this.dy = diffY / length;
	}

	update() {
		this.x += this.dx * this.speed;
		this.y += this.dy * this.speed;
		this.distanceTraveled += this.speed;
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


let lastShotTime = 0;
const fireRate = 200; // milliseconds between shots (5 per second)

canvas.addEventListener("mousedown", (event) => {
	const now = Date.now();
	if (now - lastShotTime < fireRate) return;

	lastShotTime = now;

	bullets.push(new Bullet(
		player.x + player.width / 2, 
		player.y + player.height / 2, 
		event.offsetX, 
		event.offsetY
	));
});

canvas.addEventListener("mousemove", (event) => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;
});

const mouse = { x: 0, y: 0 };

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

let lastSwing = 0;
let attackSpeed = 400;
let saber = null;
class Lightsaber {
	constructor(player, direction) {
		this.player = player;
		this.length = 60;
		this.width = 10;
		this.swingSpeed = 0.25;
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

	update() {
		if (this.direction) {
			this.angle += this.swingSpeed;
			if (this.angle >= this.endAngle) this.active = false;
		} else {
			this.angle -= this.swingSpeed;
			if (this.angle <= this.endAngle) this.active = false;
		}
	}

	draw(ctx) {
		if (!this.active) return;

		ctx.save();

		// Move pivot to player center
		const pivotX = this.player.x + this.player.width / 2;
		const pivotY = this.player.y + this.player.height / 2;

		ctx.translate(pivotX, pivotY);
		ctx.rotate(this.angle);

		// Draw saber from pivot outward
		ctx.fillStyle = "red";
		ctx.fillRect(0, -this.width / 2, this.length, this.width);

		ctx.restore();
	}
}

const enemies = [];
let enemyTimer = 0;
let enemyInterval = 3000;
class Enemy {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		this.speed = 3; 
		this.angle = 0; // controls the the bobbing
		this.amplitude = 2; // how high it bobs
		this.frequency = 0.09; // how fast it bobs
		this.markedForDeletion = false;
	}

	update() {
		// Move left
		this.x -= this.speed;

		// Bob up and down smoothly
		this.y += Math.sin(this.angle) * this.amplitude;
		this.angle += this.frequency;

		// If off screen to the left, mark for deletion
		if (this.x + this.width < 0) {
			this.markedForDeletion = true;
		}
	}

	draw() {
		ctx.fillStyle = "red";
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

function boxCollision( a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}





    // Check for collision with player
    if (boxCollision(player, enemy)) {
        const now = Date.now();
        if (now - lastDamageTime > damageCooldown) {
            player.health -= 30;
            lastDamageTime = now;

            // Optional: small knockback effect
            if (enemy.x < player.x) player.x += 20;
            else player.x -= 20;

            // Prevent negative health
            if (player.health < 0) player.health = 0;

            console.log(`Player hit! Health: ${player.health}`);
        }
    }
});

let damageCooldown = 1000; // milliseconds between hits
let lastDamageTime = 0;




let frame = 1;
function gameLoop(timestamp) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	player.update();
	player.draw();
	drawCrosshair(ctx, mouse.x, mouse.y);

	enemyTimer += 16.67; // approximate 60fps
	if (enemyTimer > enemyInterval) {
		let y = Math.random() * (canvas.height / 3);

		enemies.push(new Enemy(canvas.width, y, 50, 50)); // spawn from right edge
		enemyTimer = 0;
	}

	// Update & draw enemies
	enemies.forEach((enemy) => {
		enemy.update();
		enemy.draw();
	});

	// Remove enemies marked for deletion
	for (let i = enemies.length - 1; i >= 0; i--) {
		if (enemies[i].markedForDeletion) enemies.splice(i, 1);
	}

	if (saber) {
		saber.update();
		saber.draw(ctx);
		if (!saber.active) saber = null; // remove after swing ends
	}
	
	requestAnimationFrame(gameLoop);

	for (let i = bullets.length - 1; i >= 0; i--) {
		const bullet = bullets[i];
		bullet.update();
		bullet.draw(ctx);

		// remove bullets that exceed range
		if (bullet.distanceTraveled >= bullet.range) {
			bullets.splice(i, 1);
		}
	}
}



gameLoop();