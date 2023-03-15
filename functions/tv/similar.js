const { ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { createEmbed, createNoResultEmbed, createTvListEmbed, createTvDetailEmbed } = require('../../components/embed.js');
const { searchForTV } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { createButton } = require('../../components/button');
const { getEmoji } = require('../../helpers/get-emoji');
const { getProductionCompany, getCast } = require('../../helpers/get-production-info');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../../helpers/get-options');
const { getMediaResponse } = require('../../helpers/get-media');
const TV = 'tv';


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('tv-similar')
	// 	.setDescription('Get a list of similar tv shows (uses keywords and genres). Not the same as the "Recommendation".')
	// 	.addStringOption(option =>
	// 		option.setName('title')
	// 			.setDescription('Search for the desired tv show.')
	// 			.setRequired(true))
	// 	.addStringOption(option =>
	// 		option.setName('language')
	// 			.setDescription('Search for the desired translation.')
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

	// 	if (focusedOption.name === 'language') {
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
		const country = interaction.options.getString('region');
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		// const dept = interaction.options.getString('department') ?? '';

		const response = await searchForTV(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Tv Show Found for that query', 'Please make a new command with a different options')], files:[file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV Show similar will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Shows matching your query. :smiley:', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let similar;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;
			const appendToResponse = ['similar'];
			const tvResponse = await getMediaResponse(TV, selected, language, appendToResponse);
			const tv = tvResponse.data;

			similar = tv.similar.results;

			const tvRecommendsEmbed = await createTvListEmbed(currentIndex, listSize, similar);
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 81), 1, options);


			const current = similar.slice(currentIndex, currentIndex + listSize);
			const moreDetailBtns = current.map((tvInfo, index) => createButton(`${tvInfo.name}`, ButtonStyle.Secondary, `${tvInfo.id}`, getEmoji(currentIndex + (index + 1))));
			await i.update({
				content: `Similar to ${tv.name.slice(0, 81)}`,
				embeds: [tvRecommendsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < similar.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No TV Show found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files:[file],
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
		buttonCollector.on(MyEvents.Collect, async i => {
			if (i.customId == 'empty') return;
			if (i.customId != backId && i.customId != forwardId) {
				const appendToRespnse = ['aggregate_credits', 'content_ratings'];
				const creditResponse = await getMediaResponse(TV, i.customId, language, appendToRespnse);
				const tvDetails = creditResponse.data;


				let tvRating;
				try {
					tvRating = tvDetails.content_ratings.results.find(({ iso_3166_1 }) => ((country && iso_3166_1 == country) || tvDetails.origin_country.includes(iso_3166_1)))['rating'];
				}
				catch (err) {
					tvRating = 'N/A';
				}
				tvDetails.rating = tvRating;
				const network = getProductionCompany(tvDetails['networks']);
				const actors = getCast(tvDetails.aggregate_credits['cast'], 10);
				tvDetails.language = language;

				const tvDetailsEmbed = createTvDetailEmbed({ user: i.user, tv: tvDetails, network, actors, color: Colors.Aqua });

				await i.update({
					content: 'TV\'s Detail',
					embeds: [tvDetailsEmbed],
					components: [],
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
			}
			else {


				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const tvSimilarEmbed = await createTvListEmbed(currentIndex, listSize, similar);
				const current = similar.slice(currentIndex, currentIndex + listSize);
				const moreDetailBtns = current.map((tvInfo, index) => createButton(`${tvInfo.name}`, ButtonStyle.Secondary, `${tvInfo.id}`, getEmoji(currentIndex + (index + 1))));


				await i.update({
					content: i.message.content,
					embeds: [tvSimilarEmbed],
					components: [
						i.message.components[0],
						new ActionRowBuilder({ components:  [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < similar.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
	},
};