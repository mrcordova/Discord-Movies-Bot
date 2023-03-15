const { SlashCommandBuilder } = require('discord.js');
const { depts, siteArray, translationsCodeDict, availableProviders, countryDict } = require('../load-data');


const credit = require('../functions/tv/episode-credits');
const external = require('../functions/tv/episode-external');
const image = require('../functions/tv/episode-images');
const search = require('../functions/tv/episode-search');
const translation = require('../functions/tv/episode-translations');
const video = require('../functions/tv/episode-videos');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-episode')
		.setDescription('Get info for tv episode')
		.addSubcommand(subcommand =>
			subcommand
				.setName('credits')
				.setDescription('Search for a tv episode\'s cast and crew')
				.addStringOption(option =>
					option
						.setName('title')
						.setDescription('Search for the desired tv episode.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('season')
						.setDescription('Search for the desired season.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('episode')
						.setDescription('Search for the desired episode.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('department')
						.setDescription('Choose desired dept.')
						.setChoices(
							...depts.reduce((arry, dept) => {
								arry.push({ name: dept, value: dept });
								return arry;
							}, []))
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('external-link')
				.setDescription('Get the external links for a TV Episode. We currently support TVDB.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired tv show season.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('season')
						.setDescription('Search for the desired season.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('episode')
						.setDescription('Search for the desired episode.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('site')
						.setDescription('Select the type of site')
						.setChoices(
							...siteArray.concat({ name: 'TVDB', value: 'tvdb' }),
						))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('images')
				.setDescription('Get the images that belong to a TV show episode.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired tv show episode.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('season')
						.setDescription('Search for the desired season.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('episode')
						.setDescription('Search for the desired episode.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000))
				.addStringOption(option =>
					option.setName('image_language')
						.setDescription('Search for the desired image language.')
						.setAutocomplete(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('search')
				.setDescription('Search for TV episode details')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired episode of TV Show.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('season')
						.setDescription('Search for the desired season.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('episode')
						.setDescription('Search for the desired episode.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('translations')
				.setDescription('Get a list of translations that have been created for a tv episode.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired tv show.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('season')
						.setDescription('Search for the desired season.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('episode')
						.setDescription('Search for the desired episode.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('videos')
				.setDescription('Get the videos that have been added to a TV episode.')
				.addStringOption(option =>
					option.setName('title')
						.setDescription('Search for the desired tv show.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('season')
						.setDescription('Search for the desired season.')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('episode')
						.setDescription('Search for the desired episode.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('video-type')
						.setDescription('Select the type of release')
						.setChoices(
							{
								name: 'Trailer',
								value: 'Trailer',
							},
							{
								name: 'Behind the Scenes',
								value: 'Behind the Scenes',
							},
							{
								name: 'Bloopers',
								value: 'Bloopers',
							},
							{
								name: 'Clip',
								value: 'Clip',
							},
							{
								name: 'Teaser',
								value: 'Teaser',
							},
							{
								name: 'Featurette',
								value: 'Featurette',
							},
						))
				.addStringOption(option =>
					option.setName('site')
						.setDescription('Select the type of site')
						.setChoices(
							{
								name: 'Youtube',
								value: 'https://www.youtube.com/watch?v=',
							},
							{
								name: 'Vimeo',
								value: 'https://vimeo.com/',
							},
						))
				.addStringOption(option =>
					option.setName('language')
						.setDescription('Search for the desired translation.')
						.setMinLength(2)
						.setAutocomplete(true))
				.addStringOption(option =>
					option.setName('region')
						.setDescription('Search for the desired region.')
						.setAutocomplete(true))
				.addIntegerOption(option =>
					option.setName('release-year')
						.setDescription('Search for the desired year.')
						.setMinValue(1800)
						.setMaxValue(3000))
				.addStringOption(option =>
					option.setName('video_language')
						.setDescription('Search for the desired video language.')
						.setAutocomplete(true)),
		),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);
		let choices;


		if (focusedOption.name === 'language' || focusedOption.name === 'image-language' || focusedOption.name === 'video-language') {
			choices = translationsCodeDict;
		}
		if (focusedOption.name === 'platform') {
			choices = availableProviders.map(({ provider_name, provider_id }) => ({ name : provider_name, value : provider_id }));
		}
		if (focusedOption.name === 'region' || focusedOption.name === 'country') {
			choices = countryDict;
		}


		try {
			const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);

			await interaction.respond(
				filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
			);
		}
		catch {
			const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
			// console.log(filtered);
			await interaction.respond(
				filtered.map(choice => ({ name: `${choice.name}`, value: choice.value })),
			);

		}
	},
	async execute(interaction) {

		const subCmd = interaction.options.getSubcommand();
		switch (subCmd) {
		case 'credits':
			await credit.execute(interaction);
			break;
		case 'external-link':
			external.execute(interaction);
			break;
		case 'images':
			await image.execute(interaction);
			break;
		case 'search':
			await search.execute(interaction);
			break;
		case 'translations':
			await translation.execute(interaction);
			break;
		case 'videos':
			await video.execute(interaction);
			break;
		}
	},
};