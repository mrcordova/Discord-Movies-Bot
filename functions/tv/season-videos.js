const { ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createButton } = require('../../components/button.js');
const { searchForTV } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');
const { createNoResultEmbed, createEmbed, createVideoEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { createSelectMenu } = require('../../components/selectMenu');
const { getEmoji } = require('../../helpers/get-emoji');
const { getEditReplyWithoutEmebed, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForTvSelectMenu } = require('../../helpers/get-options');


// Constants
const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {

	async execute(interaction) {
		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const vidLang = (interaction.options.getString('video_language') ?? 'en').split('-')[0];
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		const seasonNum = interaction.options.getInteger('season');
		const videoType = interaction.options.getString('video-type') ?? 'All';
		const site = interaction.options.getString('site') ?? 'All';

		const response = await searchForTV(query, language, region, releaseYear);
		const tvTitles = response.data.results;

		if (!tvTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No TV Shows season Found', 'Please make a new command with a different info.')], files: [file] });
			return;
		}
		const options = getOptionsForTvSelectMenu(tvTitles, language);

		const selectMenu = createSelectMenu('List of TV Shows', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'TV Show season Videos will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of TV Shows matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let tvVideos;

		selectMenucollector.on(MyEvents.Collect, async m => {
			if (!m.isStringSelectMenu()) return;
			const selected = m.values[0];
			currentIndex = 0;
			let tvResponse;
			try {
				tvResponse = await axios.get(`${api_url}/tv/${selected}/season/${seasonNum}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=videos&include_video_language=${vidLang},null`);
			}
			catch {
				await m.update({
					content: m.message.content,
					embeds: [createNoResultEmbed(Colors.Red, 'No Results found')],
					components: [
						m.message.components[0],
					],
				});
				return;
			}
			const tv = tvResponse.data;

			tvVideos = tv.videos.results.filter(video => video.type.toLowerCase() == videoType.toLowerCase() || videoType == 'All').filter(video => video.site == site || site == 'All');


			const current = tvVideos.slice(currentIndex, currentIndex + listSize);
			const title = `${tv.name.slice(0, 80)} Showing TV show season videos ${currentIndex + current.length} out of ${tvVideos.length}`;

			const tvVideoEmbed = createVideoEmbed(title, current, m.user);
			const newSelectMenu = createSelectMenu('List of TV Shows', tv.name.slice(0, 80), 1, options);

			const moreDetailBtns = current.map((tvInfo, index) => createButton(`${tvInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${tvInfo.id}`, getEmoji(currentIndex + (index + 1))));


			await m.update({
				content: 'Selected TV show season video: ',
				embeds: [tvVideoEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < tvVideos.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Videos found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files: [file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		selectMenucollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			getEditReplyWithoutEmebed(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);
		});

		buttonCollector.on(MyEvents.Collect, async m => {
			if (m.customId == 'empty') return;
			if (m.customId != backId && m.customId != forwardId) {
				const sites = {
					'youtube': 'https://www.youtube.com/watch?v=',
					'vimeo': 'https://vimeo.com/',
				};
				const videoLink = tvVideos.find(video => m.customId == video.id);


				await m.reply({
					content: `${sites[videoLink.site.toLowerCase()]}${videoLink.key}`,
					embeds: [],
					components: [],
					ephemeral: false,
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
			}
			else {

				// Increase/decrease index
				m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const current = tvVideos.slice(currentIndex, currentIndex + listSize);


				const title = `${m.message.components[0].components[0].placeholder.slice(0, 60)} Showing TV Show season Video ${currentIndex + current.length} out of ${tvVideos.length}`;
				const tvVideoEmbed = createVideoEmbed(title, current, m.user);
				const moreDetailBtns = current.map((tvInfo, index) => createButton(`${tvInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${tvInfo.id}`, getEmoji(currentIndex + (index + 1))));

				// Respond to interaction by updating message with new embed
				await m.update({
					content: m.message.content,
					embeds: [tvVideoEmbed],
					components: [
						m.message.components[0],
						new ActionRowBuilder({ components: [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < tvVideos.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
						] }),
						new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Videos found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
					],
				});
			}

			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});


		buttonCollector.on(MyEvents.Dispose, m => {
			console.log(`dispose: ${m}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			getEditReplyWithoutEmebed(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			getPrivateFollowUp(args);
		});

	},
};