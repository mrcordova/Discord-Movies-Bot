const { SlashCommandBuilder } = require('discord.js');
const { depts, siteArray, translationsCodeDict, availableProviders, countryDict } = require('../load-data');


const credit = require('../functions/tv/tv-episode-credits');
const external = require('../functions/tv/tv-episode-external');
const image = require('../functions/tv/tv-episode-images');
const search = require('../functions/tv/tv-episode-search');
const translation = require('../functions/tv/tv-episode-translations');
const video = require('../functions/tv/tv-episode-videos');


const seasonCredit = require('../functions/tv/tv-season-credits');
const seasonExternal = require('../functions/tv/tv-season-external');
const seasonImage = require('../functions/tv/tv-season-images');
const seasonSearch = require('../functions/tv/tv-season-search');
const seasonTranslation = require('../functions/tv/tv-season-translations');
const seasonVideo = require('../functions/tv/tv-season-videos');



module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-info')
		.setDescription('Get tv info.')
		.addSubcommandGroup(group =>
			group
            .setName('season')
            .setDescription('Get info for tv season')
            .addSubcommand(subcommand =>
					subcommand
						.setName('credits')
						.setDescription('Search for a tv season\'s cast and crew')
						.addStringOption(option =>
							option.setName('title')
								.setDescription('Search for the desired tv .')
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName('season')
								.setDescription('Search for the desired season.')
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
								.setAutocomplete(true))
				)
        )
		.addSubcommandGroup(group =>
			group
				.setName('episode')
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
								.setMaxValue(3000))
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
								.setAutocomplete(true))
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('search')
						.setDescription('Get the TV episode details')
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
								.setMaxValue(3000))
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
								.setMaxValue(3000))
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
								.setAutocomplete(true))
				)
		)
		.addSubcommandGroup(group =>
			group
				.setName('season')
				.setDescription('Get info for tv season')
				.addSubcommand(subcommand =>
					subcommand
						.setName('credits')
						.setDescription('Search for a tv season\'s cast and crew')
						.addStringOption(option =>
							option.setName('title')
								.setDescription('Search for the desired tv .')
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName('season')
								.setDescription('Search for the desired season.')
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
								.setAutocomplete(true))
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('external-link')
						.setDescription('Get the external links for a TV season. We currently support TVDB.')
						.addStringOption(option =>
							option.setName('title')
								.setDescription('Search for the desired tv show.')
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName('season')
								.setDescription('Search for the desired season.')
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
								.setMaxValue(3000))

				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('images')
						.setDescription('Get the images that belong to a TV show season.')
						.addStringOption(option =>
							option.setName('title')
								.setDescription('Search for the desired tv show.')
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName('season')
								.setDescription('Search for the desired season.')
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
								.setAutocomplete(true))

				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('search')
						.setDescription('Search for tv season search based on a text query.')
						.addStringOption(option =>
							option.setName('title')
								.setDescription('Search for the desired TV Show.')
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName('season')
								.setDescription('Search for the desired season.')
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
								.setMaxValue(3000))
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('translations')
						.setDescription('Get a list of translations that have been created for a tv season.')
						.addStringOption(option =>
							option.setName('title')
								.setDescription('Search for the desired tv show.')
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName('season')
								.setDescription('Search for the desired season.')
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
								.setMaxValue(3000))
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('videos')
						.setDescription('Get the videos that have been added to a TV show season.')
						.addStringOption(option =>
							option.setName('title')
								.setDescription('Search for the desired tv show.')
								.setRequired(true))
						.addIntegerOption(option =>
							option.setName('season')
								.setDescription('Search for the desired season.')
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
								.setAutocomplete(true))

				)

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
		const subCmdGrp = interaction.options.getSubcommandGroup();
		switch (subCmd) {
		case 'credits':
			subCmdGrp == 'episode' ? await credit.execute(interaction) : await seasonCredit.execute(interaction);
			break;
		case 'external-link':
			subCmdGrp == 'episode' ? await external.execute(interaction) : await seasonExternal.execute(interaction);
			break;
		case 'images':
			subCmdGrp == 'episode' ? await image.execute(interaction) : await seasonImage.execute(interaction);
			break;
		case 'search':
			subCmdGrp == 'episode' ? await search.execute(interaction) : await seasonSearch.execute(interaction);
			break;
		case 'translations':
			subCmdGrp == 'episode' ? await translation.execute(interaction) : await seasonTranslation.execute(interaction);
			break;
		case 'videos':
			subCmdGrp == 'episode' ? await video.execute(interaction) : await seasonVideo.execute(interaction);
			break;
		}
	},
};