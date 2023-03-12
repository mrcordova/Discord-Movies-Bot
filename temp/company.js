const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { searchForCompany, searchForCollection } = require('../helpers/search-for.js');
const { file, translationsCodeDict } = require('../load-data.js');
const { createNoResultEmbed, createEmbed, createImageEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const { createSelectMenu } = require('../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForCompanySelectMenu, getOptionsForCollectionSelectMenu } = require('../helpers/get-options');


const companySearch = require('../functions/company/company-search');
const companyAltTitles = require('../functions/company/company-alt-titles');
const companyImage = require('../functions/company/company-images');

// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

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
		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language');

		const subCmd = interaction.options.getSubcommand();
		switch (subCmd) {
		case 'search':
			await companySearch.execute(interaction);
			break;

		case 'images':
			await companyImage.execute(interaction);
			break;
		case 'alternative-titles':
			await companyAltTitles.execute(interaction);
			break;
		}
	},
};