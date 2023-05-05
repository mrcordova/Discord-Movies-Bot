const { ActionRowBuilder, ComponentType, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createNoResultEmbed, createTvDetailEmbed } = require('../../components/embed.js');
const { searchForTV } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { getCast, getProductionCompany } = require('../../helpers/get-production-info');
const { MyEvents } = require('../../events/DMB-Events');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../../helpers/get-options');
const tv_details = '/tv';


module.exports = {

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


		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];

			const tvResponse = await axios.get(`${api_url}${tv_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=aggregate_credits,content_ratings`);
			const tv = tvResponse.data;

			let tvRating;
			try {
				tvRating = tv.content_ratings.results.find(({ iso_3166_1 }) => ((country && iso_3166_1 == country) || tv.origin_country.includes(iso_3166_1)))['rating'];
			}
			catch (err) {
				tvRating = 'N/A';
			}

			tv.rating = tvRating;
			const network = getProductionCompany(tv['networks']);

			const actors = getCast(tv.aggregate_credits['cast'], 10);
			tv.language = language;

			const tvDetailsEmbed = createTvDetailEmbed({ user: i.user, tv, network, actors, color: Colors.Aqua });
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 81), 1, options);


			await i.update({
				content: 'Selected TV Show:',
				embeds: [tvDetailsEmbed],
				components: [new ActionRowBuilder().addComponents(newSelectMenu)],
				files: [file],
			});
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

	},
};

