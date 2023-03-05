function getOptionsForSelectMenu(movieTitles, language = 'en-US') {
	const options = [];

	for (const movieObject of movieTitles) {
		const description = movieObject.overview.slice(0, 50);
		const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const releaseDate = new Date(movieObject.release_date).toLocaleDateString(language, dateOptions);
		options.push({ label: `${movieObject.title.slice(0, 81)} (${releaseDate})`, description: `${description}...`, value: `${movieObject.id}` });
	}
	return options;
}
function getOptionsForTvSelectMenu(tvTitles, language) {
	const options = [];

	for (const tvObject of tvTitles) {
		const description = tvObject.overview.slice(0, 50);
		const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const releaseDate = new Date(tvObject.first_air_date).toLocaleDateString(language, dateOptions);
		options.push({ label: `${tvObject.name.slice(0, 81)} (${releaseDate})`, description: `${description}...`, value: `${tvObject.id}` });
	}
	return options;
}

module.exports = { getOptionsForSelectMenu, getOptionsForTvSelectMenu };