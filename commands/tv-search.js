const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createNoResultEmbed, createTvDetailEmbed } = require('../components/embed.js');
const { searchForTV } = require('../helpers/search-for.js');
const { countryDict, translationsCodeDict, file } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { getCast, getProductionCompany } = require('../helpers/get-production-info');
const { MyEvents } = require('../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../helpers/get-options');
const tv_details = '/tv';


// https://api.themoviedb.org/3/search/tv?api_key=<<api_key>>&language=en-US&page=1&include_adult=false
// language string Pass a ISO 639-1 value to display translated data for the fields that support it.
// page integer Specify which page to query. optional
// query string Pass a text query to search. This value should be URI encoded. required
// include_adult false optional
// first_air_date_year integer optional


module.exports = {
	data: new SlashCommandBuilder()
		.setName('tv-search')
		.setDescription('Search for tv show based on a text query.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired TV Show.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search for the desired translation.')
				.setAutocomplete(true))
		.addStringOption(option =>
			option.setName('region')
				.setDescription('Search for the desired region.')
				.setAutocomplete(true))
		.addIntegerOption(option =>
			option.setName('release-year')
				.setDescription('Search for the desired year.')
				.setMinValue(1800)
				.setMaxValue(3000)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
		}
		if (focusedOption.name === 'region') {
			choices = countryDict;
		}

		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
		);
	},
	async execute(interaction) {

		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const country = interaction.options.getString('region');
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;

		const response = await searchForTV(query, language, region, releaseYear);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Shows Found', 'Please make a new command with a different options')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(tvTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV show will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		// if no film is found for certain year.
		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: true, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];

			const tvResponse = await axios.get(`${api_url}${tv_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=aggregate_credits,content_ratings`);
			const tv = tvResponse.data;
			// console.log(tv.origin_country);
			// console.log(tv.content_ratings);
			let tvRating;
			try {
				tvRating = tv.content_ratings.results.find(({ iso_3166_1 }) => ((country && iso_3166_1 == country) || tv.origin_country.includes(iso_3166_1)))['rating'];
			}
			catch (err) {
				tvRating = 'N/A';
			}

			tv.rating = tvRating;
			const network = getProductionCompany(tv['networks']);
			// const creators = getCrewMember(tv.credits['crew'], 'Creator');
			// console.log(tv.aggregate_credits['crew']);
			const actors = getCast(tv.aggregate_credits['cast'], 10);
			tv.language = language;
			// console.log(tv.credits['crew']);

			const tvDetailsEmbed = createTvDetailEmbed({ user: i.user, tv, network, actors, color: Colors.Aqua });
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 81), 1, options);


			await i.update({
				content: 'Selected TV Show:',
				embeds: [tvDetailsEmbed],
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

