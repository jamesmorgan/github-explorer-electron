const {combineReducers} = require('redux');
const repos = require('./repos');

const rootReducer = combineReducers({
	repos
});

module.exports = rootReducer;
