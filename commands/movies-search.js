const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createMovieDetailEmbed } = require('../components/embed.js');
const { searchForMovie } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { getCrewMember, getCast, getProductionCompany, createCurrencyFormatter } = require('../helpers/get-production-info');
const { MyEvents } = require('../events/DMB-Events');
const movie_details = '/movie';


// https://api.themoviedb.org/3/movie/{movie_id}?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional
// query String required
// page 1 optional
// include_adult false optional
// region String optional
// year Integer optional same as primary release year
// primary_release_year Integer optional

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
				.setAutocomplete(true)),
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
		// console.log(languageName);
		// let language;
		// let region;
		// try {
		// 	language = translationsCodeDict.find(lang => lang.name.toLowerCase() === languageName.toLowerCase() || lang.value.toLowerCase() === languageName.toLowerCase()).value;
		// }
		// catch {
		// 	language = 'en-US';
		// }
		// try {
		// 	region = countryDict.find(country => country.name.toLowerCase() === regionName.toLowerCase() || country.value.toLowerCase() === regionName.toLowerCase()).value.toUpperCase();

		// }
		// catch {
		// 	region = 'US';
		// }

		const response = await searchForMovie(query, language, region);
		const movieTitles = response.data.results;

		const options = [];

		for (const movieObject of movieTitles) {
			const description = movieObject.overview.slice(0, 50);
			options.push({ label: `${movieObject.title} (${movieObject.release_date})`, description: `${description}...`, value: `${movieObject.id}` });
		}

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie will apear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query.', filter: filter, ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			// const movie = movieTitles.find(m => m.id == selected);
			// console.log(language);
			const movieResponse = await axios.get(`${api_url}${movie_details}/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=credits&language=${language}`);
			const movie = movieResponse.data;
			// console.log(movie);

			const formatter = createCurrencyFormatter();
			const prod = getProductionCompany(movie['production_companies']);
			const directors = getCrewMember(movie.credits['crew'], 'director');
			const actors = getCast(movie.credits['cast'], 3);

			const movieDetailsEmbed = createMovieDetailEmbed({ user: i.user, movie, prod, directors, actors, formatter, color: Colors.Aqua });
			const newSelectMenu = createSelectMenu('List of Movies', movie.title, 1, options);


			await i.update({ content: 'Selected Movie:', embeds: [movieDetailsEmbed], components: [new ActionRowBuilder().addComponents(newSelectMenu)] });
			// collector.resetTimer([{time: 15000}]);
		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			console.log(`ignore: ${args}`);
		});

	},
};