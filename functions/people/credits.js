const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createNoResultEmbed, createCreditListEmbed, createPersonDetailEmbed, createPeopleCreditListEmbed, createTvDetailEmbed } = require('../../components/embed.js');
const { searchForMovie, searchForPeople } = require('../../helpers/search-for.js');
const { translationsCodeDict, depts, deptEmojis, file } = require('../../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { createButton } = require('../../components/button');
const { getEmoji } = require('../../helpers/get-emoji');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForSelectMenu, getOptionsForPeopleSelectMenu } = require('../../helpers/get-options');
const { getMediaResponse, getMediaDetail } = require('../../helpers/get-media');
const person_details = '/person';


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

	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
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
		const dept = interaction.options.getString('department') ?? 'all';
		const mediaType = interaction.options.getString('media-type') ?? 'combine';

		const response = await searchForPeople(query, language, region);
		const peopleNames = response.data.results;

		if (!peopleNames.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No People Found for that query', 'Please make a new command')], files: [file] });
			return;
		}
		const options = getOptionsForPeopleSelectMenu(peopleNames, language);

		const selectMenu = createSelectMenu('List of People', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Person\'s credits will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query. :smiley:', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let credits;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;

			const peopleResponse = await axios.get(`${api_url}${person_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=combined_credits`);
			const personCredits = peopleResponse.data;
			const combined_credits = personCredits.combined_credits;

			const cast = combined_credits['cast'].filter(({ media_type }) => media_type == mediaType || mediaType == 'combine').filter(() => dept == 'Acting' || dept === 'all');
			const crew = combined_credits['crew'].filter(({ media_type }) => media_type == mediaType || mediaType == 'combine').filter(({ department }) => department == dept || dept === 'all');
			credits = cast.concat(crew);
			const movieCreditsEmbed = await createPeopleCreditListEmbed(currentIndex, listSize, credits);
			const newSelectMenu = createSelectMenu('List of People', personCredits.name.slice(0, 81), 1, options);

			const current = credits.slice(currentIndex, currentIndex + listSize);
			const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name ?? credit.title}`, ButtonStyle.Secondary, `${credit.credit_id}`, getEmoji(currentIndex + (index + 1))));
			await i.update({
				content: `Department: ${dept} ${deptEmojis[dept]}`,
				embeds: [movieCreditsEmbed],
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
			if (i.customId != backId && i.customId != forwardId) {
				const creditResponse = await axios.get(`${api_url}/credit/${i.customId}?api_key=${MOVIE_API_KEY}`);

				const chosenMediaType = creditResponse.data.media_type;

				const appendToResponse = chosenMediaType == 'tv' ? ['aggregate_credits', 'content_ratings'] : ['credits', 'release_dates'];


				const mediaResponse = await getMediaResponse(chosenMediaType, creditResponse.data.media.id, language, appendToResponse);

				const media = mediaResponse.data;
				const country = media.origin_country;
				const mediaDetailsEmbed = getMediaDetail(chosenMediaType, country, language, i, media);
				await i.update({
					content: `${creditResponse.data.media_type}'s Detail`,
					embeds: [mediaDetailsEmbed],
					components: [],

				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
			}
			else {


				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const movieCreditsEmbed = await createPeopleCreditListEmbed(currentIndex, listSize, credits);
				const current = credits.slice(currentIndex, currentIndex + listSize);
				const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name ?? credit.title}`, ButtonStyle.Secondary, `${credit.credit_id}`, getEmoji(currentIndex + (index + 1))));


				await i.update({
					content: `Department: ${dept} ${deptEmojis[dept]}`,
					embeds: [movieCreditsEmbed],
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