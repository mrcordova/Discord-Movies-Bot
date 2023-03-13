const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createNoResultEmbed } = require('../components/embed.js');
const { searchForTV } = require('../helpers/search-for.js');
const { translationsCodeDict, file, countryDict, siteArray, siteDict } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../helpers/get-options');
const tv_details = '/tv';


// https://api.themoviedb.org/3/movie/{movie_id}?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional
// query String required
// page 1 optional
// include_adult false optional
// region String optional
// year Integer optional  includes dvd, blu-ray  dates ect
// primary_release_year Integer optional - oldest release date


// const backId = 'back';
// const forwardId = 'forward';

// const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
// const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-episode-external-link')
		.setDescription('Get the external links for a TV Episode. We currently support TVDB.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired tv show season.')
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
			option.setName('language')
				.setDescription('Search for the desired translation.')
				.setAutocomplete(true))
		.addStringOption(option =>
			option.setName('site')
				.setDescription('Select the type of site')
				.setChoices(
					...siteArray.concat({ name: 'TVDB', value: 'tvdb' }),
				))
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
		const site = interaction.options.getString('site');
        const seasonNum = interaction.options.getInteger('season');
        const episodeNum = interaction.options.getInteger('episode');


		const response = await searchForTV(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Show Found for that query', 'Please make a new command with a different year')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		// const embed = createEmbed(Colors.Blue, 'Movie will apear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Show episode matching your query. :smiley:', ephemeral: false, embeds: [], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		// const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		// const listSize = 5;
		// let currentIndex = 0;
		// let credits;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			// currentIndex = 0;

			const tvShowResponse = await axios.get(`${api_url}${tv_details}/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=external_ids`);
			// const tvShowResponse = await axios.get(`${api_url}${tv_details}/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=external_ids`);
			// console.log(tvShowResponse.data);
			const tvSeasonResponse = await axios.get(`${api_url}${tv_details}/${selected}/season/${seasonNum}/episode/${episodeNum}?api_key=${MOVIE_API_KEY}&append_to_response=external_ids`);
			const tvLinks = tvSeasonResponse.data.external_ids;
			delete tvLinks.id;

			// console.log(tvResponse);
			// https://thetvdb.com/series/79168-show/seasons/official/3
			if (tvLinks['tvdb_id']) {
				tvLinks['tvdb_id'] = `${tvShowResponse.data.name.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-')}/episodes/${tvLinks['tvdb_id']}`;
			}

			if (site && tvLinks[`${site}_id`]) {
				const videoLink = `${siteDict[site.toLowerCase()]}${tvLinks[`${site}_id`]}`;

				await i.reply({
					content: videoLink,
					embeds: [],
					components: [],
					ephemeral: false,
				});
			}
			else if (!site) {
				let videoLink = '';

				for (const [key, value] of Object.entries(tvLinks)) {
					if (value != null && siteDict[key.split('_')[0]]) {
						videoLink += `${siteDict[key.split('_')[0]]}${value}\n`;
					}
				}

				await i.reply({
					content: videoLink.length == 0 ? 'No external links found' : videoLink,
					embeds: [],
					components: [],
					ephemeral: videoLink.length == 0 ? true : false,
				});
			}
			else {
				await i.reply({
					content: 'No results found with these options',
					embeds: [],
					components: [],
					ephemeral: true,
				});

			}


			// buttonCollector.stop('Done!');
			selectMenucollector.stop('Done!');

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
		// buttonCollector.on(MyEvents.Collect, async i => {
		// 	if (i.customId == 'empty') return;
		// 	// console.log(i.customId);
		// 	if (i.customId != backId && i.customId != forwardId) {
		// 		// https://api.themoviedb.org/3/credit/{credit_id}?api_key=<<api_key>>
		// 		const creditResponse = await axios.get(`${api_url}/credit/${i.customId}?api_key=${MOVIE_API_KEY}`);

		// 		const person_id = creditResponse.data.person.id;
		// 		//  add language option?
		// 		const personResponse = await axios.get(`${api_url}/person/${person_id}?api_key=${MOVIE_API_KEY}&language=${language}`);
		// 		const personDetials = personResponse.data;
		// 		// console.log(personDetials);
		// 		const imdbResponse = await axios.get(`${api_url}/find/${personDetials.imdb_id}?api_key=${MOVIE_API_KEY}&language=${language}&external_source=imdb_id`);
		// 		// console.log(imdbResponse.data);
		// 		let movieCredits;
		// 		try {
		// 			// undefined error for person results
		// 			movieCredits = imdbResponse.data.person_results[0].known_for;
		// 		}
		// 		catch {
		// 			movieCredits = [{ title: 'N/A', vote_average: -1 }];
		// 		}

		// 		const personCreditsEmbed = createPersonDetailEmbed(personDetials, movieCredits, i.user);

		// 		await i.update({
		// 			content: 'Person\'s Detail',
		// 			embeds: [personCreditsEmbed],
		// 			components: [],
		// 		});
		// 		buttonCollector.stop('Done!');
		// 		selectMenucollector.stop('Done!');
		// 	}
		// 	else {


		// 		i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

		// 		const movieCreditsEmbed = await createCreditListEmbed(currentIndex, listSize, credits);
		// 		const current = credits.slice(currentIndex, currentIndex + listSize);
		// 		const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name}`, ButtonStyle.Secondary, `${credit.credit_id}`, getEmoji(currentIndex + (index + 1))));


		// 		await i.update({
		// 			content: `Department: ${dept}${deptEmojis[dept]}`,
		// 			embeds: [movieCreditsEmbed],
		// 			components: [
		// 				i.message.components[0],
		// 				new ActionRowBuilder({ components:  [
		// 					// back button if it isn't the start
		// 					...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
		// 					// forward button if it isn't the end
		// 					...(currentIndex + listSize < credits.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
		// 				] }),
		// 				new ActionRowBuilder({ components:  moreDetailBtns }),
		// 			],
		// 		});
		// 	}
		// 	selectMenucollector.resetTimer([{ idle: 30000 }]);
		// });
		// buttonCollector.on(MyEvents.Dispose, i => {
		// 	console.log(`button dispose: ${i}`);
		// });
		// buttonCollector.on(MyEvents.Ignore, args => {
		// 	// console.log(`button ignore: ${args}`);
		// 	getPrivateFollowUp(args);
		// });
		// // eslint-disable-next-line no-unused-vars
		// buttonCollector.on(MyEvents.End, async (c, r) => {
		// 	getEditReply(interaction, r);
		// });
	},
};