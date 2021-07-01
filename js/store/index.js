import actions from './actions.js';
import mutations from './mutations.js';
import stateDefaults from './state.js';
import Store from './store.js';

var state = JSON.parse(localStorage.getItem('gameSettings')) || localStorage.setItem('gameSettings', JSON.stringify(stateDefaults));

export default new Store({
    actions,
    mutations,
    state
});
