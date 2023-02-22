const fs = require('fs');
const countryDictionary = JSON.parse(fs.readFileSync('data/countries.json', 'utf8'));
const languageDictionary = JSON.parse(fs.readFileSync('data/languages.json', 'utf8'));
const images = JSON.parse(fs.readFileSync('data/images.json', 'utf8'));
let countryCodeDict = {};

// (() => {
countryCodeDict = countryDictionary.reduce((obj, item) => {
	obj[item.value] = item.name; return obj;
}, {});
// })();

// console.log(countryCodeDict);
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
};