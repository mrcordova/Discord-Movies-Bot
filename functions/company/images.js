const { ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createButton } = require('../../components/button.js');
const { searchForCompany } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');
const { createNoResultEmbed, createEmbed, createImageEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { createSelectMenu } = require('../../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForCompanySelectMenu } = require('../../helpers/get-options');


// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {

	async execute(interaction) {
		const query = interaction.options.getString('title');


		const response = await searchForCompany(query);
		const companyNames = response.data.results;

		if (!companyNames.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Companies Found', 'Please make a new command with a different year')], files: [file] });
			return;
		}
		const options = getOptionsForCompanySelectMenu(companyNames);

		const selectMenu = createSelectMenu('List of Companies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Company will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;


		const message = await interaction.reply({ content: 'List of Companies matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let companyImages;

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;
			const companyResponse = await axios.get(`${api_url}/company/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=images`);
			const company = companyResponse.data;
			companyImages = company.images.logos;

			const current = companyImages.slice(currentIndex, currentIndex + listSize);
			const title = `${company.name.slice(0, 80)} Showing Company Image ${currentIndex + current.length} out of ${companyImages.length}`;


			const companyImageEmbed = createImageEmbed(title, current, i.user, 'No Company Images Found');
			const newSelectMenu = createSelectMenu('List of Companies', company.name.slice(0, 80), 1, options);

			await i.update({
				content: 'Selected Company Images: ',
				embeds: [companyImageEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < companyImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
				],
				files: [file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);

		});

		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = companyImages.slice(currentIndex, currentIndex + listSize);


			const title = `${m.message.components[0].components[0].placeholder.slice(0, 60)} Showing Company Image ${currentIndex + current.length} out of ${companyImages.length}`;
			const movieCreditsEmbed = createImageEmbed(title, current, m.user, 'No Company Images Found');


			// Respond to interaction by updating message with new embed
			await m.update({
				content: m.message.content,
				embeds: [movieCreditsEmbed],
				components: [
					m.message.components[0],
					new ActionRowBuilder({ components: [
					// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < companyImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }) ],
			});
			selectMenucollector.resetTimer([{ idle: 30000 }]);
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