const { countryCodeDict } = require('../load-data');

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
function getOptionsForPeopleSelectMenu(people) {
	const options = [];

	for (const peopleInfo of people) {
		// known_for_department
		options.push({ label: `${peopleInfo.name.slice(0, 81)} (${peopleInfo.gender})`, description: `known for ${peopleInfo.known_for_department}`, value: `${peopleInfo.id}` });
	}
	return options;
}
function getOptionsForCompanySelectMenu(companies) {
	const options = [];

	for (const companyInfo of companies) {
		// known_for_department
		options.push({ label: `${companyInfo.name.slice(0, 81)}`, description: `${companyInfo.origin_country} (${countryCodeDict[companyInfo.origin_country]})`, value: `${companyInfo.id}` });
	}
	return options;
}

module.exports = { getOptionsForCompanySelectMenu, getOptionsForPeopleSelectMenu, getOptionsForSelectMenu, getOptionsForTvSelectMenu };