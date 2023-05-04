const { ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createNoResultEmbed, createCreditListEmbed, createPersonDetailEmbed } = require('../../components/embed.js');
const { searchForMovie } = require('../../helpers/search-for.js');
const { deptEmojis, file } = require('../../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { createButton } = require('../../components/button');
const { getEmoji } = require('../../helpers/get-emoji');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForSelectMenu } = require('../../helpers/get-options');
const movie_details = '/movie';


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {

	async execute(interaction) {


		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		const dept = interaction.options.getString('department') ?? '';

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found for that query', 'Please make a new command with a different year')], files: [file] });
			return;
		}
		const options = getOptionsForSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie credits will apear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query. :smiley:', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let credits;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;

			const movieResponse = await axios.get(`${api_url}${movie_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=credits`);
			const movie = movieResponse.data;

			const cast = movie.credits['cast'].filter(({ known_for_department }) => known_for_department == dept);
			const crew = movie.credits['crew'].filter(({ known_for_department }) => known_for_department == dept);
			credits = cast.concat(crew);
			const movieCreditsEmbed = await createCreditListEmbed(currentIndex, listSize, credits);
			const newSelectMenu = createSelectMenu('List of Movies', movie.title.slice(0, 81), 1, options);

			const current = credits.slice(currentIndex, currentIndex + listSize);
			const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name}`, ButtonStyle.Secondary, `${credit.credit_id}`, getEmoji(currentIndex + (index + 1))));
			await i.update({
				content: `Department: ${dept} ${deptEmojis[dept]}`,
				embeds: [movieCreditsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < credits.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No credits found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files: [file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);

		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			// console.log(`ignore: ${args}`);
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
		buttonCollector.on(MyEvents.Collect, async i => {
			if (i.customId == 'empty') return;
			// console.log(i.customId);
			if (i.customId != backId && i.customId != forwardId) {
				// https://api.themoviedb.org/3/credit/{credit_id}?api_key=<<api_key>>
				const creditResponse = await axios.get(`${api_url}/credit/${i.customId}?api_key=${MOVIE_API_KEY}`);

				const person_id = creditResponse.data.person.id;
				//  add language option?
				const personResponse = await axios.get(`${api_url}/person/${person_id}?api_key=${MOVIE_API_KEY}&language=${language}`);
				const personDetials = personResponse.data;
				// console.log(personDetials);
				const imdbResponse = await axios.get(`${api_url}/find/${personDetials.imdb_id}?api_key=${MOVIE_API_KEY}&language=${language}&external_source=imdb_id`);
				// console.log(imdbResponse.data);
				let movieCredits;
				try {
					// undefined error for person results
					movieCredits = imdbResponse.data.person_results[0].known_for;
				}
				catch {
					movieCredits = [{ title: 'N/A', vote_average: -1 }];
				}

				const personCreditsEmbed = createPersonDetailEmbed(personDetials, movieCredits, i.user);

				await i.update({
					content: 'Person\'s Detail',
					embeds: [personCreditsEmbed],
					components: [],
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
			}
			else {


				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const movieCreditsEmbed = await createCreditListEmbed(currentIndex, listSize, credits);
				const current = credits.slice(currentIndex, currentIndex + listSize);
				const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name}`, ButtonStyle.Secondary, `${credit.credit_id}`, getEmoji(currentIndex + (index + 1))));


				await i.update({
					content: `Department: ${dept}${deptEmojis[dept]}`,
					embeds: [movieCreditsEmbed],
					components: [
						i.message.components[0],
						new ActionRowBuilder({ components:  [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < credits.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
						] }),
						new ActionRowBuilder({ components:  moreDetailBtns }),
					],
				});
			}
			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});
		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`button dispose: ${i}`);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			// console.log(`button ignore: ${args}`);
			getPrivateFollowUp(args);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			getEditReply(interaction, r);
		});
	},
};