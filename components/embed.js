const { EmbedBuilder } = require('discord.js');


function createEmbed(color = 0x0099FF, title = 'Some title', url = 'https://discord.js.org/', description = 'Some description here') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setURL(url)
		.setDescription(description);

}

module.exports = { createEmbed };