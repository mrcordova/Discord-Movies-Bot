const { Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createMovieDetailEmbed, createTvDetailEmbed } = require('../components/embed');
const { createCurrencyFormatter, getProductionCompany, getCrewMember, getCast } = require('./get-production-info');

function getMediaDetail(mediaType, country, language, i, mediaData) {

	if (mediaType.toUpperCase() == 'TV') {

		let tvRating;
		try {
			tvRating = mediaData.content_ratings.results.find(({ iso_3166_1 }) => ((country && iso_3166_1 == country) || mediaData.origin_country.includes(iso_3166_1)))['rating'];
		}
		catch (err) {
			tvRating = 'N/A';
		}

		mediaData.rating = tvRating;
		const network = getProductionCompany(mediaData['networks']);

		const actors = getCast(mediaData.aggregate_credits['cast'], 10);
		mediaData.language = language;

		return createTvDetailEmbed({ user: i.user, tv: mediaData, network, actors, color: Colors.Aqua });
	}
	else if (mediaType.toUpperCase() == 'MOVIE') {
		let movieRating;
		try {
			const countryObj = mediaData.release_dates.results.find(({ iso_3166_1 }) => country && iso_3166_1 == country);
			movieRating = countryObj['release_dates'].find(({ type, certification }) => (type == 3 && certification) || (type == 2 && certification)).certification;
		}
		catch {
			try {
				const originCountry = mediaData.production_companies.filter(({ origin_country }) => origin_country.length ? origin_country : false).sort((a, b) => a.id - b.id)[0].origin_country;
				const countryObj = mediaData.release_dates.results.find(({ iso_3166_1 }) => iso_3166_1 == country || originCountry == iso_3166_1);
				movieRating = countryObj['release_dates'].find(({ type, certification }) => (type == 3 && certification) || (type == 2 && certification)).certification;
			}
			catch {
				movieRating = 'N/A';
			}
		}
		mediaData.rating = movieRating;

		const formatter = createCurrencyFormatter();
		const prod = getProductionCompany(mediaData['production_companies']);
		const directors = getCrewMember(mediaData.credits['crew'], 'director');
		const actors = getCast(mediaData.credits['cast'], 10);

		return createMovieDetailEmbed({ user: i.user, movie:mediaData, prod, directors, actors, formatter, color: Colors.Aqua });
	}


}


async function getMediaResponse(mediaType, id, language, ...append_to_response) {
	let mediaResponse;
	if (mediaType.toUpperCase() == 'TV') {
		// aggregate_credits,content_ratings
		mediaResponse = await axios.get(`${api_url}/${mediaType}/${id}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=${append_to_response.join(',')}`);
	}
	else if (mediaType.toUpperCase() == 'MOVIE') {
		// credits,release_dates
		mediaResponse = await axios.get(`${api_url}/${mediaType}/${id}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=${append_to_response.join(',')}`);
	}
	return mediaResponse;
}

module.exports = { getMediaDetail, getMediaResponse };