const _ = require('lodash');

/**
 * Simply trigger and run a promise based task - refreshing based on the provided options
 */
class TaskScheduler {

	constructor(_options, _timer = null) {
		_.defaults(_options, {
			refresh_interval_in_sec: 30
		});
		this.options = _options;
		this.timer = _timer;
	}

	/**
	 * Start and schedule a new tick with the provided timeout and callback
	 * @param callback
	 */
	startTask(callback) {
		var self = this;
		callback()
			.then(() => {
				let timeout_in_mills = self.options.refresh_interval_in_sec * 1000;
				if (timeout_in_mills > 0) {
					console.log('setTimeout()', timeout_in_mills);
					self.timer = setInterval(callback, timeout_in_mills);
				}
			})
			.catch((err) => console.error('failed to run task', err));
	}

	/**
	 * Is the ticker running
	 * @return {boolean}
	 */
	isRunning() {
		console.log('isRunning()');
		return this.timer !== 0 && this.timer !== null;
	};

	/**
	 * If the timer is running attempt to stop it
	 */
	stopTicker() {
		console.log('stopTicker()');
		if (this.isRunning()) {
			clearInterval(this.timer)
		}
	}
}

module.exports = {
	TaskScheduler: TaskScheduler
};
