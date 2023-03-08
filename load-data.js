const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');
const countryDictionary = JSON.parse(fs.readFileSync('data/countries.json', 'utf8'));
const languageDictionary = JSON.parse(fs.readFileSync('data/languages.json', 'utf8'));
const jobsArry = JSON.parse(fs.readFileSync('data/jobs.json', 'utf8'));
const transArry = JSON.parse(fs.readFileSync('data/primary-translations.json', 'utf8'));
const images = JSON.parse(fs.readFileSync('data/images.json', 'utf8'));
const movieRatings = JSON.parse(fs.readFileSync('data/movie-ratings.json', 'utf8'));
const tvRatings = JSON.parse(fs.readFileSync('data/tv-ratings.json', 'utf8'));
const availableRegions = JSON.parse(fs.readFileSync('data/watch-countries.json', 'utf8'));
const availableProviders = JSON.parse(fs.readFileSync('data/movie-providers.json', 'utf8'));
// let countryCodeDict = {};


const langCodeDict = languageDictionary.reduce((obj, item) => {
	obj[item.value] = item.name; return obj;
}, {});

const countryCodeDict = countryDictionary.reduce((obj, item) => {
	obj[item.value] = item.name; return obj;
}, {});


const translationsCodeDict = transArry.reduce((objArry, item) => {
	const langTemp = languageDictionary.find((lang) => item.includes(lang.value));
	objArry.push({ name:  langTemp.name, value: item });
	return objArry;
}, []);


const platformToCountryDict = availableProviders.reduce((arry, platform) => {
	if (!arry[platform.provider_name]) {
		arry[platform.provider_name] = [];
	}

	arry[platform.provider_name] = platform.display_priorities;
	return arry;
}, {});

const platformToCountryArryDict = availableProviders.reduce((arry, platform) => {
	if (!arry[platform.provider_name]) {
		arry[platform.provider_name] = [];
	}

	const countries = Object.keys(platform.display_priorities).map(country => country);

	arry[platform.provider_name] = countries;
	return arry;
}, {});

const countryToPlatformDict = availableProviders.reduce((obj, platform) => {
	const countries = Object.keys(platform.display_priorities);
	countries.forEach(country => {
		if (!(country in obj)) {
			obj[country] = {};
		}
		obj[country][platform.provider_name] = platform.provider_id;
	});
	return obj;
}, {});

const countryToPlatformDictObj = availableProviders.reduce((obj, platform) => {
	const values = availableRegions.map(({ value }) => value);
	const countries = Object.keys(platform.display_priorities).filter(country => values.includes(country));
	countries.forEach(country => {
		if (!(country in obj)) {
			obj[country] = {};
		}
		obj[country][platform.provider_name] = { id: platform.provider_id, logo_path: platform.logo_path };
	});
	return obj;
}, {});

// console.log(countryToPlatformDictObj);
// console.log(countryToPlatformDict);
// console.log(platformToCountryArry);
// console.log(platformToCountryDict);

const depts = jobsArry.reduce((arry, item) => {
	arry.push(item.department);
	return arry;
}, ['Acting']).filter((department) => department != 'Actors');
// console.log(depts);
const deptEmojis = {
	'Camera' : '📷',
	'Crew' : '👷‍♂️',
	'Directing' : '🎬',
	'Costume & Make-Up' : '💄',
	'Actors' : '🎭',
	'Acting' : '🎭',
	'Writing' : '✍️',
	'Visual Effects' : '🔮',
	'Lighting' : '💡',
	'Art' : '🎨',
	'Editing' : '🎞️',
	'Sound' : '🔊',
	'Production' : '🎥',
};

const numberEmojis = {
	1 : '1️⃣',
	2 : '2️⃣',
	3 : '3️⃣',
	4 : '4️⃣',
	5 : '5️⃣',
	6 : '6️⃣',
	7 : '7️⃣',
	8 : '8️⃣',
	9 : '9️⃣',
	10 : '🔟',
};

const siteArray = [
	{
		name: 'IMDb',
		value: 'imdb',
	},
	{
		name: 'Facebook',
		value: 'facebook',
	},
	{
		name: 'Instagram',
		value: 'instagram',
	},
	{
		name: 'Twitter',
		value: 'twitter',
	},
	{
		name: 'Wikidata',
		value: 'wikidata',
	},
];
const siteDict = {
	'imdb': 'https://www.imdb.com/title/',
	'facebook' : 'https://www.facebook.com/',
	'instagram': 'https://www.instagram.com/',
	'twitter': 'https://www.twitter.com/',
	'wikidata': 'https://www.wikidata.org/wiki/',
};


// const siteDict = siteArray.reduce((obj, item) => {
// 	obj[item.name] = item.value; return obj;
// }, {});

const file = new AttachmentBuilder('./images/TMDb-logo.jpg');
const justWatchFile = new AttachmentBuilder('./images/just-watch-logo.jpg');
// const file = new AttachmentBuilder('./images/just-watch-logo.jpg');

module.exports = {
	availableProviders,
	countryDict: countryDictionary,
	countryCodeDict,
	depts,
	deptEmojis,
	file,
	images,
	justWatchFile,
	languageDict: languageDictionary,
	langCodeDict,
	numberEmojis,
	movieRatings,
	siteArray,
	siteDict,
	translationsCodeDict,
	tvRatings,
};