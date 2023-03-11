const axios = require('axios');
const zlib = require('zlib');
// const cheerio = require('cheerio');
const fs = require('fs');
const { api_url, MOVIE_API_KEY } = require('./config.json');

const config = '/configuration';
const config_countries = '/configuration/countries';
const config_jobs = '/configuration/jobs';
const config_lang = '/configuration/languages';
const config_trans = '/configuration/primary_translations';
const config_timezones = '/configuration/timezones';

const certification_movie = '/certification/movie/list';
const certification_tv = '/certification/tv/list';

const watch_provider_movies = '/watch/providers/movie';
const watch_provider_tvs = '/watch/providers/tv';
const watch_provider_regions = '/watch/providers/regions';


const file_export_url = 'http://files.tmdb.org';
const today = new Date();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const year = today.getFullYear();
const network_ids = `tv_network_ids_${month}_${day}_${year}.json.gz`;

// axios.get(`${file_export_url}/p/exports/${network_ids}`)
// 	.then(response => {

// 	})
axios({
	method: 'get',
	url: `${file_export_url}/p/exports/${network_ids}`,
	responseType: 'stream',
}).then(response => {
	// Create a stream to the gzip data
	const gunzip = zlib.createGunzip();
	response.data.pipe(gunzip);

	// Accumulate the unzipped data
	let data = '';
	gunzip.on('data', chunk => {
		data += chunk.toString();
	});

	// Parse each line as JSON
	gunzip.on('end', () => {
		const networkArry = [];
		data.split('\n').forEach(line => {
			if (line) {
				try {
					const json = JSON.parse(line);
					// Do something with the parsed JSON object
					//   console.log(json);
					networkArry.push(json);
				}
				catch (error) {
					console.error(`Error parsing JSON: ${error}`);
				}
			}
			else {
				console.error('Empty or null JSON input');
			}
		});
		const json = JSON.stringify(networkArry, null, 2);
		fs.writeFile('data/networks.json', json, (err) => {
			if (err) throw err;
			console.log('Network data written to file');
		});
	});

}).catch(error => {
	console.error(`Error downloading file: ${error}`);
});

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

// Get the system wide configuration information.
// Some elements of the API require some knowledge of this configuration data.
// The purpose of this is to try and keep the actual API responses as light as possible.
// It is recommended you cache this data within your application and check for updates every few days.
axios.get(`${api_url}${config}?api_key=${MOVIE_API_KEY}`)
	.then(response => {
		const json = JSON.stringify(response.data['images'], null, 2);
		fs.writeFile('data/images.json', json, (err) => {
			if (err) throw err;
			console.log('Images data written to file');
		});
		const changeKeyJson = JSON.stringify(response.data['change_keys'], null, 2);
		fs.writeFile('data/change-keys.json', changeKeyJson, (err) => {
			if (err) throw err;
			console.log('Change key data written to file');
		});
	})
	.catch(error => console.error(error));

// Get the list of countries (ISO 3166-1 tags) used throughout TMDB.
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

// Get a list of the jobs and departments we use on TMDB.
axios.get(`${api_url}${config_jobs}?api_key=${MOVIE_API_KEY}`)
	.then(response => {
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(response.data, null, 2);
		fs.writeFile('data/jobs.json', json, (err) => {
			if (err) throw err;
			console.log('Jobs data written to file');
		});

	})
	.catch(error => console.error(error));


// Get the list of languages (ISO 639-1 tags) used throughout TMDB.
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

// Get a list of the officially supported translations on TMDB.
axios.get(`${api_url}${config_trans}?api_key=${MOVIE_API_KEY}`)
	.then(response => {
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(response.data, null, 2);
		fs.writeFile('data/primary-translations.json', json, (err) => {
			if (err) throw err;
			console.log('Primary Translations data written to file');
		});

	})
	.catch(error => console.error(error));

// Get the list of timezones used throughout TMDB.
axios.get(`${api_url}${config_timezones}?api_key=${MOVIE_API_KEY}`)
	.then(response => {
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(response.data, null, 2);
		fs.writeFile('data/timezones.json', json, (err) => {
			if (err) throw err;
			console.log('Timezones data written to file');
		});

	})
	.catch(error => console.error(error));

// Get an up to date list of the officially supported movie certifications on TMDB.
axios.get(`${api_url}${certification_movie}?api_key=${MOVIE_API_KEY}`)
	.then(response => {
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(response.data, null, 2);
		fs.writeFile('data/movie-ratings.json', json, (err) => {
			if (err) throw err;
			console.log('Movie certifications data written to file');
		});
	})
	.catch(error => console.error(error));

// Get an up to date list of the officially supported movie certifications on TMDB.
axios.get(`${api_url}${certification_tv}?api_key=${MOVIE_API_KEY}`)
	.then(response => {
		// null and 2 are for indentation and formatting
		const json = JSON.stringify(response.data, null, 2);
		fs.writeFile('data/tv-ratings.json', json, (err) => {
			if (err) throw err;
			console.log('Tv certifications data written to file');
		});
	})
	.catch(error => console.error(error));

// Returns a list of all of the countries we have watch provider (OTT/streaming) data for.
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

// Returns a list of the watch provider (OTT/streaming) data we have available for movies.
// You can specify a watch_region param if you want to further filter the list by country.
axios.get(`${api_url}${watch_provider_movies}?api_key=${MOVIE_API_KEY}`)
	.then(response => {

		const json = JSON.stringify(response.data.results, null, 2);
		fs.writeFile('data/movie-providers.json', json, (err) => {
			if (err) throw err;
			console.log('Movie providers data written to file');
		});

	})
	.catch(error => console.error(error));

// Returns a list of the watch provider (OTT/streaming) data we have available for TV series.
// You can specify a watch_region param if you want to further filter the list by country.
axios.get(`${api_url}${watch_provider_tvs}?api_key=${MOVIE_API_KEY}`)
	.then(response => {

		const json = JSON.stringify(response.data.results, null, 2);
		fs.writeFile('data/tv-providers.json', json, (err) => {
			if (err) throw err;
			console.log('TV providers data written to file');
		});

	})
	.catch(error => console.error(error));

