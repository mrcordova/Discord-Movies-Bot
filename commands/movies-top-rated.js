const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { countryDict, translationsCodeDict } = require('../load-data.js');
const { createListEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const movie_top_rated = '/movie/top_rated';


// https://api.themoviedb.org/3/movie/top_rated?api_key=<<api_key>>&language=en-US&page=1
// language optional
// page optional
// region optional

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-top-rated')
		.setDescription('Get the top rated movies on TMDB.')
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search for the desired language.')
				.setMinLength(2)
				.setAutocomplete(true))
		// .addIntegerOption(option =>
		// 	option.setName('page')
		// 		.setDescription('1 page equals 20 movies')
		// 		.setMinValue(1)
		// 		.setMaxValue(1000))
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
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		// const languageName = interaction.options.getString('language') ?? 'English';
		// const regionName = interaction.options.getString('region') ?? 'United States of America (the)';
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
		// const page = interaction.options.getInteger('page') ?? 1;
		// -${region.toUpperCase()}
		const response = await axios.get(`${api_url}${movie_top_rated}?api_key=${MOVIE_API_KEY}&language=${language}&page=${1}&region=${region}`);
		const moviesTopRated = response.data.results;
		const listSize = 5;
		let currentIndex = 0;
		// dates = response.data.dates;

		const canFitOnOnePage = moviesTopRated.length <= listSize;
		const embedMessage = await interaction.reply({
			content: 'Top Rated Movies',
			embeds: [await createListEmbed(currentIndex, listSize, moviesTopRated)],
			components: canFitOnOnePage ? [] : [new ActionRowBuilder({ components: [forwardButton] })],
		});

		// Exit if there is only one page of guilds (no need for all of this)
		if (canFitOnOnePage) return;

		// Collect button interactions (when a user clicks a button),
		// but only when the button as clicked by the original message author
		const filter = ({ user }) => interaction.user.id == user.id;
		const buttonCollector = embedMessage.createMessageComponentCollector({
			filter: filter,
			componentType: ComponentType.Button,
			customId:'list',
			idle: 30000,
		});
		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			// Respond to interaction by updating message with new embed
			await m.update({
				content: 'Top Rated Movies',
				embeds: [await createListEmbed(currentIndex, listSize, moviesTopRated)],
				components: [new ActionRowBuilder({ components: [
					// back button if it isn't the start
					...(currentIndex ? [backButton] : []),
					// forward button if it isn't the end
					...(currentIndex + listSize < moviesTopRated.length ? [forwardButton] : []),
				] }) ],
			});
		});
		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			console.log(`ignore: ${args}`);
		});

	},
};