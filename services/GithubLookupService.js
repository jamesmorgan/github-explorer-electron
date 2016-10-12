var github = require('octonode');
var Promise = require('bluebird');
var _ = require('lodash');

class GithubLookupService {

	constructor(_username, _options = {}) {
		_.defaults(_options, {
			version: require('../package.json').version,
			username: _username
		});
		this.options = _options;
		this.username = _username;

		/** Create a Github client */
		this.client = github.client();

		/** User agent passed when making API requests **/
		this.useragent = "GitHub-Explorer/" + _options.version;
	}

	user() {
		return this.client.user(this.username);
	}

	findUserDetails() {
		var self = this;
		return new Promise(function (resolve, reject) {
			self.client.get(`/users/${self.username}`, {}, function (err, status, body, headers) {
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
		return new Promise(function (resolve, reject) {
			self.client.get(`/users/${self.username}/1/repos`, {}, function (err, status, body, headers) {
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

}

module.exports = GithubLookupService;
