const { ActionRowBuilder, ButtonStyle, ComponentType, Colors } = require('discord.js');
const axios = require('axios');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createButton } = require('../../components/button.js');
const { searchForMovie } = require('../../helpers/search-for.js');
const { file } = require('../../load-data.js');
const { createNoResultEmbed, createEmbed, createImageEmbed } = require('../../components/embed');
const { MyEvents } = require('../../events/DMB-Events');
const { createSelectMenu } = require('../../components/selectMenu');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForSelectMenu } = require('../../helpers/get-options');


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
		const imgLang = (interaction.options.getString('image_language') ?? 'en').split('-')[0];
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found', 'Please make a new command with a different info.')], files: [file] });
			return;
		}
		const options = getOptionsForSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query.', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 1;
		let currentIndex = 0;
		let movieImages;

		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;
			const movieResponse = await axios.get(`${api_url}/movie/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=images&include_image_language=${imgLang},null`);
			const movie = movieResponse.data;
			movieImages = movie.images.posters.concat(movie.images.posters.backdrops);

			const current = movieImages.slice(currentIndex, currentIndex + listSize);
			const title = `${movie.title.slice(0, 80)} Showing Movie Image ${currentIndex + current.length} out of ${movieImages.length}`;

			// const file = new AttachmentBuilder('./images/TMDb-logo.png');

			const movieImageEmbed = createImageEmbed(title, current, i.user);
			const newSelectMenu = createSelectMenu('List of Movies', movie.title.slice(0, 80), 1, options);

			await i.update({
				content: 'Selected Movie Images: ',
				embeds: [movieImageEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					// new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Images found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files: [file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);
		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			// await interaction.editReply({ content: 'Time\'s up!', components: [] });
			getEditReply(interaction, r);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);

		});

		buttonCollector.on(MyEvents.Collect, async m => {
			// Increase/decrease index
			m.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const current = movieImages.slice(currentIndex, currentIndex + listSize);


			const title = `${m.message.components[0].components[0].placeholder.slice(0, 60)} Showing Movie Image ${currentIndex + current.length} out of ${movieImages.length}`;
			const movieCreditsEmbed = createImageEmbed(title, current, m.user);

			// console.log(currentIndex);
			// Respond to interaction by updating message with new embed
			await m.update({
				content: 'Showing Movie Images',
				embeds: [movieCreditsEmbed],
				components: [
					m.message.components[0],
					new ActionRowBuilder({ components: [
					// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < movieImages.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }) ],
			});
			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});


		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			// await interaction.editReply({ content: 'Time\'s up!', components: [] });
			getEditReply(interaction, r);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});

	},
};