const { numberEmojis } = require('../load-data');


function getEmoji(number) {
	if (number < 1) {
		return '';
	}
	else if (number <= 10) {
		// returns the appropriate emoji for numbers 1-10
		return numberEmojis[number];
	}
	else {
		// returns the "input numbers" emoji for numbers greater than 10
		return '🔢';
	}
}

module.exports = { getEmoji };