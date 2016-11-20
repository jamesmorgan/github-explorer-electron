'use strict';
const electron = require('electron');
const shell = electron.shell;

const menubar = require('menubar');
const _ = require('lodash');

const {app, Menu, MenuItem} = require('electron');

// const app = electron.app;
const mb = menubar({
	tooltip: 'Github Explorer',
	icon: 'resources/tray/icon.png',
	showOnRightClick: false
});

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')({showDevTools: true});

const ErrorCodes = require('./services/ErrorCodes');
var GithubLookupService = require('./services/GithubLookupService');
var github = new GithubLookupService("jamesmorgan");

var Notifier = require('./services/Notifier');
var notifier = new Notifier();

var TaskScheduler = require('./services/TaskScheduler');
var taskScheduler = new TaskScheduler({
	refresh_interval_in_sec: 30 // once every 30s
});

var MenuBuilder = require('./services/MenuBuilder');

function createMainWindow(type) {
	console.log('createMainWindow()', type);
	// TODO launch NG2 application and navigate to type e.g. type = about OR settings
	let mainWindow = new electron.BrowserWindow({
		width: 600,
		height: 600
	});
	mainWindow.loadURL(`file://${__dirname}/content/index.html`);
	mainWindow.on('closed', function onClosed() {
		mainWindow = null; // de-reference the window for multiple windows store them in an array
	});
	return mainWindow;
}

var onExitHandler = () => {
	taskScheduler.stopTicker();
	mb.app.quit();
	app.quit();
};

app.on('window-all-closed', onExitHandler);

var notification_triggers = {
	successfully_connected: false
};

mb.on('ready', function ready() {
	console.log('app is ready');

	var menu = new Menu();
	menu.append(new MenuItem({
		label: 'Looking up repos...'
	}));
	mb.tray.setContextMenu(menu);

	var menuBuilder = new MenuBuilder({
		tray: mb.tray
	});

	var addDefaultBottomMenus = (menu) => {
		var subMenu = new Menu();
		subMenu.append(new MenuItem({
			label: 'Configure',
			role: 'help',
			accelerator: 'CmdOrCtrl+H',
			click: () => createMainWindow("settings")
		}));
		subMenu.append(new MenuItem({
			label: 'About',
			role: 'about',
			click: () => createMainWindow("about")
		}));
		subMenu.append(new MenuItem({
			label: 'Force Refresh',
			role: 'reload',
			accelerator: 'CmdOrCtrl+R',
			click: () => gitHubLookupTask()
		}));
		subMenu.append(new MenuItem({
			label: 'Quit',
			role: 'close',
			click: onExitHandler
		}));

		menu.append(new MenuItem({type: 'separator'}));
		menu.append(new MenuItem({
			label: 'About',
			submenu: subMenu
		}));
	};

	var addDefaultTopMenus = (menu) => {
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

	var addRepoMenu = (menu, repo) => {
		console.log('Adding repo menu item for', repo.name);

		var subMenu = new Menu();

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
		subMenu.append(new MenuItem({
			label: 'Project Home',
			click: () => shell.openExternal(repo.homepage)
		}));
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
		subMenu.append(new MenuItem({
			label: `Forks: ${repo.forks_count || 0}`,
			click: () => shell.openExternal(`${repo.html_url}/forks`)
		}));

		// Add the new repo and sub menu
		menu.append(new MenuItem({
			label: repo.name,
			submenu: subMenu
		}));
	};

	let previous_repos = null;

	var gitHubLookupTask = () => {
		console.log('gitHubLookupTask() triggered');

		/** Attempt to hit github */
		return github.findRepos()
			.then(handleSuccess)
			.catch(handleFailure);

		function handleSuccess(current_repos) {
			console.log(`Found a total of [${_.size(current_repos)}] repositories`);

			var menu = new Menu();

			// Gist, Homepage
			addDefaultTopMenus(menu);

			// Each repository found
			_.forEach(current_repos, (repo) => addRepoMenu(menu, repo));

			// About, Configure, Quit
			addDefaultBottomMenus(menu);

			// Rest/enable the tray
			mb.tray.setContextMenu(menu);

			// TODO allow settings to disable notifications
			if (!notification_triggers.successfully_connected) {
				notification_triggers.successfully_connected = true;
				notifier.fireNotification({message: 'Completed github repo lookup'});
			}

			// Work out changes
			github.determineChanges(previous_repos, current_repos)
				.then((changes) => {
					console.log('changes', changes);
					_.forEach(changes, (change) => notifier.fireNotification(change));
					previous_repos = current_repos
				});

			return current_repos;
		}

		function handleFailure(error) {
			// Rest success flag
			notification_triggers.successfully_connected = false;

			// Exceeded rate limits
			if (error.type == ErrorCodes.EXCEEDED_RATE_LIMIT) {
				notifier.fireNotification({message: 'Rate limit exceeded!'});
			} else {
				notifier.fireNotification({message: 'Failed to connect to Github'});
			}

			var menu = new Menu();

			// Adding all other menus which should be present by default
			addDefaultBottomMenus(menu);

			//Enable the tray
			mb.tray.setContextMenu(menu);

			// Rethrow the error so promised chain can react
			throw error;
		}
	};

	var triggerGithubScheduler = function () {
		return taskScheduler.startTask(gitHubLookupTask)
	};

	// TODO allow settings to configure enable auto refresh
	let shouldAutoRefresh = true;
	if (shouldAutoRefresh) {
		triggerGithubScheduler();
	}
});
