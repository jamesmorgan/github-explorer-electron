const {ADD_GITHUB_REPOS, FAILURE_TO_GET_GITHUB_REPOS, FORCE_REFRESH_GITHUB_REPOS} = require("../ActionTypes");
const ErrorCodes = require('../../services/ErrorCodes');
const Notifier = require('../../services/Notifier');
const settings = require('../../services/settings');
const _ = require('lodash');

const initialState = {
	loaded: false,
	repos: []
};

module.exports = function repos(state = initialState, action) {
	console.log('repos action', action.type);
	switch (action.type) {
		case FORCE_REFRESH_GITHUB_REPOS:

			Notifier.fireNotification({message: 'Github repos refreshed'});

			// Work out changes
			determineChanges(state, action).then((changes) => {
				console.log('changes', changes);
				_.forEach(changes, (change) => Notifier.fireNotification(change));
			});

			return {
				loaded: true,
				repos: [...action.repos] // Create new instance from the new repos
			};
		case ADD_GITHUB_REPOS:

			// When we receive a success for the first time, trigger notification
			if (state.loaded == false) {
				Notifier.fireNotification({message: 'Completed github repo lookup'});
			}

			// Work out changes
			determineChanges(state, action).then((changes) => {
				console.log('changes', changes);
				_.forEach(changes, (change) => Notifier.fireNotification(change));
			});

			return {
				loaded: true,
				repos: [...action.repos] // Create new instance from the new repos
			};
		case FAILURE_TO_GET_GITHUB_REPOS:

			// Exceeded rate limits
			if (_.get(action, 'error.type') === ErrorCodes.EXCEEDED_RATE_LIMIT) {
				Notifier.fireNotification({message: 'Rate limit exceeded!'});
			} else {
				Notifier.fireNotification({message: 'Failed to connect to Github'});
			}

			return {
				loaded: false,
				repos: [...state.repos] // Return existing state when failure happens
			};
		default:
			return _.cloneDeep(state);
	}
};

/**
 * Determine what has changed
 *
 * @param previous_state
 * @param current_state
 * @return {Promise.<Array>}
 */
function determineChanges(previous_state, current_state) {

	let previous_repos = previous_state.repos;
	console.log(`previous state repos [${_.size(previous_state.repos)}]`);

	let current_repos = current_state.repos;
	console.log(`current state repos [${_.size(current_state.repos)}]`);

	let hasPreviousState = _.size(previous_repos) !== 0;

	let changes = [];

	if (hasPreviousState) {

		_.forEach(current_repos, (repo) => {
			let found_repo = _.find(previous_repos, {id: repo.id});
			// If we dont find the repo in the previous lookup, assume its been added
			if (!found_repo) {
				changes.push({
					message: `Repository Added - [${repo.name}]`,
					content: repo.name,
					link_url: `https://github.com/${settings.username}/${repo.name}`
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
					link_url: `https://github.com/${settings.username}/${repo.name}`
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
				link_url: `https://github.com/${settings.username}/${existing_repo.name}/stargazers`
			});
		}
		else if (existing_repo.watchers < new_repo.watchers) {
			changes.push({
				message: `Stargazer Added - [${existing_repo.name}]`,
				content: existing_repo.name,
				link_url: `https://github.com/${settings.username}/${existing_repo.name}/stargazers`
			});
		}

		if (existing_repo.open_issues_count > new_repo.open_issues_count) {
			changes.push({
				message: `Issue Resolved - [${existing_repo.name}]`,
				content: existing_repo.name,
				link_url: `https://github.com/${settings.username}/${existing_repo.name}/issues`
			});
		}
		else if (existing_repo.open_issues_count < new_repo.open_issues_count) {
			changes.push({
				message: `New Issue - [${existing_repo.name}]`,
				content: "",
				link_url: `https://github.com/${settings.username}/${existing_repo.name}/issues`
			});
		}

		if (existing_repo.forks_count > new_repo.forks_count) {
			changes.push({
				message: `Removed Project Fork - [${existing_repo.name}]`,
				content: existing_repo.name,
				link_url: `https://github.com/${settings.username}/${existing_repo.name}/network`
			});
		}
		else if (existing_repo.forks_count < new_repo.forks_count) {
			changes.push({
				message: `New Project Fork - [${existing_repo.name}]`,
				content: existing_repo.name,
				link_url: `https://github.com/${settings.username}/${existing_repo.name}/network`
			});
		}
	});

	return Promise.resolve(changes);
}
