window.Market = {
  offers: [
    { id: "blue-and-white-vase", name: "青花小瓶", detail: "瓷器・民國", askPrice: 120, bidPrice: 180, value: 200, level: 1 },
    { id: "bronze-incense-burner", name: "銅香爐", detail: "銅器・手工錘紋", askPrice: 180, bidPrice: 260, value: 300, level: 1 },
    { id: "white-jade-pendant", name: "白玉墜", detail: "玉石・素面", askPrice: 260, bidPrice: 370, value: 400, level: 1 },
    { id: "celadon-bowl", name: "青瓷小碗", detail: "瓷器・釉色溫潤", askPrice: 300, bidPrice: 430, value: 500, level: 2 },
    { id: "brass-compass", name: "黃銅羅盤", detail: "銅器・航海舊物", askPrice: 360, bidPrice: 520, value: 600, level: 2 },
    { id: "silver-hairpin", name: "銀簪", detail: "銀器・花草雕紋", askPrice: 420, bidPrice: 610, value: 700, level: 2 },
    { id: "lacquer-box", name: "螺鈿漆盒", detail: "漆器・螺鈿鑲嵌", askPrice: 560, bidPrice: 810, value: 900, level: 3 },
    { id: "jade-seal", name: "青玉印章", detail: "玉石・篆刻印材", askPrice: 680, bidPrice: 980, value: 1100, level: 3 },
    { id: "porcelain-vase", name: "粉彩花瓶", detail: "瓷器・粉彩繪飾", askPrice: 760, bidPrice: 1100, value: 1300, level: 3 },
  ],

  createOffers(day = 1, shopLevel = 1) {
    const unlockedOffers = this.offers.filter((offer) => offer.level <= shopLevel);
    const count = 3;
    const start = ((Math.max(1, day) - 1) * count) % unlockedOffers.length;

    return Array.from({ length: Math.min(count, unlockedOffers.length) }, (_, index) => {
      const offer = unlockedOffers[(start + index) % unlockedOffers.length];
      return {
        ...offer,
        offerId: `day-${day}-${offer.id}`,
        day,
        purchased: false,
      };
    });
  },

  minimumAsk(shopLevel = 1) {
    const nextTierOffers = this.offers.filter((offer) => offer.level === shopLevel);
    return nextTierOffers.length
      ? Math.min(...nextTierOffers.map((offer) => Math.floor(offer.value * 0.8 / 10) * 10))
      : Math.min(...this.offers.map((offer) => Math.floor(offer.value * 0.8 / 10) * 10));
  },
};
