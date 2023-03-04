const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { searchForMovie } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict, file, availableProviders, justWatchFile } = require('../load-data.js');
const { createNoResultEmbed, createEmbed, createWatchProviderListEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const { createSelectMenu } = require('../components/selectMenu');
const { getEditReplyWithoutEmebed } = require('../helpers/get-editReply');
const { getKey, TMDB_WATCH_LINK } = require('../helpers/get-key');
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
		// const regionOption = interaction.options.getString('region').value ?? 'All';
		// const platformOption = interaction.options.getString('platform') ?? 'All';
		//    const tempRegion = selectedRegion.length ? 'All' : selectedRegion;
		//    const tempRegion = selectedRegion ?? 'All';
		let choices;

		// console.log(selectedRegion);
		// console.log(countryDict);

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
		}
		if (focusedOption.name === 'platform') {
			choices = availableProviders.map(({ provider_name, provider_id }) => ({ name : provider_name, value : provider_id }));
			// availableProviders;
			// const temp = availableProviders.map((platform) => countryDict.filter(({ value }) => Object.keys(platform.display_priorities).includes(value)) && { logo_path : platform.logo_path, provider_name: platform.provider_name}) ;
			// console.log(choices);
		}
		// else if (focusedOption.name === 'platform' && tempRegion != 'All') {
		// 	// choices = countryDict;
		// 	// availableProviders;
		// 	// choices = availableProviders.map((platform) => countryDict.filter(({ value }) => (selectedRegion.toLowerCase().includes(`${value}`) || value.toLowerCase() === selectedRegion.toLowerCase()) && Object.keys(platform.display_priorities).includes(value)) && { value: platform.provider_id, name: platform.provider_name }) ;
		// 	choices = availableProviders.reduce((arry, platform) => {
		// 		try {
		// 			const filteredCountry = countryDict.find(({ value, name }) => tempRegion.toLowerCase().includes(name.toLowerCase()) || tempRegion.toLowerCase().includes(value.toLowerCase()));
		// 			// console.log(filteredCountry);
		// 			const keys = Object.keys(platform.display_priorities);
		// 			if (keys.includes(filteredCountry.value)) {
		// 				arry.push({ name: platform.provider_name, value: platform.provider_id });

		// 			}
		// 			return arry;

		// 		}
		// 		catch {
		// 			console.log('failed');
		// 			return arry;
		// 		}
		// 	}, []);
		// }
		if (focusedOption.name === 'region') {
			choices = countryDict;
		}

		try {
			const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
			// if (focusedOption.name == 'region') {
			//     selectedRegion = choices.find(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).value;
			//     console.log(selectedRegion);
			//     // console.log('----------------------------------');
			// }
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

		// console.log(platform);
		// console.log(contentType);
		// console.log(country);
		// const videoType = interaction.options.getString('video-type') ?? 'All';
		// const site = interaction.options.getString('site') ?? 'All';

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found', 'Please make a new command with a different info.')], files: [file, justWatchFile] });
			return;
		}
		const options = [];

		for (const movieObject of movieTitles) {
			const description = movieObject.overview.slice(0, 50);
			options.push({ label: `${movieObject.title.slice(0, 81)} (${movieObject.release_date})`, description: `${description}...`, value: `${movieObject.id}` });
		}

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
			// console.log(movieResponse);
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
				// console.log(filteredOptions);
				movieOptions = filteredOptions;
			}
			catch (err) {
				console.error(`content: ${contentType} failed\n${err}`);

				// console.log(movieOptions);
			}
			try {

				// console.log(platform);
				if (platform != null) {
					const filteredOptions = new Map();

					for (const [key, value] of movieOptions.entries()) {
						const values = Object.entries(value).filter(([, contentVal]) => Array.isArray(contentVal));

						const filteredContentType = new Map();
						for (const [contentKey, contentVal] of values) {
							const filteredPlatforms = contentVal.filter(({ provider_id }) => provider_id == platform);
							if (Object.keys(filteredPlatforms).length > 0) {
								// console.log(filteredPlatforms);
								if (!filteredContentType.has(contentKey)) {
									filteredContentType.set(contentKey, []);
								}
								const combinedContentType = filteredContentType.get(contentKey).concat(filteredPlatforms);
								// console.log(temp);
								filteredContentType.set(contentKey, combinedContentType);
								// console.log(filteredContentType);
							}
						}

						if (filteredContentType.size > 0) {

							filteredContentType.set(getKey(value, value[TMDB_WATCH_LINK]), value[TMDB_WATCH_LINK]);
							filteredOptions.set(key, filteredContentType);
						}
					}
					// console.log(filteredOptions);
					movieOptions = filteredOptions;
					// console.log(movieOptions);
				}
			}
			catch (err) {
				console.error(`platform: ${platform} failed\n${err}`);
				// console.log(movieOptions);

			}
			// console.log(movieOptions);


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


			// console.log('--------------------------');
			// movieVideos = movie.videos.results.filter(video => video.type.toLowerCase() == contentType.toLowerCase() || contentType == 'All').filter(video => video.site == site || site == 'All');

			// console.log(movieVideos);


			// const current = movieOptionsArray.slice(currentIndex, currentIndex + listSize);
			// console.log(current);
			// const title = `${movieTitle.slice(0, 80)} Showing Movie Videos ${currentIndex + current.length} out of ${movieOptionsArray.length}`;
			// console.log(title);

			const current = movieOptionsArray.slice(currentIndex, currentIndex + listSize);
			const title = `Showing Country ${currentIndex + current.length} out of ${movieOptionsArray.length}`;
			const movieWatchProviderEmbed = await createWatchProviderListEmbed(title, current, m.user);
			const newSelectMenu = createSelectMenu('List of Movies', movieTitle.slice(0, 80), 1, options);

			// const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));


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
					// new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Videos found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files: [file, justWatchFile],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		selectMenucollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			await getEditReplyWithoutEmebed(interaction, r);
			// await interaction.editReply({ content: 'Time\'s up!', embeds:[], components: [], files: [] });
			// await interaction.deleteReply();
		});
		selectMenucollector.on(MyEvents.Ignore, async args => {
			// console.log(`ignore: ${args}`);
			// args.message.components[0].components[0].data.placeholder = "test";
			// console.log(args.message.components[0].components[0].data.placeholder);
			await args.update({ });
			await args.followUp({ content: 'The select menu isn\'t for you!', ephemeral: true });
			// args.message.interaction.reply({ content: 'These buttons aren\'t for you!', ephemeral: true });
		});

		buttonCollector.on(MyEvents.Collect, async m => {
			if (m.customId == 'empty') return;

			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = movieOptionsArray.slice(currentIndex, currentIndex + listSize);


			// console.log(m.message.embeds[0].title.split('Showing Movie Videos').join(`Showing Movie Videos ${currentIndex + current.length} out of ${movieVideos.length}`));
			// console.log(m.message.components[0].components[0].placeholder)
			const title = `Showing Country ${currentIndex + current.length} out of ${movieOptionsArray.length}`;
			const movieWatchProviderEmbed = await createWatchProviderListEmbed(title, current, m.user);
			// const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));

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
					// new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Videos found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
			});


			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});


		buttonCollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			await getEditReplyWithoutEmebed(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, async args => {
			// console.log(`ignore: ${args}`);
			// console.log(args)
			await args.update({ });
			await args.followUp({ content: 'The select menu isn\'t for you!', ephemeral: true });
			// await i.reply({ content: 'These buttons aren\'t for you!', ephemeral: true });

		});


		// await interaction.reply({ content: `These buttons aren't for you!`, ephemeral: true });
		// return;


	},
};