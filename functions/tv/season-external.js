const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createNoResultEmbed } = require('../../components/embed.js');
const { searchForTV } = require('../../helpers/search-for.js');
const { translationsCodeDict, file, countryDict, siteArray, siteDict } = require('../../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../../helpers/get-options');
const tv_details = '/tv';


module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('tv-season-external-link')
	// 	.setDescription('Get the external links for a TV season. We currently support TVDB.')
	// 	.addStringOption(option =>
	// 		option.setName('title')
	// 			.setDescription('Search for the desired tv show season.')
	// 			.setRequired(true))
	// 	.addIntegerOption(option =>
	// 		option.setName('season')
	// 			.setDescription('Search for the desired season.')
	// 			.setRequired(true))
	// 	.addStringOption(option =>
	// 		option.setName('language')
	// 			.setDescription('Search for the desired translation.')
	// 			.setAutocomplete(true))
	// 	.addStringOption(option =>
	// 		option.setName('region')
	// 			.setDescription('Search for the desired region.')
	// 			.setAutocomplete(true))
	// 	.addIntegerOption(option =>
	// 		option.setName('release-year')
	// 			.setDescription('Search for the desired year.')
	// 			.setMinValue(1800)
	// 			.setMaxValue(3000)),
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
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		const site = interaction.options.getString('site');
		const seasonNum = interaction.options.getInteger('season');


		const response = await searchForTV(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Show Found for that query', 'Please make a new command with a different year')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Show season matching your query. :smiley:', ephemeral: false, embeds: [], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];

			const tvShowResponse = await axios.get(`${api_url}${tv_details}/${selected}?api_key=${MOVIE_API_KEY}&append_to_response=external_ids`);

			const tvSeasonResponse = await axios.get(`${api_url}${tv_details}/${selected}/season/${seasonNum}?api_key=${MOVIE_API_KEY}&append_to_response=external_ids`);
			const tvLinks = tvSeasonResponse.data.external_ids;
			delete tvLinks.id;


			if (tvLinks['tvdb_id']) {
				tvLinks['tvdb_id'] = `${tvShowResponse.data.name.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-')}/seasons/official/${seasonNum}`;
			}

			if (site && tvLinks[`${site}_id`]) {
				const videoLink = `${siteDict[site.toLowerCase()]}${tvLinks[`${site}_id`]}`;

				await i.reply({
					content: videoLink,
					embeds: [],
					components: [],
					ephemeral: false,
				});
			}
			else if (!site) {
				let videoLink = '';

				for (const [key, value] of Object.entries(tvLinks)) {
					if (value != null && siteDict[key.split('_')[0]]) {
						videoLink += `${siteDict[key.split('_')[0]]}${value}\n`;
					}
				}

				await i.reply({
					content: videoLink.length == 0 ? 'No external links found' : videoLink,
					embeds: [],
					components: [],
					ephemeral: videoLink.length == 0 ? true : false,
				});
			}
			else {
				await i.reply({
					content: 'No results found with these options',
					embeds: [],
					components: [],
					ephemeral: true,
				});

			}


			selectMenucollector.stop('Done!');

		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
	},
};