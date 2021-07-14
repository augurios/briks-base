import actions from './actions.js';
import mutations from './mutations.js';
import stateDefaults from './state.js';
import Store from './store.js';

const buildVersion = 0.1;

let state = Object.assign({}, stateDefaults);

    if(localStorage.getItem('gameSettings')) {
        state = JSON.parse(localStorage.getItem('gameSettings'));

        //update existing state
        if(buildVersion > state.version) {
            state.version = buildVersion;
            let updatedState = Object.assign({}, stateDefaults);
            Object.keys(state.version).forEach(function(key) {
                updatedState[key] = state[key]
            });
            state = updatedState;
        }
        
    } else {
        state.version = buildVersion;
        localStorage.setItem('gameSettings', JSON.stringify(state));
    }; 

export default new Store({
    actions,
    mutations,
    state
});
