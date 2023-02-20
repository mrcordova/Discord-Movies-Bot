const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { countryDict, languageDict } = require('../load-data.js');
const { createNoResultEmbed } = require('../components/embed');
const movie_upcoming = '/movie/upcoming';


// https://api.themoviedb.org/3/movie/upcoming?api_key=<<api_key>>&language=en-US&page=1
// language optional
// page optional
// region optional

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

let moviesUpcoming;
let dates = {};
const listSize = 5;


const generateEmbed = async start => {
	if (!moviesUpcoming.length) {
		return createNoResultEmbed();
	}

	const current = moviesUpcoming.slice(start, start + listSize);
	const { minimum, maximum } = dates;
	return new EmbedBuilder({
		color: Colors.Blue,
		title: `Showing Movies Now Playing ${start + 1}-${start + current.length} out of ${moviesUpcoming.length}\nFrom ${minimum} to ${maximum}`,
		fields: await Promise.all(current.map(async (movie, index) => ({ name: `${ start + (index + 1)}. ${movie.title} (${movie.release_date}) - ${movie.vote_average}`, value: movie.overview })),
		),
	});
};


module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-upcoming')
		.setDescription(' Get a list of upcoming movies.')
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
			choices = languageDict;
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
			language = languageDict.find(lang => lang.name === languageName || lang.value === languageName).value;
			region = countryDict.find(country => country.name === regionName || country.value === regionName).value.toUpperCase();
		}
		catch {
			language = 'en';
			region = 'US';
		}
		// const page = interaction.options.getInteger('page') ?? 1;
		// -${region.toUpperCase()}
		const response = await axios.get(`${api_url}${movie_upcoming}?api_key=${MOVIE_API_KEY}&language=${language}&page=${1}&region=${region}`);
		moviesUpcoming = response.data.results;
		dates = response.data.dates;

		const canFitOnOnePage = moviesUpcoming.length <= listSize;
		const embedMessage = await interaction.channel.send({
			embeds: [await generateEmbed(0)],
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

		let currentIndex = 0;
		collector.on('collect', async m => {
			// Increase/decrease index

			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			// Respond to interaction by updating message with new embed
			await m.update({
				embeds: [await generateEmbed(currentIndex)],
				components: [new ActionRowBuilder({ components: [
					// back button if it isn't the start
					...(currentIndex ? [backButton] : []),
					// forward button if it isn't the end
					...(currentIndex + listSize < moviesUpcoming.length ? [forwardButton] : []),
				] }) ],
			});
		});


	},
};