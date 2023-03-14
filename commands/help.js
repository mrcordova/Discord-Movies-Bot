const { Colors, EmbedBuilder, SlashCommandBuilder, inlineCode } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
// Here are the available commands:

// - /movie <title> - Displays information about a movie with the given title.
// - /tv <title> - Displays information about a person with the given name.
// - /network <name> - Displays information about a TV network with the given name.
// - /company <name> - Displays information about a production company with the given name.
// - /person <name> - Displays information about a person with the given name.

// <> - required, () - optional
// description, usage
const commandsPath = path.join(__dirname);
// get folders and concat together
const commandFiles = fs.readdirSync(commandsPath);

const commandsInfo = [
	{
		name: '/collection',
		value: 'Displays information about a collection with the given title.',
	},
	{
		name: '/company',
		value: 'Displays information about a company with the given title.',
	},
	{
		name: '/help',
		value: 'Displays information about all available commands',
	},
	{
		name: '/movie',
		value: 'Displays information about a movie with the given title.',
	},
	{
		name: '/network',
		value: 'Displays information about a TV network with the given name.',
	},
	{
		name: '/people',
		value: 'Displays information about a person with the given name.',
	},
	{
		name: '/tv-episode',
		value: 'Displays information about a tv episode with the given title.',
	},
	{
		name: '/tv-season',
		value: 'Displays information about a tv season with the given name.',
	},
	{
		name: '/tv',
		value: 'Displays information about a tv with the given name.',
	},
];

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


		const embed = await new EmbedBuilder({
			color: Colors.Green,
			title: 'List of Commands',
            description: `Use ${inlineCode('/help')} followed by a command name to get more additional information on a command. For example: ${inlineCode('/help /tv')}`,
			fields: await Promise.all(commandsInfo.map(async (cmd) => {
				// const filePath = path.join(commandsPath, file);
				// const command = require(filePath);


				return {
					name: inlineCode(cmd.name),
					value: cmd.value,
				};
			},
			)),
			timestamp: new Date(),
			// footer: {
			//     text: tmdbName,
			//     icon_url: tmdbIconUrl,
			// },
		});


		await interaction.reply({
			embeds:[embed],
		});
	},
};