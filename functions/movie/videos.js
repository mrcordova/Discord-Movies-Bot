const { ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createButton } = require('../../components/button.js');
const { searchForMovie } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');
const { createNoResultEmbed, createEmbed, createVideoEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { createSelectMenu } = require('../../components/selectMenu');
const { getEmoji } = require('../../helpers/get-emoji');
const { getEditReplyWithoutEmebed, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForSelectMenu } = require('../../helpers/get-options');
// const movie_now_playing = '/movie/now_playing';

// 1 - https://api.themoviedb.org/3/movie/550/videos?api_key=THE_KEY
// 2 - https://api.themoviedb.org/3/movie/550/videos?api_key=THE_KEY&language=pt-BR
// 3 - https://api.themoviedb.org/3/movie/550/videos?api_key=THE_KEY&language=pt-BR&include_video_language=en,fr,es,de,pt
// 4 - https://api.themoviedb.org/3/movie/550/videos?api_key=THE_KEY&language=pt-BR&include_video_language=en,fr,es,de
// 5 - https://api.themoviedb.org/3/movie/550/videos?api_key=THE_KEY&include_video_language=en,fr,es,de,pt
// 1 - If you don't use &language= parameter, it gets the default in English. en.
// 2 - If you only use the &language= parameter, receive in the chosen language
// 3 - If you also use the &include_video_language= parameter, you receive only in the languages specified in that parameter,
// 4 - and don't receive the referring to &language= if the language is not in the list of &include_video_language=
// 5 - If you only use the &include_video_language= parameter, receive in the languages specified in that par


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
		const videoType = interaction.options.getString('video-type') ?? 'All';
		const site = interaction.options.getString('site') ?? 'All';

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found', 'Please make a new command with a different info.')], files: [file] });
			return;
		}
		const options = getOptionsForSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie Videos will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let movieVideos;

		selectMenucollector.on(MyEvents.Collect, async m => {
			if (!m.isStringSelectMenu()) return;
			const selected = m.values[0];
			currentIndex = 0;
			const movieResponse = await axios.get(`${api_url}/movie/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=videos&include_video_language=${vidLang},null`);
			const movie = movieResponse.data;


			movieVideos = movie.videos.results.filter(video => video.type.toLowerCase() == videoType.toLowerCase() || videoType == 'All').filter(video => video.site == site || site == 'All');


			const current = movieVideos.slice(currentIndex, currentIndex + listSize);
			const title = `${movie.title.slice(0, 80)} Showing Movie Videos ${currentIndex + current.length} out of ${movieVideos.length}`;

			const movieVideoEmbed = createVideoEmbed(title, current, m.user);
			const newSelectMenu = createSelectMenu('List of Movies', movie.title.slice(0, 80), 1, options);

			const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));


			await m.update({
				content: 'Selected Movie Video: ',
				embeds: [movieVideoEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieVideos.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

		buttonCollector.on(MyEvents.Collect, async m => {
			if (m.customId == 'empty') return;
			// console.log(m.customId);
			if (m.customId != backId && m.customId != forwardId) {
				const sites = {
					'youtube': 'https://www.youtube.com/watch?v=',
					'vimeo': 'https://vimeo.com/',
				};
				const videoLink = movieVideos.find(video => m.customId == video.id);


				await m.reply({
					content: `${sites[videoLink.site.toLowerCase()]}${videoLink.key}`,
					embeds: [],
					components: [],
					ephemeral: false,
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
				// await interaction.deleteReply();


			}
			else {

				// Increase/decrease index
				m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const current = movieVideos.slice(currentIndex, currentIndex + listSize);


				// console.log(m.message.embeds[0].title.split('Showing Movie Videos').join(`Showing Movie Videos ${currentIndex + current.length} out of ${movieVideos.length}`));
				// console.log(m.message.components[0].components[0].placeholder)
				const title = `${m.message.components[0].components[0].placeholder.slice(0, 60)} Showing Movie Video ${currentIndex + current.length} out of ${movieVideos.length}`;
				const movieVideoEmbed = createVideoEmbed(title, current, m.user);
				const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.name.slice(0, 80)}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));

				// Respond to interaction by updating message with new embed
				await m.update({
					content: 'Showing Movie Videos',
					embeds: [movieVideoEmbed],
					components: [
						m.message.components[0],
						new ActionRowBuilder({ components: [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < movieVideos.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

	},
};