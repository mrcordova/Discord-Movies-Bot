const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createAltListEmbed } = require('../components/embed.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { createButton } = require('../components/button');
const movie_route = '/movie';
const movie_alt = 'alternative_titles';


// https://api.themoviedb.org/3/movie/{movie_id}/alternative_titles?api_key=<<api_key>>&country=v%20vc%20
// country string optional

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-alt-title')
		.setDescription('Get alternative titles for a movie.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired film.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('country')
				.setDescription('Search speific country.')
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
	},
	async execute(interaction) {

		const query = interaction.options.getString('title');
		// console.log(query);
		const response = await axios.get(`${api_url}/search/movie?api_key=${MOVIE_API_KEY}&query=${query}&include_adult=false`);
		// console.log(response);
		const movieTitles = response.data.results;
		// console.log(movieTitles);
		const options = [];

		for (const movieObject of movieTitles) {
			const description = movieObject.overview.slice(0, 50);
			options.push({ label: `${movieObject.title} (${movieObject.release_date})`, description: `${description}...`, value: `${movieObject.id}` });
		}

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		// TODO: work on buttons and display of alt titles for choosen film.
		const embed = createEmbed(Colors.Blue, 'Movie will apear here', 'Some description here', 'https://discord.js.org/');

		const listSize = 5;
		let currentIndex = 0;
		let firstTime = true;
		let prevSelected;

		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query.', filter: filter, ephemeral: true, embeds: [embed], components: [row] });
		const collector = message.createMessageComponentCollector({ filter, idle: 30000 });

		collector.on(MyEvents.Collect, async i => {
			let selected;
			if (i.isStringSelectMenu()) {
				selected = i.values[0];
			}
			if (prevSelected != selected && selected != undefined) {
				prevSelected = selected;
				currentIndex = 0;
				firstTime = true;
			}
			if (firstTime) {
				firstTime = false;
			}
			else {
				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);
			}

			// const movie = movieTitles.find(m => m.id == selected);
			// https://api.themoviedb.org/3/movie/550?api_key=fa6d2f27fc88f5bea6f896c7c38a58b4&append_to_response=alternative_titles
			const movieResponse = await axios.get(`${api_url}${movie_route}/${prevSelected}?api_key=${MOVIE_API_KEY}&append_to_response=${movie_alt}`);
			const movie = movieResponse.data.alternative_titles;
			const movieTitle = movieResponse.data.title;
			// const canFitOnOnePage = movie.length <= listSize;
			const newSelectMenu = createSelectMenu('List of Movies', movieTitle, 1, options);

			const altListEmbed = await createAltListEmbed(currentIndex, listSize, movie.titles);
			// console.log(altListEmbed);
			await i.update({ content: 'Selected Movie:',
				embeds: [altListEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movie.titles.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] })],
			});
		});

		collector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		collector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
		collector.on(MyEvents.Ignore, args => {
			console.log(`ignore: ${args}`);
		});

	},
};