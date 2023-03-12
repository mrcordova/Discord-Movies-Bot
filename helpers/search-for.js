const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');

const search_movie = '/search/movie';
const search_tv = '/search/tv';
const search_people = '/search/person';
const search_company = '/search/company';
const search_collection = '/search/collection';
const network = '/network';
// https://api.themoviedb.org/3/search/movie?api_key=<<api_key>>&language=en-US&page=1&include_adult=false
// language en-US optional
// query String required
// page 1 optional
// include_adult false optional
// region String optional
// year Integer optional
// primary_release_year Integer optional


// These two types of API Request, search and discover, have 2 limits:

// Maximum of 20 items per page
// Maximum of 500 pages

async function searchForMovie(query, language = 'en-US', region = 'US', primaryReleaseYear = 0, page = 1) {
	return await axios.get(`${api_url}${search_movie}?api_key=${MOVIE_API_KEY}&language=${language}&region=${region}&query=${query.toLowerCase().trim()}&page=${page}&include_adult=false&primary_release_year=${primaryReleaseYear}`);
}
async function searchForTV(query, language = 'en-US', region = 'US', primaryReleaseYear = 0, page = 1) {
	return await axios.get(`${api_url}${search_tv}?api_key=${MOVIE_API_KEY}&language=${language}&region=${region}&query=${query.toLowerCase().trim()}&page=${page}&include_adult=false&primary_release_year=${primaryReleaseYear}`);
}
async function searchForPeople(query, language = 'en-US', region = 'US', page = 1) {
	return await axios.get(`${api_url}${search_people}?api_key=${MOVIE_API_KEY}&language=${language}&region=${region}&query=${query.toLowerCase().trim()}&page=${page}&include_adult=false`);
}
async function searchForCompany(query, page = 1) {
	return await axios.get(`${api_url}${search_company}?api_key=${MOVIE_API_KEY}&query=${query.toLowerCase().trim()}&page=${page}`);
}
async function searchForCollection(query, language = 'en-US', page = 1) {
	return await axios.get(`${api_url}${search_collection}?api_key=${MOVIE_API_KEY}&query=${query.toLowerCase().trim()}&language=${language}&page=${page}`);
}
async function searchForNetwork(networkId) {
	return await axios.get(`${api_url}${network}/${networkId}?api_key=${MOVIE_API_KEY}`);
}

module.exports = {
	searchForCollection,
	searchForCompany,
	searchForNetwork,
	searchForMovie,
	searchForTV,
	searchForPeople,
};