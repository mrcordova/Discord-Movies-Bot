const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
// eslint-disable-next-line no-unused-vars
const { createEmbed, createMovieDetailEmbed, createNoResultEmbed, createCompanyDetailEmbed, createCollectionDetailEmbed, createCollectionListEmbed, createNetworkDetailEmbed, createCompanyAltListEmbed } = require('../../components/embed.js');
const { file, availableNetworks } = require('../../load-data.js');
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
	// 	.setName('network-alt-titles')
	// 	.setDescription('Get the alternative names of a network.')
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


		const response = await axios.get(`${api_url}${network_details}/${network_id}/alternative_names?api_key=${MOVIE_API_KEY}`);
		const networkInfo = response.data;

		if (!networkInfo) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Network Found', 'Please make a new command')], files: [file] });
			return;
		}

		const listSize = 5;
		let currentIndex = 0;
		const networkList = networkInfo.results;

		const networkDetailEmbed = await createCompanyAltListEmbed(currentIndex, listSize, networkList);
		const filter = ({ user }) => interaction.user.id == user.id;


		// if no film is found for certain year.
		const message = await interaction.reply({
			content: 'List of Alternative titles matching your query.',
			ephemeral: false,
			embeds: [networkDetailEmbed],
			components: [
				new ActionRowBuilder({ components:  [
					// back button if it isn't the start
					...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
					// forward button if it isn't the end
					...(currentIndex + listSize < networkList.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
				] }),
			],
		});
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });

		buttonCollector.on(MyEvents.Collect, async i => {
			if (i.customId == 'empty') return;


			i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const networkEmbed = await createCompanyAltListEmbed(currentIndex, listSize, networkList);


			await i.update({
				content: i.message.content,
				embeds: [networkEmbed],
				components: [
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < networkList.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
				],
			});

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