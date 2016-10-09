const notifier = require('node-notifier');
const _ = require('lodash');

class Notifier {

	fireNotification(options) {
		notifier.notify(options);
	}
}

module.exports = Notifier;
