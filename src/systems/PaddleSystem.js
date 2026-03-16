import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TABLE } from '../config.js';

export class PaddleSystem {
  constructor(scene) {
    this.scene = scene;

    // Player paddle
    this.playerPaddle = this.scene.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - TABLE.marginBottom - 40, 'paddle').setDepth(6);
    this.playerPaddle.setDisplaySize(50, 50);
    this.playerBody = this.playerPaddle.body;
    this.playerBody.setImmovable(true);
    this.playerBody.setCircle(25);

    this.prevPointerX = 0;
    this.prevPointerY = 0;
    this.padVX = 0;
    this.padVY = 0;

    // Bounds
    this.tableLeft = TABLE.marginX;
    this.tableRight = GAME_WIDTH - TABLE.marginX;
    this.tableTop = TABLE.marginTop;
    this.tableBottom = GAME_HEIGHT - TABLE.marginBottom;
  }

  update(pointer, isPaused) {
    if (isPaused) return;

    const nx = pointer.x;
    const ny = pointer.y;

    // Calculate velocity based on pointer delta
    this.padVX = nx - this.prevPointerX;
    this.padVY = ny - this.prevPointerY;

    this.prevPointerX = nx;
    this.prevPointerY = ny;

    // Clamp to player area
    const clampedX = Phaser.Math.Clamp(nx, this.tableLeft + 20, this.tableRight - 20);
    const clampedY = Phaser.Math.Clamp(ny, TABLE.netY + 30, this.tableBottom - 10);

    this.playerPaddle.setPosition(clampedX, clampedY);
  }
}
