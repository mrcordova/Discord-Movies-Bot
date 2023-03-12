const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createButton } = require('../../components/button.js');
const { searchForCompany, searchForCollection } = require('../../helpers/search-for.js');
const { file, translationsCodeDict } = require('../../load-data.js');
const { createNoResultEmbed, createEmbed, createImageEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { createSelectMenu } = require('../../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForCompanySelectMenu, getOptionsForCollectionSelectMenu } = require('../../helpers/get-options');


const collectionSearch = require('./collection-search');
const collectionTranslation = require('./collection-translations');
const collectionImage = require('./collection-images');

// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

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
		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language');

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