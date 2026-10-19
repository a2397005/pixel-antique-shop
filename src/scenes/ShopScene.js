class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
    this.inventoryCardObjects = [];
    this.inventoryViews = new Map();
    this.mobilePage = "trade";
  }

  create(data = {}) {
    this.state = data.state || window.InitialState.create();
    this.background = this.add.graphics();
    this.panelGraphics = this.add.graphics();
    this.cards = [];
    this.statTexts = [];

    this.title = this.add.text(0, 0, "古董小店｜今日營業", this.textStyle(22, "#fff3d6", true));
    this.backButton = this.add.text(0, 0, "回標題", this.textStyle(13, "#f3c76a", true))
      .setPadding(8, 6, 8, 6)
      .setInteractive({ useHandCursor: true });
    this.backButton.on("pointerdown", () => this.scene.start("TitleScene"));
    this.backButton.on("pointerover", () => this.backButton.setStyle({ color: "#fff3d6" }));
    this.backButton.on("pointerout", () => this.backButton.setStyle({ color: "#f3c76a" }));

    this.statLabels = ["持有金幣", "店鋪等級", "庫存容量", "已實現利潤"];
    this.statLabels.forEach((label) => {
      this.statTexts.push({
        label: this.add.text(0, 0, label, this.textStyle(12, "#c8b99f")),
        value: this.add.text(0, 0, "", this.textStyle(17, "#fff3d6", true)),
      });
    });

    this.sectionTitle = this.add.text(0, 0, "今日來客　DAY 1", this.textStyle(16, "#f3c76a", true));
    this.sectionHint = this.add.text(0, 0, "與賣家和顧客議價，談妥後完成交易。", this.textStyle(12, "#c8b99f"));

    this.visitorPanel = this.add.graphics();
    this.visitorTitle = this.add.text(0, 0, "", this.textStyle(16, "#fff3d6", true));
    this.visitorItem = this.add.text(0, 0, "", this.textStyle(11, "#e8d7b8"));
    this.visitorDialogue = this.add.text(0, 0, "", {
      ...this.textStyle(11, "#c8b99f"),
      wordWrap: { width: 520 },
      lineSpacing: 4,
    });
    this.visitorPrice = this.add.text(0, 0, "", this.textStyle(13, "#f3c76a", true));
    this.offerAmountText = this.add.text(0, 0, "你的出價 0 金", this.textStyle(13, "#fff3d6", true));
    this.offerMinusButton = this.add.text(0, 0, "−10", this.buttonStyle(11)).setInteractive({ useHandCursor: true });
    this.offerPlusButton = this.add.text(0, 0, "+10", this.buttonStyle(11)).setInteractive({ useHandCursor: true });
    this.makeOfferButton = this.add.text(0, 0, "出價", this.buttonStyle(11)).setInteractive({ useHandCursor: true });
    this.acceptButton = this.add.text(0, 0, "接受對方價格", this.buttonStyle(11)).setInteractive({ useHandCursor: true });
    this.leaveButton = this.add.text(0, 0, "拒絕交易", this.buttonStyle(11)).setInteractive({ useHandCursor: true });
    this.visitorControls = [this.offerAmountText, this.offerMinusButton, this.offerPlusButton, this.makeOfferButton, this.acceptButton, this.leaveButton];
    this.visitorPanelObjects = [this.visitorPanel, this.visitorTitle, this.visitorItem, this.visitorDialogue, this.visitorPrice, ...this.visitorControls];
    this.playerPrice = 0;
    this.lastVisitorId = null;
    this.offerMinusButton.on("pointerdown", () => this.adjustOffer(-10));
    this.offerPlusButton.on("pointerdown", () => this.adjustOffer(10));
    this.makeOfferButton.on("pointerdown", () => this.handleOffer());
    this.acceptButton.on("pointerdown", () => this.finishAction(window.Economy.acceptCurrent(this.state)));
    this.leaveButton.on("pointerdown", () => this.finishAction(window.Economy.declineCurrent(this.state)));

    this.inventoryTitle = this.add.text(0, 0, "店內庫存", this.textStyle(15, "#f3c76a", true));
    this.inventoryBox = this.add.graphics();
    this.inventoryText = this.add.text(0, 0, "目前尚無收藏　・　買入後的古董會展示在這裡。", this.textStyle(12, "#c8b99f"));

    this.upgradeGraphics = this.add.graphics();
    this.upgradeTitle = this.add.text(0, 0, "店面升級　Lv.1 → Lv.2", this.textStyle(14, "#fff3d6", true));
    this.upgradeDetail = this.add.text(0, 0, "需要 800 金幣　・　庫存容量 +2", this.textStyle(12, "#e8d7b8"));
    this.upgradeButton = this.add.text(0, 0, "升級功能下階段加入", this.buttonStyle(11)).setInteractive({ useHandCursor: true });
    this.upgradeButton.on("pointerdown", () => this.handleUpgrade());
    this.upgradeButton.on("pointerover", () => this.upgradeButton.setStyle({ backgroundColor: "#ffdc8b" }));
    this.upgradeButton.on("pointerout", () => this.upgradeButton.setStyle({ backgroundColor: "#f3c76a" }));

    this.nextDayButton = this.add.text(0, 0, "結束今日", this.buttonStyle(11)).setInteractive({ useHandCursor: true });
    this.nextDayButton.on("pointerdown", () => this.handleAdvanceDay());
    this.nextDayButton.on("pointerover", () => this.nextDayButton.setStyle({ backgroundColor: "#ffdc8b" }));
    this.nextDayButton.on("pointerout", () => this.nextDayButton.setStyle({ backgroundColor: "#f3c76a" }));

    this.dayTitle = this.add.text(0, 0, "今日營業", this.textStyle(20, "#fff3d6", true)).setVisible(false);
    this.dayHint = this.add.text(0, 0, "", {
      ...this.textStyle(14, "#c8b99f"),
      wordWrap: { width: 300 },
    }).setVisible(false);
    this.mobileNavGraphics = this.add.graphics().setVisible(false);
    this.mobileTabButtons = [
      ["買賣", "trade"],
      ["庫存", "inventory"],
      ["店舖", "shop"],
      ["下一天", "day"],
    ].map(([label, page]) => {
      const button = this.add.text(0, 0, label, {
        ...this.textStyle(11, "#fff3d6", true),
        backgroundColor: "#49363a",
        padding: { left: 5, right: 5, top: 8, bottom: 8 },
        align: "center",
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);
      button.on("pointerdown", () => this.showMobilePage(page));
      return { page, button };
    });

    this.status = this.add.text(0, 0, data.storageMessage || "買入與出售會即時更新金幣及庫存。", this.textStyle(11, data.storageMessage ? "#f0a28d" : "#a9dfaa"));
    this.refreshState();
    this.scale.on("resize", this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.layout, this);
    });
    this.layout({ width: this.scale.width, height: this.scale.height });
  }

  textStyle(size, color, bold = false) {
    return {
      fontFamily: '"PingFang TC", -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif',
      fontSize: `${size}px`,
      fontStyle: bold ? "bold" : "normal",
      color,
    };
  }

  buttonStyle(size) {
    return {
      ...this.textStyle(size, "#2b211d", true),
      backgroundColor: "#f3c76a",
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
      align: "center",
    };
  }

  setStatus(message, success = true) {
    this.status.setText(message);
    this.status.setColor(success ? "#a9dfaa" : "#f0a28d");
  }

  finishAction(result) {
    if (result.ok) {
      const saved = window.SaveManager.save(this.state);
      if (!saved.ok) {
        this.setStatus(saved.message, false);
      } else {
        this.setStatus(result.message, true);
      }
    } else {
      this.setStatus(result.message, false);
    }
    this.refreshState();
  }

  handleOffer() {
    const result = window.Economy.makeOffer(this.state, this.playerPrice);
    if (result.ok && !result.item && this.state.activeVisitor) {
      const visitor = this.state.activeVisitor;
      this.playerPrice = visitor.role === "seller"
        ? Math.max(10, Math.min(this.state.coins - (this.state.coins % 10), visitor.currentPrice - 10))
        : visitor.currentPrice + 10;
    }
    this.finishAction(result);
  }

  adjustOffer(delta) {
    const visitor = this.state.activeVisitor;
    if (!visitor) return;
    const maximum = visitor.role === "seller"
      ? Math.max(10, this.state.coins - (this.state.coins % 10))
      : 9990;
    this.playerPrice = Math.max(10, Math.min(maximum, this.playerPrice + delta));
    this.refreshVisitor();
  }

  handleAdvanceDay() {
    const result = window.Economy.advanceDay(this.state);
    this.finishAction(result);
  }

  handleUpgrade() {
    const result = window.Economy.upgrade(this.state);
    this.finishAction(result);
  }

  showMobilePage(page) {
    this.mobilePage = page;
    this.layout({ width: this.scale.width, height: this.scale.height });
  }

  setMobilePageVisibility(isMobilePortrait) {
    this.mobileNavGraphics.setVisible(isMobilePortrait);
    this.mobileTabButtons.forEach(({ button }) => button.setVisible(isMobilePortrait));
    this.dayTitle.setVisible(isMobilePortrait && this.mobilePage === "day");
    this.dayHint.setVisible(isMobilePortrait && this.mobilePage === "day");

    const showTrade = !isMobilePortrait || this.mobilePage === "trade";
    this.sectionTitle.setVisible(showTrade);
    this.sectionHint.setVisible(showTrade);
    [this.visitorPanel, this.visitorTitle, this.visitorItem, this.visitorDialogue, this.visitorPrice]
      .forEach((object) => object.setVisible(showTrade));
    const activeVisitor = this.state.activeVisitor;
    this.visitorControls.forEach((object) => {
      const finalAction = object === this.acceptButton || object === this.leaveButton;
      object.setVisible(showTrade && Boolean(activeVisitor) && (!activeVisitor.finalOffer || finalAction));
    });

    const showInventory = !isMobilePortrait || this.mobilePage === "inventory";
    this.inventoryTitle.setVisible(showInventory);
    const hasInventory = this.state.inventory.length > 0;
    this.inventoryBox.setVisible(showInventory && !hasInventory);
    this.inventoryText.setVisible(showInventory && !hasInventory);
    this.inventoryCardObjects.forEach((object) => object.setVisible(showInventory));

    const showShop = !isMobilePortrait || this.mobilePage === "shop";
    this.upgradeGraphics.setVisible(showShop);
    this.upgradeTitle.setVisible(showShop);
    this.upgradeDetail.setVisible(showShop);
    this.upgradeButton.setVisible(showShop);
    this.nextDayButton.setVisible(!isMobilePortrait || this.mobilePage === "day");

    this.mobileTabButtons.forEach(({ page, button }) => {
      button.setBackgroundColor(page === this.mobilePage ? "#f3c76a" : "#49363a");
      button.setColor(page === this.mobilePage ? "#2b211d" : "#fff3d6");
    });
  }

  refreshState() {
    this.sectionTitle.setText(`今日來客　DAY ${this.state.marketDay}`);
    const values = [
      `${this.state.coins} 金`,
      `${this.state.shopLevel} 級`,
      `${this.state.inventory.length} / ${this.state.inventoryCapacity} 件`,
      `${this.state.totalRealizedProfit}`,
    ];
    this.statTexts.forEach((stat, index) => stat.value.setText(values[index]));

    this.refreshVisitor();

    const nextCost = window.Economy.upgradeCosts[this.state.shopLevel];
    if (nextCost) {
      this.upgradeTitle.setText(`店面升級　Lv.${this.state.shopLevel} → Lv.${this.state.shopLevel + 1}`);
      const workingCapital = window.Market.minimumAsk(this.state.shopLevel + 1);
      this.upgradeDetail.setText(`升級 ${nextCost} 金　・　預留 ${workingCapital} 金周轉　・　容量 +2　・　來客 ${this.state.shopLevel + 1} 輪／日`);
      this.upgradeButton.setText("升級").setVisible(true);
    } else {
      this.upgradeTitle.setText(`店面升級　Lv.${this.state.shopLevel}（最高）`);
      this.upgradeDetail.setText("已達最高等級　・　每日 3 輪來客");
      this.upgradeButton.setText("已滿級").setVisible(true);
    }

    if (this.state.activeVisitor) {
      this.nextDayButton.disableInteractive().setAlpha(0.55);
    } else {
      this.nextDayButton.setInteractive({ useHandCursor: true }).setAlpha(1);
    }

    this.refreshInventory();
    if (this.scale.width && this.scale.height) {
      this.layout({ width: this.scale.width, height: this.scale.height });
    }
  }

  refreshVisitor() {
    const visitor = this.state.activeVisitor;
    if (!visitor) {
      this.lastVisitorId = null;
      this.visitorTitle.setText("今日來客已接待完畢");
      this.visitorItem.setText(`第 ${this.state.marketDay} 日共安排 ${this.state.shopLevel} 輪來客。`);
      this.visitorPrice.setText("");
      this.visitorDialogue.setText(this.state.dailyLog.slice(-5).join("\n"));
      this.visitorControls.forEach((object) => object.setVisible(false));
      return;
    }

    if (this.lastVisitorId !== visitor.id) {
      this.lastVisitorId = visitor.id;
      this.playerPrice = visitor.role === "seller"
        ? Math.max(10, Math.min(this.state.coins - (this.state.coins % 10), visitor.currentPrice - 30))
        : visitor.currentPrice + 30;
    }
    const isSeller = visitor.role === "seller";
    this.visitorTitle.setText(`${isSeller ? "賣家來訪" : "顧客來訪"}｜${visitor.npcName}`);
    this.visitorItem.setText(`${visitor.item.name}　・　${visitor.item.detail}　・　行情估值 ${visitor.item.value} 金`);
    this.visitorPrice.setText(isSeller
      ? `賣家目前開價：${visitor.currentPrice} 金`
      : `顧客目前出價：${visitor.currentPrice} 金`);
    this.visitorDialogue.setText(visitor.dialogue.slice(-5).join("\n"));
    this.offerAmountText.setText(`你的${isSeller ? "出價" : "售價"} ${this.playerPrice} 金`);
    const final = visitor.finalOffer;
    this.offerMinusButton.setVisible(!final);
    this.offerPlusButton.setVisible(!final);
    this.makeOfferButton.setVisible(!final);
    this.acceptButton.setText(isSeller ? "接受收購價" : "接受顧客出價");
    this.visitorControls.forEach((object) => object.setVisible(true));
    if (final) {
      this.offerAmountText.setVisible(false);
      this.offerMinusButton.setVisible(false);
      this.offerPlusButton.setVisible(false);
      this.makeOfferButton.setVisible(false);
    }
  }

  refreshInventory() {
    this.inventoryCardObjects.forEach((object) => object.destroy());
    this.inventoryCardObjects = [];
    const hasItems = this.state.inventory.length > 0;
    this.inventoryText.setVisible(!hasItems);
    this.inventoryBox.setVisible(!hasItems);

    this.state.inventory.forEach((item) => {
      const graphics = this.add.graphics();
      const name = this.add.text(0, 0, item.name, this.textStyle(12, "#fff3d6", true));
      const detail = this.add.text(0, 0,
        `成本 ${item.buyPrice} 金　・　行情估值 ${item.baseValue} 金`,
        this.textStyle(9, "#c8b99f"));
      this.inventoryCardObjects.push(graphics, name, detail);
      this.inventoryViews.set(item.id, { graphics, name, detail });
    });
  }

  layout(size) {
    const width = size.width;
    const height = size.height;
    const compact = height < 480;
    const tinyCompact = compact && width < 380;
    const margin = width < 420 ? 12 : 20;
    const contentWidth = width - margin * 2;
    const columns = width < 320 ? 1 : width < 650 ? 2 : 3;
    const gap = 10;
    const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
    const cardHeight = tinyCompact ? 76 : compact ? 94 : width < 650 ? 120 : 130;
    const statHeight = tinyCompact ? 62 : compact ? 52 : width < 500 ? 88 : 62;
    const statColumns = tinyCompact ? 2 : compact || width >= 500 ? 4 : 2;
    const statRows = Math.ceil(4 / statColumns);

    this.background.clear();
    this.background.fillGradientStyle(0x49363a, 0x49363a, 0x201a1b, 0x201a1b, 1);
    this.background.fillRect(0, 0, width, height);

    this.title.setPosition(margin, compact ? 14 : 18);
    this.title.setFontSize(width < 400 ? "18px" : "22px");
    this.backButton.setPosition(width - margin - this.backButton.width, compact ? 14 : 18);
    this.backButton.setStyle({ color: "#f3c76a" });

    const statY = compact ? 42 : 54;
    this.panelGraphics.clear();
    this.panelGraphics.fillStyle(0x33272a, 1);
    this.panelGraphics.fillRoundedRect(margin, statY, contentWidth, statHeight, 8);
    this.panelGraphics.lineStyle(1, 0x775a4a, 1);
    this.panelGraphics.strokeRoundedRect(margin, statY, contentWidth, statHeight, 8);
    this.statTexts.forEach((stat, index) => {
      const col = index % statColumns;
      const row = Math.floor(index / statColumns);
      const cellWidth = contentWidth / statColumns;
      const cellHeight = statHeight / statRows;
      const x = margin + col * cellWidth + 12;
      const y = statY + row * cellHeight + (statRows === 1 ? 8 : 6);
      stat.label.setPosition(x, y);
      stat.value.setPosition(x, y + (compact ? 16 : 17));
      stat.value.setFontSize(compact ? "14px" : "17px");
    });

    const mobilePortrait = width < 650 && height >= width;
    this.setMobilePageVisibility(mobilePortrait);
    if (mobilePortrait) {
      this.layoutMobilePortrait({ width, height, margin, contentWidth, compact, statY, statHeight });
      return;
    }
    this.mobileNavGraphics.setVisible(false);
    this.dayTitle.setVisible(false);
    this.dayHint.setVisible(false);
    this.mobileTabButtons.forEach(({ button }) => button.setVisible(false));

    const sectionY = statY + statHeight + (tinyCompact ? 7 : compact ? 10 : 14);
    this.sectionTitle.setPosition(margin, sectionY);
    this.sectionTitle.setFontSize(compact ? "14px" : "16px");
    this.sectionHint.setPosition(margin, sectionY + (compact ? 19 : 22));
    this.sectionHint.setFontSize(compact ? "10px" : "12px");

    const cardsY = sectionY + (tinyCompact ? 32 : compact ? 38 : 48);
    this.cards.forEach((card, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = margin + col * (cardWidth + gap);
      const y = cardsY + row * (cardHeight + gap);
      card.graphics.clear();
      card.graphics.fillStyle(0x3a2d30, 1);
      card.graphics.fillRoundedRect(x, y, cardWidth, cardHeight, 8);
      card.graphics.lineStyle(1, 0x775a4a, 1);
      card.graphics.strokeRoundedRect(x, y, cardWidth, cardHeight, 8);
      const inset = width < 420 ? 8 : 12;
      card.name.setPosition(x + inset, y + 8);
      card.name.setFontSize(width < 420 ? "14px" : "16px");
      card.detail.setPosition(x + inset, y + 26);
      card.ask.setPosition(x + inset, y + (tinyCompact ? 38 : compact ? 43 : width < 650 ? 40 : 46));
      card.ask.setFontSize(compact || width < 420 ? "10px" : "12px");
      card.bid.setPosition(x + inset, y + (tinyCompact ? 50 : compact ? 58 : width < 650 ? 54 : 64));
      card.bid.setFontSize(compact || width < 420 ? "10px" : "12px");
      card.profit.setPosition(x + inset, y + (tinyCompact ? 62 : compact ? 74 : width < 650 ? 68 : 83));
      card.profit.setFontSize(compact || width < 420 ? "10px" : "11px");
      card.buy.setPosition(x + cardWidth - inset, y + cardHeight - (compact ? 25 : 22));
      card.buy.setOrigin(1, 0.5);
      card.buy.setFontSize(compact ? "10px" : width < 650 ? "11px" : "11px");
      const touchPadding = compact || width < 650 ? 12 : 8;
      card.buy.setPadding({ left: 8, right: 8, top: touchPadding, bottom: touchPadding });
    });

    const visitorPanelY = cardsY;
    const visitorPanelHeight = compact ? 224 : 250;
    this.layoutVisitorPanel(margin, visitorPanelY, contentWidth, visitorPanelHeight, compact);
    const afterOffersY = visitorPanelY + visitorPanelHeight;
    const inventoryY = afterOffersY + (compact ? 8 : 12);
    this.inventoryTitle.setPosition(margin, inventoryY);
    this.inventoryTitle.setFontSize(compact ? "13px" : "15px");
    const inventoryTop = inventoryY + (compact ? 19 : 22);
    const inventoryColumns = width < 650 ? 2 : 3;
    const inventoryRows = Math.ceil(this.state.inventory.length / inventoryColumns);
    const inventoryCardHeight = compact ? 38 : 48;
    const inventoryCardGap = 6;
    const emptyHeight = compact ? 34 : 44;
    const inventoryHeight = this.state.inventory.length
      ? inventoryRows * inventoryCardHeight + (inventoryRows - 1) * inventoryCardGap
      : emptyHeight;

    if (!this.state.inventory.length) {
      this.inventoryBox.clear();
      this.inventoryBox.fillStyle(0x33272a, 1);
      this.inventoryBox.fillRoundedRect(margin, inventoryTop, contentWidth, emptyHeight, 7);
      this.inventoryText.setPosition(margin + 10, inventoryTop + emptyHeight / 2);
      this.inventoryText.setOrigin(0, 0.5);
      this.inventoryText.setFontSize(width < 420 ? "10px" : "12px");
    } else {
      this.inventoryBox.clear();
      this.inventoryCardObjects.forEach((object) => object.setVisible(true));
      const inventoryGap = 8;
      const inventoryCardWidth = (contentWidth - inventoryGap * (inventoryColumns - 1)) / inventoryColumns;
      this.state.inventory.forEach((item, index) => {
        const view = this.inventoryViews.get(item.id);
        const col = index % inventoryColumns;
        const row = Math.floor(index / inventoryColumns);
        const x = margin + col * (inventoryCardWidth + inventoryGap);
        const y = inventoryTop + row * (inventoryCardHeight + inventoryCardGap);
        view.graphics.clear();
        view.graphics.fillStyle(0x3a2d30, 1);
        view.graphics.fillRoundedRect(x, y, inventoryCardWidth, inventoryCardHeight, 6);
        view.graphics.lineStyle(1, 0x775a4a, 1);
        view.graphics.strokeRoundedRect(x, y, inventoryCardWidth, inventoryCardHeight, 6);
        view.name.setPosition(x + 7, y + 4);
        view.name.setFontSize(width < 420 ? "10px" : "12px");
        view.detail.setPosition(x + 7, y + (compact ? 22 : 27));
        view.detail.setFontSize(width < 420 ? "8px" : "9px");
      });
    }

    const upgradeY = inventoryTop + inventoryHeight + (compact ? 7 : 10);
    const upgradeHeight = compact ? 44 : width < 500 ? 92 : 54;
    this.upgradeGraphics.clear();
    this.upgradeGraphics.fillStyle(0x49363a, 1);
    this.upgradeGraphics.fillRoundedRect(margin, upgradeY, contentWidth, upgradeHeight, 7);
    this.upgradeGraphics.lineStyle(1, 0x9a7543, 1);
    this.upgradeGraphics.strokeRoundedRect(margin, upgradeY, contentWidth, upgradeHeight, 7);
    this.upgradeTitle.setPosition(margin + 10, upgradeY + 6);
    this.upgradeTitle.setFontSize(compact ? "11px" : "13px");
    this.upgradeDetail.setPosition(margin + 10, upgradeY + (width < 500 && !compact ? 27 : 27));
    this.upgradeDetail.setFontSize(compact ? "10px" : "11px");
    this.upgradeButton.setVisible(true);
    this.nextDayButton.setVisible(true);
    if (width >= 500 || compact) {
      this.upgradeButton.setPosition(width - margin - (compact ? 104 : 112), upgradeY + upgradeHeight / 2);
      this.upgradeButton.setOrigin(1, 0.5);
      this.upgradeButton.setFontSize(compact ? "9px" : "10px");
      this.upgradeButton.setPadding({ left: 6, right: 6, top: compact ? 6 : 5, bottom: compact ? 6 : 5 });
      this.nextDayButton.setPosition(width - margin - 10, upgradeY + upgradeHeight / 2);
      this.nextDayButton.setOrigin(1, 0.5);
      this.nextDayButton.setFontSize(compact ? "9px" : "10px");
      this.nextDayButton.setPadding({ left: 6, right: 6, top: compact ? 6 : 5, bottom: compact ? 6 : 5 });
    } else {
      this.upgradeButton.setPosition(margin + 10, upgradeY + 68);
      this.upgradeButton.setOrigin(0, 0.5);
      this.upgradeButton.setFontSize("11px");
      this.upgradeButton.setPadding({ left: 12, right: 12, top: 8, bottom: 8 });
      this.nextDayButton.setPosition(width - margin - 10, upgradeY + 68);
      this.nextDayButton.setOrigin(1, 0.5);
      this.nextDayButton.setFontSize("11px");
      this.nextDayButton.setPadding({ left: 12, right: 12, top: 8, bottom: 8 });
    }

    this.status.setPosition(margin, upgradeY + upgradeHeight + (compact ? 4 : 7));
    this.status.setFontSize(compact ? "9px" : "10px");
    this.status.setWordWrapWidth(contentWidth);
  }

  layoutMobilePortrait({ width, height, margin, contentWidth, compact, statY, statHeight }) {
    const navHeight = 48;
    const navY = height - navHeight;
    const navSlotWidth = width / this.mobileTabButtons.length;
    this.mobileNavGraphics.clear();
    this.mobileNavGraphics.fillStyle(0x201a1b, 1);
    this.mobileNavGraphics.fillRect(0, navY, width, navHeight);
    this.mobileNavGraphics.lineStyle(1, 0x775a4a, 1);
    this.mobileNavGraphics.lineBetween(0, navY, width, navY);
    this.mobileTabButtons.forEach(({ button }, index) => {
      button.setPosition(navSlotWidth * (index + 0.5), navY + navHeight / 2);
      button.setFontSize(width < 360 ? "10px" : "11px");
      button.setPadding({ left: width < 360 ? 4 : 8, right: width < 360 ? 4 : 8, top: 14, bottom: 14 });
    });

    const statusY = navY - 13;
    this.status.setPosition(margin, statusY);
    this.status.setFontSize(width < 360 ? "10px" : "11px");
    this.status.setWordWrapWidth(contentWidth);
    this.status.setOrigin(0, 0.5);

    const contentTop = statY + statHeight + (compact ? 10 : 14);
    const pageHeader = (title, hint) => {
      title.setPosition(margin, contentTop);
      title.setFontSize(width < 360 ? "13px" : "15px");
      this.sectionHint.setPosition(margin, contentTop + 22);
      this.sectionHint.setFontSize("12px");
      this.sectionHint.setText(hint);
    };

    if (this.mobilePage === "trade") {
      pageHeader(this.sectionTitle, "接待賣家收購古董，再與顧客議價出售。");
      this.layoutVisitorPanel(margin, contentTop + 47, contentWidth, Math.min(300, height - (contentTop + 47) - 76), true);
      return;
    }

    if (this.mobilePage === "inventory") {
      pageHeader(this.inventoryTitle, "持有古董會等待顧客上門議價收購。");
      const columns = width < 360 ? 1 : 2;
      const gap = 7;
      const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
      const cardHeight = 54;
      const top = contentTop + 42;
      if (!this.state.inventory.length) {
        this.inventoryBox.clear();
        this.inventoryBox.fillStyle(0x33272a, 1);
        this.inventoryBox.fillRoundedRect(margin, top, contentWidth, 54, 7);
        this.inventoryText.setPosition(margin + 10, top + 27).setOrigin(0, 0.5).setFontSize("11px");
      } else {
        this.state.inventory.forEach((item, index) => {
          const view = this.inventoryViews.get(item.id);
          const col = index % columns;
          const row = Math.floor(index / columns);
          const x = margin + col * (cardWidth + gap);
          const y = top + row * (cardHeight + gap);
          view.graphics.clear();
          view.graphics.fillStyle(0x3a2d30, 1);
          view.graphics.fillRoundedRect(x, y, cardWidth, cardHeight, 6);
          view.graphics.lineStyle(1, 0x775a4a, 1);
          view.graphics.strokeRoundedRect(x, y, cardWidth, cardHeight, 6);
          view.name.setPosition(x + 6, y + 6).setFontSize("11px");
          view.detail.setPosition(x + 6, y + 25).setFontSize("9px");
        });
      }
      return;
    }

    if (this.mobilePage === "shop") {
      const panelY = contentTop + 42;
      pageHeader(this.upgradeTitle, "升級可擴充店鋪與庫存空間。");
      this.upgradeGraphics.clear();
      this.upgradeGraphics.fillStyle(0x49363a, 1);
      this.upgradeGraphics.fillRoundedRect(margin, panelY, contentWidth, 108, 7);
      this.upgradeGraphics.lineStyle(1, 0x9a7543, 1);
      this.upgradeGraphics.strokeRoundedRect(margin, panelY, contentWidth, 108, 7);
      this.upgradeDetail.setPosition(margin + 12, panelY + 16).setFontSize("10px");
      this.upgradeButton.setPosition(margin + 12, panelY + 69).setOrigin(0, 0.5);
      this.upgradeButton.setFontSize("11px").setPadding({ left: 14, right: 14, top: 9, bottom: 9 });
      return;
    }

    this.dayTitle.setPosition(margin, contentTop + 12).setFontSize("20px");
    this.dayHint.setText(this.state.activeVisitor
      ? `目前第 ${this.state.marketDay} 日，尚有來客待接待。完成今天的賣家與顧客議價後，才能開始下一天。`
      : `第 ${this.state.marketDay} 日來客已接待完畢。結束今日會保留庫存，並開始第 ${this.state.marketDay + 1} 日。`);
    this.dayHint.setPosition(margin, contentTop + 52).setWordWrapWidth(contentWidth).setFontSize("12px");
    this.nextDayButton.setPosition(width / 2, contentTop + 145).setOrigin(0.5);
    this.nextDayButton.setFontSize("14px").setPadding({ left: 20, right: 20, top: 12, bottom: 12 });
  }

  layoutVisitorPanel(x, y, width, height, compact = false) {
    const safeHeight = Math.max(190, height);
    const inset = compact ? 10 : 14;
    this.visitorPanel.clear();
    this.visitorPanel.fillStyle(0x33272a, 1);
    this.visitorPanel.fillRoundedRect(x, y, width, safeHeight, 8);
    this.visitorPanel.lineStyle(1, 0x775a4a, 1);
    this.visitorPanel.strokeRoundedRect(x, y, width, safeHeight, 8);
    this.visitorTitle.setPosition(x + inset, y + inset).setFontSize(compact ? "15px" : "16px");
    this.visitorItem.setPosition(x + inset, y + inset + 25).setFontSize(compact ? "11px" : "11px");
    this.visitorDialogue.setPosition(x + inset, y + inset + 46)
      .setFontSize(compact ? "12px" : "11px")
      .setWordWrapWidth(width - inset * 2);
    this.visitorPrice.setPosition(x + inset, y + safeHeight - (compact ? 110 : 112)).setFontSize(compact ? "13px" : "13px");
    this.offerAmountText.setPosition(x + inset, y + safeHeight - (compact ? 76 : 80)).setFontSize(compact ? "12px" : "13px");

    const adjustY = y + safeHeight - (compact ? 48 : 51);
    const actionY = y + safeHeight - (compact ? 15 : 17);
    const buttonFont = compact ? "11px" : "10px";
    const padding = compact ? { left: 6, right: 6, top: 8, bottom: 8 } : { left: 8, right: 8, top: 8, bottom: 8 };
    const available = width - inset * 2;
    [this.offerMinusButton, this.offerPlusButton, this.makeOfferButton].forEach((button, index) => {
      const slot = available / 3;
      button.setPosition(x + inset + index * slot + slot / 2, adjustY)
        .setOrigin(0.5)
        .setFontSize(buttonFont)
        .setPadding(padding);
    });
    [this.acceptButton, this.leaveButton].forEach((button, index) => {
      button.setPosition(x + inset + (index + 0.5) * (available / 2), actionY)
        .setOrigin(0.5)
        .setFontSize(width < 370 ? "10px" : buttonFont)
        .setPadding({ left: 4, right: 4, top: 8, bottom: 8 });
    });
    this.offerMinusButton.setText("−10");
    this.offerPlusButton.setText("+10");
    this.makeOfferButton.setText("出價");
  }
}
