class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
    this.layoutItems = [];
  }

  create() {
    this.savedGame = window.SaveManager.read();
    this.background = this.add.graphics();
    this.shopArt = this.add.graphics();

    this.eyebrow = this.add.text(0, 0, "巷口老店・開張中", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "18px",
      color: "#f3c76a",
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.title = this.add.text(0, 0, "古董小店", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "52px",
      fontStyle: "bold",
      color: "#fff3d6",
      stroke: "#503330",
      strokeThickness: 8,
      align: "center",
    }).setOrigin(0.5);

    this.subtitle = this.add.text(0, 0, "低買高賣，讓好物找到新主人", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "20px",
      color: "#e8d7b8",
      align: "center",
    }).setOrigin(0.5);

    this.instructions = this.add.text(0, 0, "接待賣家議價收購　・　與顧客喊價出售　・　升級店鋪迎接更多來客", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "16px",
      color: "#d0c0a4",
      align: "center",
      wordWrap: { width: 760 },
    }).setOrigin(0.5);

    this.startButton = this.add.text(0, 0, this.savedGame.status === "ok" ? "繼續整理店鋪" : "開始整理店鋪", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "22px",
      fontStyle: "bold",
      color: "#2b211d",
      backgroundColor: "#f3c76a",
      padding: { left: 30, right: 30, top: 15, bottom: 15 },
      align: "center",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true, pixelPerfect: false });

    this.resetButton = this.add.text(0, 0, "重新開始", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "14px",
      fontStyle: "bold",
      color: "#fff3d6",
      backgroundColor: "#6f4340",
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
      align: "center",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(this.savedGame.hasData);

    this.confirmResetButton = this.add.text(0, 0, "確認清除存檔", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "14px",
      fontStyle: "bold",
      color: "#2b211d",
      backgroundColor: "#f3c76a",
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
      align: "center",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.cancelResetButton = this.add.text(0, 0, "取消", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "14px",
      color: "#fff3d6",
      backgroundColor: "#49363a",
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
      align: "center",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.status = this.add.text(0, 0, "", {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: "15px",
      color: "#a9dfaa",
      align: "center",
      wordWrap: { width: 760 },
    }).setOrigin(0.5);

    this.startButton.on("pointerover", () => this.startButton.setStyle({ backgroundColor: "#ffdc8b" }));
    this.startButton.on("pointerout", () => this.startButton.setStyle({ backgroundColor: "#f3c76a" }));
    this.startButton.on("pointerdown", () => this.startGame());
    this.resetButton.on("pointerdown", () => this.showResetConfirmation());
    this.confirmResetButton.on("pointerdown", () => this.confirmReset());
    this.cancelResetButton.on("pointerdown", () => this.cancelReset());

    if (this.savedGame.status === "ok") {
      this.status.setText(this.savedGame.migrated
        ? this.savedGame.message
        : `找到第 ${this.savedGame.state.marketDay} 日存檔，可繼續上次進度。`);
    } else if (this.savedGame.message) {
      this.status.setText(this.savedGame.message);
      this.status.setColor("#f0a28d");
    }

    this.scale.on("resize", this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.layout, this);
    });
    this.layout({ width: this.scale.width, height: this.scale.height });
  }

  startGame() {
    const state = this.savedGame.status === "ok"
      ? this.savedGame.state
      : window.InitialState.create();
    const saved = window.SaveManager.save(state);
    const message = saved.ok ? "" : saved.message;
    this.scene.start("ShopScene", { state, storageMessage: message });
  }

  showResetConfirmation() {
    this.resetButton.setVisible(false);
    this.confirmResetButton.setVisible(true);
    this.cancelResetButton.setVisible(true);
    this.status.setText("確定清除這台瀏覽器中的遊戲進度？");
    this.status.setColor("#f0a28d");
    this.layout({ width: this.scale.width, height: this.scale.height });
  }

  confirmReset() {
    const result = window.SaveManager.clear();
    if (!result.ok) {
      this.status.setText(result.message);
      this.status.setColor("#f0a28d");
      return;
    }
    this.savedGame = { status: "missing", hasData: false };
    this.confirmResetButton.setVisible(false);
    this.cancelResetButton.setVisible(false);
    this.startButton.setText("開始整理店鋪");
    this.status.setText("存檔已清除；可以開始新遊戲。");
    this.status.setColor("#a9dfaa");
    this.layout({ width: this.scale.width, height: this.scale.height });
  }

  cancelReset() {
    this.confirmResetButton.setVisible(false);
    this.cancelResetButton.setVisible(false);
    this.resetButton.setVisible(true);
    this.status.setText("已取消重置，原有進度仍保留。");
    this.status.setColor("#a9dfaa");
    this.layout({ width: this.scale.width, height: this.scale.height });
  }

  layout(size) {
    const width = size.width;
    const height = size.height;
    const compact = width < 620 || height < 520;
    const tinyCompact = width < 380 && height < 520;
    const centerX = width / 2;

    this.background.clear();
    this.background.fillGradientStyle(0x49363a, 0x49363a, 0x201a1b, 0x201a1b, 1);
    this.background.fillRect(0, 0, width, height);

    this.shopArt.clear();
    const awningWidth = Math.min(300, width * 0.58);
    const awningTop = compact ? 30 : 48;
    const awningLeft = centerX - awningWidth / 2;
    this.shopArt.fillStyle(0x6f4340, 1);
    this.shopArt.fillRect(awningLeft, awningTop, awningWidth, 22);
    this.shopArt.fillStyle(0xe7c27b, 1);
    for (let i = 0; i < 6; i++) {
      this.shopArt.fillRect(awningLeft + i * awningWidth / 6, awningTop, awningWidth / 12, 22);
    }
    this.shopArt.fillStyle(0x33272a, 1);
    this.shopArt.fillRect(centerX - awningWidth * 0.39, awningTop + 22, awningWidth * 0.78, 48);
    this.shopArt.fillStyle(0xd9a441, 1);
    this.shopArt.fillRect(centerX - 5, awningTop + 30, 10, 10);

    const top = compact ? 92 : 182;
    this.eyebrow.setPosition(centerX, top);
    this.title.setPosition(centerX, top + (compact ? 40 : 64));
    this.title.setFontSize(compact ? "36px" : "52px");
    this.subtitle.setPosition(centerX, top + (compact ? 82 : 128));
    this.instructions.setPosition(centerX, top + (tinyCompact ? 98 : compact ? 116 : 180));
    this.instructions.setFontSize(compact ? "13px" : "16px");
    const buttonY = top + (tinyCompact ? 180 : compact ? 170 : 250);
    this.startButton.setPosition(centerX, buttonY);
    this.resetButton.setPosition(centerX, buttonY + (compact ? 55 : 66));
    this.confirmResetButton.setPosition(centerX - (compact ? 58 : 70), buttonY + (compact ? 55 : 66));
    this.cancelResetButton.setPosition(centerX + (compact ? 60 : 76), buttonY + (compact ? 55 : 66));
    this.status.setPosition(centerX, buttonY - (tinyCompact ? 42 : compact ? 30 : 38));
    this.status.setWordWrapWidth(Math.max(220, width - 40));
  }
}



