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
	}

	user() {
		return this.client.user(this.username);
	}

	findUserDetails() {
		var self = this;
		return new Promise((resolve, reject) => {
			self.client.get(`/users/${self.username}`, {}, (err, status, body, headers) => {
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
			self.client.get(`/users/${self.username}/repos`, {}, (err, status, body, headers) => {
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

	/**
	 * Determine what has changed
	 *
	 * @param previous_repos array fo repos
	 * @param current_repos array fo repos
	 * @return {Promise.<Array>}
	 */
	determineChanges(previous_repos, current_repos) {
		var changes = [];

		// console.log('previous_repos', previous_repos);

		// if (previous_repos) {
		// 	_.forEach(current_repos, (current_repo) => {
		// 		var newly_created_repo = _.find(previous_repos, {id: current_repo.id});
		// 		// if we find a new repo not in the previous list assume its been created
		// 		if (newly_created_repo) {
		// 			changes.push({
		// 				message: "Repository Added",
		// 				content: newly_created_repo.name,
		// 				link_url: `https://github.com/${this.username}/${newly_created_repo.name}`
		// 			});
		// 		}
		// 	});
		// }

		_.forEach(previous_repos, (existing_repo) => {

			var new_repo = _.find(current_repos, {id: existing_repo.id});

			// if we cant find the existing repo in the new list, assume its deleted
			if (!new_repo) {
				changes.push({
					message: "Repository Deleted",
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}`
				});
			}

			if (existing_repo.watchers > new_repo.watchers) {
				changes.push({
					message: "Watcher Removed",
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/watchers`
				});
			}
			else if (existing_repo.watchers < new_repo.watchers) {
				changes.push({
					message: "Watcher Added",
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/watchers`
				});
			}

			if (existing_repo.open_issues_count > new_repo.open_issues_count) {
				changes.push({
					message: "Issue Resolved",
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/issues`
				});
			}
			else if (existing_repo.open_issues_count < new_repo.open_issues_count) {
				changes.push({
					message: "New Issue",
					content: "",
					link_url: `https://github.com/${this.username}/${existing_repo.name}/issues`
				});
			}

			if (existing_repo.forks_count > new_repo.forks_count) {
				changes.push({
					message: "Removed Project Fork",
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/network`
				});
			}
			else if (existing_repo.forks_count < new_repo.forks_count) {
				changes.push({
					message: "New Project Fork",
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/network`
				});
			}
		});
		return Promise.resolve(changes);
	}

}

module.exports = GithubLookupService;
