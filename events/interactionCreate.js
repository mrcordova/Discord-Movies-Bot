const { Events } = require('discord.js');
// const { autocomplete } = require('../commands/now-playing-movies');

module.exports = {
	name: Events.InteractionCreate,
	async autocomplete(interaction) {
		if (!interaction.isAutocomplete()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		try {
			await command.autocomplete(interaction);
		}
		catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}

	},
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);


		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}


		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}


	},
};