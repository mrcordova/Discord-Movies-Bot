const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createMovieDetailEmbed, createNoResultEmbed, createCompanyDetailEmbed } = require('../components/embed.js');
const { searchForMovie, searchForCompany } = require('../helpers/search-for.js');
const { countryDict, translationsCodeDict, file } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { getCrewMember, getCast, getProductionCompany, createCurrencyFormatter } = require('../helpers/get-production-info');
const { MyEvents } = require('../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForSelectMenu, getOptionsForCompanySelectMenu } = require('../helpers/get-options');
const company_details = '/company';


// https://api.themoviedb.org/3/movie/{movie_id}?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional
// query String required
// page 1 optional
// include_adult false optional
// region String optional
// year Integer optional  includes dvd, blu-ray  dates ect
// primary_release_year Integer optional - oldest release date

module.exports = {
	data: new SlashCommandBuilder()
		.setName('company-search')
		.setDescription('Search for companies.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired company.')
				.setRequired(true)),
	// async autocomplete(interaction) {
	// 	// handle the autocompletion response (more on how to do that below)
	// 	const focusedOption = interaction.options.getFocused(true);

	// 	let choices;

	// 	if (focusedOption.name === 'language') {
	// 		choices = translationsCodeDict;
	// 	}
	// 	if (focusedOption.name === 'region') {
	// 		choices = countryDict;
	// 	}

	// 	const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
	// 	await interaction.respond(
	// 		filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
	// 	);
	// },
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


			const movieDetailsEmbed = createCompanyDetailEmbed(company, i.user);
			const newSelectMenu = createSelectMenu('List of Companies', company.name.slice(0, 81), 1, options);


			await i.update({
				content: 'Selected Company:',
				embeds: [movieDetailsEmbed],
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