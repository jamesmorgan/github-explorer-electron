const _ = require('lodash');
const moment = require('moment');

/**
 * Simply trigger and run a promise based task - refreshing based on the provided options
 */
class TaskScheduler {

	constructor(_options) {
		_.defaults(_options, {
			refresh_interval_in_sec: 30
		});
		/** various config options */
		this.options = _options;
		/** The ID of any running task */
		this.timer = null;
		/** Count Number of failures to prevent **/
		this.failure_count = 0;
		/** Max number of tries **/
		this.max_retries = 5;
	}

	/**
	 * Start and schedule a new tick with the provided timeout and callback
	 * @param callback
	 */
	startTask(callback) {
		var self = this;

		var hasExceedMaxRetries = () => this.failure_count > this.max_retries;

		var scheduleNextInvocation = (refresh_interval_in_sec) => {
			let timeout_in_mills = (refresh_interval_in_sec || this.options.refresh_interval_in_sec) * 1000;
			if (timeout_in_mills > 0 && !hasExceedMaxRetries()) {
				console.log(`Triggered task [${callback.name}] setTimeout() with [${timeout_in_mills}]`);
				this.timer = setTimeout(trigger, timeout_in_mills);
			}
			if (hasExceedMaxRetries()) {
				console.error(`Reach max retries for task [${callback.name}]`);
				this.stopTicker();
			}
		};

		var trigger = () => {
			callback()
				.then(() => scheduleNextInvocation())
				.catch((err) => {

					self.failure_count++;

					// Allow specific errors to use a different next tick time
					if (_.get(err, 'data.type') === 'SET_RETRY_TIME') {
						let reset_time = _.get(err, 'reset_time');
						console.error(`Expected failure found reset_time=[${reset_time}]`, err);
						if (reset_time) {
							var now = moment();
							var new_refresh_interval_in_sec = moment(reset_time).diff(now, 'seconds') + 10; // for good luck
							scheduleNextInvocation(new_refresh_interval_in_sec);
						}
					} else {
						console.error('Failed to run task', err);
						// Other wise attempt to retry based on default refresh times
						scheduleNextInvocation();
					}
				});
		};

		// If not already started - trigger it
		if (!this.timer) {
			trigger();
		}
	}

	/**
	 * Is the ticker running
	 * @return {boolean}
	 */
	isRunning() {
		console.log('isRunning()');
		return this.timer !== 0 && this.timer !== null;
	}

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

module.exports = TaskScheduler;
