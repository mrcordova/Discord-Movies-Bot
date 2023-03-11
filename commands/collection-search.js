const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
// eslint-disable-next-line no-unused-vars
const { createEmbed, createMovieDetailEmbed, createNoResultEmbed, createCompanyDetailEmbed, createCollectionDetailEmbed } = require('../components/embed.js');
const { searchForCompany, searchForCollection } = require('../helpers/search-for.js');
const { file, translationsCodeDict } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForCompanySelectMenu, getOptionsForCollectionSelectMenu } = require('../helpers/get-options');
const collection_details = '/collection';


module.exports = {
	data: new SlashCommandBuilder()
		.setName('collection-search')
		.setDescription('Search for collections.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired collection.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search for the desired translation.')
				.setAutocomplete(true)),
	 async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

	 	let choices;

	 	if (focusedOption.name === 'language') {
	 		choices = translationsCodeDict;
	 	}


		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
		);
	 },
	async execute(interaction) {

		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		// const region = interaction.options.getString('region') ?? 'US';
		// const country = interaction.options.getString('region');
		// const releaseYear = interaction.options.getInteger('release-year') ?? 0;

		const response = await searchForCollection(query, language);
		const collectionNames = response.data.results;

		if (!collectionNames.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Collections Found', 'Please make a new command')], files: [file] });
			return;
		}
		const options = getOptionsForCollectionSelectMenu(collectionNames);

		const selectMenu = createSelectMenu('List of Collections', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Collection will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		// if no film is found for certain year.
		const message = await interaction.reply({ content: 'List of Collections matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];

			const collectionResponse = await axios.get(`${api_url}${collection_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}`);
			const collection = collectionResponse.data;
			// console.log(company);


			const collectionDetailsEmbed = createCollectionDetailEmbed (collection, i.user);
			const newSelectMenu = createSelectMenu('List of Collections', collection.name.slice(0, 81), 1, options);


			await i.update({
				content: 'Selected Collection:',
				embeds: [collectionDetailsEmbed],
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