const { EmbedBuilder, Colors, SlashCommandBuilder, hyperlink, inlineCode } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('provides info about CineBot'),
	async execute(interaction) {
		const embed = new EmbedBuilder({
			color: Colors.DarkOrange,
			title: 'Information',
			description: `CineBot is a Discord bot for getting information about movies, TV shows, networks, companies, collections, and people in the entertainment industry.\nIt is built using Node.js and the Discord.js library (v14.7.1).\nCineBot uses the TMDB API and JustWatch info to provide data. For more information and a list of available commands, use the ${inlineCode('/help') } command.\nCineBot was created by Shazam_I_Am#0680.`,
			fields: [],
			timestamp: new Date(),
		});
		await interaction.reply({
			embeds:[embed],
		});
	},
};