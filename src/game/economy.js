window.Economy = {
  upgradeCosts: { 1: 800, 2: 1600 },

  makeOffer(state, price) {
    const visitor = state.activeVisitor;
    if (!visitor) return { ok: false, message: "目前沒有正在談價的客人。" };
    if (visitor.finalOffer) return { ok: false, message: "對方已提出最後價格，請接受或結束交易。" };
    if (!Number.isSafeInteger(price) || price < 10 || price % 10 !== 0) {
      return { ok: false, message: "出價需為 10 金的正整數倍。" };
    }
    if (visitor.role === "seller" && price > state.coins) {
      return { ok: false, message: "金幣不足，請降低出價或離開。" };
    }
    if (visitor.role === "seller" && !window.Inventory.hasCapacity(state)) {
      return { ok: false, message: "庫存已滿，請先售出古董。" };
    }
    visitor.dialogue.push(visitor.role === "seller"
      ? `你出價 ${price} 金。`
      : `你喊價 ${price} 金。`);
    const response = window.Bargaining.respondToOffer(state, price);
    if (!response.accepted) {
      return {
        ok: true,
        settled: false,
        message: response.finalOffer
          ? `${visitor.npcName}提出最後價格 ${response.price} 金。`
          : `${visitor.npcName}還價 ${response.price} 金。`,
      };
    }
    return this.completeDeal(state, price);
  },

  acceptCurrent(state) {
    const visitor = state.activeVisitor;
    if (!visitor) return { ok: false, message: "目前沒有正在談價的客人。" };
    return this.completeDeal(state, visitor.currentPrice);
  },

  completeDeal(state, price) {
    const visitor = state.activeVisitor;
    if (visitor.role === "seller") {
      if (state.inventory.length >= state.inventoryCapacity) return { ok: false, message: "庫存已滿，無法收購這件古董。" };
      if (price > state.coins) return { ok: false, message: "金幣不足，無法接受這個價格。" };
      const item = {
        id: `item-${state.marketDay}-${state.visitorProgress.round}-${visitor.item.id}`,
        definitionId: visitor.item.id,
        name: visitor.item.name,
        detail: visitor.item.detail,
        baseValue: visitor.item.value,
        level: visitor.item.level,
        buyPrice: price,
      };
      state.coins -= price;
      window.Inventory.add(state, item);
      visitor.dialogue.push(`成交！你以 ${price} 金收購「${item.name}」。`);
      window.Bargaining.finishVisit(state, `收購「${item.name}」，成交價 ${price} 金。`);
      return { ok: true, message: `成交！以 ${price} 金收購「${item.name}」。`, item };
    }

    const item = state.inventory.find((entry) => entry.id === visitor.itemId);
    if (!item) return { ok: false, message: "這件古董已不在庫存，無法完成交易。" };
    const sold = window.Inventory.remove(state, item.id);
    const profit = price - sold.buyPrice;
    state.coins += price;
    state.totalRealizedProfit += profit;
    visitor.dialogue.push(`成交！「${sold.name}」以 ${price} 金售出。`);
    window.Bargaining.finishVisit(state, `售出「${sold.name}」，成交價 ${price} 金，利潤 ${profit >= 0 ? "+" : ""}${profit} 金。`);
    return {
      ok: true,
      message: `售出「${sold.name}」，收入 ${price} 金，利潤 ${profit >= 0 ? "+" : ""}${profit}。`,
      item: sold,
      profit,
    };
  },

  declineCurrent(state) {
    const visitor = state.activeVisitor;
    if (!visitor) return { ok: false, message: "目前沒有來客需要接待。" };
    const message = visitor.role === "seller"
      ? `你婉拒了${visitor.npcName}的收購交易。`
      : `你婉拒了${visitor.npcName}的購買要求。`;
    visitor.dialogue.push(message);
    window.Bargaining.finishVisit(state, message);
    return { ok: true, message };
  },

  advanceDay(state) {
    if (!Number.isInteger(state.marketDay) || state.marketDay < 1) {
      return { ok: false, message: "日期資料無效，無法進入下一天。" };
    }
    if (state.activeVisitor || state.visitorProgress.phase !== "done") {
      return { ok: false, message: "請先接待完今日所有來客，再結束今日。" };
    }
    state.marketDay += 1;
    window.Bargaining.beginDay(state);
    return { ok: true, message: `新的一天開始了，第 ${state.marketDay} 日共有 ${state.shopLevel} 輪來客；庫存已保留。` };
  },

  upgrade(state) {
    const cost = this.upgradeCosts[state.shopLevel];
    if (!cost) return { ok: false, message: "店鋪已達最高等級，無法再升級。" };
    const workingCapital = window.Market.minimumAsk(state.shopLevel + 1);
    if (state.coins < cost + workingCapital) {
      return {
        ok: false,
        message: `周轉金不足；升級費 ${cost} 金，還需保留 ${workingCapital} 金收購下一件古董。`,
      };
    }

    state.coins -= cost;
    state.shopLevel += 1;
    state.inventoryCapacity += 2;
    if (state.visitorProgress.phase === "done") {
      state.visitorProgress.round = state.shopLevel + 1;
    }
    return {
      ok: true,
      message: `店鋪升至 ${state.shopLevel} 級，庫存容量增加至 ${state.inventoryCapacity} 件。`,
    };
  },
};
