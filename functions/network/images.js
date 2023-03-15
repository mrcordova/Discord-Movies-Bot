const { ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createNoResultEmbed, createImageEmbed } = require('../../components/embed.js');
const { file } = require('../../load-data.js');
const axios = require('axios');
const { MyEvents } = require('../../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');

const { createButton } = require('../../components/button');

const network_details = '/network';

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('network-images')
	// 	.setDescription('Get the TV network logos')
	// 	.addIntegerOption(option =>
	// 		option.setName('name')
	// 			.setDescription('Search for the desired network.')
	// 			.setRequired(true)
	// 			.setAutocomplete(true)),
	// async autocomplete(interaction) {
	// 	// handle the autocompletion response (more on how to do that below)
	// 	const focusedOption = interaction.options.getFocused(true);

	// 	let choices;

	// 	if (focusedOption.name === 'name') {
	// 		choices = availableNetworks;
	// 	}


	// 	const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
	// 	await interaction.respond(
	// 		filtered.map(choice => ({ name: `${choice.name}`, value: choice.id })),
	// 	);
	// },
	async execute(interaction) {

		const network_id = interaction.options.getInteger('title');


		const response = await axios.get(`${api_url}${network_details}/${network_id}/images?api_key=${MOVIE_API_KEY}`);
		const networkInfo = response.data;

		if (!networkInfo) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Network Found', 'Please make a new command')], files: [file] });
			return;
		}

		const listSize = 1;
		let currentIndex = 0;
		const networkImages = networkInfo.logos;

		const current = networkImages.slice(currentIndex, currentIndex + listSize);
		const title = `Showing Network Image ${currentIndex + 1} out of ${networkImages.length}`;
		const networkDetailEmbed = createImageEmbed(title, current, interaction.user, 'No Network Images Found');
		const filter = ({ user }) => interaction.user.id == user.id;


		// if no film is found for certain year.
		const message = await interaction.reply({
			content: 'List of Images matching your query.',
			ephemeral: false,
			embeds: [networkDetailEmbed],
			components: [
				new ActionRowBuilder({ components:  [
					// back button if it isn't the start
					...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
					// forward button if it isn't the end
					...(currentIndex + listSize < networkImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
				] }),
			],
		});
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const newCurrent = networkImages.slice(currentIndex, currentIndex + listSize);


			const newTitle = `Showing Network Image ${currentIndex + 1} out of ${networkImages.length}`;
			const movieCreditsEmbed = createImageEmbed(newTitle, newCurrent, m.user, 'No Network Images Found');


			// Respond to interaction by updating message with new embed
			await m.update({
				content: m.message.content,
				embeds: [movieCreditsEmbed],
				components: [
					new ActionRowBuilder({ components: [
					// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < networkImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }) ],
			});
			// selectMenucollector.resetTimer([{ idle: 30000 }]);
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