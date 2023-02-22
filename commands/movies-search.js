const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createMovieDetailEmbed } = require('../components/embed.js');
const { searchForMovie } = require('../helpers/search-movie.js');
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
// year Integer optional
// primary_release_year Integer optional

module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-search')
		.setDescription('Search for movies based on a text query.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired film.')
				.setRequired(true)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
	},
	async execute(interaction) {

		const query = interaction.options.getString('title');
		const response = await searchForMovie(query);
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
		const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		collector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			// const movie = movieTitles.find(m => m.id == selected);
			const movieResponse = await axios.get(`${api_url}${movie_details}/${selected}?api_key=${MOVIE_API_KEY}&langauage=en&append_to_response=credits`);
			const movie = movieResponse.data;

			const formatter = createCurrencyFormatter();
			const prod = getProductionCompany(movie['production_companies']);
			const directors = getCrewMember(movie.credits['crew'], 'director');
			const actors = getCast(movie.credits['cast'], 3);

			const movieDetailsEmbed = createMovieDetailEmbed({ user: i.user, movie, prod, directors, actors, formatter, color: Colors.Aqua });
			const newSelectMenu = createSelectMenu('List of Movies', movie.title, 1, options);


			await i.update({ content: 'Selected Movie:', embeds: [movieDetailsEmbed], components: [new ActionRowBuilder().addComponents(newSelectMenu)] });
			// collector.resetTimer([{time: 15000}]);
		});

		collector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		collector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
		collector.on(MyEvents.Ignore, args => {
			console.log(`ignore: ${args}`);
		});

	},
};