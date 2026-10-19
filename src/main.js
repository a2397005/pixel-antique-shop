const config = {
  ...window.GAME_CONFIG,
  scene: [BootScene, TitleScene, ShopScene],
};

window.antiqueShopGame = new Phaser.Game(config);
