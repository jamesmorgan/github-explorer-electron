'use strict';
const path = require('path');
const electron = require('electron');
const shell = electron.shell;

const menubar = require('menubar');
const _ = require('lodash');

const {app, Menu, MenuItem} = require('electron');

const {AddGithubRepos, FailureToGetGithubRepos, ForceRefreshGithubRepos} = require("./redux/actions");
const {createStore}  = require("redux");
const reducer = require("./redux/reducers");

const store = createStore(reducer);

// const app = electron.app;
const mb = menubar({
	tooltip: 'Github Explorer',
	icon: path.join(__dirname, './resources/tray/icon.png'),
	showOnRightClick: false
});

// TODO setting to always open config with dev tools
// adds debug features like hotkeys for triggering dev tools and reload
// require('electron-debug')({showDevTools: true});

let GithubLookupService = require('./services/GithubLookupService');
const github = new GithubLookupService();

let TaskScheduler = require('./services/TaskScheduler');
const taskScheduler = new TaskScheduler({
	// refresh_interval_in_sec: 30 // once every 30s
});

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createMainWindow(type) {
	console.log('createMainWindow()', type, !mainWindow);
	if (!mainWindow) {
		// TODO launch NG2 application and navigate to type e.g. type = about OR settings
		mainWindow = new electron.BrowserWindow({
			width: 600,
			height: 600,
			alwaysOnTop: true
		});
		mainWindow.loadURL(`file://${__dirname}/browser-content-build/index.html`);
		mainWindow.on('closed', function onClosed() {
			mainWindow = null; // de-reference the window for multiple windows store them in an array
		});
		return mainWindow;
	}
}

const onExitHandler = () => {
	taskScheduler.stopTicker();
	mb.app.quit();
	app.quit();
};

// This method will be called when Electron has finished initialization and is ready to create browser windows.
app.on('ready', function () {
	// TODO -> trigger lookup
	// TODO -> open settings windows if user name not set
});

app.on('window-all-closed', () => console.log('Closed'));

mb.on('ready', function ready() {
	console.log('app is ready');

	let menu = new Menu();
	menu.append(new MenuItem({
		label: 'Looking up repos...'
	}));
	mb.tray.setContextMenu(menu);

	const addDefaultBottomMenus = (menu) => {
		let subMenu = new Menu();
		subMenu.append(new MenuItem({
			label: 'Configure',
			click: () => createMainWindow("settings")
		}));
		subMenu.append(new MenuItem({
			label: 'About',
			click: () => createMainWindow("about")
		}));
		subMenu.append(new MenuItem({
			label: 'About Electron',
			role: 'about'
		}));
		subMenu.append(new MenuItem({
			label: 'Force Refresh',
			click: () => gitHubLookupTask(true)
		}));
		subMenu.append(new MenuItem({
			label: 'Quit',
			click: onExitHandler
		}));

		menu.append(new MenuItem({type: 'separator'}));
		menu.append(new MenuItem({
			label: 'Options...',
			submenu: subMenu
		}));
	};

	const addDefaultTopMenus = (menu) => {
		menu.append(new MenuItem({
			label: 'Github Home',
			click: () => shell.openExternal(`https://github.com/${github.username}`)
		}));
		menu.append(new MenuItem({
			label: 'Create Gits',
			click: () => shell.openExternal(`https://gist.github.com`)
		}));
		menu.append(new MenuItem({type: 'separator'}));
	};

	const addRepoMenu = (menu, repo) => {
		// console.log('Adding repo menu item for', repo.name);

		let subMenu = new Menu();

		// TODO add config option to display description in menu-bar
		if (repo.description) {
			subMenu.append(new MenuItem({
				label: repo.description,
				enabled: false
			}));
		}
		subMenu.append(new MenuItem({
			label: 'Github Home',
			click: () => shell.openExternal(repo.html_url)
		}));

		if (repo.homepage) {
			subMenu.append(new MenuItem({
				label: 'Project Home',
				click: () => shell.openExternal(repo.homepage)
			}));
		}

		subMenu.append(new MenuItem({
			label: 'Pulls',
			click: () => shell.openExternal(`${repo.html_url}/pulls`)
		}));

		if (repo.has_wiki) {
			subMenu.append(new MenuItem({
				label: 'Project Wiki',
				click: () => shell.openExternal(`${repo.html_url}/wiki`)
			}));
		}

		subMenu.append(new MenuItem({type: 'separator'}));

		if (repo.has_issues) {
			subMenu.append(new MenuItem({
				label: `Issues: ${repo.open_issues_count || 0}`,
				click: () => shell.openExternal(`${repo.html_url}/issues`)
			}));
		}
		subMenu.append(new MenuItem({
			label: `Stars: ${repo.watchers_count || 0}`,
			click: () => shell.openExternal(`${repo.html_url}/stargazers`)
		}));

		const forksOrNetwork = (repo) => repo.forks_count > 0
			? `Forks: ${repo.forks_count || 0}`
			: `Network: ${repo.forks_count || 0}`;

		subMenu.append(new MenuItem({
			label: forksOrNetwork(repo),
			click: () => shell.openExternal(`${repo.html_url}/network`)
		}));

		// Add the new repo and sub menu
		menu.append(new MenuItem({
			label: repo.name,
			submenu: subMenu
		}));
	};

	const gitHubLookupTask = (forceRefresh) => {
		console.log('gitHubLookupTask() triggered');

		/** Attempt to hit github */
		return github.findRepos()
			.then(handleSuccess)
			.catch(handleFailure);

		function handleSuccess(current_repos) {
			console.log(`Found a total of [${_.size(current_repos)}] repositories`);

			if (forceRefresh) {
				store.dispatch(ForceRefreshGithubRepos(current_repos));
			} else {
				store.dispatch(AddGithubRepos(current_repos));
			}

			let menu = new Menu();

			// Gist, Homepage
			addDefaultTopMenus(menu);

			// Each repository found
			_.forEach(current_repos, (repo) => addRepoMenu(menu, repo));

			// About, Configure, Quit
			addDefaultBottomMenus(menu);

			// Rest/enable the tray
			mb.tray.setContextMenu(menu);

			return current_repos;
		}

		function handleFailure(error) {

			store.dispatch(FailureToGetGithubRepos(error));

			let menu = new Menu();

			// Adding all other menus which should be present by default
			addDefaultBottomMenus(menu);

			//Enable the tray
			mb.tray.setContextMenu(menu);

			// Rethrow the error so promised chain can react
			throw error;
		}
	};

	const triggerGithubScheduler = function () {
		return taskScheduler.startTask(gitHubLookupTask)
	};

	// TODO allow settings to configure enable auto refresh
	let shouldAutoRefresh = true;
	if (shouldAutoRefresh) {
		triggerGithubScheduler();
	} else {
		gitHubLookupTask()
	}
});
