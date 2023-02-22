const axios = require('axios');
// const cheerio = require('cheerio');
const fs = require('fs');
const { api_url, MOVIE_API_KEY } = require('./config.json');
const watch_provider_regions = '/watch/providers/regions';
const config_countries = '/configuration/countries';
const config_lang = '/configuration/languages';
const watch_provider_movies = '/watch/providers/movie';
const watch_provider_tvs = '/watch/providers/tv';
const config = '/configuration';

// countries
// axios.get('https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes')
// 	.then(response => {
// 		const $ = cheerio.load(response.data);
// 		const table = $('table');
// 		const rows = table.find('tr');
// 		const countries = [];

// 		for (const row of rows) {
// 			const td = $(row).find('td:first-child');

// 			if (td.find('span').hasClass('flagicon')) {
// 				const countryName = td.find('a').text().split('[')[0];
// 				const countryCode = $(row).find('td:nth-child(4)').find('a').find('span').text();

// 				if (countryCode.length) {
// 					countries.push({ name: countryName, value: countryCode });
// 				}
// 			}
// 		}
// 		// null and 2 are for indentation and formatting
// 		const json = JSON.stringify(countries, null, 2);
// 		fs.writeFile('countries.json', json, (err) => {
// 			if (err) throw err;
// 			console.log('Country data written to file');
// 		});

// 	})
// 	.catch(error => console.error(error));

// Language
// axios.get('https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes')
// 	.then(response => {
// 		const $ = cheerio.load(response.data);
// 		const table = $('#Table');
// 		const rows = table.find('tr');
// 		const countries = [];

// 		for (const row of rows) {
// 			const td = $(row).find('td:first-child');

// 			// if (td.find('span').hasClass('flagicon')) {
// 			const languageName = td.text();
// 			const languageCode = $(row).find('td:nth-child(2)').find('a').text();

// 			if (languageCode.length && languageName.length) {
// 				countries.push({ name: languageName, value: languageCode });
// 			}
// 			// }
// 		}
// 		// null and 2 are for indentation and formatting
// 		const json = JSON.stringify(countries, null, 2);
// 		fs.writeFile('languages.json', json, (err) => {
// 			if (err) throw err;
// 			console.log('Language data written to file');
// 		});

// 	})
// 	.catch(error => console.error(error));


// countries used throughout tmdb
axios.get(`${api_url}${config_countries}?api_key=${MOVIE_API_KEY}`)
	.then(response => {

		const countries = [];
		// console.log(response);

		for (const country of response.data) {
			countries.push({ name: country.english_name, value: country.iso_3166_1, native_name: country.native_name });
		}
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(countries, null, 2);
		fs.writeFile('data/countries.json', json, (err) => {
			if (err) throw err;
			console.log('Country data written to file');
		});

	})
	.catch(error => console.error(error));

// watch providers region
axios.get(`${api_url}${watch_provider_regions}?api_key=${MOVIE_API_KEY}`)
	.then(response => {

		const countries = [];


		for (const country of response.data.results) {
			countries.push({ name: country.english_name, value: country.iso_3166_1 });
		}
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(countries, null, 2);
		fs.writeFile('data/watch-countries.json', json, (err) => {
			if (err) throw err;
			console.log('Country data written to file');
		});

	})
	.catch(error => console.error(error));
// Avaivible Languages
axios.get(`${api_url}${config_lang}?api_key=${MOVIE_API_KEY}`)
	.then(response => {

		const languages = [];

		for (const language of response.data) {
			languages.push({ name: language.english_name, value: language.iso_639_1 });
		}
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(languages, null, 2);
		fs.writeFile('data/languages.json', json, (err) => {
			if (err) throw err;
			console.log('Language data written to file');
		});

	})
	.catch(error => console.error(error));

// Movie Providers
axios.get(`${api_url}${watch_provider_movies}?api_key=${MOVIE_API_KEY}`)
	.then(response => {

		const json = JSON.stringify(response.data.results, null, 2);
		fs.writeFile('data/movie-providers.json', json, (err) => {
			if (err) throw err;
			console.log('Movie providers data written to file');
		});

	})
	.catch(error => console.error(error));

// Tv providers
axios.get(`${api_url}${watch_provider_tvs}?api_key=${MOVIE_API_KEY}`)
	.then(response => {

		const json = JSON.stringify(response.data.results, null, 2);
		fs.writeFile('data/tv-providers.json', json, (err) => {
			if (err) throw err;
			console.log('TV providers data written to file');
		});

	})
	.catch(error => console.error(error));

axios.get(`${api_url}${config}?api_key=${MOVIE_API_KEY}`)
	.then(response => {
		const json = JSON.stringify({ images: response.data['images'] }, null, 2);
		fs.writeFile('data/images.json', json, (err) => {
			if (err) throw err;
			console.log('Images data written to file');
		});
		const changeKeyJson = JSON.stringify({ change_keys: response.data['change_keys']}, null, 2);
		fs.writeFile('data/change-keys.json', changeKeyJson, (err) => {
			if (err) throw err;
			console.log('Change key data written to file');
		});
	})
	.catch(error => console.error(error));

