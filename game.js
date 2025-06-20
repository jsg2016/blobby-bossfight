// Blobby Boss Fight Game

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 640;
canvas.height = 360;

let gameState = "menu";

const keys = {};
const images = {};
const cages = [];
const freedBlobbys = [];
let jumpSound;

const blobby = {
  x: 100,
  y: 260,
  width: 32,
  height: 32,
  vy: 0,
  grounded: false,
  speed: 2.5
};

const troll = {
  x: 400,
  y: 260,
  width: 48,
  height: 48,
  health: 3,
  attacking: false,
  clubDown: false
};

const club = {
  x: troll.x - 10,
  y: troll.y,
  width: 16,
  height: 32
};

function loadAssets() {
  const assets = ["blobby.png", "troll.png", "club.png", "cage.png"];
  let loaded = 0;
  assets.forEach((name) => {
    const img = new Image();
    img.src = `assets/${name}`;
    img.onload = () => {
      loaded++;
      if (loaded === assets.length) init();
    };
    images[name] = img;
  });

  jumpSound = new Audio("assets/jump.wav");
}

function init() {
  for (let i = 0; i < 3; i++) {
    cages.push({ x: 480 + i * 40, y: 260, freed: false });
  }
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function update() {
  if (gameState === "playing") {
    // Movement
    if (keys["ArrowLeft"]) blobby.x -= blobby.speed;
    if (keys["ArrowRight"]) blobby.x += blobby.speed;

    // Gravity
    blobby.vy += 0.5;
    blobby.y += blobby.vy;
    if (blobby.y >= 260) {
      blobby.y = 260;
      blobby.vy = 0;
      blobby.grounded = true;
    }

    // Jump
    if (keys[" "] && blobby.grounded) {
      blobby.vy = -8;
      blobby.grounded = false;
      jumpSound.play();
    }

    // Troll attack
    if (!troll.attacking && Math.random() < 0.01) {
      troll.attacking = true;
      club.y = troll.y;
      setTimeout(() => {
        club.y += 30;
        troll.clubDown = true;
        setTimeout(() => {
          troll.attacking = false;
          troll.clubDown = false;
          club.y = troll.y;
        }, 1000);
      }, 500);
    }

    // Check collision with club
    if (
      troll.clubDown &&
      blobby.x < club.x + club.width &&
      blobby.x + blobby.width > club.x &&
      blobby.y < club.y + club.height &&
      blobby.y + blobby.height > club.y
    ) {
      troll.health--;
      troll.clubDown = false;
      if (troll.health <= 0) {
        gameState = "won";
        cages.forEach((c, i) => {
          setTimeout(() => {
            c.freed = true;
            freedBlobbys.push({ x: c.x, y: c.y });
          }, 500 * i);
        });
      }
    }

    // Update freed blobbys
    freedBlobbys.forEach((b) => (b.x += 1));
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, 300, canvas.width, 60);

  if (gameState === "menu") {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("BLOBBY BOSS FIGHT", 180, 160);
    ctx.font = "20px Arial";
    ctx.fillText("Tryck på valfri tangent för att börja", 170, 200);
  } else {
    // Draw game
    ctx.drawImage(images["blobby.png"], blobby.x, blobby.y, blobby.width, blobby.height);
    ctx.drawImage(images["troll.png"], troll.x, troll.y, troll.width, troll.height);
    ctx.drawImage(images["club.png"], club.x, club.y, club.width, club.height);
    cages.forEach((c) => {
      if (!c.freed) ctx.drawImage(images["cage.png"], c.x, c.y, 32, 32);
    });
    freedBlobbys.forEach((b) => ctx.drawImage(images["blobby.png"], b.x, b.y, 24, 24));

    if (gameState === "won") {
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";
      ctx.fillText("DU VANN!", 250, 180);
    }
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", () => {
  if (gameState === "menu") gameState = "playing";
});

loadAssets();
