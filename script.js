const canvas = document.getElementById("display");
	const ctx = canvas.getContext("2d");

	ctx.fillRect(0, 0, 200, 100);







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



	class Player {
		constructor(x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;

			this.speed = 7;
			this.velocityY = 0;
			this.gravity = 1;
			this.jumpForce = 20;
			this.grounded = false;
			this.jumpCount = 2;
 this.health = 3;
			this.moving = { left: false, right: false };
		}

		update() {
			if (this.moving.left && !this.moving.right) this.x -= this.speed;
			if (this.moving.right && !this.moving.left) this.x += this.speed;

			this.velocityY += this.gravity;
			this.y += this.velocityY;

			if (this.y + this.height >= canvas.height) {
				this.y = canvas.height - this.height;
				this.velocityY = 0;
				this.grounded = true;
				this.jumpCount = 2;
			} else {
				this.grounded = false;
			}

			this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
		}

		draw() {
			ctx.fillStyle = "lime";
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	}


const enemies = [];
let enemyTimer = 0;
let enemyInterval = 3000;
	const player = new Player(200, 100, 50, 50);

	window.addEventListener("keydown", (e) => {
		switch (e.key.toLowerCase()) {
			case "a": player.moving.left = true; break;
			case "d": player.moving.right = true; break;
			case "w":
				if (player.grounded || player.jumpCount > 0) {
					player.velocityY = -player.jumpForce;
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
	}



// Enemy code
	// boxcollision
function boxCollision(player, enemy) {
    return (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
    );
}







function gameLoop(timestamp) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Player logic
	player.update();
	player.draw();

	// Enemy spawning
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

	requestAnimationFrame(gameLoop);
}

	gameLoop();
