'use strict';
const electron = require('electron');
const shell = electron.shell;

const menubar = require('menubar');
const _ = require('lodash');

const {app, Menu, MenuItem} = require('electron');

// const app = electron.app;
const mb = menubar();

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

mb.on('ready', function ready() {
	console.log('app is ready');

	var menu = new Menu();
	menu.append(new MenuItem({
		label: 'Looking up repos...'
	}));
	mb.tray.setContextMenu(menu);

	menu.append(new MenuItem({type: 'separator'}));

	var triggerGithubScheduler = function () {
		gitHubLookupScheduler.startTicker(function () {
			github.findRepos().then((function (repos) {

				var menu = new Menu();

				menu.append(new MenuItem({
					label: 'Github Home',
					click: () => shell.openExternal(`https://github.com/${github.username}`)
				}));

				menu.append(new MenuItem({
					label: 'Create Gits',
					click: () => shell.openExternal(`https://gist.github.com`)
				}));

				menu.append(new MenuItem({type: 'separator'}));

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

				notifier.fireNotification({
					message: 'completed github repo lookup'
				});

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

				//Enable the tray
				mb.tray.setContextMenu(menu);
			}));
		})
	};

	// if options not set
	// launch settings
	// otherwise trigger github

	triggerGithubScheduler()

});
