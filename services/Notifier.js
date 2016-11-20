const path = require('path');
const notifier = require('node-notifier');
const _ = require('lodash');

class Notifier {

	fireNotification(options) {
		_.defaults(options, {
			title: 'Github Explorer',
			icon: path.join(__dirname, './resources/tray/icon.png'), // Absolute path (doesn't work on balloons)
		});

		if (_.has(options, 'link_url')) {
			options.open = _.get(options, 'link_url');
		}

		notifier.notify(options);
	}
}

module.exports = Notifier;
