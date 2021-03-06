export default {
    addItem(state, payload) {
        state.items.push(payload);
        
        return state;
    },
    clearItem(state, payload) {
        state.items.splice(payload.index, 1);
        
        return state;
    },
    addScore(state, payload) {
        state.score = payload;
        
        return state;
    },
    toggleOption(state, payload) {
        state[payload] = !state[payload];
        
        return state;
    },
};
