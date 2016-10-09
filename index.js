'use strict';
const electron = require('electron');
const shell = electron.shell;

const menubar = require('menubar');
const _ = require('lodash');

const {Menu, MenuItem} = require('electron');

const app = electron.app;
const mb = menubar();

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

	github.findRepos().then((function (repos) {

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
			title: 'github explorer',
			message: 'completed github repo lookup'
		});

		//Enable the tray
		mb.tray.setContextMenu(menu);
	}));
});
