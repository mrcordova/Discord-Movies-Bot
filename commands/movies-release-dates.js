const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { searchForMovie } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict } = require('../load-data.js');
const { createNoResultEmbed, createEmbed, createReleaseDatesEmbed } = require('../components/embed');
const { MyEvents, ReleaseTypes } = require('../events/DMB-Events');
const { createSelectMenu } = require('../components/selectMenu');
// const movie_now_playing = '/movie/now_playing';

// https://api.themoviedb.org/3/movie/{movie_id}/images?api_key=<<api_key>>&language=en-US
// language string optional
// include_image_language string optional


// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-release-dates')
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
						// console.log(releaseType.value);
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
				.setMaxValue(3000)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'language' || focusedOption.name === 'image_language') {
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
		const country = interaction.options.getString('region') ?? 'All';
		const releaseType = interaction.options.getInteger('release-type');
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found', 'Please make a new command with a different info.')] });
			return;
		}
		const options = [];

		for (const movieObject of movieTitles) {
			const description = movieObject.overview.slice(0, 50);
			options.push({ label: `${movieObject.title.slice(0, 81)} (${movieObject.release_date})`, description: `${description}...`, value: `${movieObject.id}` });
		}

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie will apear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query.', filter: filter, ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let movieReleaseDates;

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;
			const movieResponse = await axios.get(`${api_url}/movie/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=release_dates`);
			const movie = movieResponse.data;
			movieReleaseDates = movie.release_dates.results.filter((countryCode) => countryCode.iso_3166_1 == country || country == 'All');


			const current = movieReleaseDates.slice(currentIndex, currentIndex + listSize, movieReleaseDates);
			// console.log(current);
			const title = `Showing Release Dates ${currentIndex + current.length} out of ${movieReleaseDates.length}`;

			const movieReleaseDateEmbed = await createReleaseDatesEmbed(currentIndex, current, title, releaseType);
			const newSelectMenu = createSelectMenu('List of Movies', movie.title.slice(0, 81), 1, options);


			await i.update({
				content: `${new ReleaseTypes(releaseType).toString} releases for ${movie.title.slice(0, 81)}`,
				embeds: [movieReleaseDateEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieReleaseDates.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
				],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
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

		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = movieReleaseDates.slice(currentIndex, currentIndex + listSize);
			const title = `Showing Release Dates ${currentIndex + current.length} out of ${movieReleaseDates.length}`;

			const movieReleaseDateEmbed = await createReleaseDatesEmbed(currentIndex, current, title, releaseType);
			// const newSelectMenu = createSelectMenu('List of Movies', m.message.components[0].placeHolderText, 1, options);

			// console.log(currentIndex);
			// Respond to interaction by updating message with new embed
			await m.update({
				content:  m.message.content,
				embeds: [movieReleaseDateEmbed],
				components: [
					m.message.components[0],
					new ActionRowBuilder({ components: [
					// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieReleaseDates.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }) ],
			});
			selectMenucollector.resetTimer([{ idle: 30000 }]);
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