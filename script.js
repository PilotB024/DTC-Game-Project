// Team Roles:
	// Paul Braden: Player Controls/Abilities, Core Game Functionality, In-Game UI
	// Matthew Strickland: Enemy Design, Power-Ups
	// Dakotta Bhatti: Sprites, Level Design, Enemy Design
	// Lindsey Jacobsen: Sound, Website Design

// GitHub Repo: https://github.com/PilotB024/DTC-Game-Project

// Assets:
	// Music: 		https://freesound.org/people/solarpsychedelic/sounds/748203/
	// Background: 	https://picryl.com/media/space-stars-star-wars-backgrounds-textures-106f3e
	// Sprites: 	https://www.spriters-resource.com/snes/superstarwars2theempirestrikesback/asset/31607/,
	// 				https://www.spriters-resource.com/snes/superstarwars/asset/45665/,
	// 				https://www.spriters-resource.com/game_boy_advance/starwarstrilogyapprenticeoftheforce/asset/137487/,
	// 				https://www.spriters-resource.com/snes/superstarwars3returnofthejedi/asset/11123/

// ChatGPT:
	// Paul Braden: 		https://chatgpt.com/share/692e358c-53f4-8004-b50c-066a52906e8f, 
	//						https://chatgpt.com/share/692e35b3-60a8-8004-bc3b-d6d75763fed1, 
	//						https://chatgpt.com/share/692e35e9-d060-8004-8673-fb0ccedbfe10
	// Lindsey Jacobsen: 	https://chatgpt.com/share/6932389d-a098-8000-9c70-1495f2ad4807
	// Dakotta Bhatti: 		https://chatgpt.com/share/69331cbe-692c-8003-9f3f-97f9a06b57a2,
	//						https://chatgpt.com/share/69331f06-b3b4-8003-bbde-5914f126359e
	// Matthew Strickland: 	 
	// We used ChatGPT to help troublshoot issues with the game and work out how to add new features.

// Logic Steps:
// 1. Listen for start button click.
// 2. When the start button is clicked, hide the start popup, begin playing the music, and start the game loop.
// 3. Create the player object.
// 4. Call update game to update the entire game state each frame. Frame rate is locked to 60 FPS.
// 5. Update player state depending on player input and interaction from enemies.
// 6. Enemies are spawned on a timer. Spawn an enemy if the timer allows it. Enemies move from left to right and shoot at the player.
// 7. Check for any collisions, and apply damage to player and enemies accordingly.
// 8. Mark enemies and bullets for deletion if they run off the screen or collide with another object.
//	  Splice them out at the end of the frame to delete them.
// 9. Draw game updates onto the canvas.
// 10. Request another animation frame as long as the player's health is above zero.
// 11. If the player has died display the game over popup and give it the player's final score.
// 12. If the player presses the restart button the game resets and starts from the beginning.

const canvas = document.getElementById("display"); // Save the canvas to a variable
const ctx = canvas.getContext("2d"); // Get canvas coordinate system
const lukeImg = new Image(); // Create variable for player sprite
lukeImg.src = "./img/luke1.png"; // Assign player sprite file


// Globals
let frame = 0; // Tracks the frame we are on
const LUKE_FRAME_W = 48; // Player sprite width
const LUKE_FRAME_H = 64; // Player sprite height
let lukeCol = 0; // Start on first sprite frame
let lukeRow = 0;

lukeImg.onload = () => console.log("Luke loaded"); // Sprite found
lukeImg.onerror = () =>
	console.error("Bad path:", new URL(lukeImg.src, document.baseURI).href); // Sprite not found

// Hide mouse cursor when it enters the canvas
canvas.addEventListener("mouseenter", () => {
  	canvas.style.cursor = "none";
});

// Show cursor when mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  	canvas.style.cursor = "default";
});

// Player Class
class Player {
  	constructor(x, y, width, height) { // Constructor takes starting position and width/height
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		// Movement
		this.speed = 300; // Horizontal movement speed
		this.velocityY = 0; // Jump Velocity
		this.gravity = 2000; // Gravitational Force
		this.jumpForce = 900; // Jump Acceleration
		this.grounded = false; // Boolean detects if player is on the ground
		this.jumpCount = 2; // Player can perform a double jump
		this.moving = { left: false, right: false }; // Player cannot be move left and right simultaneously

		// Stats
		this.health = 100; // Player health
		this.maxHealth = 100; // Max player health
		this.force = 100; // Player force meter, used for abilities like double jump and shield
		this.maxForce = 100; // Max amount of force
		this.score = 0; // Player score, ticks up every second and when you kill enemies
		this.direction = true; // Direction player is facing; true = right and false = left;

	    // Animation system
	    this.frameW = 96; 
	    this.frameH = 96;
	    this.scale = 1.3;

		// Defines animation frames for each player action
		this.anims = {
		  	idle: {
				sheet: "neutral",
				frames: [0],
				fps: 4
			},

			run: {
				sheet: "neutral",
				frames: [11,10,9,8,7,6,5,4],
				fps: 16
			},

			jump: {
				sheet: "neutral",
				frames: [30,31,32,33,34,35],
				fps: 10
			},

			shoot_straight: {
				sheet: "neutral",
				frames: [12,13],
				fps: 12
			},

			shoot_run: {
				sheet: "neutral",
				frames: [11,10,9,8],
				fps: 16
			},

			shoot_up: {
				sheet: "neutral",
				frames: [14,15],
				fps: 12
			},

			shoot_down: {
				sheet: "neutral",
				frames: [16,17],
				fps: 12
			}
		};

		// animation playback state
		this.state = "idle";
		this.frame = 0;
		this.timer = 0;

		// your frame size (keep using your current values)
		this.frameW = 96;
		this.frameH = 96;

		// your scaling stays as-is
		this.scale = 1.3;

	    this.state = "idle";
	    this.frameIndex = 0;
	    this.frameTimer = 0;
	}

	// Updates player state for use by sprite
	setState(next) {
		if (this.state !== next) {
			this.state = next;
			this.frameIndex = 0;
			this.frameTimer = 0;
		}
	}	

  	// Called by updateGame to update the player each frame
  	update(delta) {
  	    // Shooting Timer
	    if (this.isShooting) {
	      	this.shootTimer -= delta;
	      	if (this.shootTimer <= 0) {
	        	this.isShooting = false; // Allow Movement states when player can no longer shoot
	      	}
	    }

	    // Horizontal Movement
	    if (this.moving.left && !this.moving.right) {
	      	this.x -= this.speed * delta;
	      	this.direction = false;
	    }
	    if (this.moving.right && !this.moving.left) {
	      	this.x += this.speed * delta;
	      	this.direction = true;
	    }

	    // Gravity
	    this.velocityY += this.gravity * delta;
	    this.y += this.velocityY * delta;


	    // Ground Collision
	    if (this.y + this.height >= canvas.height) {
	      	this.y = canvas.height - this.height;
	      	this.velocityY = 0;
	      	this.grounded = true;
	      	this.jumpCount = 2;
	    } else {
	      	this.grounded = false;
	    }

	    // Prevent player from running off screen
	    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

	    // Force Meter Regeneration
	    // Force increases by 1 every 15th frame as long as abilities are not active
	    if (frame % 15 === 0 && this.force < this.maxForce && !shield) {
      		this.force = Math.min(this.maxForce, this.force + 1);
    	}

    	// Score increases by 1 every 60 frames
    	if (frame % 60 === 0) this.score++;

	    // Animation States
	    if (!this.isShooting) {
		    if (!this.grounded) this.setState("jump");
		    else if (this.moving.left || this.moving.right) this.setState("run");
		    else this.setState("idle");
		}

   		// Update Animation Using State
		let anim = this.anims[this.state];
		// Safety Fallback for Missing State
		if (!anim) anim = this.anims.idle;

		this.frameTimer += delta * 1000; // Convert Delta from seconds to ms
		if (this.frameTimer >= 1000 / anim.fps) {
		  	this.frameTimer = 0;
		  	this.frameIndex = (this.frameIndex + 1) % anim.frames.length;
		}
  	}

  	draw() {
		// Draw Luke
		if (!lukeImg.complete) return; // Don't draw if missing sprite

		let anim = this.anims[this.state];
		if (!anim) anim = this.anims.idle;

		const index = anim.frames[this.frameIndex];


		// Sprite sheet has 10 columns
		const COLS = 10;

		// Convert frame index to sprite sheet coordinates
		const sx = (index % COLS) * this.frameW;
		const sy = Math.floor(index / COLS) * this.frameH;

    	ctx.save();

	    if (this.direction === false) {
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
	    ctx.fillText(`Score: ${this.score}`, 10, 62);
  	}
}

// Create player object upon startup
let player = new Player(100, 100, 120, 120);

// Additional Globals
let lastSwing = 0; // Time of last lightsaber swing
let attackSpeed = 400; // Cooldown time for lightsaber in ms
let saber = null; // Variable to contain lightsaber object
let shield = null; //  Variable to contain shield object

// Prevent arrow keys from interacting with webpage
window.addEventListener("keydown", (e) => {
	const blocked = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
	if (blocked.includes(e.key)) e.preventDefault();
});

// Player Input Handling
// Key Press
window.addEventListener("keydown", (e) => {
	switch (e.key.toLowerCase()) { 
		case "a": // Move Left
		case "arrowleft":
			player.moving.left = true;
			player.direction = false;
			break;
		case "d": // Move Right
		case "arrowright":
			player.moving.right = true;
			player.direction = true;
			break;
		case "w": // Jump
		case "arrowup":
			if (player.grounded && player.jumpCount > 1) { // Initial Jump
				player.velocityY = -player.jumpForce;
				player.grounded = false;
				player.jumpCount--;
			} else if (player.jumpCount > 0 && player.force >= 20) { // Double Jump
				player.velocityY = -player.jumpForce;
				player.force -= 10;
				player.jumpCount--;
			}
			break; // Breaks prevent overlapping actions
		case " ": // Lightsaber Swing
			const now = Date.now();
			if (now - lastSwing < attackSpeed) return; // Skip if on cooldown
			lastSwing = now;
			saber = new Lightsaber(player, player.direction);
			break;
		case "q": // Shield
			if (!shield && player.force >= 50) shield = new ForceShield(player);
			break;
	}
});

// Key Release
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

// Player + Enemy Bullets
let bullets = []; // Array stores every player bullet
let lastShotTime = 0; // Time of last shot
const fireRate = 200; // Cooldown until next shot in ms

const enemyBullets = []; // Seperate array for enemy bullets

// Bullet Class
class Bullet {
	constructor(x, y, targetX, targetY, speed, range) {
		this.x = x; // Starting position
		this.y = y;
		this.speed = speed; // Speed bullet travels at
		this.range = range; // How far bullet travels
		this.distanceTraveled = 0; // Pixels traveled
		this.markedForDeletion = false; // Marks bullets that aren't being used

		const diffX = targetX - x; // Horizontal distance between start and target
		const diffY = targetY - y; // Vertical distance between start and target
		const length = Math.sqrt(diffX * diffX + diffY * diffY) || 1; // True distance from start to target
		this.dx = diffX / length; // Horizontal Slope
		this.dy = diffY / length; // Vertical Slope
	}

	// Move bullet along path for a set amount each frame
	update(delta) {
		const distance = this.speed * delta;
		this.x += this.dx * distance;
		this.y += this.dy * distance;
		this.distanceTraveled += distance;
	}

	// Draw the bullet each frame, making sure to angle it to match trajectory
	draw(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(Math.atan2(this.dy, this.dx));
		ctx.fillStyle = "red";
		ctx.fillRect(0, -2, 20, 5);
		ctx.restore();
	}
}

// Listen for mouse clicks to fire bullet
canvas.addEventListener("mousedown", (event) => {
	const now = Date.now();
	if (now - lastShotTime < fireRate || saber) return; // Cannot fire while in cooldown or other weapons are active
	lastShotTime = now;

	// Aim Angle for Sprite
	const originX = player.x + player.width  / 2;
	const originY = player.y + player.height * 0.4; // roughly gun height

	const dx = event.offsetX - originX;
	const dy = event.offsetY - originY;
	const angle = Math.atan2(dy, dx); // 0 = right, negative = up, positive = down

	// Choose animation based on angle
	const moving = player.moving.left || player.moving.right;

	// Thresholds
	const UP_THRESHOLD   = -0.6; // aim clearly upward  (~ -34°)
	const DOWN_THRESHOLD =  0.4; // aim clearly downward (~ +23°)

	let animName;
	if (angle < UP_THRESHOLD) {
		animName = "shoot_up";
	} else if (angle > DOWN_THRESHOLD) {
		animName = "shoot_down";
	} else if (moving) {
		animName = "shoot_run";
	} else {
		animName = "shoot_straight";
	}

	player.setState(animName);
	player.isShooting = true;
	player.shootTimer = 0.2; // show shoot anim for ~0.2 seconds

	// Create a new bullet object and add it to the array
	bullets.push(new Bullet(
		originX,
		originY,
		event.offsetX,
		event.offsetY,
		1200,
		600
	));
});

// Listen for the location of the mouse on screen
const mouse = { x: 0, y: 0 };
canvas.addEventListener("mousemove", (event) => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;
});


// Draws a crosshair to replace the normal cursor
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

// Lightsaber
class Lightsaber {
	constructor(player, direction) {
		this.player = player; // Grab player for ease of use
		this.length = 60; // Lightsaber dimensions
		this.width = 10;
		this.swingSpeed = 6; // Speed at which saber tilts
		this.direction = direction; // Direction player is facing determines lightsaber direction
		this.active = true; // True when a lightsaber object exists
		
		if (direction) { // Defines angles for the left and right swing
			this.angle = -Math.PI / 4;
			this.endAngle = Math.PI / 4;
		} else {
			this.angle = Math.PI + Math.PI / 4;
			this.endAngle = Math.PI - Math.PI / 4;
		}
	}

	// Update saber's progress through a swing each frame
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

	// Draw the lightsaber each frame
	draw(ctx) {
		if (!this.active) return; // Cannot draw lightsaber if it doesn't exist
		ctx.save();

		const pivotX = this.player.x + (this.direction ? this.player.width : 0);
		const pivotY = this.player.y + this.player.height / 2;

		ctx.translate(pivotX, pivotY); // Pivots around player
		ctx.rotate(this.angle);
		ctx.fillStyle = "red";

		ctx.fillRect(0, -this.width / 2, this.length, this.width);
		ctx.restore();
	}
}

// Shield
class ForceShield {
	constructor(player) {
		this.player = player; // Grab player for ease of use
		this.radius = 50; // Size of shield bubble
		this.cost = 1; // Cost per interval
		this.costInterval = 1000 / 5; // 5 intervals per second
		this.timer = 0; // Time shield is active for
		this.active = true; // True when shield object exists
	}

	// Apply the cost of the shield each frame, if applicable
	update(delta) {
		if (!this.active) return; // Skip if no shield is present
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

	// Draw the sheild over the player each frame
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

// Enemies
let enemies = []; // Each active enemy is stored in this array
let enemyTimer = 0; // Time since last enemy spawn
let enemyInterval = 3000; // Time interval for when enemies spawn

// Enemy
class Enemy {
	constructor(x, y, width, height) {
		this.x = x; // Spawn Position
		this.y = y;
		this.width = width; // Dimensions
		this.height = height;
		this.speed = 180; // Horizontal movement speed
		this.angle = 0;
		this.amplitude = 2; // How far they bob up and down
		this.frequency = 0.09; // How often they bob
		this.markedForDeletion = false; // Marks enemies that aren't being used
		this.shotCooldown = 1500;  // Time between enemy shots
		this.lastShot = 0;  // Time of last enemy shot
		this.health = 50; // Enemy health
	}

	// Update enemy each frame
	update(delta) {
		// Enemy Movement
		this.x -= this.speed * delta;
		this.y += Math.sin(this.angle) * this.amplitude;
		this.angle += this.frequency;
		if (this.x + this.width < 0) this.markedForDeletion = true;

		// Enemy Attacks
		const now = Date.now()
		if(now - this.lastShot > this.shotCooldown){
			enemyBullets.push(new Bullet(
				this.x + this.width /2,
				this.y + this.height /2,
				player.x + player.width /2,
				player.y + player.height /2,
				500,
				500
				));
			this.lastShot = now;
		}
	}

	// Draw the enemy each frame
	draw() {
		ctx.fillStyle = "red";
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

// Global Collision Detection Function 
function boxCollision(a, b) { // Takes two objects and checks if their coordinates overlap
	if (!a || !b) return false;
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

// How often damage can be dealt
let damageCooldown = 1000;
let lastDamageTime = 0;

// Game Loop
const timestep = 1000 / 60; // Set FPS
let lastTime = performance.now();
let accumulator = 0;

// Called to update the entire game each frame
function updateGame(delta) {
	frame++; // Increment frame count

	player.update(delta); // Update player

	// Spawn Enemies
	enemyTimer += timestep;
	if (enemyTimer > enemyInterval) {
		let y = Math.random() * (canvas.height / 3);
		enemies.push(new Enemy(canvas.width, y, 50, 50));
		enemyTimer = 0;
	}

	// Update Enemies
	for (let i = enemies.length - 1; i >= 0; i--) {
		if (!enemies[i]) continue;
		enemies[i].update(delta);

		// Player and Enemy Body Collision
		if (boxCollision(player, enemies[i])) {
			const now = Date.now();
			if (now - lastDamageTime > damageCooldown && !shield) {
				player.health -= 20;
				lastDamageTime = now;
				if (enemies[i].x < player.x) player.x += 20;
				else player.x -= 20;
				if (player.health < 0) player.health = 0;
			} else if (now - lastDamageTime > damageCooldown && shield) {
				player.force -= 20;
				lastDamageTime = now;
				if (enemies[i].x < player.x) player.x += 20;
				else player.x -= 20;
				if (player.force < 0) player.force = 0;
			} 
		}
	}

	// Update Enemy Bullets
	for (let i = enemyBullets.length - 1; i >= 0; i--) {
		enemyBullets[i].update(delta);

		if(enemyBullets[i].distanceTraveled >= enemyBullets[i].range){
			enemyBullets.splice(i, 1);
			continue;
		}

		// Player and Enemy Bullet Collision
		if (boxCollision(player, {
			x:enemyBullets [i].x,
			y:enemyBullets [i].y,
			width: 20,
			height: 5
		})) 
		{
			if (!shield) {
				player.health -= 5;
				if (player.health < 0) player.health = 0;
				enemyBullets.splice(i, 1);
			} else {
				player.force -= 5;
				if (player.force < 0) player.force = 0;
				enemyBullets.splice(i, 1);
			}
		}
	}

	// Update Saber
	if (saber) {
		saber.update(delta);
		if (!saber.active) saber = null;
	}

	// Update Shield
	if (shield) {
		shield.update(delta);
		if (!shield.active) shield = null;
	}

	// Update Player Bullets
	for (let i = bullets.length - 1; i >= 0; i--) {
		bullets[i].update(delta);

		if (bullets[i].distanceTraveled >= bullets[i].range) {
			bullets[i].markedForDeletion = true;
			continue;
		}

		// Player Bullet and Enemy Collision
		for (let j = 0; j <= enemies.length - 1; j++) {
			if (boxCollision(enemies[j], {
				x: bullets[i].x,
				y: bullets[i].y,
				width: 20,
				height: 5
			}))
			{
				enemies[j].health -= 25;
				bullets[i].markedForDeletion = true;
				if (enemies[j].health <= 0) enemies[j].markedForDeletion = true;
				continue;
			}
		}
	}

	// Remove Enemies Marked for Deletion
	for (let i = enemies.length - 1; i >= 0; i--) {
		if (enemies[i].markedForDeletion === true) {
			enemies.splice(i, 1);
			player.score += 20;
		}
	}

	// Remove Player Bullets Marked for Deletion
	for (let i = bullets.length - 1; i >= 0; i--) {
    	if (bullets[i].markedForDeletion) {
        	bullets.splice(i, 1);
    	}
	}
}

// Draw each frame of the game
function drawGame() {
	ctx.fillStyle = "#000"; // Fill Canvas w/ Black Background
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	player.draw(); // Draw Player
	if (shield) shield.draw(ctx); // Draw shield if active
	if (saber) saber.draw(ctx); // Draw lightsabe if active

	enemies.forEach(e => e.draw()); // Draw each enemy
	enemyBullets.forEach(b => b.draw(ctx)); // Draw each enemy bullet
	bullets.forEach(b => b.draw(ctx)); // Draw each player bullet
	drawCrosshair(ctx, mouse.x, mouse.y); // Draw crosshair
}

// Recursive GameLoop function initializes each frame 
function gameLoop(timestamp) {
	let frameTime = timestamp - lastTime; // Check if it's time for a new frame to be generated
	if (frameTime > 1000) frameTime = 1000;
	lastTime = timestamp;
	accumulator += frameTime;

	while (accumulator >= timestep) {
		updateGame(timestep / 1000); // Updates Game State
		accumulator -= timestep;
	}

	drawGame(); // Draws Frame

	if (player.health > 0) { // Loop continues as long as player is alive
		requestAnimationFrame(gameLoop);
	} else {
		gameOver();
	}
}

// Displays Game Over Popup
function gameOver() {
	document.getElementById("gameOver").style.display = "flex";
	document.getElementById("score").innerHTML = `Score: ${player.score}`;
}

// Listens for restart button press and resets game state
restartButton.addEventListener("click", function () {
	document.getElementById("gameOver").style.display = "none"; // Hides Popup

	player = new Player(100, 100, 120, 120); // Creates a new player
	bullets = []; // Clears Bullets
	enemies = []; // Clears Enemies

	requestAnimationFrame(gameLoop); // Initializes a new frame
});

// Listens for start button press and starts game loop and audio
startButton.addEventListener("click", function () {
    document.getElementById("startPopup").style.display = "none"; // Hides Popup

    // Get and Play Music
    let bgm = document.getElementById("bgm");
    if (bgm) {
        bgm.loop = true;
        bgm.play();
    }

    // Start Game
    requestAnimationFrame(gameLoop);
});






