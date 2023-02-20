const { ButtonBuilder } = require('discord.js');


function createButton(label, style, id, emoji) {
	const button = new ButtonBuilder()
		.setCustomId(id)
		.setLabel(label)
		.setStyle(style)
		.setEmoji(emoji);
	return button;
}


module.exports = { createButton };