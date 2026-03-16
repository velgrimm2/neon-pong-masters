import Phaser from 'phaser';

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  color: number,
  onClick: () => void,
  textColor: string = '#ffffff',
  width: number = 220,
  height: number = 44
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y).setDepth(20);

  const bg = scene.add.graphics();
  bg.fillStyle(color, 1);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'Arial Black, Arial',
    fontSize: '14px',
    color: textColor,
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0.5);

  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

  // Hover and press animations
  container.on('pointerover', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      ease: 'Power2',
    });
  });

  container.on('pointerout', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Power2',
    });
  });

  container.on('pointerdown', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 60,
      yoyo: true,
      onComplete: () => onClick(),
    });
  });

  // Entrance animation
  container.setAlpha(0);
  container.y += 10;
  scene.tweens.add({
    targets: container,
    alpha: 1,
    y: y,
    duration: 300,
    ease: 'Back.easeOut',
  });

  return container;
}
