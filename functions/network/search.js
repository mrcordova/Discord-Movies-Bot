const { Colors } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { createNoResultEmbed } = require('../../components/embed.js');
const { searchForNetwork } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');


module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('network-search')
	// 	.setDescription('Get the details of a network.')
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

		const response = await searchForNetwork(network_id);
		const networkInfo = response.data;

		if (!networkInfo) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Network Found', 'Please make a new command')], files: [file] });
			return;
		}


	},
};