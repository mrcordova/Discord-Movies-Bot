const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle,  EmojiResolvable, ReactionEmoji } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed, createNoResultEmbed, createCreditListEmbed } = require('../components/embed.js');
const { searchForMovie } = require('../helpers/search-movie.js');
const { countryDict, translationsCodeDict, depts } = require('../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/selectMenu');
const { MyEvents } = require('../events/DMB-Events');
const { createButton } = require('../components/button');
const movie_details = '/movie';


// https://api.themoviedb.org/3/movie/{movie_id}?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional
// query String required
// page 1 optional
// include_adult false optional
// region String optional
// year Integer optional  includes dvd, blu-ray  dates ect
// primary_release_year Integer optional - oldest release date


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-credits')
		.setDescription('Search for a movie\'s cast and crew')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired film.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('department')
				.setDescription('Choose desired dept.')
				.setChoices(
					...depts.reduce((arry, dept) => {
						arry.push({ name: dept, value: dept });
						return arry;
					}, []))
				.setRequired(true))
		.addStringOption(option =>
			option.setName('language')
				.setDescription('Search for the desired translation.')
				.setAutocomplete(true)),
		// .addStringOption(option =>
		// 	option.setName('region')
		// 		.setDescription('Search for the desired region.')
		// 		.setAutocomplete(true))
		// .addIntegerOption(option =>
		// 	option.setName('release-year')
		// 		.setDescription('Search for the desired year.')
		// 		.setMinValue(1800)
		// 		.setMaxValue(3000)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
		const focusedOption = interaction.options.getFocused(true);

		let choices;

		if (focusedOption.name === 'language') {
			choices = translationsCodeDict;
		}
		// if (focusedOption.name === 'region') {
		// 	choices = countryDict;
		// }

		const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) || choice.value.toLowerCase().startsWith(focusedOption.value.toLowerCase())).slice(0, 25);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name} (${choice.value.toUpperCase()})`, value: choice.value })),
		);
	},
	async execute(interaction) {


		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		const dept = interaction.options.getString('department') ?? '';

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found for that query', 'Please make a new command with a different year')] });
			return;
		}
		const options = [];

		for (const movieObject of movieTitles) {
			const description = movieObject.overview.slice(0, 50);
			options.push({ label: `${movieObject.title.slice(0, 81)} (${movieObject.release_date})`, description: `${description}...`, value: `${movieObject.id}` });
		}

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie credits will apear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;
		// const reactFilter = (reaction, user) => user.id === interaction.user.id;

		// if no film is found for certain year.
		const message = await interaction.reply({ content: 'List of Movies matching your query. :smiley:', filter: filter, ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });
		// const reactionCollector = message.createReactionCollector({ filter: reactFilter, customId: 'react' });

        //1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟
        // :one:
        // await message.react('1️⃣');
        // message.react('🍎')
		// 	.then(() => message.react('🍊'))
		// 	.then(() => message.react('🍇'))
		// 	.catch(error => console.error('One of the emojis failed to react:', error));
    //     message.awaitReactions({ filter, max: 4, time: 60000, errors: ['time'] })
	// .then(collected => console.log(collected.size))
	// .catch(collected => {
	// 	console.log(`After a minute, only ${collected.size} out of 4 reacted.`);
	// });
		const numberEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
		const listSize = Math.min(5, 10);
		let currentIndex = 0;
		let credits;
		// for (let i = 0; i < listSize; i++) {
		// 	await message.react(numberEmoji[i]);
		// }

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

			const moreDetailBtns = [];
			const amountOfListMemebers = Math.min(listSize, credits.length);
			for (let j = 0; j < amountOfListMemebers; j++) {
				moreDetailBtns.push(createButton(`${credits[j].name}`, ButtonStyle.Secondary, `${credits[j].job}_${credits[j].name}`, numberEmoji[j]));
			}

			await i.update({
				content: `Department: ${dept}`,
				embeds: [movieCreditsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < credits.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns }),
				],
			});
			// const reactMessage = await i.fetchReply();
			// reactMessage.react(numberEmoji[0]);
			// reactMessage.react('2️⃣');
			// reactMessage.react('3️⃣');
			// reactMessage.react('4️⃣');
			// reactMessage.react('5️⃣');

			// const choices = Math.min(listSize, credits.length);
			// for (let choice = 1; i <= list; choice++) {
			// 	// console.log(numberEmoji[choice]);
			// 	reactMessage.react('1️⃣');
			// }
			buttonCollector.resetTimer([{ idle: 30000 }]);

			// collector.resetTimer([{time: 15000}]);
		});

		selectMenucollector.on(MyEvents.Dispose, i => {
			console.log(`dispose: ${i}`);
		});
		// eslint-disable-next-line no-unused-vars
		selectMenucollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});
		selectMenucollector.on(MyEvents.Ignore, args => {
			console.log(`ignore: ${args}`);
		});
		buttonCollector.on(MyEvents.Collect, async i => {

			i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

			const movieCreditsEmbed = await createCreditListEmbed(currentIndex, listSize, credits);
			// const amountOfListMemebers = Math.min(listSize, credits.length);
			const current = credits.slice(currentIndex, currentIndex + listSize);
			// for (let j = 0; j < amountOfListMemebers; j++) {
			const moreDetailBtns = current.map((credit, index) => createButton(`${credit.name}`, ButtonStyle.Secondary, `${credit.job}_${credit.name}`, numberEmoji[index]));
			// }

			await i.update({
				content: `Department: ${dept}`,
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
			selectMenucollector.resetTimer([{ idle: 30000 }]);
		});
		buttonCollector.on(MyEvents.Dispose, i => {
			console.log(`button dispose: ${i}`);
		});
		buttonCollector.on(MyEvents.Ignore, args => {
			console.log(`button ignore: ${args}`);
		});
		// eslint-disable-next-line no-unused-vars
		buttonCollector.on(MyEvents.End, async (c, r) => {
			await interaction.editReply({ content: 'Time\'s up!', components: [] });
		});

		// reactionCollector.on(MyEvents.Collect, (reaction, user) => {
		// 	console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
		// });

		// reactionCollector.on(MyEvents.End, collected => {
		// 	console.log(`Collected ${collected.size} items`);
		// });
	},
};