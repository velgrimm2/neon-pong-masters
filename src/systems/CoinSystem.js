import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TABLE } from '../config.js';
import { GameState, saveGameState } from '../GameState.js';

export class CoinSystem {
  constructor(scene) {
    this.scene = scene;

    this.coinText = this.scene.add.text(GAME_WIDTH - 20, GAME_HEIGHT / 2, `🪙 ${GameState.coins}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(20).setAlpha(0.5).setAngle(90);
  }

  addCoins(amount) {
    GameState.coins += amount;
    saveGameState();
    this.coinText.setText(`🪙 ${GameState.coins}`);
  }

  showCoinFloat(x, y, text) {
    const coinFloat = this.scene.add.text(x, y, `🪙 ${text}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);

    this.scene.tweens.add({
      targets: coinFloat,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => coinFloat.destroy(),
    });
  }
}
