const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { searchForTV } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict, file } = require('../load-data.js');
const { createNoResultEmbed, createEmbed, createImageEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const { createSelectMenu } = require('../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../helpers/get-options');
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
		.setName('tv-season-images')
		.setDescription('Get the images that belong to a TV show season.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired tv show season.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('season')
				.setDescription('Search for the desired season.')
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
			option.setName('release-year')
				.setDescription('Search for the desired year.')
				.setMinValue(1800)
				.setMaxValue(3000))
		.addStringOption(option =>
			option.setName('image_language')
				.setDescription('Search for the desired image language.')
				.setAutocomplete(true)),
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
		const imgLang = (interaction.options.getString('image_language') ?? 'en').split('-')[0];
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		const seasonNum = interaction.options.getInteger('season') ?? 0;

		const response = await searchForTV(query, language, region, releaseYear);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV show season Found', 'Please make a new command with a different info.')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(tvTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV Show will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let tvImages;

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;

            let tvResponse;
			try {
				tvResponse = await axios.get(`${api_url}/tv/${selected}/season/${seasonNum}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=images&include_image_language=${imgLang},null`);
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
            const tv = tvResponse.data;
			// console.log(tv.images);
			tvImages = tv.images.posters.concat(tv.images.posters.backdrops).filter((obj) => obj);

			const current = tvImages.slice(currentIndex, currentIndex + listSize);
			const title = `${tv.name.slice(0, 80)} Showing TV Show Season Image ${currentIndex + current.length} out of ${tvImages.length}`;

			// const file = new AttachmentBuilder('./images/TMDb-logo.png');

			const movieImageEmbed = createImageEmbed(title, current, i.user);
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 80), 1, options);

			await i.update({
				content: 'Selected TV show season Images: ',
				embeds: [movieImageEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < tvImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					// new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Images found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files: [file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			// await interaction.editReply({ content: 'Time\'s up!', components: [] });
			getEditReply(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);

		});

		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = tvImages.slice(currentIndex, currentIndex + listSize);


			const title = `${m.message.components[0].components[0].placeholder.slice(0, 60)} Showing TV Show Season Image ${currentIndex + current.length} out of ${tvImages.length}`;
			const movieCreditsEmbed = createImageEmbed(title, current, m.user);

			// console.log(currentIndex);
			// Respond to interaction by updating message with new embed
			await m.update({
				content: m.message.content,
				embeds: [movieCreditsEmbed],
				components: [
					m.message.components[0],
					new ActionRowBuilder({ components: [
					// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < tvImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }) ],
			});
			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});


		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			// await interaction.editReply({ content: 'Time\'s up!', components: [] });
			getEditReply(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

	},
};