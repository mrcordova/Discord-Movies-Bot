const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { searchForMovie } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict, file, availableProviders } = require('../load-data.js');
const { createNoResultEmbed, createEmbed, createVideoEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const { createSelectMenu } = require('../components/selectMenu');
const { getEmoji } = require('../helpers/get-emoji');
const { getEditReplyWithoutEmebed } = require('../helpers/get-editReply');
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
		.addStringOption(option =>
			option.setName('platform')
				.setDescription('Search platform. Hint: Select region first for available options in specific region.')
				.setAutocomplete(true))
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
				filtered.map(choice => ({ name: `${choice.name}`, value: `${choice.value}` })),
			);

		}
	},
	async execute(interaction) {
		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const vidLang = (interaction.options.getString('video_language') ?? 'en').split('-')[0];
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		const videoType = interaction.options.getString('video-type') ?? 'All';
		const site = interaction.options.getString('site') ?? 'All';

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found', 'Please make a new command with a different info.')], files: [file] });
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

		const message = await interaction.reply({ content: 'List of Movies matching your query.', filter: filter, ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let movieVideos;

		selectMenucollector.on(MyEvents.Collect, async m => {
			if (!m.isStringSelectMenu()) return;
			const selected = m.values[0];
			currentIndex = 0;
			const movieResponse = await axios.get(`${api_url}/movie/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=videos&include_video_language=${vidLang},null`);
			const movie = movieResponse.data;

			// console.log(movie.videos.results);
			// console.log('--------------------------');
			movieVideos = movie.videos.results.filter(video => video.type.toLowerCase() == videoType.toLowerCase() || videoType == 'All').filter(video => video.site == site || site == 'All');

			// console.log(movieVideos);


			const current = movieVideos.slice(currentIndex, currentIndex + listSize);
			const title = `${movie.title.slice(0, 80)} Showing Movie Videos ${currentIndex + current.length} out of ${movieVideos.length}`;

			const movieVideoEmbed = createVideoEmbed(title, current, m.user);
			const newSelectMenu = createSelectMenu('List of Movies', movie.title.slice(0, 80), 1, options);

			const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));


			await m.update({
				content: 'Selected Movie Video: ',
				embeds: [movieVideoEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieVideos.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Videos found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files: [file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		selectMenucollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			await getEditReplyWithoutEmebed(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			console.log(`ignore: ${args}`);
		});

		buttonCollector.on(MyEvents.Collect, async m => {
			if (m.customId == 'empty') return;
			// console.log(m.customId);
			if (m.customId != backId && m.customId != forwardId) {
				const sites = {
					'youtube': 'https://www.youtube.com/watch?v=',
					'vimeo': 'https://vimeo.com/',
				};
				const videoLink = movieVideos.find(video => m.customId == video.id);


				await m.reply({
					content: `${sites[videoLink.site.toLowerCase()]}${videoLink.key}`,
					embeds: [],
					components: [],
					ephemeral: false,
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
				// await interaction.deleteReply();


			}
			else {

				// Increase/decrease index
				m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const current = movieVideos.slice(currentIndex, currentIndex + listSize);


				// console.log(m.message.embeds[0].title.split('Showing Movie Videos').join(`Showing Movie Videos ${currentIndex + current.length} out of ${movieVideos.length}`));
				// console.log(m.message.components[0].components[0].placeholder)
				const title = `${m.message.components[0].components[0].placeholder.slice(0, 60)} Showing Movie Image ${currentIndex + current.length} out of ${movieVideos.length}`;
				const movieVideoEmbed = createVideoEmbed(title, current, m.user);
				const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));

				// Respond to interaction by updating message with new embed
				await m.update({
					content: 'Showing Movie Videos',
					embeds: [movieVideoEmbed],
					components: [
						m.message.components[0],
						new ActionRowBuilder({ components: [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < movieVideos.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
						] }),
						new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Videos found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
					],
				});
			}

			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});


		buttonCollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			await getEditReplyWithoutEmebed(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			console.log(`ignore: ${args}`);
		});

	},
};