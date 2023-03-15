const { Colors, EmbedBuilder, SlashCommandBuilder, inlineCode, bold, underscore } = require('discord.js');
// const fs = require('node:fs');
// const path = require('node:path');
// Here are the available commands:

// - /movie  - Displays information about a movie with the given title.
// - /tv  - Displays information about a person with the given name.
// - /network <name> - Displays information about a TV network with the given name.
// - /company <name> - Displays information about a production company with the given name.
// - /person <name> - Displays information about a person with the given name.

// <> - required, () - optional
// description, usage
// const commandsPath = path.join(__dirname);
// get folders and concat together
// const commandFiles = fs.readdirSync(commandsPath);

const commandsInfo = [
	{
		name: '/collection',
		value: 'Displays information about a collection with the given title.',
		subcmds: {
			'images': ['<title>', '(language)'],
			'translation': ['<title>', '(language)'],
			'search': ['<title>', '(language)'],
		},
	},
	{
		name: '/company',
		value: 'Displays information about a company with the given title.',
		subcmds: {
			'images': ['<title>'],
			'translation': ['<title>'],
			'search': ['<title>'],
		},
	},
	{
		name: '/help (command-name)',
		value: 'Displays information about all available commands',
		subcmds: {

		},
	},
	{
		name: '/movie',
		value: 'Displays information about a movie with the given title.',
		subcmds: {
			'alt-titles': ['<title>', '(country)'],
			'availability': ['<title>', '(language)', '(region)', '(platform)', '(content-type)', '(release-type)'],
			'credits':  ['<title>', '<department>', '(language)'],
			'external-link': ['<title>', '(langauge)', '(site)'],
			'images': ['<title>', '(language)', '(region)', '(release-year)', '(image-language)'],
			'lists': ['<title>', '(language)'],
			'now-playing': ['(language)', '(region)'],
			'popular': ['(language)', '(region)'],
			'recommendations': ['<title>', '(language)', '(region)', '(release-year)'],
			'release-date': ['<title>', '<release-type>', '(language)', '(region)', '(release-year)'],
			'reviews': ['<title>', '(language)', '(region)', '(release-year)'],
			'search':  ['<title>', '(language)', '(region)', '(release-year)'],
			'similar': ['<title>', '(language)', '(region)', '(release-year)'],
			'top-rated':  ['(language)', '(region)'],
			'translations': ['<title>', '(language)', '(region)', '(release-year)'],
			'upcoming': ['(language)', '(region)'],
			'videos':  ['<title>', '(video-type)', '(site)', '(language)', '(region)', '(release-year)', '(video-language)'],
		},
	},
	{
		name: '/network',
		value: 'Displays information about a TV network with the given name.',
		subcmds: {
			'images': ['<title>'],
			'alt-titles': ['<title>'],
			'search': ['<title>'],
		},
	},
	{
		name: '/people',
		value: 'Displays information about a person with the given name.',
		subcmds: {
			'images': ['<title>', '(language)', '(region)'],
			'credits': ['<title>', '(department)', '(media-type)', '(language)'],
			'external-link': ['<title>', '(language)', '(site)', '(region)'],
			'popular': ['(language)'],
			'search': ['<title>', '(language)', '(region)'],
			'translations': ['<title>', '(language)', '(region)'],
		},
	},
	{
		name: '/tv-episode',
		value: 'Displays information about a tv episode with the given title.',
		subcmds: {
			'credits': ['<title>', '<season>', '<episode>', '<department>', '(language)'],
			'external-link': ['<title>', '<season>', '<episode>', '(language)', '(site)', '(region)', '(release-year)'],
			'images': ['<title>', '<season>', '<episode>', '(language)', '(region)', '(release-year)', '(image_language)'],
			'search': ['<title>', '<season>', '<episode>', '(language)', '(region)', '(release-year)'],
			'translations': ['<title>', '<season>', '<episode>', '(language)', '(region)', '(release-year)'],
			'videos': ['<title>', '<season>', '<episode>', '(video-type)', '(site)', '(language)', '(region)', '(release-year)', '(video_language)'],
		},
	},
	{
		name: '/tv-season',
		value: 'Displays information about a tv season with the given name.',
		subcmds: {
			'credits': ['<title>', '<season>', '<department>', '(language)'],
			'external-link': ['<title>', '<season>', '(language)', '(site)', '(region)', '(release-year)'],
			'images': ['<title>', '<season>', '(language)', '(region)', '(release-year)', '(image_language)'],
			'search': ['<title>', '<season>', '(language)', '(region)', '(release-year)'],
			'translations': ['<title>', '<season>', '(language)', '(region)', '(release-year)'],
			'videos': ['<title>', '<season>', '(video-type)', '(site)', '(language)', '(region)', '(release-year)', '(video_language)'],
		},
	},
	{
		name: '/tv',
		value: 'Displays information about a tv with the given name.',
		subcmds: {
			'airing-today': ['(language)', '(region)', '(language)'],
			'alt-titles': ['<title>', '(country)'],
			'availability': ['<title>', '(language)', '(region)', '(platform)', '(content-type)', '(release-type)'],
			'credits': ['<title>', '<department>', '(language)'],
			'external-link': ['<title>', '(language)', '(site)', '(region)', '(release-year)'],
			'images': ['<title>', '(language)', '(region)', '(release-year)', '(image_language)'],
			'lists': ['<title>', '(lanuage)'],
			'on-the-air': ['(language)', '(region)'],
			'popular': ['(language)', '(region)'],
			'ratings': ['<title>', '(language)', '(region)', '(release-year)'],
			'recommendations': ['<title>', '(language)', '(region)', '(release-year)'],
			'reviews': ['<title>', '(language)', '(region)', '(release-year)'],
			'search': ['<title>', '(language)', '(region)', '(release-year)'],
			'similar': ['<title>', '(language)', '(region)', '(release-year)'],
			'top-rated': ['(language)', '(region)'],
			'translations': ['<title>', '(language)', '(region)', '(release-year)'],
			'videos': ['<title>', '(video-type)', '(site)', '(language)', '(region)', '(release-year)', '(video_language)'],
		},
	},
];

const optionDescDict = {
	'<title>': 'used to specify the title of the collection for which the images are desired. It is a required option',
	'(country)': 'used to specify the name of a specific country for which to search.',
	'<department>': 'used to specify the desired department for which to retrieve credits',
	'<release-type>': 'used to specify the type of release for which to search.',
	'(video-type)': 'used to specify the type of video release for which to search. ',
	'(site)':'used to specify the type of site for which to search',
	'(language)': 'to specify the desired translation of the collection.',
	'(region)': 'used to specify the desired region for which to search.',
	'(release-year)': 'used to specify the desired release year for which to search.',
	'(video_language)': 'used to specify the desired language for a video search.',
	'(image_language)': 'used to specify the desired language for the image search.',
	'(platform)': ' used to specify the desired platform for a media search.',
	'<season>': 'used to specify the desired season number to search for.',
	'<episode>': 'used to specify the desired episode number to search for.',
	'(media-type)': ' used to specify the type of media (i.e., TV show or movie) to search for.',
	'(content-type)': 'a string option used to specify the desired content availability type for a media search.',
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get info about avaviale commands')
		.addStringOption(option =>
			option.setName('command-name')
				.setDescription('Choose desired command.')
				.setChoices(
					...commandsInfo.map(({ name }) => ({ name, value: name })),
				)),
	async execute(interaction) {

		const cmdName = interaction.options.getString('command-name');
		let embed;

		if (cmdName) {
			const command = commandsInfo.find(({ name }) => name == cmdName);

			embed = new EmbedBuilder({
				color: Colors.Green,
				title: `${command.name}`,
				description: `${command.value}`,
				fields: await Promise.all(Object.entries(command.subcmds).map(async (key) => {
					const [cmd, options] = key;
					// console.log(options);
					return {
						name: `${bold(cmd) }`,
						value: options.map(option => `${underscore(option)}: ${optionDescDict[option]}\n`).join(''),
					};
				}
				)),
				timestamp: new Date(),
				footer: {
					text: '"<>" is required, "()" is optional',
					// icon_url: tmdbIconUrl,
				},
			});
		}
		else {
			embed = await new EmbedBuilder({
				color: Colors.Green,
				title: 'List of Commands',
				description: `Use ${inlineCode('/help')} followed by a command name to get more additional information on a command. For example: ${inlineCode('/help /tv')}\n${'-'.repeat(40)}`,
				fields: await Promise.all(commandsInfo.map(async (cmd) => {
					// const filePath = path.join(commandsPath, file);
					// const command = require(filePath);


					return {
						name: `${inlineCode(cmd.name)}`,
						value: `${cmd.value}`,
					};
				},
				)),
				timestamp: new Date(),
				footer: {
					text: '"<>" is required, "()" is optional',
					// icon_url: tmdbIconUrl,
				},
			});


		}


		await interaction.reply({
			embeds:[embed],
		});
	},
};