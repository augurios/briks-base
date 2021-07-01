export default {
    addItem(context, payload) {
        context.commit('addItem', payload);
    },
    clearItem(context, payload) {
        context.commit('clearItem', payload);
    },
    addScore(context, payload) {
        context.commit('addScore', payload);
    },
};
