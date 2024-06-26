const { SlashCommandBuilder } = require('discord.js');


const { availableNetworks } = require('../load-data.js');


const search = require('../functions/network/search');
const altTitles = require('../functions/network/alt-titles');
const image = require('../functions/network/images');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('network')
		.setDescription('Get network info.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('images')
				.setDescription('get network images')
				.addIntegerOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired network.')
						.setRequired(true)
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('alt-titles')
				.setDescription('get network alternative titles')
				.addIntegerOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired network.')
						.setRequired(true)
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('search')
				.setDescription('search network')
				.addIntegerOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired network.')
						.setRequired(true)
						.setAutocomplete(true))),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'title') {
			choices = availableNetworks;
		}


		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name}`, value: choice.id })),
		);
	},
	async execute(interaction) {

		const subCmd = interaction.options.getSubcommand();
		switch (subCmd) {
		case 'search':
			await search.execute(interaction);
			break;

		case 'images':
			await image.execute(interaction);
			break;
		case 'alt-titles':
			await altTitles.execute(interaction);
			break;
		}
	},
};