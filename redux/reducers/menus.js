const {ADD_GITHUB_REPOS, FAILURE_TO_GET_GITHUB_REPOS} = require("../ActionTypes");
const Notifier = require('../../services/Notifier');
const settings = require('../../services/settings');
const _ = require('lodash');
const {app, Menu, MenuItem} = require('electron');
const menubar = require('menubar');
const shell = electron.shell;

const mb = menubar({
	tooltip: 'Github Explorer',
	icon: path.join(__dirname, './resources/tray/icon.png'),
	showOnRightClick: false
});

const initialState = {
	template: [{
		label: 'Looking up repos...'
	}]
};

module.exports = function menus(state = initialState, action) {
	console.log('menus action', action.type);

	let menu = Menu.buildFromTemplate(state.template);
	mb.tray.setContextMenu(menu);

	switch (action.type) {
		case ADD_GITHUB_REPOS:

			let templates = [...addDefaultTopMenus()];

			return {
				template: [...action.template, ...state.template]
			};
		case FAILURE_TO_GET_GITHUB_REPOS:
			return {
				repos: [...state.template]
			};
		default:
			return state
	}

	const addDefaultTopMenus = () => {
		return [
			{label: 'Github Home', click: () => shell.openExternal(`https://github.com/${settings.username}`)},
			{label: 'Create Gits', click: () => shell.openExternal(`https://gist.github.com`)},
			{type: 'separator'}
		];
	};

	const addDefaultBottomMenus = (menu) => {
		let subMenu = [{
			label: 'Configure',
			role: 'help',
			accelerator: 'CmdOrCtrl+H',
			click: () => createMainWindow("settings")
		}, {
			label: 'About',
			click: () => createMainWindow("about")
		}, {
			label: 'About Electron',
			role: 'about'
		}, {
			label: 'Force Refresh',
			role: 'reload',
			accelerator: 'CmdOrCtrl+R',
			click: () => gitHubLookupTask()
		}, {
			label: 'Quit',
			click: onExitHandler
		}];

		return [
			{type: 'separator'},
			{
				label: 'Options...',
				submenu: subMenu
			}
		]
	};

};
