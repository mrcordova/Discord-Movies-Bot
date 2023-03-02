const getEditReply = async (interaction, reason) => {
	if (reason == 'Done!') {
		return await interaction.editReply({ content: 'Done!', embeds:[], components: [], files: [] });
	}

	return await interaction.editReply({ content: 'Time\'s up!', embeds:[], components: [], files: [] });
};


module.exports = { getEditReply };