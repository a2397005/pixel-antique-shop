window.Inventory = {
  hasCapacity(state) {
    return state.inventory.length < state.inventoryCapacity;
  },

  add(state, item) {
    if (!this.hasCapacity(state)) return false;
    state.inventory.push(item);
    return true;
  },

  remove(state, itemId) {
    const index = state.inventory.findIndex((item) => item.id === itemId);
    if (index < 0) return null;
    return state.inventory.splice(index, 1)[0];
  },
};
