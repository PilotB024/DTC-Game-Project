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
	}

	update() {
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
	}

	draw() {
		ctx.fillStyle = "lime";
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

const player = new Player(100, 100, 50, 50);

// Input handling
window.addEventListener("keydown", (e) => {
	switch (e.key.toLowerCase()) {
		case "a": player.moving.left = true; break;
		case "d": player.moving.right = true; break;
		case "w":
			if (player.grounded || player.jumpCount > 0) {
				player.velocityY = -player.jumpForce; // jump impulse
				player.grounded = false;
				player.jumpCount--;
			}
			break;
	}
});

window.addEventListener("keyup", (e) => {
	switch (e.key.toLowerCase()) {
		case "a": player.moving.left = false; break;
		case "d": player.moving.right = false; break;
	}
});

function gameLoop() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	player.update();
	player.draw();
	requestAnimationFrame(gameLoop);
	const linearGradient = ctx.createLinearGradient(0, 0, 200, 0);

	linearGradient.addColorStop(0, 'red');     // Start color
	linearGradient.addColorStop(0.5, 'yellow'); // Middle color
	linearGradient.addColorStop(1, 'blue');    // End color

	ctx.fillStyle = linearGradient;
}

gameLoop();
