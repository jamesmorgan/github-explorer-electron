const types = require("../ActionTypes");

/**
 *
 */
const AddGithubRepos = (repos) => ({
	type: types.ADD_GITHUB_REPOS,
	repos: repos
});

/**
 *
 */
const FailureToGetGithubRepos = (error) => ({
	type: types.FAILURE_TO_GET_GITHUB_REPOS,
	error: error
});

module.exports = {
	AddGithubRepos: AddGithubRepos,
	FailureToGetGithubRepos: FailureToGetGithubRepos,
};
