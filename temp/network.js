const { SlashCommandBuilder, ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createButton } = require('../components/button.js');
const { searchForCompany, searchForCollection } = require('../helpers/search-for.js');
const { file, translationsCodeDict, availableNetworks, images } = require('../load-data.js');
const { createNoResultEmbed, createEmbed, createImageEmbed } = require('../components/embed');
const { MyEvents } = require('../events/DMB-Events');
const { createSelectMenu } = require('../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForCompanySelectMenu, getOptionsForCollectionSelectMenu } = require('../helpers/get-options');


const search = require('../functions/network/network-search');
const altTitles = require('../functions/network/network-alt-titles');
const image = require('../functions/network/network-images');

// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

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
						.setName('name')
						.setDescription('Search for the desired network.')
						.setRequired(true)
                        .setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('alternative-titles')
				.setDescription('get network alternative titles')
				.addIntegerOption(option =>
					option
						.setName('name')
						.setDescription('Search for the desired network.')
                        .setRequired(true)
                        .setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('search')
				.setDescription('search company')
				.addIntegerOption(option =>
					option
						.setName('name')
						.setDescription('Search for the desired network.')
						.setRequired(true)
                        .setAutocomplete(true))),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'name') {
			choices = availableNetworks;
		}


		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name}`, value: choice.id })),
		);
	},
	async execute(interaction) {
		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language');

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