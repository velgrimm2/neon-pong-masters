import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../GameState';
import { createButton } from '../ui/Button';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;

    // Background gradient effect
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative circles
    const deco = this.add.graphics();
    deco.fillStyle(COLORS.accent, 0.05);
    deco.fillCircle(cx, 200, 180);
    deco.fillCircle(cx, 200, 120);

    // Title
    const title = this.add.text(cx, 140, '🏓', { fontSize: '64px' }).setOrigin(0.5);
    this.tweens.add({
      targets: title,
      y: 135,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(cx, 200, 'TABLE TENNIS', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#e8e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 232, 'ARCADE', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#666680',
      letterSpacing: 6,
    }).setOrigin(0.5);

    // Difficulty selector
    this.add.text(cx, 275, 'DIFFICULTY', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#666680',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
    const diffColors = { easy: COLORS.green, medium: COLORS.gold, hard: COLORS.red };
    const diffBtns: Phaser.GameObjects.Container[] = [];

    difficulties.forEach((diff, i) => {
      const bx = cx - 80 + i * 80;
      const isSelected = GameState.difficulty === diff;
      const btn = this.createDiffButton(bx, 305, diff.toUpperCase(), diffColors[diff], isSelected);
      diffBtns.push(btn);

      btn.setInteractive(new Phaser.Geom.Rectangle(-35, -14, 70, 28), Phaser.Geom.Rectangle.Contains);
      btn.on('pointerdown', () => {
        GameState.difficulty = diff;
        // Refresh buttons
        diffBtns.forEach((b, j) => {
          const bg = b.getAt(0) as Phaser.GameObjects.Graphics;
          const txt = b.getAt(1) as Phaser.GameObjects.Text;
          const sel = difficulties[j] === diff;
          bg.clear();
          if (sel) {
            bg.fillStyle(diffColors[difficulties[j]], 0.2);
            bg.fillRoundedRect(-35, -14, 70, 28, 14);
            bg.lineStyle(2, diffColors[difficulties[j]], 1);
            bg.strokeRoundedRect(-35, -14, 70, 28, 14);
            txt.setColor('#ffffff');
          } else {
            bg.fillStyle(0xffffff, 0.06);
            bg.fillRoundedRect(-35, -14, 70, 28, 14);
            txt.setColor('#9999aa');
          }
        });
      });
    });

    // Buttons
    const btnY = 380;
    createButton(this, cx, btnY, 'PLAY', COLORS.accent, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });

    createButton(this, cx, btnY + 60, 'STORE', COLORS.gold, () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => this.scene.start('StoreScene'));
    }, '#1a1a2e');

    createButton(this, cx, btnY + 120, 'HOW TO PLAY', 0x444466, () => {
      this.showHelp();
    }, '#e8e8f0');

    // Coins display
    this.add.text(cx, GAME_HEIGHT - 50, `🪙 ${GameState.coins}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createDiffButton(x: number, y: number, label: string, color: number, selected: boolean) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    if (selected) {
      bg.fillStyle(color, 0.2);
      bg.fillRoundedRect(-35, -14, 70, 28, 14);
      bg.lineStyle(2, color, 1);
      bg.strokeRoundedRect(-35, -14, 70, 28, 14);
    } else {
      bg.fillStyle(0xffffff, 0.06);
      bg.fillRoundedRect(-35, -14, 70, 28, 14);
    }
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: selected ? '#ffffff' : '#9999aa',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add([bg, txt]);
    return container;
  }

  private showHelp() {
    const overlay = this.add.container(0, 0).setDepth(100);
    const dimBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
    dimBg.setInteractive();

    const helpTexts = [
      '🎮 Move your paddle by touching/moving',
      '🏓 Hit the ball past your opponent to score',
      '⚡ Fast swipes = stronger hits',
      '🔄 Spin the ball by swiping sideways',
      '💰 Earn coins by winning points',
      '🛒 Buy abilities in the Store',
      '🎯 First to 11 points wins!',
    ];

    const panel = this.add.graphics();
    panel.fillStyle(0x252545, 0.95);
    panel.fillRoundedRect(20, 80, GAME_WIDTH - 40, GAME_HEIGHT - 160, 16);

    const title = this.add.text(GAME_WIDTH / 2, 110, 'HOW TO PLAY', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: '#e8e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const textObjects: Phaser.GameObjects.Text[] = [];
    helpTexts.forEach((t, i) => {
      textObjects.push(this.add.text(50, 155 + i * 50, t, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#ccccdd',
        wordWrap: { width: GAME_WIDTH - 100 },
      }));
    });

    const closeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 120, 'GOT IT', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#6c63ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => overlay.destroy());
    overlay.add([dimBg, panel, title, ...textObjects, closeBtn]);
  }
}
