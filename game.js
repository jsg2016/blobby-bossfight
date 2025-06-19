/*  Blobby Bossfight – Phaser 3 mini-demo
    ©2025  */

const GAME_W = 640;
const GAME_H = 360;

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#222437',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

/* ---------- Globala variabler ---------- */
let blobby, troll, cursors, txt, gameOver = false;

function preload () {
  /* Ladda sprites från assets-mappen */
  this.load.image('blobby', 'assets/blobby.png');
  this.load.image('troll',  'assets/troll.png');
}

function create () {
  /* Tangent-input */
  cursors = this.input.keyboard.createCursorKeys();

  /* Mark (statisk rektangel som kollisionsyta) */
  const ground = this.add.rectangle(GAME_W/2, 340, GAME_W, 40, 0x333333);
  this.physics.add.existing(ground, true);   // true = immovable

  /* Spelaren – Blobby */
  blobby = this.physics.add.sprite(100, 280, 'blobby')
                       .setBounce(0.1)
                       .setCollideWorldBounds(true);

  /* Boss – Troll */
  troll  = this.physics.add.sprite(500, 280, 'troll')
                       .setImmovable(true);

  /* Kollision mot mark */
  this.physics.add.collider(blobby, ground);
  this.physics.add.collider(troll,  ground);

  /* Vinst-överlapppning: hoppa på troll-huvud */
  this.physics.add.overlap(blobby, troll, onHitTroll, null, this);

  /* Text-UI */
  txt = this.add.text(GAME_W/2, GAME_H/2, '',
                      { font: '24px Arial', fill: '#ffffff' })
               .setOrigin(0.5);
}

function update () {
  if (gameOver) return;

  /* Sidoförflyttning */
  if (cursors.left?.isDown)       blobby.setVelocityX(-160);
  else if (cursors.right?.isDown) blobby.setVelocityX(160);
  else                            blobby.setVelocityX(0);

  /* Hoppa */
  if (cursors.up?.isDown && blobby.body.blocked.down)
      blobby.setVelocityY(-350);
}

/* ---------- Kollisions-callback ---------- */
function onHitTroll (player, boss) {
  /* Registrera träff bara om Blobby faller nedåt (hoppa på huvud) */
  if (player.body.velocity.y > 0) {
    boss.disableBody(true, true);
    gameOver = true;
    txt.setText('YOU WIN!');
  } else {
    player.setTint(0xff0000).setVelocity(0, 0);
    gameOver = true;
    txt.setText('GAME OVER');
  }
}
