const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createNoResultEmbed, createTvSeasonDetailEmbed, createEpisodeDetailEmbed } = require('../../components/embed.js');
const { searchForTV } = require('../../helpers/search-for.js');
const { countryDict, translationsCodeDict, file } = require('../../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { getCast, getCrewMember } = require('../../helpers/get-production-info');
const { MyEvents } = require('../../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../../helpers/get-options');
const { createButton } = require('../../components/button');
const { getEmoji } = require('../../helpers/get-emoji');
const tv_details = '/tv';




const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	// data: new SlashCommandBuilder()
	// 	.setName('tv-episode-search')
	// 	.setDescription('Get the TV episode details')
	// 	.addStringOption(option =>
	// 		option.setName('title')
	// 			.setDescription('Search for the desired episode of TV Show.')
	// 			.setRequired(true))
	// 	.addIntegerOption(option =>
	// 		option.setName('season')
	// 			.setDescription('Search for the desired season.')
	// 			.setRequired(true))
	// 	.addIntegerOption(option =>
	// 		option.setName('episode')
	// 			.setDescription('Search for the desired episode.')
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
		const seasonNum = interaction.options.getInteger('season');
		const episodeNum = interaction.options.getInteger('episode');

		const response = await searchForTV(query, language, region, releaseYear);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Shows Found', 'Please make a new command with a different options')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(tvTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV show episode will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenuCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		let episode;
		selectMenuCollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			const selectedOption = i.message.components[0].components[0].data.options.find(option => option.value === selected);
			const selectedName = selectedOption.label;


			let tvResponse;
			try {
				tvResponse = await axios.get(`${api_url}${tv_details}/${selected}/season/${seasonNum}/episode/${episodeNum}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=credits`);
			}
			catch {
				await i.update({
					content: i.message.content,
					embeds: [createNoResultEmbed(Colors.Red, 'No Results found')],
					components: [
						i.message.components[0],
					],
				});
				return;
			}

			episode = tvResponse.data;


			const crew = episode.crew;
			episode.writers = getCrewMember(crew, 'writer');
			episode.directors = getCrewMember(crew, 'director');
			episode.editors = getCrewMember(crew, 'editor');
			episode.dps = getCrewMember(crew, 'director of photography');
			episode.actors = getCast(episode.credits.cast, 10);
			const episodeDeatailEmbed = createEpisodeDetailEmbed(episode, i.user);


			await i.update({
				content: `Selected TV Show: ${selectedName}`,
				embeds: [episodeDeatailEmbed],
				components: [],
				files: [file],
			});

		});

		selectMenuCollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenuCollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		selectMenuCollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});
	},
};

