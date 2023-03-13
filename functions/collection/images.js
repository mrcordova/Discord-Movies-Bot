const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createButton } = require('../../components/button.js');
const { searchForCollection } = require('../../helpers/search-for.js');
const { file, translationsCodeDict } = require('../../load-data.js');
const { createNoResultEmbed, createEmbed, createImageEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { createSelectMenu } = require('../../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForCollectionSelectMenu } = require('../../helpers/get-options');


// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('collection-images')
	// 	.setDescription('Get the images for a collection by id.')
	// 	.addStringOption(option =>
	// 		option.setName('title')
	// 			.setDescription('Search for the desired collection.')
	// 			.setRequired(true))
	// 	.addStringOption(option =>
	// 		option.setName('language')
	// 			.setDescription('Search for the desired translation.')
	// 			.setAutocomplete(true)),
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
		const language = interaction.options.getString('language');


		const response = await searchForCollection(query, language);
		const collectionNames = response.data.results;

		if (!collectionNames.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Collections Found', 'Please make a new command with a different year')], files: [file] });
			return;
		}
		const options = getOptionsForCollectionSelectMenu(collectionNames);

		const selectMenu = createSelectMenu('List of Collections', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Collection will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;


		const message = await interaction.reply({ content: 'List of Collections matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let collectionImages;

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;
			const collectionResponse = await axios.get(`${api_url}/collection/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=images`);
			const collection = collectionResponse.data;
			collectionImages = collection.images.backdrops.concat(collection.images.posters);

			const current = collectionImages.slice(currentIndex, currentIndex + listSize);
			const title = `${collection.name.slice(0, 80)} Showing Collection Image ${currentIndex + current.length} out of ${collectionImages.length}`;


			const companyImageEmbed = createImageEmbed(title, current, i.user, 'No Company Images Found');
			const newSelectMenu = createSelectMenu('List of Collections', collection.name.slice(0, 80), 1, options);

			await i.update({
				content: 'Selected Collection Images: ',
				embeds: [companyImageEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < collectionImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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
			getEditReply(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);

		});

		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = collectionImages.slice(currentIndex, currentIndex + listSize);


			const title = `${m.message.components[0].components[0].placeholder.slice(0, 60)} Showing Collection Image ${currentIndex + current.length} out of ${collectionImages.length}`;
			const movieCreditsEmbed = createImageEmbed(title, current, m.user, 'No Collection Images Found');


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
						...(currentIndex + listSize < collectionImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

	},
};