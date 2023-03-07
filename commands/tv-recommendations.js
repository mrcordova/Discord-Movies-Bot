const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createNoResultEmbed, createMovieDetailEmbed, createListEmbed, createTvListEmbed, createTvDetailEmbed } = require('../components/embed.js');
const { searchForMovie, searchForTV } = require('../helpers/search-movie.js');
const { translationsCodeDict, countryDict, file } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { createButton } = require('../components/button');
const { getEmoji } = require('../helpers/get-emoji');
const { createCurrencyFormatter, getProductionCompany, getCrewMember, getCast } = require('../helpers/get-production-info');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForSelectMenu, getOptionsForTvSelectMenu } = require('../helpers/get-options');
const { getMediaResponse } = require('../helpers/get-media');
const movie_details = '/tv';
const TV = 'tv';

// https://api.themoviedb.org/3/movie/{movie_id}/recommendations?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-recommendations')
		.setDescription('Get the list of TV show recommendations for this tv show.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired Tv show.')
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
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		// const dept = interaction.options.getString('department') ?? '';

		const response = await searchForTV(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Show Found for that query', 'Please make a new command with a different options')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV Show Recommendations will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Recommended TV Shows matching your query. :smiley:', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let recommendations;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;
			const appendToResponse = ['recommendations'];
			const tvResponse = await getMediaResponse(TV, selected, language, appendToResponse);
			const tv = tvResponse.data;


			recommendations = tv.recommendations.results;

			const movieRecommendsEmbed = await createTvListEmbed(currentIndex, listSize, recommendations);
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 81), 1, options);

			// console.log(recommendations);

			const current = recommendations.slice(currentIndex, currentIndex + listSize);
			// console.log(current);
			const moreDetailBtns = current.map((tvInfo, index) => createButton(`${tvInfo.name}`, ButtonStyle.Secondary, `${tvInfo.id}`, getEmoji(currentIndex + (index + 1))));
			await i.update({
				content: `Recommendations for ${tv.name.slice(0, 81)}`,
				embeds: [movieRecommendsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < recommendations.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No TV Shows found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
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
		buttonCollector.on(MyEvents.Collect, async i => {
			if (i.customId == 'empty') return;
			// console.log(i.customId);
			if (i.customId != backId && i.customId != forwardId) {
				// https://api.themoviedb.org/3/credit/{credit_id}?api_key=<<api_key>>
				const appendToResponse = ['credits', 'release_dates'];
				const creditResponse = await getMediaResponse(TV, i.customId, language, appendToResponse);
				const tvDetails = creditResponse.data;
                console.log(tvDetails);
				let tvRating;
				try {
					tvRating = (tvDetails.release_dates.results.find(({ iso_3166_1 }) => iso_3166_1 == region) ?? { release_dates: [{ type: 3 }] })['release_dates'].find(({ type }) => type == 3).certification ?? 'N/A';
				}
				catch {
					tvRating = 'N/A';
				}
				tvDetails.rating = tvRating;

				const formatter = createCurrencyFormatter();
				const network = getProductionCompany(tvDetails['network']);
				const directors = getCrewMember(tvDetails.credits['crew'], 'director');
				const actors = getCast(tvDetails.credits['cast'], 3);

				const tvDetailssEmbed = createTvDetailEmbed({ user: i.user, tv: tvDetails, network, directors, actors, formatter, color: Colors.Aqua });

				await i.update({
					content: 'TV\'s Detail',
					embeds: [tvDetailssEmbed],
					components: [],
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
			}
			else {


				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const tvRecommendsEmbed = await createTvListEmbed(currentIndex, listSize, recommendations);
				const current = recommendations.slice(currentIndex, currentIndex + listSize);
				const moreDetailBtns = current.map((tv, index) => createButton(`${tv.name}`, ButtonStyle.Secondary, `${tv.id}`, getEmoji(currentIndex + (index + 1))));


				await i.update({
					content: i.message.content,
					embeds: [tvRecommendsEmbed],
					components: [
						i.message.components[0],
						new ActionRowBuilder({ components:  [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < recommendations.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
						] }),
						new ActionRowBuilder({ components:  moreDetailBtns }),
					],
				});
			}
			selectMenucollector.resetTimer([{ idle: 30000 }]);
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