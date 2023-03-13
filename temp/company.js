const { SlashCommandBuilder } = require('discord.js');
const { translationsCodeDict } = require('../load-data');


const search = require('../functions/company/search');
const altTitles = require('../functions/company/alt-titles');
const image = require('../functions/company/images');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('company')
		.setDescription('Get company.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('images')
				.setDescription('get company images')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired company.')
						.setRequired(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('alternative-titles')
				.setDescription('get company alternative titles')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired collection.')))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('search')
				.setDescription('search company')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired collection.')
						.setRequired(true))),
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


		const subCmd = interaction.options.getSubcommand();
		switch (subCmd) {
		case 'search':
			await search.execute(interaction);
			break;

		case 'images':
			await image.execute(interaction);
			break;
		case 'alternative-titles':
			await altTitles.execute(interaction);
			break;
		}
	},
};