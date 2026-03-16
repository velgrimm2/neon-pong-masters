import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TABLE, COLORS } from '../config.js';
import { GameState, saveGameState } from '../GameState.js';
import { PaddleSystem } from '../systems/PaddleSystem.js';
import { AISystem } from '../systems/AISystem.js';
import { BallSystem } from '../systems/BallSystem.js';
import { CoinSystem } from '../systems/CoinSystem.js';
import { AbilitySystem } from '../systems/AbilitySystem.js';
import { HUD } from '../ui/HUD.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.playerScore = 0;
    this.aiScore = 0;
    this.serving = true;
    this.serverIsPlayer = true;

    // Draw table
    this.drawTable();

    // Initialize systems
    this.paddleSystem = new PaddleSystem(this);
    this.aiSystem = new AISystem(this);
    this.ballSystem = new BallSystem(this);
    this.coinSystem = new CoinSystem(this);
    this.abilitySystem = new AbilitySystem(this);
    this.hud = new HUD(this);

    // Collisions
    this.physics.add.overlap(this.ballSystem.ball, this.paddleSystem.playerPaddle, this.onPlayerHit, undefined, this);
    this.physics.add.overlap(this.ballSystem.ball, this.aiSystem.aiPaddle, this.onAIHit, undefined, this);

    // Input
    this.input.on('pointermove', (pointer) => {
      this.paddleSystem.update(pointer, this.hud.isPaused);
    });

    this.input.on('pointerdown', () => {
      if (this.serving && this.serverIsPlayer && !this.hud.isPaused) {
        this.serveBall(true);
      }
    });

    // Start
    this.showServePrompt();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(time, delta) {
    if (this.hud.isPaused) return;

    this.aiSystem.update(delta, this.ballSystem.ball, this.ballSystem.ballBody, this.serving, this.serverIsPlayer);
    this.ballSystem.update();

    // Scoring
    if (this.ballSystem.ball.y < TABLE.marginTop - 30 && !this.serving) {
      this.scorePoint(true);
    }
    if (this.ballSystem.ball.y > GAME_HEIGHT - TABLE.marginBottom + 30 && !this.serving) {
      this.scorePoint(false);
    }

    // AI auto-serve
    if (this.serving && !this.serverIsPlayer) {
      this.time.delayedCall(800, () => {
        if (this.serving && !this.serverIsPlayer && !this.hud.isPaused) {
          this.serveBall(false);
        }
      });
    }
  }

  drawTable() {
    const g = this.add.graphics().setDepth(1);

    // Table background
    g.fillStyle(TABLE.color, 1);
    g.fillRoundedRect(TABLE.marginX, TABLE.marginTop, GAME_WIDTH - TABLE.marginX * 2, GAME_HEIGHT - TABLE.marginTop - TABLE.marginBottom, 8);

    // Table border
    g.lineStyle(2, TABLE.borderColor, 1);
    g.strokeRoundedRect(TABLE.marginX, TABLE.marginTop, GAME_WIDTH - TABLE.marginX * 2, GAME_HEIGHT - TABLE.marginTop - TABLE.marginBottom, 8);

    // Center line
    g.lineStyle(2, 0xffffff, 0.15);
    g.lineBetween(TABLE.marginX + 10, TABLE.netY, GAME_WIDTH - TABLE.marginX - 10, TABLE.netY);

    // Net
    g.lineStyle(3, 0xffffff, 0.7);
    g.lineBetween(TABLE.marginX - 5, TABLE.netY, GAME_WIDTH - TABLE.marginX + 5, TABLE.netY);

    // Net posts
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(TABLE.marginX - 5, TABLE.netY, 4);
    g.fillCircle(GAME_WIDTH - TABLE.marginX + 5, TABLE.netY, 4);

    // Center dashed line
    for (let y = TABLE.marginTop + 20; y < GAME_HEIGHT - TABLE.marginBottom - 20; y += 20) {
      if (Math.abs(y - TABLE.netY) < 15) continue;
      g.fillStyle(0xffffff, 0.08);
      g.fillRect(GAME_WIDTH / 2 - 1, y, 2, 10);
    }
  }

  showServePrompt() {
    this.serving = true;
    const serveText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60,
      this.serverIsPlayer ? 'TAP TO SERVE' : '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9999aa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);

    if (this.serverIsPlayer) {
      this.ballSystem.ball.setPosition(this.paddleSystem.playerPaddle.x, this.paddleSystem.playerPaddle.y - 20);
      this.ballSystem.ballBody.setVelocity(0, 0);
    } else {
      this.ballSystem.ball.setPosition(this.aiSystem.aiPaddle.x, this.aiSystem.aiPaddle.y + 20);
      this.ballSystem.ballBody.setVelocity(0, 0);
    }

    this.time.delayedCall(500, () => serveText.destroy());
  }

  serveBall(byPlayer) {
    this.serving = false;
    this.ballSystem.serveBall(byPlayer);
  }

  onPlayerHit() {
    if (this.serving) return;
    this.ballSystem.handlePlayerHit(this.paddleSystem.playerPaddle, this.paddleSystem.padVX, this.paddleSystem.padVY);
  }

  onAIHit() {
    if (this.serving) return;
    this.ballSystem.handleAIHit(this.aiSystem.aiPaddle);
  }

  scorePoint(playerScored) {
    this.serving = true;

    if (playerScored) {
      this.playerScore++;
      this.coinSystem.addCoins(2);
      this.coinSystem.showCoinFloat(this.ballSystem.ball.x, this.ballSystem.ball.y, '+2');
    } else {
      this.aiScore++;

      // Handle Shield ability auto-save logic if opponent scores
      if (this.abilitySystem.hasAbility('shield')) {
        // Implement shield block point logic if needed or just let it pass
      }
    }

    this.hud.updateScore(this.playerScore, this.aiScore);

    // Check win
    const ptsToWin = GameState.pointsToWin;
    if ((this.playerScore >= ptsToWin || this.aiScore >= ptsToWin) && Math.abs(this.playerScore - this.aiScore) >= 2) {
      this.endMatch();
      return;
    }

    // Next serve
    this.serverIsPlayer = !playerScored;
    this.time.delayedCall(600, () => {
      if (this.scene.isActive()) {
        this.showServePrompt();
      }
    });
  }

  endMatch() {
    const playerWon = this.playerScore > this.aiScore;
    GameState.lastWinner = playerWon ? 'You' : 'CPU';
    GameState.lastScorePlayer = this.playerScore;
    GameState.lastScoreAI = this.aiScore;

    if (playerWon) {
      this.coinSystem.addCoins(10);
    }

    saveGameState();

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene');
    });
  }
}
