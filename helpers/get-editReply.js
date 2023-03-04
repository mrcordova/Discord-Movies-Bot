const getEditReply = async (interaction, reason) => {
	if (reason == 'Done!') {
		return await interaction.editReply({ content: 'Done!', components: [] });
	}
	else if (reason == 'messageDelete') {
		return;
	}

	return await interaction.editReply({ content: 'Time\'s up!', components: [] });
};
const getEditReplyWithoutEmebed = async (interaction, reason) => {
	if (reason == 'Done!') {
		return await interaction.editReply({ content: 'Done!', embeds:[], components: [], files: [] });
	}
	else if (reason == 'messageDelete') {
		return;
	}

	return await interaction.editReply({ content: 'Time\'s up!', embeds:[], components: [], files: [] });
};


module.exports = { getEditReply, getEditReplyWithoutEmebed };