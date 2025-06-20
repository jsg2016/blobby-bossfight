
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 640;
canvas.height = 360;

const SPRITES = {
  blobby: 'assets/blobby.png',
  troll: 'assets/troll.png',
  cage: 'assets/cage.png',
  club: 'assets/club.png'
};

const sounds = {
  jump: new Audio('assets/jump.wav')
};

let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function loadSprite(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

async function loadAssets() {
  const sprites = {};
  for (let key in SPRITES) {
    sprites[key] = await loadSprite(SPRITES[key]);
  }
  return sprites;
}

function rectsIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}

class GameObject {
  constructor(x, y, w, h, sprite) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.sprite = sprite;
  }
  draw(ctx) {
    ctx.drawImage(this.sprite, this.x, this.y, this.w, this.h);
  }
}

class Blobby extends GameObject {
  constructor(x, y, sprite) {
    super(x, y, 64, 64, sprite);
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpPower = -10;
    this.speed = 3;
  }
  update(platforms) {
    this.vx = 0;
    if (keys['ArrowLeft']) this.vx = -this.speed;
    if (keys['ArrowRight']) this.vx = this.speed;
    if (keys['Space'] && this.onGround) {
      this.vy = this.jumpPower;
      sounds.jump.play();
      this.onGround = false;
    }
    this.vy += 0.5;
    this.x += this.vx;
    this.y += this.vy;

    this.onGround = false;
    for (let p of platforms) {
      if (rectsIntersect(this, p) && this.vy >= 0) {
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
      }
    }
  }
}

class Troll extends GameObject {
  constructor(x, y, sprite, club) {
    super(x, y, 128, 128, sprite);
    this.hitCount = 0;
    this.club = club;
    this.clubX = x + 40;
    this.clubY = y + 80;
    this.swinging = false;
    this.swingTimer = 0;
  }
  update() {
    if (!this.swinging) {
      this.swinging = true;
      this.swingTimer = 60;
    } else {
      this.swingTimer--;
      if (this.swingTimer <= 0) {
        this.swinging = false;
      }
    }
  }
  draw(ctx) {
    super.draw(ctx);
    ctx.drawImage(this.club, this.clubX, this.clubY, 64, 32);
  }
}

async function main() {
  const sprites = await loadAssets();
  const blobby = new Blobby(100, 100, sprites.blobby);
  const troll = new Troll(400, 200, sprites.troll, sprites.club);
  const platforms = [new GameObject(0, 320, 640, 40, { drawImage: () => {} })];

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blobby.update(platforms);
    troll.update();

    for (let p of platforms) p.draw(ctx);
    blobby.draw(ctx);
    troll.draw(ctx);

    requestAnimationFrame(loop);
  }
  loop();
}

main();
