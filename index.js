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

require('electron-debug')({showDevTools: true});

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

var GithubLookupService = require('./services/GithubLookupService');

var github = new GithubLookupService("jamesmorgan");

var Notifier = require('./services/Notifier');
var notifier = new Notifier();

var Schedular = require('./services/Schedular');
var tickingScheduler = new Schedular.GitHubLookupScheduler({});

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
	tickingScheduler.stopTicker();
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

	var addDefaultBottomMenus = (menu) => {
		var subMenu = new Menu();
		subMenu.append(new MenuItem({
			label: 'Configure',
			click: () => createMainWindow("settings")
		}));
		subMenu.append(new MenuItem({
			label: 'About',
			click: () => createMainWindow("about")
		}));
		subMenu.append(new MenuItem({
			label: 'Quit',
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
				label: breakSentence(repo.description),
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
			label: `Watchers: ${repo.watchers_count || 0}`,
			click: () => shell.openExternal(`${repo.html_url}/watchers`)
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

	var lookupTask = () => {

		/**
		 * Attempt to hit github
		 */
		return github.findRepos()
			.then(handleSuccess)
			.catch(handleFailure);

		function handleSuccess(repos) {
			console.log(`Found a total of [${_.size(repos)}] repositories`);

			var menu = new Menu();

			// Gist, Homepage
			addDefaultTopMenus(menu);

			// Each repository found
			_.forEach(repos, (repo) => addRepoMenu(menu, repo));

			// About, Configure, Quit
			addDefaultBottomMenus(menu);

			// Rest/enable the tray
			mb.tray.setContextMenu(menu);

			// TODO allow settings to disable notifications
			if (!notification_triggers.successfully_connected) {
				notification_triggers.successfully_connected = true;
				notifier.fireNotification({
					message: 'Completed github repo lookup'
				});
			}
		}

		function handleFailure(error) {
			console.error(error);

			notification_triggers.successfully_connected = false;

			// Exceeded rate limits
			if (error.statusCode === 403 && (_.get(error.headers, 'x-ratelimit-remaining') === '0')) {
				notifier.fireNotification({
					message: 'Rate limit exceeded!'
				});
				// TODO handle exceeded rate limit and trigger refresh from 'x-ratelimit-reset' header
			} else {
				notifier.fireNotification({
					message: 'Failed to connect to Github'
				});
			}

			var menu = new Menu();

			// Adding all other menus which should be present by default
			addDefaultBottomMenus(menu);

			//Enable the tray
			mb.tray.setContextMenu(menu);
		}
	};

	var triggerGithubScheduler = function () {
		tickingScheduler.startTask(lookupTask)
	};

	// TODO allow settings to configure enable auto refresh
	let shouldAutoRefresh = true;
	if (shouldAutoRefresh) {
		triggerGithubScheduler();
	}
});

var breakSentence = (longString, charLimit = 50) => {
	// Split by spaces & then join words so that each string section is less than charLimit
	var result = longString
		.split(/\s+/)
		.reduce((prev, curr) => {
			if (prev.length && (prev[prev.length - 1] + ' ' + curr).length <= charLimit) {
				prev[prev.length - 1] += ' ' + curr;
			} else {
				prev.push(curr);
			}
			return prev;
		}, [])
		.join('\n');
	console.log('Splitting sentence to', result);
	return result;
};

