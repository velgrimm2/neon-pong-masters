import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState, ABILITIES } from '../GameState';
import { createButton } from '../ui/Button';

export class StoreScene extends Phaser.Scene {
  private coinText!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'StoreScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;

    // Background
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    // Title
    this.add.text(cx, 35, 'STORE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '24px',
      color: '#e8e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Coins
    this.coinText = this.add.text(cx, 65, `🪙 ${GameState.coins}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Equipped slots
    this.add.text(cx, 95, 'EQUIPPED', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#666680',
      letterSpacing: 3,
    }).setOrigin(0.5);

    const slotStartX = cx - 30;
    for (let i = 0; i < GameState.maxEquipSlots; i++) {
      const sx = slotStartX + i * 60;
      const slotBg = this.add.graphics();
      const equipped = GameState.equippedAbilities[i];
      if (equipped) {
        slotBg.fillStyle(COLORS.accent, 0.15);
        slotBg.fillRoundedRect(sx - 22, 110, 44, 44, 10);
        slotBg.lineStyle(2, COLORS.accent, 0.6);
        slotBg.strokeRoundedRect(sx - 22, 110, 44, 44, 10);
        const ab = ABILITIES.find(a => a.id === equipped);
        if (ab) {
          this.add.text(sx, 132, ab.icon, { fontSize: '22px' }).setOrigin(0.5);
        }
      } else {
        slotBg.lineStyle(2, 0xffffff, 0.1);
        slotBg.strokeRoundedRect(sx - 22, 110, 44, 44, 10);
        this.add.text(sx, 132, '＋', { fontSize: '16px', color: '#444466' }).setOrigin(0.5);
      }
    }

    // Ability cards grid
    const cols = 2;
    const cardW = 160;
    const cardH = 155;
    const gap = 12;
    const startX = (GAME_WIDTH - (cols * cardW + (cols - 1) * gap)) / 2;
    const startY = 170;

    ABILITIES.forEach((ability, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gap) + cardW / 2;
      const y = startY + row * (cardH + gap) + cardH / 2;
      this.createAbilityCard(x, y, cardW, cardH, ability);
    });

    // Back button
    createButton(this, cx, GAME_HEIGHT - 45, 'BACK', 0x444466, () => {
      this.scene.start('MenuScene');
    }, '#e8e8f0');

    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  private createAbilityCard(x: number, y: number, w: number, h: number, ability: typeof ABILITIES[0]) {
    const owned = GameState.ownedAbilities.includes(ability.id);
    const equipped = GameState.equippedAbilities.includes(ability.id);

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    const borderColor = equipped ? COLORS.accent : owned ? COLORS.green : 0xffffff;
    const borderAlpha = equipped ? 0.7 : owned ? 0.5 : 0.12;
    bg.fillStyle(0xffffff, equipped ? 0.1 : 0.06);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(2, borderColor, borderAlpha);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    const icon = this.add.text(0, -h / 2 + 28, ability.icon, { fontSize: '30px' }).setOrigin(0.5);
    const name = this.add.text(0, -h / 2 + 60, ability.name, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '13px',
      color: '#e8e8f0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const desc = this.add.text(0, -h / 2 + 80, ability.desc, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#9999aa',
      wordWrap: { width: w - 20 },
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, icon, name, desc]);

    if (!owned) {
      // Price + buy button
      const price = this.add.text(0, h / 2 - 45, `🪙 ${ability.price}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '13px',
        color: '#fbbf24',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const canAfford = GameState.coins >= ability.price;
      const buyBg = this.add.graphics();
      buyBg.fillStyle(canAfford ? COLORS.gold : 0x555555, canAfford ? 1 : 0.3);
      buyBg.fillRoundedRect(-35, h / 2 - 32, 70, 24, 12);

      const buyText = this.add.text(0, h / 2 - 20, 'BUY', {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: canAfford ? '#1a1a2e' : '#666666',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([price, buyBg, buyText]);

      if (canAfford) {
        const hitArea = this.add.rectangle(0, h / 2 - 20, 70, 24, 0x000000, 0).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
          GameState.coins -= ability.price;
          GameState.ownedAbilities.push(ability.id);
          this.scene.restart();
        });
        container.add(hitArea);
      }
    } else {
      // Equip/Unequip
      const isEquipped = equipped;
      const eqBg = this.add.graphics();
      eqBg.fillStyle(isEquipped ? 0x444466 : COLORS.accent, 0.8);
      eqBg.fillRoundedRect(-40, h / 2 - 32, 80, 24, 12);

      const eqText = this.add.text(0, h / 2 - 20, isEquipped ? 'UNEQUIP' : 'EQUIP', {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const hitArea = this.add.rectangle(0, h / 2 - 20, 80, 24, 0x000000, 0).setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        if (isEquipped) {
          GameState.equippedAbilities = GameState.equippedAbilities.filter(id => id !== ability.id);
        } else if (GameState.equippedAbilities.length < GameState.maxEquipSlots) {
          GameState.equippedAbilities.push(ability.id);
        }
        this.scene.restart();
      });

      container.add([eqBg, eqText, hitArea]);
    }

    // Entrance animation
    container.setAlpha(0);
    container.setScale(0.9);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: ABILITIES.indexOf(ability) * 60,
      ease: 'Back.easeOut',
    });

    this.cards.push(container);
  }
}
