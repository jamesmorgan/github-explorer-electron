const {combineReducers} = require('redux');
const repos = require('./repos');
// const menus = require('./menus');

const rootReducer = combineReducers({
	repos,
	// menus
});

module.exports = rootReducer;
