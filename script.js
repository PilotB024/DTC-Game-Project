// ========================// ========================
// 60 FPS fixed-timestep game
// ========================
const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

// ------------------------
// PLAYER SPRITE
// ------------------------
const lukeImg = new Image();
lukeImg.src = "./img/luke1.png";

// --- Stormtrooper sprite sheet ---
const stImg = new Image();
stImg.src = "./img/st.png";
stImg.onload = () => console.log("Stormtrooper loaded");

// ------------------------
// TIE FIGHTER SPRITE SHEET
// ------------------------
const tieImg = new Image();
tieImg.src = "img/tie.png"; // make sure file exists

const TIE_COLS = 4;     // 4 frames across
const TIE_ROWS = 2;     // row 0 = TIE, row 1 = explosion
let TIE_FRAME_W, TIE_FRAME_H;

tieImg.onload = () => {
  TIE_FRAME_W = tieImg.width / TIE_COLS;
  TIE_FRAME_H = tieImg.height / TIE_ROWS;
  console.log("TIE sprite ready");
};

// ------------------------
// RANCOR BOSS SPRITE
// ------------------------
const rancorImg = new Image();
rancorImg.src = "./img/rancor.png";   // <-- match your file path
let RANCOR_FRAME_W, RANCOR_FRAME_H;

rancorImg.onload = () => {
  RANCOR_FRAME_W = rancorImg.width / 6;   // 6 columns
  RANCOR_FRAME_H = rancorImg.height / 3;  // 3 rows
  console.log("Rancor Boss loaded");
};

// ------------------------
// Floating ledges
// ------------------------
const smallLedgeImg = new Image();
smallLedgeImg.src = "./img/ledge.png";

const bigLedgeImg = new Image();
bigLedgeImg.src = "./img/xlledge.png";

// All floating ledges live here
const floatingLedges = [];

// Wait until both ledge images are ready
let ledgesReady = false;
smallLedgeImg.onload = checkLedgesReady;
bigLedgeImg.onload = checkLedgesReady;

function checkLedgesReady() {
  if (smallLedgeImg.complete && bigLedgeImg.complete) {
    ledgesReady = true;
    console.log("Ledges ready");
  }
}

// ------------------------
// BACKGROUND IMAGE
// ------------------------
const bgImg = new Image();
bgImg.src = "./img/background.png";
let bgX = 0;
let backgroundLocked = false;   // <--- add this here (global flag)

bgImg.onload = () => console.log("Background loaded");

// ---------------------------------------
// BACKGROUND DRAW + SCROLL (correct one)
// ---------------------------------------
const bgScale = 0.6;

function drawBackground(delta) {
  if (!bgImg.complete || bgImg.naturalWidth === 0) return;

  const scrollSpeed = 70;
  if (!backgroundLocked) {
    bgX -= scrollSpeed * delta;
  }

  const w = bgImg.width * bgScale;
  const h = bgImg.height * bgScale;

  if (bgX <= -w) bgX += w;

  const y = canvas.height - h;

  ctx.drawImage(bgImg, bgX,     y, w, h);
  ctx.drawImage(bgImg, bgX + w, y, w, h);
}


// ------------------------
// Globals
// ------------------------
let frame = 0;
let framesThisSecond = 0;

// Enemy collections must exist before Stormtrooper / Lightsaber use them
const enemies = [];
const enemyBullets = [];
// DEBUG: frame tester for stormtrooper animation
let testFrameNumber = 0; 


// ------------------------
// Hide cursor on canvas
// ------------------------
canvas.addEventListener("mouseenter", () => {
  canvas.style.cursor = "none";
});
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
    this.prevY = y;
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
    this.score = 0;

    // Shooting
    this.isShooting = false;
    this.shootTimer = 0;

    // Saber state
    this.saberOn = false;
    this.saberIgniting = false;
    this.saberTurningOff = false;
    this.isBlocking = false;

    // Animation system
    this.frameW = 96;
    this.frameH = 96;
    this.scale = 2;

    this.anims = {
      idle: { sheet: "neutral", frames: [0], fps: 4 },
      run:  { sheet: "neutral", frames: [11,10,9,8,7,6,5,4], fps: 16 },
      jump: { sheet: "neutral", frames: [43,42,41,40,39,38,37,36,35], fps: 10 },
      death: { sheet: "neutral", frames: [49,50], fps: 4 },

      shoot_straight: { sheet: "neutral", frames: [12,13], fps: 12 },
      shoot_run:      { sheet: "neutral", frames: [11,10,9,8], fps: 16 },
      shoot_up:       { sheet: "neutral", frames: [14,15], fps: 12 },
      shoot_down:     { sheet: "neutral", frames: [16,17], fps: 12 },

      saber_ignite: { sheet:"neutral", frames:[62,61,60], fps:12 },
      saber_off:    { sheet:"neutral", frames:[60,61,62], fps:12 },
      saber_idle:   { sheet:"neutral", frames:[60], fps:4 },

      saber_attack: { sheet:"neutral", frames:[76,74,73,72,71,70], fps:20 },
      saber_block:  { sheet:"neutral", frames:[104,105], fps:8 },
      saber_run:    { sheet:"neutral", frames:[63,64,65,66,67,68,69,70], fps:18 },
      saber_jump:   { sheet:"neutral", frames:[83,84,85,86,87,90,91,92], fps:16 }
    };

    this.state = "idle";
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  getHitBox() {
    return {
      x: this.x + this.width * 0.28,
      y: this.y + this.height * 0.15,
      width: this.width * 0.42,
      height: this.height * 0.80
    };
  }

  setState(next) {
    if (this.state !== next) {
      this.state = next;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  update(delta) {
    // shooting timer
    if (this.isShooting) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0) this.isShooting = false;
    }

    // death check
    // if (this.health <= 0) {
    //   this.setState("death");
    //   return; // stop all movement
    // }


    // horizontal movement
    if (this.moving.left && !this.moving.right) {
      this.x -= this.speed * delta;
      this.facing = -1;
      this.direction = false;
    }
    if (this.moving.right && !this.moving.left) {
      this.x += this.speed * delta;
      this.facing = 1;
      this.direction = true;
    }

    // gravity
    this.velocityY += this.gravity * delta;
    this.y += this.velocityY * delta;

    // ground collision (only handles ground)
    if (this.y + this.height >= canvas.height) {
      this.y = canvas.height - this.height;
      this.velocityY = 0;
      this.grounded = true;
      this.jumpCount = 2;
    }

    // clamp horizontal
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

    // force regen
    if (frame % 15 === 0 && this.force < this.maxForce && !shield) {
      this.force = Math.min(this.maxForce, this.force + 1);
    }

    // score
    if (frame % 60 === 0) this.score++;

    // ==========================
    // STATE & ANIMATION
    // ==========================
    const saberSwinging = (saber && saber.active);

    if (saberSwinging) {
      this.setState("saber_attack");
    } else if (this.saberIgniting) {
      this.setState("saber_ignite");
      const igniteAnim = this.anims.saber_ignite;
      if (this.frameIndex === igniteAnim.frames.length - 1 && this.frameTimer === 0) {
        this.saberIgniting = false;
        this.saberOn = true;
        this.setState("saber_idle");
      }
    } else if (this.saberTurningOff) {
      this.setState("saber_off");
      const offAnim = this.anims.saber_off;
      if (this.frameIndex === offAnim.frames.length - 1 && this.frameTimer === 0) {
        this.saberTurningOff = false;
        this.saberOn = false;
      }
    } else if (this.saberOn) {
      if (this.isBlocking)       this.setState("saber_block");
      else if (!this.grounded)   this.setState("saber_jump");
      else if (this.moving.left || this.moving.right) this.setState("saber_run");
      else                       this.setState("saber_idle");
    } else if (this.isShooting) {
      // keep chosen shoot_* state
    } else {
      if (!this.grounded)                 this.setState("jump");
      else if (this.moving.left || this.moving.right) this.setState("run");
      else                               this.setState("idle");
    }

    // ANIMATION ADVANCE
    const anim = this.anims[this.state] || this.anims.idle;
    this.frameTimer += delta * 1000;
    if (this.frameTimer >= 1000 / anim.fps) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % anim.frames.length;
    }
  }

  draw() {
    if (!lukeImg.complete) return;

    const anim = this.anims[this.state] || this.anims.idle;
    const index = anim.frames[this.frameIndex];

    const COLS = 10;
    const sx = (index % COLS) * this.frameW;
    const sy = Math.floor(index / COLS) * this.frameH;

    ctx.save();
    if (this.facing === -1) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(lukeImg, sx, sy, this.frameW, this.frameH,
                    0, 0, this.width, this.height);
    } else {
      ctx.drawImage(lukeImg, sx, sy, this.frameW, this.frameH,
                    this.x, this.y, this.width, this.height);
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

// -----------------------------------------------------
// STORMTROOPER SPRITE CONFIG (st.png)
// -----------------------------------------------------
const ST_COLS = 12;     // 12 frames per row
const ST_FRAME_W = 96;
const ST_FRAME_H = 96;

// -----------------------------------------------------
// STORMTROOPER ANIMATION CONFIG (Luke-style system)
// -----------------------------------------------------
const trooperAnims = {
  walk: {
    frames: [13,14,15,16,17,18,19,20,22,24,25,26,27,28,29,30,31,32],
    fps: 12
  },

  run: {
    frames: [34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50],
    fps: 14
  },

  aim: {
    frames: [50,51,53,54,55,56,57,58,59,60,62,63,64],
    fps: 10
  },

  shoot: {
    frames: [69,70,71,72,73,74,76,77,78,79],
    fps: 10
  },

  crouch: {
    frames: [95,96,97,121,122,123],
    fps: 10
  },

  hurt: {
    frames: [84,85,86,87,88,89,90,91,92,93,94,95],
    fps: 12
  },

  death: {
    frames: [148,149,150,151,152,153,154,155,156,157,158],
    fps: 12
  }
};

// -----------------------------------------------------
// STORMTROOPER BULLET
// -----------------------------------------------------
class StormtrooperBullet {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;

    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;

    this.dx = dx / len;
    this.dy = dy / len;

    this.speed = 450;
    this.range = 0;
    this.distanceTraveled = 0;
  }

  update(delta) {
    const step = this.speed * delta;
    this.x += this.dx * step;
    this.y += this.dy * step;
    this.distanceTraveled += step;
  }

  draw(ctx) {
    ctx.save();

    const angle = Math.atan2(this.dy, this.dx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Red glow
    ctx.shadowColor = "rgba(255, 60, 60, 0.9)";
    ctx.shadowBlur = 14;

    // Stretched red bolt
    ctx.fillStyle = "rgb(255, 80, 80)";
    ctx.fillRect(0, -2, 22, 4);

    ctx.restore();
  }
}

// -----------------------------------------------------
// STORMTROOPER CLASS
// -----------------------------------------------------
class Stormtrooper {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.frameW = 96;
    this.frameH = 96;
    this.scale = 1.7;

    this.width  = this.frameW * this.scale;
    this.height = this.frameH * this.scale;

    this.direction = -1;
    this.speed = 60;

    this.state = "walk";
    this.frameIndex = 0;
    this.frameTimer = 0;

    this.hp = 40;
    this.shootCooldown = 0;
    this.remove = false;
  }

   getHitBox() {
    return {
      x: this.x + this.width * 0.30,
      y: this.y + this.height * 0.20,
      width: this.width * 0.40,
      height: this.height * 0.75
    };
  }

  setState(next) {
    if (this.state !== next) {
      this.state = next;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.setState("death");
    } else {
      this.setState("hurt");
    }
  }

  update(delta, player) {
    // Death animation
    if (this.state === "death") {
      const anim = trooperAnims.death;
      this.frameTimer += delta * 1000;

      if (this.frameTimer >= 1000 / anim.fps) {
        this.frameTimer = 0;
        this.frameIndex++;
        if (this.frameIndex >= anim.frames.length) {
          this.remove = true;
        }
      }
      return;
    }

    // Movement + AI
    const px = player.x + player.width / 2;
    const cx = this.x + this.width / 2;

    const dx = px - cx;

    // Walk toward player
    if (Math.abs(dx) > 180) {
      this.setState("walk");
      this.direction = dx > 0 ? 1 : -1;
      this.x += this.direction * this.speed * delta;
    } else {
      this.setState("aim");
      if (this.shootCooldown === 0) {
        this.setState("shoot");

        const muzzleX = this.x + this.width * (this.direction === 1 ? 0.75 : 0.25);
        const muzzleY = this.y + this.height * 0.55;

        enemyBullets.push(new StormtrooperBullet(
          muzzleX,
          muzzleY,
          player.x + player.width / 2,
          player.y + player.height / 2
        ));

        this.shootCooldown = 1.0;
      }
    }

    // Cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= delta;
      if (this.shootCooldown < 0) this.shootCooldown = 0;
    }

    // Animation update
    const anim = trooperAnims[this.state];
    this.frameTimer += delta * 1000;

    if (this.frameTimer >= 1000 / anim.fps) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % anim.frames.length;
    }

    this.frame = anim.frames[this.frameIndex];
  }

  draw(ctx) {
    ctx.save();

    // Flip horizontally if facing left
    if (this.direction === -1) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(this.x, this.y);
    }

    const frame = this.frame;
    const col = frame % ST_COLS;
    const row = Math.floor(frame / ST_COLS);

    ctx.drawImage(
      stImg,
      col * ST_FRAME_W,
      row * ST_FRAME_H,
      ST_FRAME_W,
      ST_FRAME_H,
      0,
      0,
      this.width,
      this.height
    );

    ctx.restore();
  }

}

Stormtrooper.prototype.forceFrame = function(frameIndex) {
  this.frame = frameIndex;
};


// -----------------------------------------------------
// GLOBAL TROOPER SPAWN
// -----------------------------------------------------
function spawnStormtrooper(x, y) {
  enemies.push(new Stormtrooper(x, y));
}

// ------------------------
// PLAYER INSTANCE
// ------------------------
const player = new Player(100, 100, 180, 180);

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
        player.force -= 10;
        player.jumpCount--;
      }
      break;
    case " ":
      const now = Date.now();
      if (!player.saberOn) return;
      if (now - lastSwing < attackSpeed) return;
      lastSwing = now;
      saber = new Lightsaber(player, player.direction);
      break;
    case "q":
      if (!shield && player.force >= 50) shield = new ForceShield(player);
      break;
    case "f":
      if (player.saberOn && !player.saberIgniting) {
        player.isBlocking = true;
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
    case "e":
      if (!player.saberOn && !player.saberIgniting) {
        player.saberIgniting = true;
        player.setState("saber_ignite");
        player.frameIndex = 0;
      } else if (player.saberOn && !player.saberIgniting) {
        player.saberOn = false;
      }
      break;
    case "f":
      player.isBlocking = false;
      break;
  }
});

// ------------------------
// BULLETS (player)
// ------------------------
const bullets = [];
let lastShotTime = 0;
const fireRate = 200; // ms

class Bullet {
  constructor(x, y, targetX, targetY, speed, range) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.range = range;
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

    const angle = Math.atan2(this.dy, this.dx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Hero green glow (lighter than TIE bolts)
    ctx.shadowColor = "rgba(80, 255, 80, 0.9)";
    ctx.shadowBlur = 14;

    // Green beam (smaller than TIE shot)
    ctx.fillStyle = "rgb(80, 255, 80)";
    ctx.fillRect(0, -2, 20, 4);

    ctx.restore();
  }
}

canvas.addEventListener("mousedown", (event) => {
  const now = Date.now();
  if (now - lastShotTime < fireRate || saber) return;
  lastShotTime = now;

  const originX = player.x + player.width  / 2;
  const originY = player.y + player.height * 0.4;

  const dx = event.offsetX - originX;
  const dy = event.offsetY - originY;
  const angle = Math.atan2(dy, dx);

  const moving = player.moving.left || player.moving.right;
  const UP_THRESHOLD   = -0.6;
  const DOWN_THRESHOLD =  0.4;

  let animName;
  if (angle < UP_THRESHOLD)      animName = "shoot_up";
  else if (angle > DOWN_THRESHOLD) animName = "shoot_down";
  else if (moving)               animName = "shoot_run";
  else                           animName = "shoot_straight";

  player.setState(animName);
  player.isShooting = true;
  player.shootTimer = 0.2;

  bullets.push(new Bullet(
    originX,
    originY,
    event.offsetX,
    event.offsetY,
    1200,
    500
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

    this.pivotX = this.player.x + this.player.width * (this.player.direction ? 0.8 : 0.2);
    this.pivotY = this.player.y + this.player.height * 0.45;

   // hit enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (this.checkHit(e)) {
        if (typeof e.takeDamage === "function") {
          e.takeDamage(50);   // <-- saber damage
        } else {
          e.remove = true;
        }
      }
    }


    // deflect enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      if (this.checkHit({ x:b.x, y:b.y, width:20, height:5 })) {
        b.dx *= -1;
        b.dy *= -1;
      }
    }
  }

  checkHit(obj) {
    const saberX2 = this.pivotX + Math.cos(this.angle) * this.length;
    const saberY2 = this.pivotY + Math.sin(this.angle) * this.length;
    const dist = Math.hypot(
      obj.x + obj.width / 2 - saberX2,
      obj.y + obj.height / 2 - saberY2
    );
    return dist < 40;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    const pivotX = this.player.x + (this.player.direction ? 72 : 30);
    const pivotY = this.player.y + 76;

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
    ctx.arc(this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ------------------------
// ENEMY SPAWN + LEDGE SPAWN
// ------------------------
let enemyTimer = 0;
// spawn less frequently than before
let enemyInterval = 4500;

let ledgeTimer = 0;
const ledgeInterval = 6; // roughly every 6 seconds

function spawnFloatingLedge() {
  if (!ledgesReady) return;

  // Pick image (50/50 big or small)
  const useBig = Math.random() < 0.5;
  const img = useBig ? bigLedgeImg : smallLedgeImg;

  // Altitude: high in sky
  const minY = canvas.height * 0.05 + 50; // 25
  const maxY = canvas.height * 0.30 + 50; // 150
  const y = minY + Math.random() * (maxY - minY) + 50;

  const x = canvas.width + 100;
  floatingLedges.push(new FloatingLedge(x, y, img));
}

// ------------------------------------
// TIE FIGHTER BULLET
// ------------------------------------
class TieBullet {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;

    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;

    this.dx = dx / len;
    this.dy = dy / len;

    this.speed = 550;       // fast laser
    this.range = 1500;
    this.distanceTraveled = 0;
  }

  update(delta) {
    const step = this.speed * delta;
    this.x += this.dx * step;
    this.y += this.dy * step;
    this.distanceTraveled += step;
  }

  draw(ctx) {
    ctx.save();

    const angle = Math.atan2(this.dy, this.dx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Bright green glow (accurate TIE color)
    ctx.shadowColor = "rgba(0, 255, 0, 0.9)";
    ctx.shadowBlur = 18;

    // Stretched green beam with small trailing start
    ctx.fillStyle = "rgb(0, 255, 0)";
    ctx.fillRect(-12, -2, 26, 4);

    ctx.restore();
  }
}

// =======================================================
//                 FULLY PATCHED TIE FIGHTER
// =======================================================
class Enemy {
  constructor(x, y, width, height) {

    // Hitbox area (real collision box)
    this.x = x;
    this.y = y;
    this.width = width;     
    this.height = height;   

    // FIXED: small scale so it matches SNES size
    this.spriteScale = 0.55;   // <<--- THIS FIXES GIANT TIE FIGHTER

    this.hp = 30;
    this.speed = 140;
    this.time = 0;
    this.baseY = y;

    this.shootCooldown = 2.0;
    this.burstCount = 0;
    this.burstDelay = 0.15;
    this.burstTimer = 0;

    this.exploding = false;
    this.frame = 0;
    this.explosionTimer = 0;
    this.explosionFPS = 8;
    this.remove = false;
  }

  getHitBox() {
    return {
      x: this.x + this.width * 0.20,
      y: this.y + this.height * 0.20,
      width: this.width * 0.60,
      height: this.height * 0.60
    };
  }

  takeDamage(amount) {
    if (this.exploding) return;
    this.hp -= amount;

    if (this.hp <= 0) {
      this.exploding = true;
      this.frame = 0;
    }
  }

  update(delta) {
    if (!this.exploding) {

      // Move fast left
      this.x -= 300 * delta;

      // Hover bobbing
      this.time += delta;
      this.y = this.baseY + Math.sin(this.time * 6) * 14;

      // --- Burst-fire logic ---
      this.shootCooldown -= delta;

      if (this.burstCount === 0) {
        if (this.shootCooldown <= 0) {
          this.burstCount = 3;
          this.burstTimer = 0;
          this.shootCooldown = 2.0;
        }
      } else {
        this.burstTimer -= delta;
        if (this.burstTimer <= 0) {

          const muzzleX = this.x + this.width / 2;
          const muzzleY = this.y + this.height / 2;

          enemyBullets.push(new TieBullet(
            muzzleX,
            muzzleY,
            player.x + player.width / 2,
            player.y + player.height / 2
          ));

          this.burstCount--;
          this.burstTimer = this.burstDelay;
        }
      }

      if (this.x + this.width < 0)
        this.remove = true;

    } else {
      // Explosion animation
      this.explosionTimer += delta * 1000;

      if (this.explosionTimer > 1000 / this.explosionFPS) {
        this.explosionTimer = 0;
        this.frame++;
        if (this.frame >= 4) this.remove = true;
      }
    }
  }

  draw(ctx) {
    if (!tieImg.complete || !TIE_FRAME_W) return;

    const drawW = TIE_FRAME_W * this.spriteScale;
    const drawH = TIE_FRAME_H * this.spriteScale;

    let sx, sy;

    if (!this.exploding) {
      sx = 0;
      sy = 0;
    } else {
      sx = this.frame * TIE_FRAME_W;
      sy = TIE_FRAME_H;
    }

    ctx.drawImage(
      tieImg,
      sx, sy, TIE_FRAME_W, TIE_FRAME_H,
      this.x - (drawW - this.width) / 2,
      this.y - (drawH - this.height) / 2,
      drawW,
      drawH
    );
  }
}

let rancorSpawned = false;
let boss = null;

// =======================================================
//                 FULLY PATCHED RANCOR BOSS
// =======================================================
class RancorBoss {
  constructor(x, y) {

    // Correct sheet layout (based on your uploaded PNG)
    this.columns = 4;  
    this.rows = 3;

    // FIX: compute frame size using correct columns
    RANCOR_FRAME_W = rancorImg.width / this.columns;
    RANCOR_FRAME_H = rancorImg.height / this.rows;

    this.scale = 2.2;

    this.width = RANCOR_FRAME_W * this.scale;
    this.height = RANCOR_FRAME_H * this.scale;

    this.x = x;
    this.y = canvas.height - this.height;

    this.frameX = 0;
    this.frameY = 1;
    this.frameTimer = 0;
    this.fps = 8;
    this.frameInterval = 1000 / this.fps;

    this.arrayFrameIndex = 0;

    this.animations = {
      idle: { row: 0, frames: [0,1,2,3], fps: 6 },
      walk: { row: 1, frames: [0,1,2,3], fps: 10 },
      roar: { row: 2, frames: [0,1,2,3], fps: 4 }
    };

    this.currentAnimation = this.animations.walk;

    this.health = 250;
    this.maxHealth = 250;
    this.falling = false;
  }

  getHitBox() {
    return {
      x: this.x + this.width * 0.30,
      y: this.y + this.height * 0.20,
      width: this.width * 0.40,
      height: this.height * 0.70
    };
  }

  setAnimation(name) {
    const anim = this.animations[name];
    if (!anim) return;

    this.currentAnimation = anim;
    this.frameY = anim.row;
    this.arrayFrameIndex = 0;
    this.frameX = anim.frames[0];
    this.fps = anim.fps;
    this.frameInterval = 1000 / this.fps;
  }

  updateAnimation(delta) {
    this.frameTimer += delta * 1000;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      const seq = this.currentAnimation.frames;

      this.arrayFrameIndex =
        (this.arrayFrameIndex + 1) % seq.length;

      this.frameX = seq[this.arrayFrameIndex];
    }
  }

  update(delta) {
    if (this.falling) {
      this.y += 500 * delta;

      if (this.y > canvas.height + this.height)
        restartGame();

      this.updateAnimation(delta);
      return;
    }

    const stopX = canvas.width * 0.35;

    if (this.x > stopX) {
      this.setAnimation("walk");
      this.x -= 200 * delta;
    } else {
      this.setAnimation("idle");
    }

    this.updateAnimation(delta);
  }

  draw(ctx) {
    if (!rancorImg.complete) return;

    const sx = this.frameX * RANCOR_FRAME_W;
    const sy = this.frameY * RANCOR_FRAME_H;

    const offsetX = -90;
    const offsetY = 10;

    ctx.drawImage(
      rancorImg,
      sx, sy,
      RANCOR_FRAME_W, RANCOR_FRAME_H,
      this.x + offsetX,
      this.y + offsetY,
      this.width,
      this.height
    );
  }

  takeDamage(amount) {
    this.health -= amount;

    if (this.health <= 0 && !this.falling) {
      this.health = 0;
      this.falling = true;
      this.setAnimation("idle");
      this.frameX = 0;
    }
  }
}


// ------------------------
// FLOATING LEDGE CLASS
// ------------------------
class FloatingLedge {
  constructor(x, y, img) {
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.img = img;

    const maxWidth = 150;
    const naturalW = img.naturalWidth || maxWidth;
    const naturalH = img.naturalHeight || 160;
    const scale = Math.min(1, maxWidth / naturalW);

    this.width  = naturalW * scale;
    this.height = naturalH * scale;

    // pixel-tuned platform height offsets
    if (img === smallLedgeImg) {
      this.topOffset = this.height - 32;   // small ledge surface
    } else {
      this.topOffset = this.height - 20;   // big ledge surface
    }

    this.time = 0;
    this.remove = false;

    this.speed = 90;
    this.bobAmplitude = 12;
    this.bobFrequency = 2.5;
  }

  update(delta) {
    // Move left
    this.x -= this.speed * delta;

    // Gentle vertical bobbing
    this.time += delta;
    this.y = this.baseY + Math.sin(this.time * this.bobFrequency) * this.bobAmplitude;

    // Kill when off-screen
    if (this.x + this.width < -50) {
      this.remove = true;
    }
  }

  draw(ctx) {
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

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
// MAIN GAME LOOP SUPPORT
// ------------------------
const timestep = 1000 / 60;
let lastTime = performance.now();
let accumulator = 0;

// ------------------------
// UPDATE GAME
// ------------------------
function updateGame(delta) {
  frame++;

  // -------------------------------
  // 1. Player update
  // -------------------------------
  player.prevY = player.y;
  player.update(delta);

  // -------------------------------
  // 2. Spawn enemies & floating ledges
  // -------------------------------
  enemyTimer += timestep;
  if (enemyTimer > enemyInterval) {
    if (Math.random() < 0.4) {
      spawnStormtrooper(canvas.width - 150, canvas.height - 163);
    } else {
      let y = Math.random() * (canvas.height / 3);
      enemies.push(new Enemy(canvas.width, y, 140, 110));
    }
    enemyTimer = 0;
  }

  // TEMP: test animation frames for the first trooper
if (enemies[0] instanceof Stormtrooper) {
  enemies[0].forceFrame(testFrameNumber); // replace testFrameNumber each time
}


  ledgeTimer += delta;
  if (ledgeTimer >= ledgeInterval && ledgesReady) {
    spawnFloatingLedge();
    ledgeTimer = 0;
  }

  // -------------------------------
  // 3. Update floating ledges
  // -------------------------------
  for (let i = floatingLedges.length - 1; i >= 0; i--) {
    const ledge = floatingLedges[i];
    ledge.update(delta);
    if (ledge.remove) floatingLedges.splice(i, 1);
  }

// -------------------------------
// Boss trigger — background end reached
// -------------------------------
const w = bgImg.width * bgScale;

if (!rancorSpawned && bgX <= -(w - canvas.width)) {

    backgroundLocked = true;  
    rancorSpawned = true;

    boss = new RancorBoss(
        canvas.width + 200,
        canvas.height - 300
    );

    enemies.push(boss);

    // Start intro timer
    boss.introTimer = 2.0;
    boss.doRoarIntro = true;

    console.log("RANCOR SPAWNED!");
}


  // -------------------------------
  // 4. ONE-WAY PLATFORM COLLISION
  // -------------------------------
  if (player.velocityY >= 0) {
    const feetPrev = player.prevY + player.height;
    const feetNow = player.y + player.height;
    const centerX = player.x + player.width * 0.5;

    for (const ledge of floatingLedges) {
      const surfX = ledge.x + 2;
      const surfW = ledge.width - 4;

      const left = surfX;
      const right = surfX + surfW;
      const horizontallyInside = centerX >= left && centerX <= right;

      const surfaceY = ledge.y + ledge.topOffset;

      const crossingDown =
        feetPrev <= surfaceY &&
        feetNow >= surfaceY;

      if (horizontallyInside && crossingDown) {
        player.y = surfaceY - player.height;
        player.velocityY = 0;
        player.grounded = true;
        player.jumpCount = 2;
        break;
      }
    }
  }

  // -------------------------------
  // 5. Enemies update
  // -------------------------------
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    e.update(delta, player);

   // Do NOT auto-remove the Rancor Boss
  if (!(e instanceof RancorBoss)) {
      if (e.markedForDeletion || e.remove) {
          enemies.splice(i, 1);
          continue;
      }
  }


    // Player collision with enemy
    const now = Date.now();
    if (now - lastDamageTime > damageCooldown) {
      if (!shield) {
        player.health -= 1;
        if (player.health < 0) player.health = 0;
      } else {
        player.force -= 5;
        if (player.force < 0) player.force = 0;
      }
      lastDamageTime = now;

      if (e.x < player.x) player.x += 20;
      else player.x -= 20;
    }
  }

  // -----------------------------------------
// Enemy bullets update (Stormtrooper / TIE)
// -----------------------------------------
for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.update(delta);

    // Remove if off-screen or past range
    if (
        b.x < -50 || b.x > canvas.width + 50 ||
        b.y < -50 || b.y > canvas.height + 50 ||
        b.distanceTraveled > b.range
    ) {
        enemyBullets.splice(i, 1);
        continue;
    }

    // Enemy bullet hits Luke
    const hitBox = {
        x: b.x - 10,
        y: b.y - 10,
        width: 20,
        height: 20
    };

    if (boxCollision(hitBox, player)) {

        if (!shield) {
            player.health -= 10;
        } else {
            player.force -= 5;
        }

        enemyBullets.splice(i, 1);
        continue;
    }
}


// -------------------------------
// 7. Player bullets update (FIXED)
// -------------------------------
for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.update(delta);  // <-- correct place for distance tracking

    // Remove if off-screen or past range
    if (
        bullet.x < -50 || bullet.x > canvas.width + 50 ||
        bullet.y < -50 || bullet.y > canvas.height + 50 ||
        bullet.distanceTraveled > bullet.range
    ) {
        bullets.splice(i, 1);
        continue;
    }

    // Check collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];

        // Rancor uses custom hitbox
        const target = (e instanceof RancorBoss) ? e.getHitBox() : e;

        // Proper bullet hitbox
        const hitBox = {
            x: bullet.x - 9,
            y: bullet.y - 9,
            width: 18,
            height: 18
        };

        if (boxCollision(hitBox, target)) {
            if (typeof e.takeDamage === "function") {
                e.takeDamage(15);
            } else {
                e.remove = true;
            }

            bullets.splice(i, 1);
            break;
        }
    }
}


  // -------------------------------
  // 8. Saber & Shield update
  // -------------------------------
  if (saber) {
    saber.update(delta);
    if (!saber.active) saber = null;
  }

  if (shield) {
    shield.update(delta);
    if (!shield.active) shield = null;
  }
}

// ------------------------------------
// MAIN DRAW GAME
// ------------------------------------
function drawGame() {
  ctx.fillStyle = "#8f93b6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // -----------------------------
  // CAMERA SHAKE WRAPPER
  // -----------------------------
  ctx.save();
  if (boss && boss.shake) {
      ctx.translate(
          (Math.random() - 0.5) * boss.shake,
          (Math.random() - 0.5) * boss.shake
      );
  }

  // ----- WORLD DRAW BEGINS -----
  drawBackground(timestep / 1000);

  // Floating ledges
  for (const ledge of floatingLedges) {
    ledge.draw(ctx);
  }

  player.draw();
  if (shield) shield.draw(ctx);
  if (saber) saber.draw(ctx);

  enemies.forEach(e => e.draw(ctx));
  enemyBullets.forEach(b => b.draw(ctx));
  bullets.forEach(b => b.draw(ctx));
  // ----- WORLD DRAW ENDS -----

  ctx.restore();

  // -----------------------------
  // UI (does NOT shake)
  // -----------------------------
  drawCrosshair(ctx, mouse.x, mouse.y);

  if (player.state === "death" &&
      player.frameIndex === player.anims.death.frames.length -1) {
      // Game Over logic here
  }
// -----------------------------
// BOSS HEALTH BAR
// -----------------------------
if (boss && !boss.remove) {
    const barWidth = canvas.width * 0.6; 
    const barHeight = 20;
    const x = (canvas.width - barWidth) / 2;
    const y = 20;

    const pct = Math.max(0, boss.health / boss.maxHealth);

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Health fill
    ctx.fillStyle = "#ff5c33";  // orange-ish to match desert theme
    ctx.fillRect(x, y, barWidth * pct, barHeight);

    // Border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
}

}


// ------------------------------------
// GAME LOOP
// ------------------------------------
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
function restartGame() {
    window.location.reload();   // simplest restart
}


requestAnimationFrame(gameLoop);
