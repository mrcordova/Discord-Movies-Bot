const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createNoResultEmbed, createTranslateListEmbed, createTranslateDetailEmbed, createPeopleTranslateDetailEmbed } = require('../components/embed.js');
const { searchForMovie, searchForPeople } = require('../helpers/search-for.js');
const { translationsCodeDict, countryDict, file } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { createButton } = require('../components/button');
const { getEmoji } = require('../helpers/get-emoji');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForSelectMenu, getOptionsForPeopleSelectMenu } = require('../helpers/get-options');
const person_details = '/person';


// https://api.themoviedb.org/3/movie/{movie_id}/recommendations?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('people-translations')
		.setDescription('Get a list of translations that have been created for a person.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired person.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search for the desired translation.')
				.setAutocomplete(true))
		.addStringOption(option =>
			option.setName('region')
				.setDescription('Search for the desired region.')
				.setAutocomplete(true)),
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
		// const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		// const dept = interaction.options.getString('department') ?? '';

		const response = await searchForPeople(query, language, region);
		const peopleNames = response.data.results;

		if (!peopleNames.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No People Found for that query', 'Please make a new command with a different options')], files:[file] });
			return;
		}
		const options = getOptionsForPeopleSelectMenu(peopleNames);

		const selectMenu = createSelectMenu('List of People', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Person Translations will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of People matching your query. :smiley:', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let translations;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;

			const personResponse = await axios.get(`${api_url}${person_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=translations`);
			const person = personResponse.data;

			translations = person.translations.translations;

			const movieTranslationsEmbed = await createTranslateListEmbed(currentIndex, listSize, translations);
			const newSelectMenu = createSelectMenu('List of Movies', person.name.slice(0, 81), 1, options);

			// console.log(recommendations);

			const current = translations.slice(currentIndex, currentIndex + listSize);
			// console.log(current);
			const moreDetailBtns = current.map((translation, index) => createButton(`${translation.name}-${translation.iso_3166_1}`, ButtonStyle.Secondary, `${translation.iso_3166_1}-${translation.iso_639_1}`, getEmoji(currentIndex + (index + 1))));
			await i.update({
				content: `Translations for ${person.name.slice(0, 81)}`,
				embeds: [movieTranslationsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < translations.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Person found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
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
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});
		buttonCollector.on(MyEvents.Collect, async i => {
			if (i.customId == 'empty') return;
			// console.log(i.customId);
			if (i.customId != backId && i.customId != forwardId) {

				const selectedTranslation = translations.find((translation) => i.customId == `${translation.iso_3166_1}-${translation.iso_639_1}`);

                // const selectedOption = i.message.components[0].components[0].data.options.find(option => option.value === selected);
                // const selectedName = selectedOption.label;
                selectedTranslation.person_name = i.message.components[0].components[0].data.placeholder;
                // console.log(i.message.components[0].components[0].data)
				const translationDetailEmbed = createPeopleTranslateDetailEmbed(selectedTranslation, i.user);
				const content = i.message.content.split('Translation').join('Translation Detail');

				await i.update({
					content: `${content}`,
					embeds: [translationDetailEmbed],
					components: [],
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');

			}
			else {


				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const personTranslationsEmbed = await createTranslateListEmbed(currentIndex, listSize, translations);
				const current = translations.slice(currentIndex, currentIndex + listSize);
				const moreDetailBtns = current.map((translation, index) => createButton(`${translation.name}-${translation.iso_3166_1}`, ButtonStyle.Secondary, `${translation.iso_3166_1}-${translation.iso_639_1}`, getEmoji(currentIndex + (index + 1))));


				await i.update({
					content: i.message.content,
					embeds: [personTranslationsEmbed],
					components: [
						i.message.components[0],
						new ActionRowBuilder({ components:  [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < translations.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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