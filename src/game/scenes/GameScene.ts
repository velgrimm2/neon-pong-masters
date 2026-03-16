import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TABLE, COLORS } from '../config';
import { GameState } from '../GameState';

export class GameScene extends Phaser.Scene {
  // Game objects
  private playerPaddle!: Phaser.GameObjects.Sprite;
  private aiPaddle!: Phaser.GameObjects.Sprite;
  private ball!: Phaser.GameObjects.Sprite;
  private ballShadow!: Phaser.GameObjects.Ellipse;
  private ballTrail!: Phaser.GameObjects.Graphics;

  // Physics bodies
  private playerBody!: Phaser.Physics.Arcade.Body;
  private aiBody!: Phaser.Physics.Arcade.Body;
  private ballBody!: Phaser.Physics.Arcade.Body;

  // Table bounds
  private tableLeft = TABLE.marginX;
  private tableRight = GAME_WIDTH - TABLE.marginX;
  private tableTop = TABLE.marginTop;
  private tableBottom = GAME_HEIGHT - TABLE.marginBottom;

  // Scores
  private playerScore = 0;
  private aiScore = 0;
  private scoreTextPlayer!: Phaser.GameObjects.Text;
  private scoreTextAI!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;

  // Ball state
  private ballSpeed = 300;
  private ballSpeedBase = 300;
  private rallyCount = 0;
  private serving = true;
  private serverIsPlayer = true;

  // Paddle velocity tracking
  private prevPointerX = 0;
  private prevPointerY = 0;
  private padVX = 0;
  private padVY = 0;

  // AI
  private aiTargetX = GAME_WIDTH / 2;
  private aiTargetY = 100;
  private aiSpeed = 3;
  private aiReactionDelay = 0;

  // Particles
  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Pause
  private isPaused = false;
  private pauseBtn!: Phaser.GameObjects.Container;
  private pauseOverlay!: Phaser.GameObjects.Container;

  // Sounds
  private hitSound!: Phaser.Sound.BaseSound;
  private smashSound!: Phaser.Sound.BaseSound;

  // Trail positions
  private trailPositions: { x: number; y: number; alpha: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.playerScore = 0;
    this.aiScore = 0;
    this.rallyCount = 0;
    this.ballSpeed = this.ballSpeedBase;
    this.serving = true;
    this.serverIsPlayer = true;
    this.isPaused = false;
    this.trailPositions = [];

    // Set AI difficulty
    switch (GameState.difficulty) {
      case 'easy': this.aiSpeed = 2.2; this.aiReactionDelay = 200; break;
      case 'medium': this.aiSpeed = 3.5; this.aiReactionDelay = 80; break;
      case 'hard': this.aiSpeed = 5; this.aiReactionDelay = 20; break;
    }

    // Draw table
    this.drawTable();

    // Sounds
    this.hitSound = this.sound.add('hit', { volume: 0.4 });
    this.smashSound = this.sound.add('smash', { volume: 0.5 });

    // Ball trail graphics
    this.ballTrail = this.add.graphics().setDepth(3);

    // Ball shadow
    this.ballShadow = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2, 22, 10, 0x000000, 0.25).setDepth(3);

    // Ball
    this.ball = this.physics.add.sprite(GAME_WIDTH / 2, TABLE.netY + 100, 'ball').setDepth(5);
    this.ball.setDisplaySize(18, 18);
    this.ball.setCircle(this.ball.width / 2);
    this.ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    this.ballBody.setCollideWorldBounds(false);
    this.ballBody.setBounce(1, 1);

    // Player paddle
    this.playerPaddle = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - TABLE.marginBottom - 40, 'paddle').setDepth(6);
    this.playerPaddle.setDisplaySize(50, 50);
    this.playerBody = this.playerPaddle.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setImmovable(true);
    this.playerBody.setCircle(25);

    // AI paddle
    this.aiPaddle = this.physics.add.sprite(GAME_WIDTH / 2, TABLE.marginTop + 40, 'paddle').setDepth(6);
    this.aiPaddle.setDisplaySize(46, 46);
    this.aiPaddle.setTint(COLORS.cyan);
    this.aiBody = this.aiPaddle.body as Phaser.Physics.Arcade.Body;
    this.aiBody.setImmovable(true);
    this.aiBody.setCircle(23);

    // Hit particles using built-in graphics
    const particleGraphics = this.add.graphics();
    particleGraphics.fillStyle(0xffffff, 1);
    particleGraphics.fillCircle(4, 4, 4);
    particleGraphics.generateTexture('spark', 8, 8);
    particleGraphics.destroy();

    this.hitParticles = this.add.particles(0, 0, 'spark', {
      speed: { min: 50, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      blendMode: 'ADD',
      emitting: false,
    }).setDepth(10);

    // Collisions
    this.physics.add.overlap(this.ball, this.playerPaddle, this.onPlayerHit, undefined, this);
    this.physics.add.overlap(this.ball, this.aiPaddle, this.onAIHit, undefined, this);

    // HUD
    this.createHUD();

    // Pause button
    this.createPauseButton();

    // Input
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      const nx = pointer.x;
      const ny = pointer.y;
      this.padVX = nx - this.prevPointerX;
      this.padVY = ny - this.prevPointerY;
      this.prevPointerX = nx;
      this.prevPointerY = ny;

      // Clamp to player area
      const clampedX = Phaser.Math.Clamp(nx, this.tableLeft + 20, this.tableRight - 20);
      const clampedY = Phaser.Math.Clamp(ny, TABLE.netY + 30, this.tableBottom - 10);
      this.playerPaddle.setPosition(clampedX, clampedY);
    });

    // Serve on tap
    this.input.on('pointerdown', () => {
      if (this.serving && this.serverIsPlayer) {
        this.serveBall(true);
      }
    });

    // Start with serve
    this.showServePrompt();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(time: number, delta: number) {
    if (this.isPaused) return;

    // AI movement
    this.updateAI(delta);

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

    // Scoring: ball past top or bottom
    if (this.ball.y < this.tableTop - 30 && !this.serving) {
      this.scorePoint(true); // Player scores
    }
    if (this.ball.y > this.tableBottom + 30 && !this.serving) {
      this.scorePoint(false); // AI scores
    }

    // AI auto-serve
    if (this.serving && !this.serverIsPlayer) {
      this.time.delayedCall(800, () => {
        if (this.serving && !this.serverIsPlayer) {
          this.serveBall(false);
        }
      });
    }
  }

  private drawTable() {
    const g = this.add.graphics().setDepth(1);

    // Table background
    g.fillStyle(TABLE.color, 1);
    g.fillRoundedRect(this.tableLeft, this.tableTop, this.tableRight - this.tableLeft, this.tableBottom - this.tableTop, 8);

    // Table border
    g.lineStyle(2, TABLE.borderColor, 1);
    g.strokeRoundedRect(this.tableLeft, this.tableTop, this.tableRight - this.tableLeft, this.tableBottom - this.tableTop, 8);

    // Center line
    g.lineStyle(2, 0xffffff, 0.15);
    g.lineBetween(this.tableLeft + 10, TABLE.netY, this.tableRight - 10, TABLE.netY);

    // Net (thicker line with dots)
    g.lineStyle(3, 0xffffff, 0.7);
    g.lineBetween(this.tableLeft - 5, TABLE.netY, this.tableRight + 5, TABLE.netY);
    // Net posts
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(this.tableLeft - 5, TABLE.netY, 4);
    g.fillCircle(this.tableRight + 5, TABLE.netY, 4);

    // Center dashed line
    for (let y = this.tableTop + 20; y < this.tableBottom - 20; y += 20) {
      if (Math.abs(y - TABLE.netY) < 15) continue;
      g.fillStyle(0xffffff, 0.08);
      g.fillRect(GAME_WIDTH / 2 - 1, y, 2, 10);
    }
  }

  private createHUD() {
    // AI score (top)
    this.scoreTextAI = this.add.text(GAME_WIDTH / 2, 25, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#22d3ee',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20).setAlpha(0.6);

    // Player score (bottom)
    this.scoreTextPlayer = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#a78bfa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20).setAlpha(0.6);

    // Coin display
    this.coinText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT / 2, `🪙 ${GameState.coins}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(20).setAlpha(0.5).setAngle(90);
  }

  private createPauseButton() {
    this.pauseBtn = this.add.container(GAME_WIDTH - 30, 25).setDepth(30);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xffffff, 0.1);
    btnBg.fillCircle(0, 0, 18);
    const bar1 = this.add.rectangle(-4, 0, 3, 14, 0xe8e8f0);
    const bar2 = this.add.rectangle(4, 0, 3, 14, 0xe8e8f0);
    this.pauseBtn.add([btnBg, bar1, bar2]);
    this.pauseBtn.setSize(36, 36);
    this.pauseBtn.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
    this.pauseBtn.on('pointerdown', () => this.togglePause());
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.showPauseOverlay();
    } else {
      this.physics.resume();
      if (this.pauseOverlay) this.pauseOverlay.destroy();
    }
  }

  private showPauseOverlay() {
    this.pauseOverlay = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    dim.setInteractive();

    const pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'PAUSED', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#e8e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'RESUME', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#6c63ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => this.togglePause());

    const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'MAIN MENU', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9999aa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.physics.resume();
      this.scene.start('MenuScene');
    });

    this.pauseOverlay.add([dim, pauseText, resumeBtn, menuBtn]);
  }

  private showServePrompt() {
    this.serving = true;
    const serveText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 
      this.serverIsPlayer ? 'TAP TO SERVE' : '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9999aa',
      letterSpacing: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);

    // Position ball for serve
    if (this.serverIsPlayer) {
      this.ball.setPosition(this.playerPaddle.x, this.playerPaddle.y - 20);
      this.ballBody.setVelocity(0, 0);
    } else {
      this.ball.setPosition(this.aiPaddle.x, this.aiPaddle.y + 20);
      this.ballBody.setVelocity(0, 0);
    }

    this.time.delayedCall(500, () => serveText.destroy());
  }

  private serveBall(byPlayer: boolean) {
    this.serving = false;
    this.rallyCount = 0;
    this.ballSpeed = this.ballSpeedBase;

    const angle = Phaser.Math.FloatBetween(-0.3, 0.3);
    if (byPlayer) {
      this.ballBody.setVelocity(Math.sin(angle) * this.ballSpeed, -this.ballSpeed);
    } else {
      this.ballBody.setVelocity(Math.sin(angle) * this.ballSpeed, this.ballSpeed);
    }
  }

  private onPlayerHit() {
    if (this.serving) return;
    if (this.ballBody.velocity.y < 0) return; // Already going up after being hit

    this.rallyCount++;
    const speedBoost = Math.min(this.rallyCount * 15, 200);
    this.ballSpeed = this.ballSpeedBase + speedBoost;

    // Calculate hit angle based on paddle velocity and hit position
    const hitOffsetX = (this.ball.x - this.playerPaddle.x) / 25;
    const spinX = this.padVX * 3 + hitOffsetX * 120;
    const speed = Math.sqrt(this.padVX * this.padVX + this.padVY * this.padVY);
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
      this.cameras.main.shake(100, 0.008);
      // Ball squash
      this.tweens.add({
        targets: this.ball,
        scaleX: 1.4,
        scaleY: 0.7,
        duration: 60,
        yoyo: true,
      });
    } else {
      this.hitSound.play();
      this.tweens.add({
        targets: this.ball,
        scaleX: 1.2,
        scaleY: 0.85,
        duration: 50,
        yoyo: true,
      });
    }
  }

  private onAIHit() {
    if (this.serving) return;
    if (this.ballBody.velocity.y > 0) return;

    this.rallyCount++;
    const speedBoost = Math.min(this.rallyCount * 15, 200);
    this.ballSpeed = this.ballSpeedBase + speedBoost;

    const hitOffsetX = (this.ball.x - this.aiPaddle.x) / 25;
    const spinX = hitOffsetX * 100;
    this.ballBody.setVelocity(
      Phaser.Math.Clamp(spinX, -200, 200),
      this.ballSpeed
    );

    this.hitParticles.emitParticleAt(this.ball.x, this.ball.y, 4);
    this.hitSound.play();

    this.tweens.add({
      targets: this.ball,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });
  }

  private updateAI(delta: number) {
    if (this.serving && !this.serverIsPlayer) {
      // Move to center when about to serve
      this.aiTargetX = GAME_WIDTH / 2;
      this.aiTargetY = TABLE.marginTop + 40;
    } else {
      // Predict ball position
      if (this.ballBody.velocity.y < 0) {
        // Ball coming toward AI
        const timeToReach = Math.abs(this.aiPaddle.y - this.ball.y) / Math.abs(this.ballBody.velocity.y);
        this.aiTargetX = this.ball.x + this.ballBody.velocity.x * timeToReach * 0.7;
        this.aiTargetY = TABLE.marginTop + 35 + Math.random() * 15;
      } else {
        // Ball going away, return to center
        this.aiTargetX = GAME_WIDTH / 2 + (Math.random() - 0.5) * 40;
        this.aiTargetY = TABLE.marginTop + 45;
      }
    }

    // Smooth movement
    const dx = this.aiTargetX - this.aiPaddle.x;
    const dy = this.aiTargetY - this.aiPaddle.y;
    const speed = this.aiSpeed * (delta / 16);

    this.aiPaddle.x += dx * 0.08 * speed;
    this.aiPaddle.y += dy * 0.06 * speed;

    // Clamp AI to its area
    this.aiPaddle.x = Phaser.Math.Clamp(this.aiPaddle.x, this.tableLeft + 20, this.tableRight - 20);
    this.aiPaddle.y = Phaser.Math.Clamp(this.aiPaddle.y, this.tableTop + 10, TABLE.netY - 30);
  }

  private scorePoint(playerScored: boolean) {
    this.serving = true;

    if (playerScored) {
      this.playerScore++;
      GameState.coins += 2;
      this.scoreTextPlayer.setText(String(this.playerScore));
      this.tweens.add({
        targets: this.scoreTextPlayer,
        scale: 1.5,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });
      // Coin float
      this.showCoinFloat(this.ball.x, this.ball.y, '+2');
    } else {
      this.aiScore++;
      this.scoreTextAI.setText(String(this.aiScore));
      this.tweens.add({
        targets: this.scoreTextAI,
        scale: 1.5,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }

    this.coinText.setText(`🪙 ${GameState.coins}`);

    // Check win condition
    const ptsToWin = GameState.pointsToWin;
    if (
      (this.playerScore >= ptsToWin || this.aiScore >= ptsToWin) &&
      Math.abs(this.playerScore - this.aiScore) >= 2
    ) {
      this.endMatch();
      return;
    }

    // Setup next serve
    this.serverIsPlayer = !playerScored;
    this.time.delayedCall(600, () => {
      if (this.scene.isActive()) {
        this.showServePrompt();
      }
    });
  }

  private showCoinFloat(x: number, y: number, text: string) {
    const coinFloat = this.add.text(x, y, `🪙 ${text}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: coinFloat,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => coinFloat.destroy(),
    });
  }

  private endMatch() {
    const playerWon = this.playerScore > this.aiScore;
    GameState.lastWinner = playerWon ? 'You' : 'CPU';
    GameState.lastScorePlayer = this.playerScore;
    GameState.lastScoreAI = this.aiScore;

    if (playerWon) {
      GameState.coins += 10;
    }

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene');
    });
  }
}
