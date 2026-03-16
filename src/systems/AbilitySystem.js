import Phaser from 'phaser';
import { GameState } from '../GameState.js';

export class AbilitySystem {
  constructor(scene) {
    this.scene = scene;
  }

  hasAbility(id) {
    return GameState.equippedAbilities.includes(id);
  }

  // Hook point when ball hits paddle
  onPaddleHit(paddle, ball, isPlayer) {
    if (!isPlayer) return;

    // Apply speed powerup effect if applicable
    if (this.hasAbility('fireball')) {
       // example implementation
    }
  }
}
