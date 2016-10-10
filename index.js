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
var gitHubLookupScheduler = new Schedular.GitHubLookupScheduler({});

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
	app.quit();
	mb.app.quit();
	if (gitHubLookupScheduler.isRunning()) {
		gitHubLookupScheduler.stopTicker();
	}
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

	function addDefaultBottomMenus(menu) {
		menu.append(new MenuItem({type: 'separator'}));
		menu.append(new MenuItem({
			label: 'Configure',
			click: () => createMainWindow("settings")
		}));
		menu.append(new MenuItem({
			label: 'About',
			click: () => createMainWindow("about")
		}));
		menu.append(new MenuItem({
			label: 'Quit',
			click: onExitHandler
		}));
	}

	function addDefaultTopMenus(menu) {
		menu.append(new MenuItem({
			label: 'Github Home',
			click: () => shell.openExternal(`https://github.com/${github.username}`)
		}));
		menu.append(new MenuItem({
			label: 'Create Gits',
			click: () => shell.openExternal(`https://gist.github.com`)
		}));
		menu.append(new MenuItem({type: 'separator'}));
	}

	var triggerGithubScheduler = function () {
		gitHubLookupScheduler.startTicker(function () {

			var handleSuccess = function (repos) {

				var menu = new Menu();
				addDefaultTopMenus(menu);

				_.forEach(repos, (repo) => {
					console.log('adding repo - ' + repo.name);
					menu.append(new MenuItem({
						label: repo.name,
						click: function (current) {
							console.log('clicked', repo.name);
							shell.openExternal(repo.html_url);
						}
					}));
				});

				if (!notification_triggers.successfully_connected) {
					notification_triggers.successfully_connected = true;
					notifier.fireNotification({
						message: 'completed github repo lookup'
					});
				}

				// Adding all other menus which should be present by default
				addDefaultBottomMenus(menu);

				//Enable the tray
				mb.tray.setContextMenu(menu);
			};

			/**
			 * Attempt to hit github
			 */
			github.findRepos()
				.then(handleSuccess)
				.catch(function (error) {
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
				})
		})
	};

	// if options not set
	// launch settings
	// otherwise trigger github

	triggerGithubScheduler()

});
