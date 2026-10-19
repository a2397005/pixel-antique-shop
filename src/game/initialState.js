window.InitialState = {
  create() {
    const state = {
      coins: 500,
      shopLevel: 1,
      inventoryCapacity: 4,
      marketDay: 1,
      inventory: [],
      totalRealizedProfit: 0,
      visitorProgress: { round: 1, phase: "seller" },
      activeVisitor: null,
      dailyLog: [],
    };
    window.Bargaining.beginDay(state);
    return state;
  },
};
