const fs = require('fs');
const countryDictionary = JSON.parse(fs.readFileSync('data/countries.json', 'utf8'));
const languageDictionary = JSON.parse(fs.readFileSync('data/languages.json', 'utf8'));
const jobsArry = JSON.parse(fs.readFileSync('data/jobs.json', 'utf8'));
const transArry = JSON.parse(fs.readFileSync('data/primary-translations.json', 'utf8'));
const images = JSON.parse(fs.readFileSync('data/images.json', 'utf8'));
let countryCodeDict = {};

// (() => {
countryCodeDict = countryDictionary.reduce((obj, item) => {
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
}, []);
// console.log(depts);
// // Create an empty dictionary object
// const countriesDict = {};

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
};