const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const { createButton } = require('../../components/button.js');
const { searchForTV } = require('../../helpers/search-for.js');
const { countryDict, translationsCodeDict, file } = require('../../load-data.js');
const { createNoResultEmbed, createEmbed, createRatingsEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { createSelectMenu } = require('../../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../../helpers/get-options');
const { getMediaResponse } = require('../../helpers/get-media');
const TV = 'tv';
// const movie_now_playing = '/movie/now_playing';

// https://api.themoviedb.org/3/movie/{movie_id}/release_dates?api_key=<<api_key>>

// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('tv-content-ratings')
	// 	.setDescription(' Get a list of a TV Show\'s content ratings.')
	// 	.addStringOption(option =>
	// 		option.setName('title')
	// 			.setDescription('Search for the desired TV Show.')
	// 			.setRequired(true))
	// 	.addStringOption(option =>
	// 		option.setName('language')
	// 			.setDescription('Search for the desired translation.')
	// 			.setMinLength(2)
	// 			.setAutocomplete(true))
	// 	.addStringOption(option =>
	// 		option.setName('region')
	// 			.setDescription('Search for the desired region.')
	// 			.setAutocomplete(true))
	// 	.addIntegerOption(option =>
	// 		option.setName('release-year')
	// 			.setDescription('Search for the desired year.')
	// 			.setMinValue(1800)
	// 			.setMaxValue(3000)),
	// async autocomplete(interaction) {
	// 	// handle the autocompletion response (more on how to do that below)
	// 	const focusedOption = interaction.options.getFocused(true);
	// 	let choices;

	// 	if (focusedOption.name === 'language' || focusedOption.name === 'image_language') {
	// 		choices = translationsCodeDict;
	// 	}
	// 	if (focusedOption.name === 'region') {
	// 		choices = countryDict;
	// 	}

	// 	const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
	// 	await interaction.respond(
	// 		filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
	// 	);
	// },
	async execute(interaction) {
		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const country = interaction.options.getString('region') ?? 'All';
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;

		const response = await searchForTV(query, language, region, releaseYear);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Shows Found', 'Please make a new command with a different options.')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(tvTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV Show will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let tvRatings;

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;
			const appendToResponse = ['content_ratings'];
			const tvResponse = await getMediaResponse(TV, selected, language, appendToResponse);
			const tv = tvResponse.data;
			tvRatings = tv.content_ratings.results.filter((countryCode) => countryCode.iso_3166_1 == country || country == 'All');
			const current = tvRatings.slice(currentIndex, currentIndex + listSize, tvRatings);

			const title = `Showing Ratings ${currentIndex + current.length} out of ${tvRatings.length}`;

			const tvRatingEmbed = await createRatingsEmbed(currentIndex, current, title);
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 81), 1, options);


			await i.update({
				content: `Ratings for ${tv.name.slice(0, 81)}`,
				embeds: [tvRatingEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < tvRatings.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
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
			getEditReply(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);
		});

		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = tvRatings.slice(currentIndex, currentIndex + listSize);
			const title = `Showing Ratings ${currentIndex + 1}-${currentIndex + current.length} out of ${tvRatings.length}`;

			const movieReleaseDateEmbed = await createRatingsEmbed(currentIndex, current, title);


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
						...(currentIndex + listSize < tvRatings.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }) ],
			});
			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});


		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);

		});

	},
};

