// const getKey = (key, map) => map.has(key) ? key : 'Not found';
const TMDB_WATCH_LINK = 'link';
function getKey(obj, input) {
	for (const [key, value] of Object.entries(obj)) {
		if (value === input) {
			return key;
		}
	}

	return 'Not found';
}

module.exports = { getKey, TMDB_WATCH_LINK };