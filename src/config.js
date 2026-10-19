window.GAME_CONFIG = {
  width: 960,
  height: 640,
  backgroundColor: "#33272a",
  parent: "game-container",
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 360 },
  },
  scene: [],
};
