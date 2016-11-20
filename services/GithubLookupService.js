const github = require('octonode');
const ErrorCodes = require('./ErrorCodes');
const Promise = require('bluebird');
const _ = require('lodash');

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
			// TODO {per_page:100} <- how to show all repos?
			self.client.get(`/users/${self.username}/repos`, {per_page: 100}, (error, status, body, headers) => {
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

	/**
	 * Determine what has changed
	 *
	 * @param previous_repos array of repos
	 * @param current_repos array of repos
	 * @return {Promise.<Array>}
	 */
	determineChanges(previous_repos, current_repos) {
		var changes = [];

		if (previous_repos) {

			_.forEach(current_repos, (repo) => {
				var found_repo = _.find(previous_repos, {id: repo.id});
				// If we dont find the repo in the previous lookup, assume its been added
				if (!found_repo) {
					changes.push({
						message: `Repository Added - [${repo.name}]`,
						content: repo.name,
						link_url: `https://github.com/${this.username}/${repo.name}`
					});
				}
			});

			_.forEach(previous_repos, (repo) => {
				let found_repo = _.find(current_repos, {id: repo.id});
				// If we find the repo in the previous lookup and not in the current repo
				if (!found_repo) {
					changes.push({
						message: `Repository Deleted - [${repo.name}]`,
						content: repo.name,
						link_url: `https://github.com/${this.username}/${repo.name}`
					});
				}
			});

		}

		_.forEach(previous_repos, (existing_repo) => {

			let new_repo = _.find(current_repos, {id: existing_repo.id});
			if (!new_repo) {
				console.log(`Repo [${existing_repo.name}] not found, assumed deleted so skipping remaining checks`);
				return;
			}

			if (existing_repo.watchers > new_repo.watchers) {
				changes.push({
					message: `Stargazer Removed - [${existing_repo.name}]`,
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/stargazers`
				});
			}
			else if (existing_repo.watchers < new_repo.watchers) {
				changes.push({
					message: `Stargazer Added - [${existing_repo.name}]`,
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/stargazers`
				});
			}

			if (existing_repo.open_issues_count > new_repo.open_issues_count) {
				changes.push({
					message: `Issue Resolved - [${existing_repo.name}]`,
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/issues`
				});
			}
			else if (existing_repo.open_issues_count < new_repo.open_issues_count) {
				changes.push({
					message: `New Issue - [${existing_repo.name}]`,
					content: "",
					link_url: `https://github.com/${this.username}/${existing_repo.name}/issues`
				});
			}

			if (existing_repo.forks_count > new_repo.forks_count) {
				changes.push({
					message: `Removed Project Fork - [${existing_repo.name}]`,
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/network`
				});
			}
			else if (existing_repo.forks_count < new_repo.forks_count) {
				changes.push({
					message: `New Project Fork - [${existing_repo.name}]`,
					content: existing_repo.name,
					link_url: `https://github.com/${this.username}/${existing_repo.name}/network`
				});
			}
		});

		return Promise.resolve(changes);
	}

}

module.exports = GithubLookupService;
