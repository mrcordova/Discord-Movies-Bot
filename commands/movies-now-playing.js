const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { countryDict, translationsCodeDict } = require('../load-data.js');
const { createListEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const movie_now_playing = '/movie/now_playing';

// https://api.themoviedb.org/3/movie/now_playing?api_key=<<api_key>>&language=en&page=1&region=us
// language optional
// page optional
// region optional


// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-now-playing')
		.setDescription(' Get a list of movies currently playing.')
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search for the desired translation.')
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
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.name })),
		);
	},
	async execute(interaction) {
		const languageName = interaction.options.getString('language') ?? 'English';
		const regionName = interaction.options.getString('region') ?? 'United States of America (the)';
		let language;
		let region;
		try {
			language = translationsCodeDict.find(lang => lang.name.toLowerCase() === languageName.toLowerCase() || lang.value.toLowerCase() === languageName.toLowerCase()).value;
		}
		catch {
			language = 'en-US';
		}
		try {
			region = countryDict.find(country => country.name.toLowerCase() === regionName.toLowerCase() || country.value.toLowerCase() === regionName.toLowerCase()).value.toUpperCase();

		}
		catch {
			region = 'US';
		}
		// const page = interaction.options.getInteger('page') ?? 1;
		// -${region.toUpperCase()}
		const response = await axios.get(`${api_url}${movie_now_playing}?api_key=${MOVIE_API_KEY}&language=${language}&page=${1}&region=${region}`);
		const moviesNowPlaying = response.data.results;
		const listSize = 5;
		const canFitOnOnePage = moviesNowPlaying.length <= listSize;
		let currentIndex = 0;
		const embedMessage = await interaction.reply({
			embeds: [await createListEmbed(currentIndex, listSize, moviesNowPlaying)],
			components: canFitOnOnePage ? [] : [new ActionRowBuilder({ components: [forwardButton] })],
		});

		// Exit if there is only one page of guilds (no need for all of this)
		if (canFitOnOnePage) return;

		// Collect button interactions (when a user clicks a button),
		// but only when the button as clicked by the original message author
		const filter = ({ user }) => interaction.user.id == user.id;
		const collector = embedMessage.createMessageComponentCollector({
			filter: filter,
		});


		collector.on(MyEvents.Collect, async m => {
			// Increase/decrease index

			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			// Respond to interaction by updating message with new embed
			await m.update({
				embeds: [await createListEmbed(currentIndex, listSize, moviesNowPlaying)],
				components: [new ActionRowBuilder({ components: [
					// back button if it isn't the start
					...(currentIndex ? [backButton] : []),
					// forward button if it isn't the end
					...(currentIndex + listSize < moviesNowPlaying.length ? [forwardButton] : []),
				] }) ],
			});
		});


	},
};