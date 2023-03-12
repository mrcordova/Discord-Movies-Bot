const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createNoResultEmbed, createPersonDetailEmbed, createTvEpisodeCreditListEmbed } = require('../components/embed.js');
const { searchForTV } = require('../helpers/search-for.js');
const { translationsCodeDict, depts, deptEmojis, file } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { createButton } = require('../components/button');
const { getEmoji } = require('../helpers/get-emoji');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../helpers/get-options');
const { getMediaDetail, getMediaResponse } = require('../helpers/get-media');
const tv_details = '/tv';


// https://api.themoviedb.org/3/movie/{movie_id}?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional
// query String required
// page 1 optional
// include_adult false optional
// region String optional
// year Integer optional  includes dvd, blu-ray  dates ect
// primary_release_year Integer optional - oldest release date


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-episode-credits')
		.setDescription('Search for a tv episode\'s cast and crew')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired tv episode.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('season')
				.setDescription('Search for the desired season.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('episode')
				.setDescription('Search for the desired episode.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('department')
				.setDescription('Choose desired dept.')
				.setChoices(
					...depts.reduce((arry, dept) => {
						arry.push({ name: dept, value: dept });
						return arry;
					}, []))
				.setRequired(true))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search for the desired translation.')
				.setAutocomplete(true)),
	// .addStringOption(option =>
	// 	option.setName('region')
	// 		.setDescription('Search for the desired region.')
	// 		.setAutocomplete(true))
	// .addIntegerOption(option =>
	// 	option.setName('release-year')
	// 		.setDescription('Search for the desired year.')
	// 		.setMinValue(1800)
	// 		.setMaxValue(3000)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
		}
		// if (focusedOption.name === 'region') {
		// 	choices = countryDict;
		// }

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
		const episodeNum = interaction.options.getInteger('episode');
		const dept = interaction.options.getString('department') ?? '';

		const response = await searchForTV(query, language, region, releaseYear);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Show Episode found for that query', 'Please make a new command with a different option(s)')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(tvTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV Show episode credits will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Show episode matching your query. :smiley:', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let credits;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;

			let tvResponse;
			try {
				tvResponse = await axios.get(`${api_url}${tv_details}/${selected}/season/${seasonNum}/episode/${episodeNum}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=credits`);
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

			// console.log(tv.credits);
			const cast = tv.credits['cast'].filter(({ known_for_department }) => known_for_department == dept);
			const crew = tv.credits['crew'].filter(({ known_for_department }) => known_for_department == dept);
			const guestStars = tv.credits['guest_stars'].filter(({ known_for_department }) => known_for_department == dept);
			credits = cast.concat(crew).concat(guestStars);
			// console.log(credits);
			// console.log(movie.credits['cast'].filter(({name}) => name.includes('Michael')));
			const tvCreditsEmbed = await createTvEpisodeCreditListEmbed(currentIndex, listSize, credits);
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 81), 1, options);

			const current = credits.slice(currentIndex, currentIndex + listSize);
			const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name}`, ButtonStyle.Secondary, `${credit.id}`, getEmoji(currentIndex + (index + 1))));
			await i.update({
				content: `Department: ${dept} ${deptEmojis[dept]}`,
				embeds: [tvCreditsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < credits.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No credits found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files: [file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);

		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		buttonCollector.on(MyEvents.Collect, async i => {
			if (i.customId == 'empty') return;
			// console.log(i.customId);
			if (i.customId != backId && i.customId != forwardId && !i.customId.includes('known_for_')) {

				const personResponse = await axios.get(`${api_url}/person/${i.customId}?api_key=${MOVIE_API_KEY}&language=${language}`);
				const personDetials = personResponse.data;
				// console.log(personDetials);
				const imdbResponse = await axios.get(`${api_url}/find/${personDetials.imdb_id}?api_key=${MOVIE_API_KEY}&language=${language}&external_source=imdb_id`);
				// console.log(imdbResponse.data);
				let tvCredits;
				try {
					// undefined error for person results
					tvCredits = imdbResponse.data.person_results[0].known_for;
				}
				catch {
					tvCredits = [];
				}

				const personCreditsEmbed = createPersonDetailEmbed(personDetials, tvCredits, i.user);
				const moreDetailBtns = tvCredits.map((credit, index) => createButton(`${credit.name ?? credit.title}`, ButtonStyle.Secondary, `known_for_${credit.media_type}_${credit.id}`, getEmoji((index + 1))));
				await i.update({
					content: 'Person\'s Detail',
					embeds: [personCreditsEmbed],
					components: [
						new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No credits found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
					],
				});
				// buttonCollector.stop('Done!');
				// selectMenucollector.stop('Done!');
			}
			else if (i.customId.includes('known_for_')) {
				const searchParameter = i.customId.replace('known_for_', '');
				const [mediaType, id] = searchParameter.split('_');
				const appendToResponse = mediaType == 'tv' ? ['aggregate_credits', 'content_ratings'] : ['credits', 'release_dates'];


				const mediaResponse = await getMediaResponse(mediaType, id, language, appendToResponse);

				const media = mediaResponse.data;

				const mediaDetailsEmbed = getMediaDetail(mediaType, country, language, i, media);
				await i.update({
					content: `${mediaType}'s Detail`,
					embeds: [mediaDetailsEmbed],
					components: [],

				});

				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
			}
			else {


				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const tvCreditsEmbed = await createTvEpisodeCreditListEmbed(currentIndex, listSize, credits);
				const current = credits.slice(currentIndex, currentIndex + listSize);
				const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name}`, ButtonStyle.Secondary, `${credit.id}`, getEmoji(currentIndex + (index + 1))));


				await i.update({
					content: i.message.content,
					embeds: [tvCreditsEmbed],
					components: [
						i.message.components[0],
						new ActionRowBuilder({ components:  [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < credits.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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
			getEditReply(interaction, r);
		});
	},
};