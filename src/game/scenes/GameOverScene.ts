import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../GameState';
import { createButton } from '../ui/Button';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const playerWon = GameState.lastWinner === 'You';

    // Background
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    // Confetti for winner
    if (playerWon) {
      this.createConfetti();
    }

    // Trophy / result icon
    const icon = this.add.text(cx, 160, playerWon ? '🏆' : '😞', {
      fontSize: '72px',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: icon,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Winner text
    this.add.text(cx, 230, playerWon ? 'YOU WIN!' : 'YOU LOSE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: playerWon ? '#34d399' : '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score
    this.add.text(cx, 280, `${GameState.lastScorePlayer} - ${GameState.lastScoreAI}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '24px',
      color: '#e8e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Coins earned
    if (playerWon) {
      const coinText = this.add.text(cx, 320, '🪙 +10 coins!', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        color: '#fbbf24',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: coinText,
        y: 315,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Total coins
    this.add.text(cx, 360, `Total: 🪙 ${GameState.coins}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9999aa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Buttons
    createButton(this, cx, 430, 'PLAY AGAIN', COLORS.accent, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });

    createButton(this, cx, 490, 'MAIN MENU', 0x444466, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('MenuScene'));
    }, '#e8e8f0');

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createConfetti() {
    const colors = [0xff6b6b, 0xfbbf24, 0x34d399, 0x6c63ff, 0x22d3ee, 0xa78bfa];
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const color = Phaser.Math.RND.pick(colors);
      const size = Phaser.Math.Between(4, 8);
      const confetti = this.add.rectangle(x, -10, size, size, color).setDepth(100);
      confetti.setAngle(Phaser.Math.Between(0, 360));

      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 20,
        angle: Phaser.Math.Between(180, 720),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Power1',
        onComplete: () => confetti.destroy(),
      });
    }
  }
}
