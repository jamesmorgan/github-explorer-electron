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

// // prevent window being garbage collected
// let mainWindow;
//
// function onClosed() {
// 	mainWindow = null; // de-reference the window for multiple windows store them in an array
// }
//
// function createMainWindow() {
// 	const mainWindow = new electron.BrowserWindow({
// 		width: 600,
// 		height: 400
// 	});
// 	mainWindow.loadURL(`file://${__dirname}/index.html`);
// 	mainWindow.on('closed', onClosed);
// 	return mainWindow;
// }
//
// app.on('window-all-closed', () => {
// 	if (process.platform !== 'darwin') {
// 		app.quit();
// 	}
// });
//
// app.on('activate', () => {
// 	if (!mainWindow) {
// 		mainWindow = createMainWindow();
// 	}
// });
//
// app.on('ready', () => {
// 	mainWindow = createMainWindow();
// });

var GithubLookupService = require('./services/GithubLookupService');

var github = new GithubLookupService("jamesmorgan");

var Notifier = require('./services/Notifier');
var notifier = new Notifier();

mb.on('ready', function ready() {
	console.log('app is ready');

	var menu = new Menu();
	menu.append(new MenuItem({
		label: 'Looking up repos...'
	}));
	mb.tray.setContextMenu(menu);

	menu.append(new MenuItem({type: 'separator'}));

	github.findRepos().then((function (repos) {

		var menu = new Menu();

		menu.append(new MenuItem({
			label: 'Github Home',
			click: function () {
				console.log('github home clicked'); // TODO
			}
		}));

		menu.append(new MenuItem({
			label: 'Create Gits',
			click: function () {
				console.log('create gist clicked'); // TODO
			}
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
			click: function () {
				console.log('Configure clicked'); // TODO launch configure.html
			}
		}));

		menu.append(new MenuItem({
			label: 'About',
			click: function () {
				console.log('about clicked'); // TODO launch about.html
			}
		}));

		//Clicking this option quits the soundcast app
		menu.append(new MenuItem({
			label: 'Quit',
			click: function () {
				mb.app.quit();
			}
		}));

		//Enable the tray
		mb.tray.setContextMenu(menu);
	}));
});
