const { ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createNoResultEmbed, createCompanyAltListEmbed } = require('../../components/embed.js');
const { file } = require('../../load-data.js');

const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { createButton } = require('../../components/button');
const { getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForCompanySelectMenu } = require('../../helpers/get-options');
const { searchForCompany } = require('../../helpers/search-for');
const company_route = '/company';
const company_alt = 'alternative_names';


// https://api.themoviedb.org/3/movie/{movie_id}/alternative_titles?api_key=<<api_key>>&country=v%20vc%20
// country string optional

const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');


module.exports = {
	// data: new SlashCommandBuilder()
	// .setName('company-alt-titles')
	// .setDescription('Get the alternative names of a company.')
	// .addStringOption(option =>
	// 	option.setName('title')
	// 		.setDescription('Search for the desired company.')
	// 		.setRequired(true)),
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

		// if no film is found for certain year.
		const message = await interaction.reply({ content: 'List of Companies matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenuCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });

		const listSize = 5;
		let currentIndex = 0;
		let company;

		selectMenuCollector.on(MyEvents.Collect, async i => {
			const selected = i.values[0];
			currentIndex = 0;
			const companyResponse = await axios.get(`${api_url}${company_route}/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=${company_alt}`);
			company = companyResponse.data.alternative_names;
			const results = company.results;
			const companyName = companyResponse.data.name;

			const newSelectMenu = createSelectMenu('List of Companies', companyName, 1, options);

			const altListEmbed = await createCompanyAltListEmbed(currentIndex, listSize, results);
			await i.update({
				content: 'Selected Company:',
				embeds: [altListEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < results.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
				],
				files: [file],
			});
			buttonCollector.resetTimer([{ idle: 30000 }]);
		});
		selectMenuCollector.on(MyEvents.Dispose, i => {
			console.log(`select menu dispose: ${i}`);
		});
		selectMenuCollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenuCollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
		buttonCollector.on(MyEvents.Collect, async i => {

			i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);
			const results = company.results;
			const altListEmbed = await createCompanyAltListEmbed(currentIndex, listSize, results);

			await i.update({
				content: i.message.content,
				embeds: [altListEmbed],
				components: [
					i.message.components[0],
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < results.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] })],
			});
			selectMenuCollector.resetTimer([{ idle: 30000 }]);
		});
		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`button dispose: ${i}`);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
	},
};