const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createAltListEmbed, createNoResultEmbed } = require('../../components/embed.js');
const { countryDict, file } = require('../../load-data.js');

const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { createButton } = require('../../components/button');
const { getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../../helpers/get-options');
const tv_route = '/tv';
const tv_alt = 'alternative_titles';


// https://api.themoviedb.org/3/movie/{movie_id}/alternative_titles?api_key=<<api_key>>&country=v%20vc%20
// country string optional

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-alt-titles')
		.setDescription('Get alternative titles for a tv show.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired TV Show.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('country')
				.setDescription('Search speific country.')
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'country') {
			choices = countryDict;
		}


		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
		);
	},
	async execute(interaction) {

		const query = interaction.options.getString('title');
		const country = interaction.options.getString('country') ?? '';
		const response = await axios.get(`${api_url}/search/tv?api_key=${MOVIE_API_KEY}&query=${query}&include_adult=false`);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Shows with that title.', 'Please make a new command with different option(s)')], files: [file] });
			return;
		}

		const options = getOptionsForTvSelectMenu(tvTitles);


		const selectMenu = createSelectMenu('List of Tv Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);


		const embed = createEmbed(Colors.Blue, 'TV Show will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenuCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });

		const listSize = 5;
		let currentIndex = 0;
		let tv;

		selectMenuCollector.on(MyEvents.Collect, async i => {
			const selected = i.values[0];
			currentIndex = 0;
			const tvResponse = await axios.get(`${api_url}${tv_route}/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=${tv_alt}&country=${country}`);
			tv = tvResponse.data.alternative_titles;
			const tvTitle = tvResponse.data.name;

			const newSelectMenu = createSelectMenu('List of TV Shows', tvTitle, 1, options);

			const altListEmbed = await createAltListEmbed(currentIndex, listSize, tv.results);

			await i.update({
				content: 'Selected Movie:',
				embeds: [altListEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < tv.results.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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
			// console.log(`select menu ignore: ${args}`);
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenuCollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
		buttonCollector.on(MyEvents.Collect, async i => {

			i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const altListEmbed = await createAltListEmbed(currentIndex, listSize, tv.results);

			await i.update({
				content: 'Selected TV Show:',
				embeds: [altListEmbed],
				components: [
					i.message.components[0],
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < tv.results.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] })],
			});
			selectMenuCollector.resetTimer([{ idle: 30000 }]);
		});
		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`button dispose: ${i}`);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			// console.log(`button ignore: ${args}`);
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
	},
};