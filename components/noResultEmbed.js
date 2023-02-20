const { EmbedBuilder } = require('discord.js');

function noResultEmbed(color = 'ff0000', title = 'No Movies Found', description = 'Please enter new options.') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(description);
}

module.exports = { noResultEmbed };