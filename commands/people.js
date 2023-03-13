const { SlashCommandBuilder } = require('discord.js');
const { depts, siteArray, translationsCodeDict, countryDict } = require('../load-data');


const search = require('../functions/people/search');
const credits = require('../functions/people/credits');
const image = require('../functions/people/images');
const external = require('../functions/people/external');
const popular = require('../functions/people/popular');
const translation = require('../functions/people/translations');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('people')
		.setDescription('Get person.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('images')
				.setDescription('Get the images for a person.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired person.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('credits')
				.setDescription('Search for a person\'s credits')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired person.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('department')
						.setDescription('Choose desired dept.')
						.setChoices(
							...depts.reduce((arry, dept) => {
								arry.push({ name: dept, value: dept });
								return arry;
							}, [])),
				)
				.addStringOption(option =>
					option.setName('media-type')
						.setDescription('Select the type of media')
						.setChoices(
							{ name: 'Tv', value: 'tv' },
							{ name: 'Movie', value: 'movie' },
						))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('external-link')
				.setDescription('Get the external links for a person.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired person.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('site')
						.setDescription('Select the type of site')
						.setChoices(
							...siteArray.concat([{ name: 'Tiktok', value: 'tiktok' }, { name: 'YouTube', value: 'youtube' }]),
						))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('popular')
				.setDescription('Get the list of popular people on TMDB. This list updates daily.')
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired language.')
						.setMinLength(2)
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('search')
				.setDescription('search person')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired person.')
						.setRequired(true))
				.addStringOption(option =>
					option
						.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true)))
		.addSubcommand((subcommand) =>
			subcommand
				.setName('translations')
				.setDescription('Get a list of translations that have been created for a person.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired person.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
		}
		if (focusedOption.name === 'region') {
			choices = countryDict;
		}

		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
		);
	},
	async execute(interaction) {

		const subCmd = interaction.options.getSubcommand();
		switch (subCmd) {
		case 'credits':
			await credits.execute(interaction);
			break;
		case 'external-link':
			await external.execute(interaction);
			break;
		case 'images':
			await image.execute(interaction);
			break;
		case 'popular':
			await popular.execute(interaction);
			break;
		case 'search':
			await search.execute(interaction);
			break;
		case 'translations':
			await translation.execute(interaction);
			break;
		}
	},
};