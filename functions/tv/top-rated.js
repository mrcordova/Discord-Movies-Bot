const { ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createButton } = require('../../components/button.js');
const { file } = require('../../load-data.js');
const { createTvListEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const tv_top_rated = '/tv/top_rated';


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');


module.exports = {

	async execute(interaction) {
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';

		const response = await axios.get(`${api_url}${tv_top_rated}?api_key=${MOVIE_API_KEY}&language=${language}&page=${1}&region=${region}`);
		const tvTopRated = response.data.results;
		const listSize = 5;
		let currentIndex = 0;

		const canFitOnOnePage = tvTopRated.length <= listSize;
		const embedMessage = await interaction.reply({
			content: 'Top Rated TV Shows',
			embeds: [await createTvListEmbed(currentIndex, listSize, tvTopRated)],
			components: canFitOnOnePage ? [] : [new ActionRowBuilder({ components: [forwardButton] })],
			files: [file],
		});

		// Exit if there is only one page of guilds (no need for all of this)
		if (canFitOnOnePage) return;

		// Collect button interactions (when a user clicks a button),
		// but only when the button as clicked by the original message author
		const filter = ({ user }) => interaction.user.id == user.id;
		const buttonCollector = embedMessage.createMessageComponentCollector({
			filter: filter,
			componentType: ComponentType.Button,
			customId:'list',
			idle: 30000,
		});
		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			// Respond to interaction by updating message with new embed
			await m.update({
				content: 'Top Rated TV Shows',
				embeds: [await createTvListEmbed(currentIndex, listSize, tvTopRated)],
				components: [new ActionRowBuilder({ components: [
					// back button if it isn't the start
					...(currentIndex ? [backButton] : []),
					// forward button if it isn't the end
					...(currentIndex + listSize < tvTopRated.length ? [forwardButton] : []),
				] }) ],
			});
		});
		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);
		});

	},
};