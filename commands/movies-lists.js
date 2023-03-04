const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createNoResultEmbed, createListsEmbed } = require('../components/embed.js');
const { translationsCodeDict, file } = require('../load-data.js');

const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { createButton } = require('../components/button');
const { getEditReply } = require('../helpers/get-reply');
const movie_route = '/movie';
const movie_lists = 'lists';


// https://api.themoviedb.org/3/movie/{movie_id}/lists?api_key=<<api_key>>&country=v%20vc%20
// country string optional

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-lists')
		.setDescription('Get a list of lists that this movie belongs to.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired film.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search with speific language.')
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
		}
		// if (focusedOption.name === 'region') {
		// 	choices = countryDict;
		// }

		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
		);
	},
	async execute(interaction) {

		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const response = await axios.get(`${api_url}/search/movie?api_key=${MOVIE_API_KEY}&query=${query}&include_adult=false`);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies with that title.', 'Please make a new command with a different options')], files: [file] });
			return;
		}

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
		const selectMenuCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });

		const listSize = 5;
		let currentIndex = 0;
		let movie;

		selectMenuCollector.on(MyEvents.Collect, async i => {
			const selected = i.values[0];
			currentIndex = 0;
			const movieResponse = await axios.get(`${api_url}${movie_route}/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=${movie_lists}&country=${language}`);
			movie = movieResponse.data.lists;
			const movieTitle = movieResponse.data.title;


			const newSelectMenu = createSelectMenu('List of Movies', movieTitle, 1, options);


			const listsEmbed = await createListsEmbed(currentIndex, listSize, movie.results);

			await i.update({
				content: 'Selected Movie:',
				embeds: [listsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movie.results.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
				],
				files: [file],
			});
			buttonCollector.resetTimer([{ idle: 30000 }]);
		});
		selectMenuCollector.on(MyEvents.Dispose, i => {
			console.log(`select menu dispose: ${i}`);
		});
		selectMenuCollector.on(MyEvents.Ignore, args => {
			console.log(`select menu ignore: ${args}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenuCollector.on(MyEvents.End, async (c, r) => {
			// await interaction.editReply({ content: 'Time\'s up!', components: [] });
			await getEditReply(interaction, r);

		});
		buttonCollector.on(MyEvents.Collect, async i => {

			i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const listsEmbed = await createListsEmbed(currentIndex, listSize, movie.results);

			await i.update({
				content: 'Selected Movie:',
				embeds: [listsEmbed],
				components: [
					i.message.components[0],
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movie.results.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] })],
			});
			selectMenuCollector.resetTimer([{ idle: 30000 }]);
		});
		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`button dispose: ${i}`);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			console.log(`button ignore: ${args}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			// await interaction.editReply({ content: 'Time\'s up!', components: [] });
			await getEditReply(interaction, r);
		});
	},
};