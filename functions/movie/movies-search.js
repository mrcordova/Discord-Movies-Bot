const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createMovieDetailEmbed, createNoResultEmbed } = require('../components/embed.js');
const { searchForMovie } = require('../helpers/search-for.js');
const { countryDict, translationsCodeDict, file } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { getCrewMember, getCast, getProductionCompany, createCurrencyFormatter } = require('../helpers/get-production-info');
const { MyEvents } = require('../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForSelectMenu } = require('../helpers/get-options');
const movie_details = '/movie';


// https://api.themoviedb.org/3/movie/{movie_id}?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional
// query String required
// page 1 optional
// include_adult false optional
// region String optional
// year Integer optional  includes dvd, blu-ray  dates ect
// primary_release_year Integer optional - oldest release date

module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-search')
		.setDescription('Search for movies based on a text query.')
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
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
		}
		if (focusedOption.name === 'region') {
			choices = countryDict;
		}

		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
		);
	},
	async execute(interaction) {

		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const country = interaction.options.getString('region');
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found for that year', 'Please make a new command with a different year')], files: [file] });
			return;
		}
		const options = getOptionsForSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		// if no film is found for certain year.
		const message = await interaction.reply({ content: 'List of Movies matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];

			const movieResponse = await axios.get(`${api_url}${movie_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=credits,release_dates`);
			const movie = movieResponse.data;
			// console.log(movieDetails.release_dates.results);
			let movieRating;
			// || tv.origin_country.includes(iso_3166_1)
			try {
				// console.log(movie.production_companies);
				const countryObj = movie.release_dates.results.find(({ iso_3166_1 }) => country && iso_3166_1 == country);
				movieRating = countryObj['release_dates'].find(({ type, certification }) => (type == 3 && certification) || (type == 2 && certification)).certification;
				// console.log(countryObj['release_dates']);
			}
			catch {
				try {
					const originCountry = movie.production_companies.filter(({ origin_country }) => origin_country.length ? origin_country : false).sort((a, b) => a.id - b.id)[0].origin_country;
					// console.log(movie.production_companies.filter(({ origin_country }) => origin_country.length ? origin_country : false).sort((a, b) => a.id - b.id)[0]);
					const countryObj = movie.release_dates.results.find(({ iso_3166_1 }) => iso_3166_1 == region || originCountry == iso_3166_1);
					movieRating = countryObj['release_dates'].find(({ type, certification }) => (type == 3 && certification) || (type == 2 && certification)).certification;
				}
				catch {
					movieRating = 'N/A';
				}
			}
			movie.rating = movieRating;

			const formatter = createCurrencyFormatter();
			const prod = getProductionCompany(movie['production_companies']);
			const directors = getCrewMember(movie.credits['crew'], 'director');
			const actors = getCast(movie.credits['cast'], 3);

			const movieDetailsEmbed = createMovieDetailEmbed({ user: i.user, movie, prod, directors, actors, formatter, color: Colors.Aqua });
			const newSelectMenu = createSelectMenu('List of Movies', movie.title.slice(0, 81), 1, options);


			await i.update({
				content: 'Selected Movie:',
				embeds: [movieDetailsEmbed],
				components: [new ActionRowBuilder().addComponents(newSelectMenu)],
				files: [file],
			});
			// collector.resetTimer([{time: 15000}]);
		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

	},
};