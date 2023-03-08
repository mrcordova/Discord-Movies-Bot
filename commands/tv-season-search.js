const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createNoResultEmbed, createTvSeasonDetailEmbed, createEpisodeDetailEmbed } = require('../components/embed.js');
const { searchForTV } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict, file } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { getCast, getCrewMember } = require('../helpers/get-production-info');
const { MyEvents } = require('../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../helpers/get-options');
const { createButton } = require('../components/button');
const { getEmoji } = require('../helpers/get-emoji');
const tv_details = '/tv';


// https://api.themoviedb.org/3/search/tv?api_key=<<api_key>>&language=en-US&page=1&include_adult=false
// language string Pass a ISO 639-1 value to display translated data for the fields that support it.
// page integer Specify which page to query. optional
// query string Pass a text query to search. This value should be URI encoded. required
// include_adult false optional
// first_air_date_year integer optional

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-season-search')
		.setDescription('Search for tv show search based on a text query.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired TV Show\'s season.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('season')
				.setDescription('Search for the desired season.')
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
		const seasonNum = interaction.options.getInteger('season');

		const response = await searchForTV(query, language, region, releaseYear);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Shows Found', 'Please make a new command with a different options')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(tvTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV show will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		// if no film is found for certain year.
		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenuCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });
		let currentIndex = 0;
		const listSize = 5;
		let episodes;
		let tv;
		selectMenuCollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;

			let tvResponse;
			try {
				tvResponse = await axios.get(`${api_url}${tv_details}/${selected}/season/${seasonNum}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=aggregate_credits`);
			}
			catch {
				await i.update({
					content: i.message.content,
					embeds: [createNoResultEmbed(Colors.Red, 'No Results found')],
					components: [
						i.message.components[0],
					],
				});
				return;
			}

			tv = tvResponse.data;

			// console.log(tv.credits['crew']);
			episodes = tv.episodes;
			const current = episodes.slice(currentIndex, currentIndex + listSize);
			tv.count = `Showing Episodes ${currentIndex + 1} - ${currentIndex + current.length} out of ${episodes.length}`;
			const tvDetailsEmbed = await createTvSeasonDetailEmbed({ tv, episodes: current }, i.user);
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 81), 1, options);

			const moreDetailBtns = current.map((tvInfo, index) => createButton(`${tvInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${tvInfo.id}`, getEmoji(currentIndex + (index + 1))));

			await i.update({
				content: `Selected TV Show: ${tv.name.slice(0, 81)}`,
				embeds: [tvDetailsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < tv.episodes.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Episodes found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),

				],
				files: [file],
			});
			// collector.resetTimer([{time: 15000}]);
			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		selectMenuCollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenuCollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		selectMenuCollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

		buttonCollector.on(MyEvents.Collect, async i => {
			// console.log(i.customId);

			if (i.customId != backId && i.customId != forwardId) {
				const episode = episodes.find(({ id }) => id == i.customId);
				// console.log(episode);
				// const episodeDetailDetailEmbed;
				const crew = episode.crew;
				episode.writers = getCrewMember(crew, 'writer');
				episode.directors = getCrewMember(crew, 'director');
				episode.editors = getCrewMember(crew, 'editor');
				episode.dps = getCrewMember(crew, 'director of photography');
				episode.actors = getCast(tv.aggregate_credits.cast, 10);
				// console.log(episode);
				const episodeDeatailEmbed = createEpisodeDetailEmbed(episode, i.user);
				await i.update({
					content: 'Episode\'s Detail',
					embeds: [episodeDeatailEmbed],
					components: [],
					ephemeral: false,
				});
				buttonCollector.stop('Done!');
				selectMenuCollector.stop('Done!');
			}
			else {

				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const current = episodes.slice(currentIndex, currentIndex + listSize);
				tv.count = `Showing Episodes ${currentIndex + 1} - ${currentIndex + current.length} out of ${episodes.length}`;
				const moreDetailBtns = current.map((tvInfo, index) => createButton(`${tvInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${tvInfo.id}`, getEmoji(currentIndex + (index + 1))));

				const tvDetailsEmbed = await createTvSeasonDetailEmbed({ tv, episodes: current }, i.user);

				await i.update({
					content: i.message.content,
					embeds: [tvDetailsEmbed],
					components: [
						i.message.components[0],
						new ActionRowBuilder({ components:  [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < episodes.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
						] }),
						new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Episodes found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
					],
				});

			}
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
			// await interaction.editReply({ content: 'Time\'s up!', components: [] });
			getEditReply(interaction, r);
		});
	},
};

