const { SlashCommandBuilder } = require('discord.js');
const { depts, siteArray, translationsCodeDict, availableProviders, countryDict } = require('../load-data');
const { ReleaseTypes } = require('../events/DMB-Events');

const altTitle = require('../functions/movie/alt-titles');
const credit = require('../functions/movie/credits');
const external = require('../functions/movie/external');
const image = require('../functions/movie/images');
const list = require('../functions/movie/lists');
const nowPlaying = require('../functions/movie/now-playing');
const popular = require('../functions/movie/popular');
const recommendation = require('../functions/movie/recommendations');
const releaseDate = require('../functions/movie/release-dates');
const review = require('../functions/movie/reviews');
const search = require('../functions/movie/search');
const similar = require('../functions/movie/similar');
const topRated = require('../functions/movie/top-rated');
const translation = require('../functions/movie/translations');
const upcoming = require('../functions/movie/upcoming');
const video = require('../functions/movie/videos');
const watchProviders = require('../functions/movie/watch-providers');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('movie')
		.setDescription('Get movie info.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('alt-titles')
				.setDescription('Get alternative titles for a movie.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('country')
						.setDescription('Search speific country.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('credits')
				.setDescription('Search for a movie\'s cast and crew')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('department')
						.setDescription('Choose desired dept.')
						.setChoices(
							...depts.reduce((arry, dept) => {
								arry.push({ name: dept, value: dept });
								return arry;
							}, []))
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('external-link')
				.setDescription('Get the external links for a movie.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('site')
						.setDescription('Select the type of site')
						.setChoices(
							...siteArray,
						))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('images')
				.setDescription(' Get a list of a movies\' images.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000))
				.addStringOption(option =>
					option.setName('image-language')
						.setDescription('Search for the desired image language.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('lists')
				.setDescription('Get a list of lists that this movie belongs to.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search with speific language.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('now-playing')
				.setDescription(' Get a list of movies currently playing.')
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('popular')
				.setDescription('Get a list of the current popular movies on TMDB. This list updates daily.')
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired language.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('recommendations')
				.setDescription('Get a list of recommended movies for a movie.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('release-dates')
				.setDescription(' Get a list of a movies\' release dates.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('release-type')
						.setDescription('Select the type of release')
						.setRequired(true)
						.setChoices(
							...Object.values(ReleaseTypes).reduce((arry, releaseType) => {
								arry.push({ name: releaseType.toString, value: releaseType.value });
								return arry;
							}, []),
						))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('reviews')
				.setDescription('Get the user reviews for a movie.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('search')
				.setDescription('Search for movie.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('similar')
				.setDescription('Get a list of similar movies (uses keywords and genres). Not the same as the "Recommendation".')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)),

		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('top-rated')
				.setDescription('Get the top rated movies on TMDB.')
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired language.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true)),

		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('translations')
				.setDescription('Get a list of translations that have been created for a movie.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)),

		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('upcoming')
				.setDescription(' Get a list of upcoming movies.')
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired language.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true)),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('videos')
				.setDescription('Get the videos that have been added to a movie.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('video-type')
						.setDescription('Select the type of release')
						.setChoices(
							{
								name: 'Trailer',
								value: 'Trailer',
							},
							{
								name: 'Behind the Scenes',
								value: 'Behind the Scenes',
							},
							{
								name: 'Bloopers',
								value: 'Bloopers',
							},
							{
								name: 'Clip',
								value: 'Clip',
							},
							{
								name: 'Teaser',
								value: 'Teaser',
							},
							{
								name: 'Featurette',
								value: 'Featurette',
							},
						))
				.addStringOption(option =>
					option.setName('site')
						.setDescription('Select the type of site')
						.setChoices(
							{
								name: 'Youtube',
								value: 'https://www.youtube.com/watch?v=',
							},
							{
								name: 'Vimeo',
								value: 'https://vimeo.com/',
							},
						))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000))
				.addStringOption(option =>
					option.setName('video-language')
						.setDescription('Search for the desired video language.')
						.setAutocomplete(true)),

		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('availability')
				.setDescription('Get a list of the availabilities per country by platform')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired film.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('platform')
						.setDescription('Search with speific platform.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('content-type')
						.setDescription('Search availability with specific Content Availability Type')
						.setChoices(
							{
								name: 'Streaming',
								value: 'flatrate',
							},
							{
								name: 'Rent',
								value: 'rent',
							},
							{
								name: 'Buy',
								value: 'buy',
							},
						))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)),

		),

	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);
		let choices;


		if (focusedOption.name === 'language' || focusedOption.name === 'image-language' || focusedOption.name === 'video-language') {
			choices = translationsCodeDict;
		}
		if (focusedOption.name === 'platform') {
			choices = availableProviders.map(({ provider_name, provider_id }) => ({ name : provider_name, value : provider_id }));
		}
		if (focusedOption.name === 'region' || focusedOption.name === 'country') {
			choices = countryDict;
		}


		try {
			const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);

			await interaction.respond(
				filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
			);
		}
		catch {
			const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
			// console.log(filtered);
			await interaction.respond(
				filtered.map(choice => ({ name: `${choice.name}`, value: choice.value })),
			);

		}
	},
	async execute(interaction) {

		const subCmd = interaction.options.getSubcommand();
		switch (subCmd) {
		case 'alt-title':
			await altTitle.execute(interaction);
			break;
		case 'availability':
			await watchProviders.execute(interaction);
			break;
		case 'credits':
			await credit.execute(interaction);
			break;
		case 'external-link':
			await external.execute(interaction);
			break;
		case 'images':
			await image.execute(interaction);
			break;
		case 'lists':
			await list.execute(interaction);
			break;
		case 'now-playing':
			await nowPlaying.execute(interaction);
			break;
		case 'popular':
			await popular.execute(interaction);
			break;
		case 'recommendations':
			await recommendation.execute(interaction);
			break;
		case 'release-dates':
			await releaseDate.execute(interaction);
			break;
		case 'reviews':
			await review.execute(interaction);
			break;
		case 'search':
			await search.execute(interaction);
			break;
		case 'similar':
			await similar.execute(interaction);
			break;
		case 'top-rated':
			await topRated.execute(interaction);
			break;

		case 'translations':
			await translation.execute(interaction);
			break;
		case 'upcoming':
			await upcoming.execute(interaction);
			break;
		case 'videos':
			await video.execute(interaction);
			break;
		}
	},
};