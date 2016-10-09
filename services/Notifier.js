const notifier = require('node-notifier');
const _ = require('lodash');

class Notifier {

	fireNotification(options) {
		_.defaults(options, {
			title: 'Github Explorer'
		});
		notifier.notify(options);
	}
}

module.exports = Notifier;
