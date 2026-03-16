import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { StoreScene } from './scenes/StoreScene';
import { GameOverScene } from './scenes/GameOverScene';

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 700;

export const TABLE = {
  marginX: 30,
  marginTop: 80,
  marginBottom: 80,
  netY: 350,
  color: 0x1e3a5f,
  borderColor: 0x2a2a4a,
  lineColor: 0xffffff,
};

export const COLORS = {
  bg: 0x1a1a2e,
  accent: 0x6c63ff,
  accentLight: 0x8b83ff,
  gold: 0xfbbf24,
  green: 0x34d399,
  red: 0xf87171,
  cyan: 0x22d3ee,
  purple: 0xa78bfa,
  text: 0xe8e8f0,
  textDim: 0x9999aa,
  surface: 0x252545,
};

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene, StoreScene, GameOverScene],
  };
}
