const getEditReply = async (interaction, reason) => {
	if (reason == 'Done!') {
		return await interaction.editReply({ content: 'Done!', components: [] });
	}

	return await interaction.editReply({ content: 'Time\'s up!', components: [] });
};


module.exports = { getEditReply };