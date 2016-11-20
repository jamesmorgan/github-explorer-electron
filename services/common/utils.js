var breakSentence = (longString, charLimit = 50) => {
	// Split by spaces & then join words so that each string section is less than charLimit
	return longString
		.split(/\s+/)
		.reduce((prev, curr) => {
			if (prev.length && (prev[prev.length - 1] + ' ' + curr).length <= charLimit) {
				prev[prev.length - 1] += ' ' + curr;
			} else {
				prev.push(curr);
			}
			return prev;
		}, [])
		.join('\n');
};

module.exports = {
	breakSentence: breakSentence
};
