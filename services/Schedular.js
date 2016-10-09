const _ = require('lodash');

/**
 *
 */
class GitHubLookupScheduler {

	constructor(options) {
		_.defaults(options, {
			task_timeout_in_sec: 30,
			task_retries_before_fail: 10,
			refresh_interval: 3000000,
			enable_auto_refresh: true
		});
		this.options = options;
		this.timer = null;
	}

	/**
	 * Start and schedule a new tick with the provided timeout and callback
	 * @param callback
	 */
	startTicker(callback) {
		let timeout_in_mills = this.options.task_timeout_in_sec * 1000;
		if (timeout_in_mills > 0 && this.options.enable_auto_refresh) {
			console.log('setTimeout()', timeout_in_mills);
			callback();
			this.timer = setInterval(callback, timeout_in_mills);
		}
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
		if (this.timer) {
			clearInterval(this.timer)
		}
	}
}

module.exports = {
	GitHubLookupScheduler: GitHubLookupScheduler
};
