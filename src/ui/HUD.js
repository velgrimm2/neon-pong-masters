import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TABLE } from '../config.js';
import { GameState } from '../GameState.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;

    // AI score (top)
    this.scoreTextAI = this.scene.add.text(GAME_WIDTH / 2, 25, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#22d3ee',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20).setAlpha(0.6);

    // Player score (bottom)
    this.scoreTextPlayer = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#a78bfa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20).setAlpha(0.6);

    // Pause overlay
    this.isPaused = false;
    this.createPauseButton();
  }

  updateScore(playerScore, aiScore) {
    this.scoreTextPlayer.setText(String(playerScore));
    this.scoreTextAI.setText(String(aiScore));

    this.scene.tweens.add({
      targets: [this.scoreTextPlayer, this.scoreTextAI],
      scale: 1.5,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  createPauseButton() {
    this.pauseBtn = this.scene.add.container(GAME_WIDTH - 30, 25).setDepth(30);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0xffffff, 0.1);
    btnBg.fillCircle(0, 0, 18);
    const bar1 = this.scene.add.rectangle(-4, 0, 3, 14, 0xe8e8f0);
    const bar2 = this.scene.add.rectangle(4, 0, 3, 14, 0xe8e8f0);
    this.pauseBtn.add([btnBg, bar1, bar2]);
    this.pauseBtn.setSize(36, 36);
    this.pauseBtn.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
    this.pauseBtn.on('pointerdown', () => this.togglePause());
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.scene.physics.pause();
      this.showPauseOverlay();
    } else {
      this.scene.physics.resume();
      if (this.pauseOverlay) this.pauseOverlay.destroy();
    }
  }

  showPauseOverlay() {
    this.pauseOverlay = this.scene.add.container(0, 0).setDepth(50);
    const dim = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    dim.setInteractive();

    const pauseText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'PAUSED', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#e8e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const resumeBtn = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'RESUME', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#6c63ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => this.togglePause());

    const menuBtn = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'MAIN MENU', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9999aa',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.scene.physics.resume();
      this.scene.scene.start('MenuScene');
    });

    this.pauseOverlay.add([dim, pauseText, resumeBtn, menuBtn]);
  }
}
