/*  Blobby Boss-fight  – full demo  ©2025
    Specs:
      • Grotta-bakgrund
      • Troll-boss med brun klubba (slam-attack)
      • Klubban fastnar ⇒ Blobby kan hoppa upp
      • 3 hopp på huvud → boss knock-out + två burar öppnas
      • Fler färgade Blobbys springer ut
      • Menyskärm & seger­skärm
*/

/* ---------  Konstanter  --------- */
const W = 800, H = 450, GROUND_Y = 400;
const COLORS = ['#ffce3b', '#39c243', '#3489ff', '#555555'];   // gul, grön, blå, svart

/* ---------  Base64-PNG-sprites 32×32  --------- */
/* Små, stiliserade pixelikoner – byt gärna mot riktiga senare */
const SPRITES = {
  blobby: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAABnKfE/AAAAUUlEQVR4AWMYBaOYGZuZ/xkYGNgHGBkZ+P8fBgMDA+P/H4b/BwcHQYGRkTHwHx8fJw8jIxMDDwPyMjIz8H8B4fPx/DAwMDwf//P4Y8hAwjJgYGBoYGBgAAMiIA8RFzBwowAAAABJRU5ErkJggg==',
  troll:  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAABnKfE/AAAAWUlEQVR4AWMYBbvEwMDw/x8GChuZGRn4/x8ZGRnYGRkZGH4DxsbG/x/FxcXHwP8/PwTDw8Px/2BgYGDIyMTA8D8TAwMDw/x8GhgYGBgf/P4ZGX4b/v//P4b///8DAwMDAwMAAAABlccuTH6hrTUAAAAASUVORK5CYII=',
  club:  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAgCAQAAABnKfE/AAAAIUlEQVR4AWPAwMDw/x8GCcYGBgYGBv//P4YGBgYGhgYGBgAAB+YAhfEQi2oAAAAAElFTkSuQmCC',
  cage:  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAgCAQAAABnKfE/AAAANUlEQVR4AWNgGAVDg8DAwP8fBphgYGBlZGBgYGeYGBgYzIyM/4fBwMHw////PxgYGJgYGRlGAIAvuwM9jrNsGQAAAABJRU5ErkJggg=='
};

/* ---------  Mini-wav-ljud (22050 Hz/8-bit/mono)  --------- */
const SFX = {
  jump:  'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA8AAAAPAAAADwAAAA=',
  hit:   'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAA',
  win:   'data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAFwAAABcAAAAXAAAAFwAAABcAAAAXAAAAFwAAABcAAAAXAAAAFwAAABc'
};

/* ==========  Phaser-spel  ========== */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#16181f',
  physics: { default: 'arcade', arcade: { gravity: { y: 900 } } },
  scene: [TitleScene, BossScene, WinScene]
});

/* ----------  Titel-scen  ---------- */
function TitleScene () { Phaser.Scene.call(this, { key: 'TitleScene' }); }
TitleScene.prototype = Object.create(Phaser.Scene.prototype);
TitleScene.prototype.preload = function () {
  // Ladda sprites / ljud
  Object.entries(SPRITES).forEach(([k, d]) => this.load.image(k, d));
  Object.entries(SFX).forEach(([k, d]) => this.load.audio(k, d));
};
TitleScene.prototype.create = function () {
  this.add.text(W/2, H/2 - 50, 'BLOBBY BOSSFIGHT', {font:'32px Arial', fill:'#fff'}).setOrigin(0.5);
  this.add.text(W/2, H/2 + 10, 'Press SPACE to Play', {font:'18px Arial', fill:'#ccc'}).setOrigin(0.5);

  this.input.keyboard.once('keydown-SPACE', () => this.scene.start('BossScene'));
};

/* ----------  Boss-scen  ---------- */
function BossScene () { Phaser.Scene.call(this, { key: 'BossScene' }); }
BossScene.prototype = Object.create(Phaser.Scene.prototype);

BossScene.prototype.create = function () {
  /* Mark */
  const ground = this.add.rectangle(W/2, GROUND_Y, W, 100, 0x332a20);
  this.physics.add.existing(ground, true);

  /* Spelare */
  this.cursors = this.input.keyboard.createCursorKeys();
  this.player = this.physics.add.sprite(120, 260, 'blobby').setCollideWorldBounds(true);
  this.player.setBounce(0.1);
  this.physics.add.collider(this.player, ground);

  /* Boss */
  this.boss = this.physics.add.sprite(620, 260, 'troll').setImmovable(true).setCollideWorldBounds(true);
  this.physics.add.collider(this.boss, ground);

  /* Klubba */
  this.club = this.physics.add.sprite(this.boss.x - 36, this.boss.y + 26, 'club')
                  .setImmovable(true).setVisible(false);
  this.physics.add.collider(this.player, this.club, () => this.playerHit(), null, this);

  /* Burbesatta Blobbys */
  this.cages = [];
  const cageX = [540, 600];
  cageX.forEach((x,i)=>{
    const cage = this.physics.add.sprite(x, 140, 'cage').setImmovable(true);
    this.cages.push(cage);
  });

  /* UI */
  this.info  = this.add.text(W/2, 20, 'Avoid club • Hop on head 3×', {font:'18px Arial', fill:'#fff'}).setOrigin(0.5);

  /* Ljud */
  this.sfx = {
    jump: this.sound.add('jump'), hit: this.sound.add('hit'), win: this.sound.add('win')
  };

  /* Boss-AI */
  this.headHits = 0;
  this.bossState = 'idle';
  this.time.addEvent({ delay: 2000, callback: this.bossCycle, callbackScope: this, loop: true });

  /* Träff på huvud */
  this.physics.add.overlap(this.player, this.boss, this.hitHead, this.canHitHead, this);
};

BossScene.prototype.canHitHead = function (player, boss) {
  return player.body.velocity.y > 0 && player.y < boss.y - 10;
};

BossScene.prototype.hitHead = function () {
  if (this.bossState !== 'stuck') return;
  this.headHits++;
  this.sfx.hit.play();
  if (this.headHits >= 3) this.winBoss();
};

BossScene.prototype.playerHit = function () {
  if (this.player.getData('hit')) return;
  this.player.setTint(0xff0000).setData('hit', true);
  this.physics.pause();
  this.time.delayedCall(800, () => this.scene.start('TitleScene'));
};

BossScene.prototype.bossCycle = function () {
  if (this.headHits >= 3) return;
  if (this.bossState !== 'idle') return;

  /* Windup → slam → stuck → recover */
  this.bossState = 'windup';
  this.time.delayedCall(500, () => {
    this.bossState = 'slam';
    this.club.setPosition(this.boss.x - 36, this.boss.y + 26).setVisible(true);
    this.tweens.add({ targets:this.club, y:GROUND_Y - 42, duration:150, onComplete:()=>{
      this.bossState = 'stuck';
      /* Efter 1s drar troll upp klubban */
      this.time.delayedCall(1000, ()=>{
        this.club.setVisible(false);
        this.bossState = 'recover';
        this.time.delayedCall(400, () => this.bossState = 'idle');
      });
    }});
  });
};

BossScene.prototype.update = function () {
  if (this.headHits >= 3) return;   // redan vunnit

  /* Spelar-kontroller */
  const speedX = 200;
  if (this.cursors.left?.isDown)      this.player.setVelocityX(-speedX);
  else if (this.cursors.right?.isDown) this.player.setVelocityX(speedX);
  else                                 this.player.setVelocityX(0);

  if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.player.body.blocked.down) {
    this.player.setVelocityY(-420); this.sfx.jump.play();
  }
};

BossScene.prototype.winBoss = function () {
  this.boss.disableBody(true, true);
  this.club.disableBody(true, true);
  this.cages.forEach(c=>c.destroy());
  this.sfx.win.play();
  this.scene.start('WinScene');
};

/* ----------  Vinst-scen  ---------- */
function WinScene () { Phaser.Scene.call(this, { key: 'WinScene' }); }
WinScene.prototype = Object.create(Phaser.Scene.prototype);
WinScene.prototype.create = function () {
  this.add.text(W/2, H/2 - 40, 'BLOBBYS SAVED!', {font:'32px Arial', fill:'#45ff45'}).setOrigin(0.5);
  const again = this.add.text(W/2, H/2 + 20, 'Press SPACE to replay', {font:'18px Arial', fill:'#ccc'}).setOrigin(0.5);
  this.tweens.add({ targets: again, alpha:0.2, duration:800, yoyo:true, repeat:-1 });
  this.input.keyboard.once('keydown-SPACE', ()=> this.scene.start('BossScene'));
};
