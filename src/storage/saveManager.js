window.SaveManager = (() => {
  const STORAGE_KEY = "antique-shop-save";
  const VERSION = 2;

  function validCore(data) {
    return data && typeof data === "object" && !Array.isArray(data)
      && Number.isSafeInteger(data.coins) && data.coins >= 0
      && Number.isInteger(data.shopLevel) && data.shopLevel >= 1 && data.shopLevel <= 3
      && data.inventoryCapacity === 4 + (data.shopLevel - 1) * 2
      && Number.isInteger(data.marketDay) && data.marketDay >= 1 && data.marketDay <= 1000000000
      && Number.isSafeInteger(data.totalRealizedProfit);
  }

  function normalizeV2(data) {
    if (!validCore(data) || !Array.isArray(data.inventory) || data.inventory.length > data.inventoryCapacity) return null;
    const inventory = [];
    const ids = new Set();
    for (const saved of data.inventory) {
      if (!saved || typeof saved !== "object" || typeof saved.id !== "string" || ids.has(saved.id)) return null;
      const definition = window.Market.offers.find((offer) => offer.id === saved.definitionId);
      if (!definition || definition.level > data.shopLevel) return null;
      if (saved.name !== definition.name || saved.detail !== definition.detail || saved.baseValue !== definition.value || saved.level !== definition.level) return null;
      if (!Number.isSafeInteger(saved.buyPrice) || saved.buyPrice < 10 || saved.buyPrice % 10 !== 0) return null;
      ids.add(saved.id);
      inventory.push({
        id: saved.id,
        definitionId: saved.definitionId,
        name: saved.name,
        detail: saved.detail,
        baseValue: saved.baseValue,
        level: saved.level,
        buyPrice: saved.buyPrice,
      });
    }

    const progress = data.visitorProgress;
    if (!progress || !Number.isInteger(progress.round) || progress.round < 1 || progress.round > data.shopLevel + 1) return null;
    if (!['seller', 'customer', 'done'].includes(progress.phase)) return null;
    if (!Array.isArray(data.dailyLog) || data.dailyLog.length > 24 || data.dailyLog.some((line) => typeof line !== "string" || line.length > 180)) return null;

    const state = {
      coins: data.coins,
      shopLevel: data.shopLevel,
      inventoryCapacity: data.inventoryCapacity,
      marketDay: data.marketDay,
      inventory,
      totalRealizedProfit: data.totalRealizedProfit,
      visitorProgress: { round: progress.round, phase: progress.phase },
      dailyLog: [...data.dailyLog],
      activeVisitor: null,
    };

    if (progress.phase === "done") {
      if (progress.round !== data.shopLevel + 1 || data.activeVisitor !== null) return null;
    } else {
      if (progress.round > data.shopLevel) return null;
      const visitor = window.Bargaining.validateVisitor(data.activeVisitor, state);
      if (!visitor || visitor.role !== progress.phase) return null;
      state.activeVisitor = visitor;
    }
    return state;
  }

  function migrateV1(data) {
    if (!validCore(data) || data.version !== 1 || data.totalRealizedProfit < 0) return null;
    if (!Array.isArray(data.inventory) || data.inventory.length > data.inventoryCapacity || !Array.isArray(data.marketOffers)) return null;
    const inventory = [];
    const seen = new Set();
    for (const saved of data.inventory) {
      if (!saved || typeof saved !== "object" || typeof saved.offerId !== "string") return null;
      const match = saved.offerId.match(/^day-(\d+)-(.+)$/);
      if (!match || Number(match[1]) > data.marketDay || seen.has(saved.id)) return null;
      const definition = window.Market.offers.find((offer) => offer.id === match[2]);
      if (!definition || definition.level > data.shopLevel || saved.id !== `item-${saved.offerId}`) return null;
      if (saved.name !== definition.name || saved.detail !== definition.detail || saved.buyPrice !== definition.askPrice || saved.sellPrice !== definition.bidPrice) return null;
      seen.add(saved.id);
      inventory.push({
        id: saved.id,
        definitionId: definition.id,
        name: definition.name,
        detail: definition.detail,
        baseValue: definition.value,
        level: definition.level,
        buyPrice: saved.buyPrice,
      });
    }
    const state = window.InitialState.create();
    state.coins = data.coins;
    state.shopLevel = data.shopLevel;
    state.inventoryCapacity = data.inventoryCapacity;
    state.marketDay = data.marketDay;
    state.inventory = inventory;
    state.totalRealizedProfit = data.totalRealizedProfit;
    window.Bargaining.beginDay(state);
    return state;
  }

  function read() {
    try {
      const serialized = window.localStorage.getItem(STORAGE_KEY);
      if (serialized === null) return { status: "missing", hasData: false };
      const data = JSON.parse(serialized);
      if (data?.version === 1) {
        const state = migrateV1(data);
        return state
          ? { status: "ok", hasData: true, state, migrated: true, message: "舊版進度已保留並轉入議價版。" }
          : { status: "invalid", hasData: true, message: "舊版存檔無法安全轉換，已改用新遊戲。" };
      }
      const state = data?.version === VERSION ? normalizeV2(data) : null;
      return state
        ? { status: "ok", hasData: true, state }
        : { status: "invalid", hasData: true, message: "本機存檔格式不正確，已改用新遊戲。" };
    } catch (error) {
      return { status: "unavailable", hasData: false, message: "無法讀取本機存檔；仍可開始新遊戲，但進度可能無法保留。" };
    }
  }

  function save(state) {
    try {
      const snapshot = {
        version: VERSION,
        coins: state.coins,
        shopLevel: state.shopLevel,
        inventoryCapacity: state.inventoryCapacity,
        marketDay: state.marketDay,
        inventory: state.inventory.map((item) => ({
          id: item.id,
          definitionId: item.definitionId,
          name: item.name,
          detail: item.detail,
          baseValue: item.baseValue,
          level: item.level,
          buyPrice: item.buyPrice,
        })),
        totalRealizedProfit: state.totalRealizedProfit,
        visitorProgress: { ...state.visitorProgress },
        activeVisitor: state.activeVisitor ? {
          ...state.activeVisitor,
          item: { ...state.activeVisitor.item },
          dialogue: [...state.activeVisitor.dialogue],
        } : null,
        dailyLog: [...state.dailyLog],
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: "本機存檔失敗；目前頁面仍可繼續遊玩。" };
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: "無法清除本機存檔，進度仍保留。" };
    }
  }

  return { read, save, clear };
})();
