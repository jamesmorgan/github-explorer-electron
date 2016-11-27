const github = require('octonode');
const ErrorCodes = require('./ErrorCodes');
const Promise = require('bluebird');
const _ = require('lodash');
const settings = require('./settings');

class GithubLookupService {

	constructor(_username, _options = {}) {

		this.options = _.defaults(_options, {
			version: require('../package.json').version,
			username: _username || settings.username
		});

		// FIXME clean up at some point
		this.username = this.options.username;

		/** Create a Github client */
		this.client = github.client();
	}

	user() {
		return this.client.user(this.options.username);
	}

	findUserDetails() {
		var self = this;
		return new Promise((resolve, reject) => {
			self.client.get(`/users/${self.options.username}`, {}, (err, status, body, headers) => {
				if (err) {
					// console.log(err, status);
					reject(err);
				} else {
					// console.log(body);
					resolve(body);
				}
			});
		});
	}

	findRepos() {
		var self = this;
		return new Promise((resolve, reject) => {
			// TODO {per_page:100} <- how to show all repos by default?
			self.client.get(`/users/${self.options.username}/repos`, {per_page: 100}, (error, status, body, headers) => {
				if (error) {
					// console.log(error, status);

					// Exceeded rate limits
					if (error.statusCode === 403 && (_.get(error.headers, 'x-ratelimit-remaining') === '0')) {
						reject({
							type: ErrorCodes.EXCEEDED_RATE_LIMIT,
							data: {
								reset_time: _.get(error.headers, 'x-ratelimit-reset')
							}
						});
					} else {
						reject(error);
					}
				} else {
					// console.log(body);
					resolve(body);
				}
			});
		});
	}

}

module.exports = GithubLookupService;
