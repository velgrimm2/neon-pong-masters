import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TABLE } from '../config.js';

export class BallSystem {
  constructor(scene) {
    this.scene = scene;

    // Ball shadow
    this.ballShadow = this.scene.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2, 22, 10, 0x000000, 0.25).setDepth(3);

    // Ball Trail
    this.ballTrail = this.scene.add.graphics().setDepth(3);
    this.trailPositions = [];

    // Ball
    this.ball = this.scene.physics.add.sprite(GAME_WIDTH / 2, TABLE.netY + 100, 'ball').setDepth(5);
    this.ball.setDisplaySize(18, 18);

    this.ballBody = this.ball.body;
    this.ballBody.setCircle(9);
    this.ballBody.setCollideWorldBounds(false);
    this.ballBody.setBounce(1, 1);

    this.ballSpeedBase = 300;
    this.ballSpeed = this.ballSpeedBase;
    this.rallyCount = 0;

    // Bounds
    this.tableLeft = TABLE.marginX;
    this.tableRight = GAME_WIDTH - TABLE.marginX;

    this.hitSound = this.scene.sound.add('hit', { volume: 0.4 });
    this.smashSound = this.scene.sound.add('smash', { volume: 0.5 });

    // Particles
    const particleGraphics = this.scene.add.graphics();
    particleGraphics.fillStyle(0xffffff, 1);
    particleGraphics.fillCircle(4, 4, 4);
    particleGraphics.generateTexture('spark', 8, 8);
    particleGraphics.destroy();

    this.hitParticles = this.scene.add.particles(0, 0, 'spark', {
      speed: { min: 50, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      blendMode: 'ADD',
      emitting: false,
    }).setDepth(10);
  }

  update() {
    // Side boundary bounce
    if (this.ball.x <= this.tableLeft + 9) {
      this.ball.x = this.tableLeft + 10;
      this.ballBody.setVelocityX(Math.abs(this.ballBody.velocity.x));
    }
    if (this.ball.x >= this.tableRight - 9) {
      this.ball.x = this.tableRight - 10;
      this.ballBody.setVelocityX(-Math.abs(this.ballBody.velocity.x));
    }

    // Ball shadow
    this.ballShadow.setPosition(this.ball.x + 3, this.ball.y + 6);

    // Ball trail
    this.trailPositions.unshift({ x: this.ball.x, y: this.ball.y, alpha: 0.5 });
    if (this.trailPositions.length > 8) this.trailPositions.pop();
    this.trailPositions.forEach(p => p.alpha *= 0.85);
    this.ballTrail.clear();
    this.trailPositions.forEach((p, i) => {
      if (i === 0) return;
      const size = 9 - i;
      if (size > 0) {
        this.ballTrail.fillStyle(0xffffff, p.alpha * 0.3);
        this.ballTrail.fillCircle(p.x, p.y, size);
      }
    });
  }

  serveBall(byPlayer) {
    this.rallyCount = 0;
    this.ballSpeed = this.ballSpeedBase;

    const angle = Phaser.Math.FloatBetween(-0.3, 0.3);
    if (byPlayer) {
      this.ballBody.setVelocity(Math.sin(angle) * this.ballSpeed, -this.ballSpeed);
    } else {
      this.ballBody.setVelocity(Math.sin(angle) * this.ballSpeed, this.ballSpeed);
    }
  }

  handlePlayerHit(playerPaddle, padVX, padVY) {
    if (this.ballBody.velocity.y < 0) return; // Already going up

    this.rallyCount++;
    const speedBoost = Math.min(this.rallyCount * 15, 200);
    this.ballSpeed = this.ballSpeedBase + speedBoost;

    // Calculate hit angle based on paddle velocity and hit position
    const hitOffsetX = (this.ball.x - playerPaddle.x) / 25;
    const spinX = padVX * 3 + hitOffsetX * 120;
    const speed = Math.sqrt(padVX * padVX + padVY * padVY);
    const isSmash = speed > 12;

    const vy = isSmash ? -(this.ballSpeed * 1.6) : -this.ballSpeed;
    this.ballBody.setVelocity(
      Phaser.Math.Clamp(spinX, -250, 250),
      vy
    );

    // Effects
    this.hitParticles.emitParticleAt(this.ball.x, this.ball.y, isSmash ? 12 : 5);

    if (isSmash) {
      this.smashSound.play();
      this.scene.cameras.main.shake(100, 0.008);
      // Ball squash
      this.scene.tweens.add({
        targets: this.ball,
        scaleX: 1.4,
        scaleY: 0.7,
        duration: 60,
        yoyo: true,
      });
    } else {
      this.hitSound.play();
      this.scene.tweens.add({
        targets: this.ball,
        scaleX: 1.2,
        scaleY: 0.85,
        duration: 50,
        yoyo: true,
      });
    }
  }

  handleAIHit(aiPaddle) {
    if (this.ballBody.velocity.y > 0) return; // Already going down

    this.rallyCount++;
    const speedBoost = Math.min(this.rallyCount * 15, 200);
    this.ballSpeed = this.ballSpeedBase + speedBoost;

    const hitOffsetX = (this.ball.x - aiPaddle.x) / 25;
    const spinX = hitOffsetX * 100;
    this.ballBody.setVelocity(
      Phaser.Math.Clamp(spinX, -200, 200),
      this.ballSpeed
    );

    this.hitParticles.emitParticleAt(this.ball.x, this.ball.y, 4);
    this.hitSound.play();

    this.scene.tweens.add({
      targets: this.ball,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });
  }
}
