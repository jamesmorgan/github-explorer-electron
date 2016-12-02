const path = require('path');
const notifier = require('node-notifier');
const _ = require('lodash');

class Notifier {

	static fireNotification(messageOptions) {
		_.defaults(messageOptions, {
			title: 'Github Explorer',
			// FIXME Absolute path (doesn't work on balloons) ... ?
			icon: path.join(__dirname, './resources/tray/icon.png'),
		});

		if (_.has(messageOptions, 'link_url')) {
			messageOptions.open = _.get(messageOptions, 'link_url');
		}

		notifier.notify(messageOptions);
	}
}

module.exports = Notifier;
