const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');
const countryDictionary = JSON.parse(fs.readFileSync('data/countries.json', 'utf8'));
const languageDictionary = JSON.parse(fs.readFileSync('data/languages.json', 'utf8'));
const jobsArry = JSON.parse(fs.readFileSync('data/jobs.json', 'utf8'));
const transArry = JSON.parse(fs.readFileSync('data/primary-translations.json', 'utf8'));
const images = JSON.parse(fs.readFileSync('data/images.json', 'utf8'));
const ratings = JSON.parse(fs.readFileSync('data/movie-ratings.json', 'utf8'));
const availableRegions = JSON.parse(fs.readFileSync('data/watch-countries.json', 'utf8'));
const availableProviders = JSON.parse(fs.readFileSync('data/movie-providers.json', 'utf8'));
// let countryCodeDict = {};

// (() => {
const countryCodeDict = countryDictionary.reduce((obj, item) => {
	obj[item.value] = item.name; return obj;
}, {});
// })();

const translationsCodeDict = transArry.reduce((objArry, item) => {
	const langTemp = languageDictionary.find((lang) => item.includes(lang.value));
	objArry.push({ name:  langTemp.name, value: item });
	return objArry;
}, []);

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

const file = new AttachmentBuilder('./images/TMDb-logo.jpg');
// const file = new AttachmentBuilder('./images/just-watch-logo.jpg');

// // Create an empty dictionary object
// const countriesDict = {};
// console.log(ratings)
// // Loop through the array and create dictionary entries
// for (let i = 0; i < dictionary.length; i++) {
// 	const item = dictionary[i];
// 	countriesDict[item.key] = item.value;
// }
module.exports = {
	countryDict: countryDictionary,
	languageDict: languageDictionary,
	countryCodeDict,
	images,
	translationsCodeDict,
	depts,
	deptEmojis,
	numberEmojis,
	ratings,
	file,
};