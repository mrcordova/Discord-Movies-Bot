const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { searchForMovie } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict, file, availableProviders, justWatchFile } = require('../load-data.js');
const { createNoResultEmbed, createEmbed, createWatchProviderListEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const { createSelectMenu } = require('../components/selectMenu');
const { getEditReplyWithoutEmebed, getPrivateFollowUp } = require('../helpers/get-reply');
const { getKey, TMDB_WATCH_LINK } = require('../helpers/get-key');
const { getOptionsForSelectMenu } = require('../helpers/get-options');
// const movie_now_playing = '/movie/now_playing';

// flatrate: HBO, DirectTV, Cable TV, Locke etc...
// free: PlutoTV, NetMovies etc...
// ads: I don't remember any
// rent: AppleTV, GooglePLAY, Youtube, Microsoft etc...
// buy: Amazon, Vudu, RedBox, AppleTV, GooglePLAY, Youtube, Microsoft etc...


// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

// let selectedRegion
// Here are some suggestions for a Discord bot slash command and options based on the given information:

// Command name: streaming

// Options:

// movie (required): The name of the movie you want to check the streaming availability for.
// country (optional): The two-letter country code for the country you want to check the streaming availability in. Defaults to the server's country.
// provider (optional): The name of the streaming provider you want to check the availability for. If not specified, returns all available providers for the given country.
// Example usage: /streaming movie="The Matrix" country=US provider="Netflix"

module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-platforms')
		.setDescription('Get a list of the availabilities per country by platform')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired film.')
				.setRequired(true))
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
			option.setName('platform')
				.setDescription('Search with speific platform.')
				.setAutocomplete(true))
		.addStringOption(option =>
			option.setName('content-type')
				.setDescription('Search availability with specific Content Availability Type')
				.setChoices(
					{
						name: 'Streaming',
						value: 'flatrate',
					},
					{
						name: 'Rent',
						value: 'rent',
					},
					{
						name: 'Buy',
						value: 'buy',
					},
				))
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
		if (focusedOption.name === 'platform') {
			choices = availableProviders.map(({ provider_name, provider_id }) => ({ name : provider_name, value : provider_id }));
		}
		if (focusedOption.name === 'region') {
			choices = countryDict;
		}

		try {
			const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);

			await interaction.respond(
				filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
			);
		}
		catch {
			const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
			// console.log(filtered);
			await interaction.respond(
				filtered.map(choice => ({ name: `${choice.name}`, value: choice.value })),
			);

		}
	},
	async execute(interaction) {
		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const country = interaction.options.getString('region');
		// const vidLang = (interaction.options.getString('video_language') ?? 'en').split('-')[0];
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		const platform = interaction.options.getInteger('platform');
		const contentType = interaction.options.getString('content-type');


		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found', 'Please make a new command with a different info.')], files: [file, justWatchFile] });
			return;
		}
		const options = getOptionsForSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie will appear here', 'Some description here', 'https://discord.js.org/');

		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query.', filter: filter, ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let movieOptionsArray;


		selectMenucollector.on(MyEvents.Collect, async m => {
			if (!m.isStringSelectMenu()) return;
			const selected = m.values[0];
			currentIndex = 0;
			let movieOptions;
			const movieResponse = await axios.get(`${api_url}/movie/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=watch/providers`);
			const movieTitle = movieResponse.data.title;
			const movie = new Map(Object.entries(movieResponse.data['watch/providers'].results));
			try {
				for (const k of movie.keys()) {
					if (!(k.trim().toLowerCase() === country.trim().toLowerCase())) {
						movie.delete(k);
					}
				}
				movieOptions = movie;
			}
			catch (err) {
				console.error(`region: ${country} failed\n${err}`);
				movieOptions = movie;
			}
			try {
				const filteredOptions = new Map();

				for (const [key, value] of movieOptions.entries()) {
					const filteredValue = Object.entries(value)
						.filter(([k]) => k.trim().toLowerCase() === contentType.trim().toLowerCase() || k.trim().toLocaleLowerCase() === 'link')
						.reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

					if (Object.keys(filteredValue).length > 1) {
						filteredOptions.set(key, filteredValue);
					}
				}
				movieOptions = filteredOptions;
			}
			catch (err) {
				console.error(`content: ${contentType} failed\n${err}`);

			}
			try {

				if (platform != null) {
					const filteredOptions = new Map();

					for (const [key, value] of movieOptions.entries()) {
						const values = Object.entries(value).filter(([, contentVal]) => Array.isArray(contentVal));

						const filteredContentType = new Map();
						for (const [contentKey, contentVal] of values) {
							const filteredPlatforms = contentVal.filter(({ provider_id }) => provider_id == platform);
							if (Object.keys(filteredPlatforms).length > 0) {
								if (!filteredContentType.has(contentKey)) {
									filteredContentType.set(contentKey, []);
								}
								const combinedContentType = filteredContentType.get(contentKey).concat(filteredPlatforms);
								filteredContentType.set(contentKey, combinedContentType);
							}
						}

						if (filteredContentType.size > 0) {

							filteredContentType.set(getKey(value, value[TMDB_WATCH_LINK]), value[TMDB_WATCH_LINK]);
							filteredOptions.set(key, filteredContentType);
						}
					}
					movieOptions = filteredOptions;
				}
			}
			catch (err) {
				console.error(`platform: ${platform} failed\n${err}`);

			}


			movieOptionsArray = Array.from(movieOptions.entries()).map(([key, value]) => {
				let temp = value;
				if (value instanceof Map) {
					temp = Object.fromEntries(value);
				}

				return {
					country: key,
					link: temp['link'],
					buy: temp['buy'],
					rent: temp['rent'],
					flatrate: temp['flatrate'],
				};
			});


			const current = movieOptionsArray.slice(currentIndex, currentIndex + listSize);
			const title = `Showing Country ${currentIndex + current.length} out of ${movieOptionsArray.length}`;
			const movieWatchProviderEmbed = await createWatchProviderListEmbed(title, current, m.user);
			const newSelectMenu = createSelectMenu('List of Movies', movieTitle.slice(0, 80), 1, options);


			await m.update({
				content: `Selected Movie: ${movieTitle.slice(0, 80)}`,
				embeds: [movieWatchProviderEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieOptionsArray.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
				],
				files: [file, justWatchFile],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});


		selectMenucollector.on(MyEvents.End, async (c, r) => {
			// const temp = await message.client.channels.fetch(message.interaction.channelId);
			// console.log(await temp.messages.fetch());

			getEditReplyWithoutEmebed(interaction, r);

		});
		selectMenucollector.on(MyEvents.Ignore, async args => {
			// await args.update({ });
			// await args.followUp({ content: 'The select menu isn\'t for you!', ephemeral: true });
			getPrivateFollowUp(args);
		});

		buttonCollector.on(MyEvents.Collect, async m => {
			if (m.customId == 'empty') return;

			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = movieOptionsArray.slice(currentIndex, currentIndex + listSize);


			const title = `Showing Country ${currentIndex + current.length} out of ${movieOptionsArray.length}`;
			const movieWatchProviderEmbed = await createWatchProviderListEmbed(title, current, m.user);

			// Respond to interaction by updating message with new embed
			await m.update({
				content: m.message.content,
				embeds: [movieWatchProviderEmbed],
				components: [
					m.message.components[0],
					new ActionRowBuilder({ components: [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieOptionsArray.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
				],
			});


			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});


		buttonCollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			getEditReplyWithoutEmebed(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, async args => {

			// await args.update({ });
			// await args.followUp({ content: 'The button isn\'t for you!', ephemeral: true });
			getPrivateFollowUp(args);

		});


	},
};