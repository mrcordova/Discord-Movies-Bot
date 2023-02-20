const { StringSelectMenuBuilder } = require('discord.js');


function createSelectMenu(customId = 'select-menu', placeHolderText = 'choose an option', minVal = 1, options = []) {
	const menu = new StringSelectMenuBuilder()
		.setCustomId(customId)
		.setPlaceholder(placeHolderText)
		.setMinValues(minVal)
		.addOptions(options);


	return menu;
}

module.exports = { createSelectMenu };