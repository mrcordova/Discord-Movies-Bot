const { SlashCommandBuilder } = require('discord.js');

const collectionSearch = require('../functions/collection/search');
const collectionTranslation = require('../functions/collection/translations');
const collectionImage = require('../functions/collection/images');
const { translationsCodeDict } = require('../load-data');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('collection')
		.setDescription('Get collection.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('images')
				.setDescription('get collection images')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired collection.')
						.setRequired(true))
				.addStringOption(option =>
					option
						.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('translation')
				.setDescription('get collection translation')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired collection.')
						.setRequired(true))
				.addStringOption(option =>
					option
						.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('search')
				.setDescription('search collection')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired collection.')
						.setRequired(true))
				.addStringOption(option =>
					option
						.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))),


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
			await collectionSearch.execute(interaction);
			break;

		case 'images':
			await collectionImage.execute(interaction);
			break;
		case 'translation':
			await collectionTranslation.execute(interaction);
			break;
		}
	},
};