const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createNoResultEmbed, createCompanyDetailEmbed } = require('../../components/embed.js');
const { searchForCompany } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForCompanySelectMenu } = require('../../helpers/get-options');
const company_details = '/company';


module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('company-search')
	// 	.setDescription('Search for companies.')
	// 	.addStringOption(option =>
	// 		option.setName('title')
	// 			.setDescription('Search for the desired company.')
	// 			.setRequired(true)),
	async execute(interaction) {

		const query = interaction.options.getString('title');
		// const language = interaction.options.getString('language') ?? 'en-US';
		// const region = interaction.options.getString('region') ?? 'US';
		// const country = interaction.options.getString('region');
		// const releaseYear = interaction.options.getInteger('release-year') ?? 0;

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
		const message = await interaction.reply({ content: 'List of Companies matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];

			const companyResponse = await axios.get(`${api_url}${company_details}/${selected}?api_key=${MOVIE_API_KEY}`);
			const company = companyResponse.data;
			// console.log(company);


			const companyDetailsEmbed = createCompanyDetailEmbed(company, i.user);
			const newSelectMenu = createSelectMenu('List of Companies', company.name.slice(0, 81), 1, options);


			await i.update({
				content: 'Selected Company:',
				embeds: [companyDetailsEmbed],
				components: [new ActionRowBuilder().addComponents(newSelectMenu)],
				files: [file],
			});
			// collector.resetTimer([{time: 15000}]);
		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

	},
};