var github = require('octonode');
var Promise = require('bluebird');

class GithubLookupService {

	constructor(username) {
		this.username = username;
		this.client = github.client();
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
			self.client.get(`/users/${self.username}/repos`, {}, function (err, status, body, headers) {
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
