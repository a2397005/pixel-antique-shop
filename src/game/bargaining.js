window.Bargaining = (() => {
  const floor10 = (value) => Math.floor(value / 10) * 10;
  const ceil10 = (value) => Math.ceil(value / 10) * 10;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function log(state, message) {
    state.dailyLog.push(message);
    if (state.dailyLog.length > 24) state.dailyLog.splice(0, state.dailyLog.length - 24);
  }

  function createSeller(state) {
    const unlocked = window.Market.offers.filter((offer) => offer.level <= state.shopLevel);
    const index = ((state.marketDay - 1) * state.shopLevel + state.visitorProgress.round - 1) % unlocked.length;
    const definition = unlocked[index];
    const opening = ceil10(definition.value * 1.4);
    const floor = Math.max(10, floor10(definition.value * 0.8));
    const npcName = ["林先生", "陳阿姨", "周先生"][(state.marketDay + state.visitorProgress.round - 2) % 3];
    return {
      id: `seller-${state.marketDay}-${state.visitorProgress.round}`,
      role: "seller",
      npcName,
      item: { id: definition.id, name: definition.name, detail: definition.detail, value: definition.value, level: definition.level },
      openingPrice: opening,
      limitPrice: floor,
      currentPrice: opening,
      counterCount: 0,
      finalOffer: false,
      dialogue: [`${npcName}帶來「${definition.name}」，開價 ${opening} 金。`],
    };
  }

  function createCustomer(state) {
    if (state.inventory.length === 0) return null;
    const item = state.inventory[0];
    const opening = Math.max(10, floor10(item.baseValue * 0.7));
    const ceiling = Math.max(opening, floor10(item.baseValue * 1.3));
    const npcName = ["王小姐", "黃先生", "李同學"][(state.marketDay + state.visitorProgress.round - 2) % 3];
    return {
      id: `customer-${state.marketDay}-${state.visitorProgress.round}`,
      role: "customer",
      npcName,
      itemId: item.id,
      item: { id: item.definitionId, name: item.name, detail: item.detail, value: item.baseValue, level: item.level },
      openingPrice: opening,
      limitPrice: ceiling,
      currentPrice: opening,
      counterCount: 0,
      finalOffer: false,
      dialogue: [`${npcName}想買「${item.name}」，出價 ${opening} 金。`],
    };
  }

  function spawnNext(state) {
    while (state.visitorProgress.round <= state.shopLevel) {
      if (state.visitorProgress.phase === "seller") {
        state.activeVisitor = createSeller(state);
        return;
      }
      const customer = createCustomer(state);
      if (customer) {
        state.activeVisitor = customer;
        return;
      }
      log(state, "顧客到店，但店內沒有合適古董；本次來訪未成交。");
      state.visitorProgress.round += 1;
      state.visitorProgress.phase = "seller";
    }
    state.activeVisitor = null;
    state.visitorProgress.phase = "done";
    log(state, "今日來客已接待完畢，可以結束今日。");
  }

  function beginDay(state) {
    state.dailyLog = [];
    state.visitorProgress = { round: 1, phase: "seller" };
    spawnNext(state);
  }

  function finishVisit(state, message) {
    log(state, message);
    if (state.visitorProgress.phase === "seller") {
      state.visitorProgress.phase = "customer";
    } else {
      state.visitorProgress.round += 1;
      state.visitorProgress.phase = "seller";
    }
    spawnNext(state);
  }

  function respondToOffer(state, price) {
    const visitor = state.activeVisitor;
    const accepted = visitor.role === "seller"
      ? price >= visitor.limitPrice
      : price <= visitor.limitPrice;
    if (accepted) return { accepted: true };

    if (visitor.finalOffer) return { accepted: false, message: "對方已經提出最後價格；請選擇接受或結束這次交易。" };
    if (visitor.counterCount >= 2) {
      visitor.currentPrice = visitor.limitPrice;
      visitor.counterCount += 1;
      visitor.finalOffer = true;
      visitor.dialogue.push(visitor.role === "seller"
        ? `${visitor.npcName}表示最低 ${visitor.currentPrice} 金，這是最後價格。`
        : `${visitor.npcName}提高到 ${visitor.currentPrice} 金，這是最後出價。`);
      return { accepted: false, countered: true, finalOffer: true, price: visitor.currentPrice };
    }

    const midpoint = (visitor.currentPrice + price) / 2;
    visitor.currentPrice = visitor.role === "seller"
      ? Math.max(visitor.limitPrice, ceil10(midpoint))
      : Math.min(visitor.limitPrice, floor10(midpoint));
    visitor.counterCount += 1;
    visitor.dialogue.push(visitor.role === "seller"
      ? `${visitor.npcName}還價 ${visitor.currentPrice} 金。`
      : `${visitor.npcName}回價 ${visitor.currentPrice} 金。`);
    return { accepted: false, countered: true, finalOffer: false, price: visitor.currentPrice };
  }

  function isPrice(value) {
    return Number.isSafeInteger(value) && value >= 10 && value % 10 === 0;
  }

  function validateVisitor(visitor, state) {
    if (!visitor || typeof visitor !== "object" || Array.isArray(visitor)) return null;
    if (!['seller', 'customer'].includes(visitor.role) || typeof visitor.id !== "string" || typeof visitor.npcName !== "string") return null;
    if (!isPrice(visitor.openingPrice) || !isPrice(visitor.limitPrice) || !isPrice(visitor.currentPrice)) return null;
    if (!Number.isInteger(visitor.counterCount) || visitor.counterCount < 0 || visitor.counterCount > 3) return null;
    if (typeof visitor.finalOffer !== "boolean" || !Array.isArray(visitor.dialogue) || visitor.dialogue.length > 12) return null;
    if (visitor.dialogue.some((line) => typeof line !== "string" || line.length > 180)) return null;

    if (visitor.role === "seller") {
      const definition = window.Market.offers.find((offer) => offer.id === visitor.item?.id);
      if (!definition || definition.level > state.shopLevel) return null;
      if (visitor.item.name !== definition.name || visitor.item.detail !== definition.detail || visitor.item.value !== definition.value || visitor.item.level !== definition.level) return null;
      if (visitor.id !== `seller-${state.marketDay}-${state.visitorProgress.round}`) return null;
      if (visitor.openingPrice !== ceil10(definition.value * 1.4) || visitor.limitPrice !== Math.max(10, floor10(definition.value * 0.8))) return null;
      if (visitor.currentPrice < visitor.limitPrice || visitor.currentPrice > visitor.openingPrice) return null;
    } else {
      const item = state.inventory.find((entry) => entry.id === visitor.itemId);
      if (!item || visitor.item.id !== item.definitionId || visitor.item.name !== item.name || visitor.item.detail !== item.detail || visitor.item.value !== item.baseValue || visitor.item.level !== item.level) return null;
      if (visitor.id !== `customer-${state.marketDay}-${state.visitorProgress.round}`) return null;
      if (visitor.openingPrice !== Math.max(10, floor10(item.baseValue * 0.7)) || visitor.limitPrice !== Math.max(visitor.openingPrice, floor10(item.baseValue * 1.3))) return null;
      if (visitor.currentPrice < visitor.openingPrice || visitor.currentPrice > visitor.limitPrice) return null;
    }
    if (visitor.finalOffer !== (visitor.counterCount === 3)) return null;
    return {
      ...visitor,
      item: { ...visitor.item },
      dialogue: [...visitor.dialogue],
    };
  }

  return { beginDay, finishVisit, log, respondToOffer, validateVisitor };
})();
