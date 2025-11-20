// ========================
// 60 FPS fixed-timestep game
// ========================
const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

// ------------------------
// Globals / debug
// ------------------------
let frame = 0;
let framesThisSecond = 0;

// ------------------------
// PLAYER
// ------------------------
class Player {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		this.speed = 300;      
		this.velocityY = 0;
		this.gravity = 2000;   
		this.jumpForce = 900;  
		this.grounded = false;
		this.jumpCount = 2;

		this.moving = { left: false, right: false };
<<<<<<< Updated upstream
		this.direction = true;
=======
		this.facing = 1;
		this.saberOn = false;        // is the saber currently ignited?
		this.saberIgniting = false;  // are we in the ignite animation?
		this.isBlocking = false;
		this.saberTurningOff = false; // are we playing the saber OFF animation?


>>>>>>> Stashed changes

		this.health = 100;
		this.maxHealth = 100;
		this.force = 100;
		this.maxForce = 100;
<<<<<<< Updated upstream
=======
		this.score = 0;
		this.direction = true;

	    // Animation system
	    this.frameW = 96; 
	    this.frameH = 96;
	    this.scale = 2;

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
				frames: [43,42,41,40,39,38,37,36,35],
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
			},
			saber_ignite: {
			  sheet: "neutral",
			  frames: [62,61,60], // your ignite frames
			  fps: 12
			},
			saber_off: {
			  sheet: "neutral",
			  // use the reverse of your ignite frames (adjust to your real indices)
			  frames: [60,61,62],   // OFF animation, opposite of [62,61,60]
			  fps: 12
			},
			saber_idle: {
			  sheet: "neutral",
			  frames: [60], // usually 1–2 frames of Luke holding saber out
			  fps: 4
			},
			// lightsaber swing (you can tweak these frame indices later)
      saber_attack: {
        sheet: "neutral",
        frames: [76,74,73,72,71,70], // TODO: adjust to your favorite saber frames
        fps: 20

      },
      saber_block: {
			  sheet: "neutral",
			  // TODO: change these to the exact block frames you like
			  frames: [104,105],   // two frames of Luke holding saber up to block
			  fps: 8
			},

      saber_run: {
		    sheet: "neutral",
		    frames: [63,64,65,66,67,68,69,70],
		    fps: 18
		  },

		  saber_jump: {
		    sheet: "neutral",
		    frames: [83,84,85,86,87,90,91,92],
		    fps: 16
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
		this.scale = 2;

	    this.state = "idle";
	    this.frameIndex = 0;
	    this.frameTimer = 0;
>>>>>>> Stashed changes
	}

	update(delta) {
		// Horizontal
		if (this.moving.left && !this.moving.right) this.x -= this.speed * delta;
		if (this.moving.right && !this.moving.left) this.x += this.speed * delta;

		// Gravity / vertical
		this.velocityY += this.gravity * delta;
		this.y += this.velocityY * delta;

<<<<<<< Updated upstream
		// Ground collision
		if (this.y + this.height >= canvas.height) {
			this.y = canvas.height - this.height;
			this.velocityY = 0;
			this.grounded = true;
			this.jumpCount = 2;
		} else {
			this.grounded = false;
		}

		// Keep player within horizontal bounds
		this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

		// Force regen every 15 frames
		if (frame % 15 === 0 && this.force < this.maxForce && !shield) {
			this.force = Math.min(this.maxForce, this.force + 1);
		}
	}
=======
	    // ===========================
	    // HORIZONTAL MOVEMENT
	    // ===========================
	    if (this.moving.left && !this.moving.right) {
	      	this.x -= this.speed * delta;
	      	this.facing = -1;
	    }
	    if (this.moving.right && !this.moving.left) {
	      	this.x += this.speed * delta;
	      	this.facing = 1;
	    }

	    // ===========================
	    // GRAVITY
	    // ===========================
	    this.velocityY += this.gravity * delta;
	    this.y += this.velocityY * delta;


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
	    // PLAYER SCORE
	    // ===========================
	    if (frame % 60 === 0) this.score++;

	   // ===========================
			// STATE & ANIMATION SELECTION
			// ===========================
			const saberSwinging = (saber && saber.active);

			// 1) Saber swing has highest priority
			if (saberSwinging) {
			  this.setState("saber_attack");
			}
			// 2) Igniting saber (E key) – play ignite once
			else if (this.saberIgniting) {
			  this.setState("saber_ignite");
			  const igniteAnim = this.anims.saber_ignite;

			  // when ignite animation finishes, switch to saber_idle
			  if (this.frameIndex === igniteAnim.frames.length - 1 && this.frameTimer === 0) {
			    this.saberIgniting = false;
			    this.saberOn = true;
			    this.setState("saber_idle");
			  }
			}
			// 3) Turning saber OFF – play saber_off once
			else if (this.saberTurningOff) {
			  this.setState("saber_off");
			  const offAnim = this.anims.saber_off;

			  // when OFF animation finishes, go back to normal idle/run/jump
			  if (this.frameIndex === offAnim.frames.length - 1 && this.frameTimer === 0) {
			    this.saberTurningOff = false;
			    this.saberOn = false;
			    // we don’t set a final state here; the code below
			    // will pick idle/run/jump next frame
			  }
			}
			// 4) Saber is ON, but not swinging/igniting/turning off
			else if (this.saberOn) {
			  if (this.isBlocking) {
			    this.setState("saber_block");
			  } else if (!this.grounded) {
			    this.setState("saber_jump");
			  } else if (this.moving.left || this.moving.right) {
			    this.setState("saber_run");
			  } else {
			    this.setState("saber_idle");
			  }
			}
			// 5) Blaster shooting (state already chosen in mousedown)
			else if (this.isShooting) {
			  // keep whatever shoot_* state mouse set
			}
			// 6) Normal movement (no saber, not shooting)
			else {
			  if (!this.grounded) this.setState("jump");
			  else if (this.moving.left || this.moving.right) this.setState("run");
			  else this.setState("idle");
			}


			// ===========================
			// ANIMATION FRAME ADVANCE
			// ===========================
			let anim = this.anims[this.state] || this.anims.idle;

			this.frameTimer += delta * 1000; // ms
			if (this.frameTimer >= 1000 / anim.fps) {
			  this.frameTimer = 0;
			  this.frameIndex = (this.frameIndex + 1) % anim.frames.length;
			}


  	}
>>>>>>> Stashed changes

	draw() {
		// Player
		ctx.fillStyle = "lime";
		ctx.fillRect(this.x, this.y, this.width, this.height);

		// HUD
		ctx.font = "18px monospace";
		ctx.fillStyle = "white";
		ctx.fillText(`HP: ${this.health}/${this.maxHealth}`, 10, 22);
		ctx.fillText(`Force: ${this.force}/${this.maxForce}`, 10, 42);
	}
}

<<<<<<< Updated upstream
const player = new Player(100, 100, 50, 50);
=======
const player = new Player(100, 100, 180, 180);
>>>>>>> Stashed changes

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
		  if (!player.saberOn) return;          // require ignite first
		  if (now - lastSwing < attackSpeed) return;
		  lastSwing = now;
		  saber = new Lightsaber(player, player.direction);
		  break;
		case "q":
			if (!shield && player.force >= 50) shield = new ForceShield(player);
			break;
		case "f":
	  // start blocking only if saber is already on and not in the middle of ignite
	  if (player.saberOn && !player.saberIgniting) {
	    player.isBlocking = true;
	  }
	  break;
	  // case "e":
		// case "E": {
		//   // If saber is completely off and not animating, IGNITE
		//   if (!player.saberOn && !player.saberIgniting && !player.saberTurningOff) {
		//     player.saberIgniting = true;
		//     player.saberTurningOff = false;
		//     player.setState("saber_ignite");
		//     player.frameIndex = 0;
		//     player.frameTimer = 0;
		//   }
		//   // If saber is on and not already turning off, play OFF animation
		//   else if (player.saberOn && !player.saberIgniting && !player.saberTurningOff) {
		//     player.saberTurningOff = true;
		//     player.setState("saber_off");
		//     player.frameIndex = 0;
		//     player.frameTimer = 0;
		//   }
		//   break;
		// }
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

    case "e":
      if (!player.saberOn && !player.saberIgniting) {
        // turning ON → play ignite
        player.saberIgniting = true;
        player.setState("saber_ignite");
        player.frameIndex = 0;
      } else if (player.saberOn && !player.saberIgniting) {
        // turning OFF → just go back to normal idle/run/jump
        player.saberOn = false;
      }
      break;

    case "f":
      // stop blocking when F is released
      player.isBlocking = false;
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
<<<<<<< Updated upstream
=======
		this.speed = speed; 
		this.range = range; 
>>>>>>> Stashed changes
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

		this.length = 70;
		this.width = 10;
		this.swingSpeed = 7; 
		this.direction = direction;
		this.active = true;
		
		if (direction) {
			this.angle = -Math.PI / 3;
			this.endAngle = Math.PI / 3;
		} else {
			this.angle = Math.PI + Math.PI / 3;
			this.endAngle = Math.PI - Math.PI / 3;
		}
	}

	update(delta) {
		if (!this.active) return;

		const step = this.swingSpeed * delta;

		if (this.direction) {
			this.angle += step;
			if (this.angle >= this.endAngle) this.active = false;
		} else {
			this.angle -= step;
			if (this.angle <= this.endAngle) this.active = false;
		}
		// Follow Luke's hand (no hitbox changes)
		this.pivotX = this.player.x + this.player.width * (this.player.direction ? 0.85 : 0.15);
		this.pivotY = this.player.y + this.player.height * 0.45;
		
		//-----------------------------------
		// 1) SABER HITS ENEMIES
		//-----------------------------------
		for (let i = enemies.length - 1; i >= 0; i--) {
			const e = enemies[i];

			if (this.checkHit(e)) {
				enemies.splice(i, 1); // kill enemy
			}
		}

		//-----------------------------------
		// 2) SABER DEFLECTS ENEMY BULLETS
		//-----------------------------------
		for (let i = enemyBullets.length - 1; i >= 0; i--) {
			const b = enemyBullets[i];

			if (this.checkHit(b)) {
				// reflect bullet back at enemy
				b.dx *= -1;
				b.dy *= -1;
			}
		}
	}

		// Saber hit detection (rectangle sweep)
	checkHit(obj) {
		const saberX2 = this.pivotX + Math.cos(this.angle) * this.length;
		const saberY2 = this.pivotY + Math.sin(this.angle) * this.length;

		// simple distance test (fast and safe)
		const dist = Math.hypot(
			obj.x + obj.width / 2 - saberX2,
			obj.y + obj.height / 2 - saberY2
		);

		return dist < 40; // adjust swing hit size here
	}


	draw(ctx) {
		if (!this.active) return;
		
		ctx.save();
		ctx.translate(pivotX, pivotY);
		ctx.rotate(this.angle);
		
		ctx.fillStyle = "cyan";
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
