const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');

const search_movie = '/search/movie';
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

module.exports = { searchForMovie };