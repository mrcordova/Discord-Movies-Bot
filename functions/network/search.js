const { Colors } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { createNoResultEmbed, createNetworkDetailEmbed } = require('../../components/embed.js');
const { searchForNetwork } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');


module.exports = {

	async execute(interaction) {

		const network_id = interaction.options.getInteger('title');

		const response = await searchForNetwork(network_id);
		const networkInfo = response.data;

		if (!networkInfo) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Network Found', 'Please make a new command')], files: [file] });
			return;
		}

		const networkDetailEmbed = createNetworkDetailEmbed(networkInfo, interaction.user);
		const message = await interaction.reply({ ephemeral: false, embeds: [networkDetailEmbed], components: [] });

	},
};