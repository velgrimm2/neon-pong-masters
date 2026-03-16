import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TABLE, COLORS } from '../config.js';
import { GameState } from '../GameState.js';

export class AISystem {
  constructor(scene) {
    this.scene = scene;

    // AI paddle
    this.aiPaddle = this.scene.physics.add.sprite(GAME_WIDTH / 2, TABLE.marginTop + 40, 'paddle').setDepth(6);
    this.aiPaddle.setDisplaySize(46, 46);
    this.aiPaddle.setTint(COLORS.cyan);

    this.aiBody = this.aiPaddle.body;
    this.aiBody.setImmovable(true);
    this.aiBody.setCircle(23);

    // AI Variables
    this.aiTargetX = GAME_WIDTH / 2;
    this.aiTargetY = 100;
    this.aiSpeed = 3;
    this.aiReactionDelay = 0;

    this.tableLeft = TABLE.marginX;
    this.tableRight = GAME_WIDTH - TABLE.marginX;
    this.tableTop = TABLE.marginTop;
    this.tableBottom = GAME_HEIGHT - TABLE.marginBottom;

    this.setDifficulty(GameState.difficulty);
  }

  setDifficulty(difficulty) {
    switch (difficulty) {
      case 'easy': this.aiSpeed = 2.2; this.aiReactionDelay = 200; break;
      case 'medium': this.aiSpeed = 3.5; this.aiReactionDelay = 80; break;
      case 'hard': this.aiSpeed = 5; this.aiReactionDelay = 20; break;
      default: this.aiSpeed = 3.5; this.aiReactionDelay = 80;
    }
  }

  update(delta, ball, ballBody, serving, serverIsPlayer) {
    if (serving && !serverIsPlayer) {
      // Move to center when about to serve
      this.aiTargetX = GAME_WIDTH / 2;
      this.aiTargetY = TABLE.marginTop + 40;
    } else {
      // Predict ball position
      if (ballBody.velocity.y < 0) {
        // Ball coming toward AI
        const timeToReach = Math.abs(this.aiPaddle.y - ball.y) / Math.abs(ballBody.velocity.y);
        this.aiTargetX = ball.x + ballBody.velocity.x * timeToReach * 0.7;
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
}
