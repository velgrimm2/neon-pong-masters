import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Loading bar
    const w = GAME_WIDTH * 0.6;
    const h = 8;
    const x = (GAME_WIDTH - w) / 2;
    const y = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(GAME_WIDTH / 2, y, w, h, 0x333355);
    const bar = this.add.rectangle(x + 2, y, 0, h - 4, COLORS.accent).setOrigin(0, 0.5);

    this.load.on('progress', (val: number) => {
      bar.width = (w - 4) * val;
    });

    const loadingText = this.add.text(GAME_WIDTH / 2, y - 30, 'LOADING...', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#9999aa',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Load assets
    this.load.image('paddle', '/images/paddle.png');
    this.load.image('ball', '/images/ball.png');
    this.load.audio('hit', '/sounds/ping_pong_hit.wav');
    this.load.audio('smash', '/sounds/ping_pong_smash.wav');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
