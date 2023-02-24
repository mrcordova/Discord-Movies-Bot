const { SlashCommandBuilder } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('stevie-fact')
		.setDescription('Replies with the truth'),
	async execute(interaction) {
		interaction.reply({
			content:
        'apparently hitler didnt even kill the jews because he didnt like them, he owed one money and you know how they are with their money so he killed them all',
		});
	},
};