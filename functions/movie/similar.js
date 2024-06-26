const { SlashCommandBuilder, ActionRowBuilder, ComponentType, Colors, ButtonStyle } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../../config.json');
const { createEmbed, createNoResultEmbed, createMovieDetailEmbed, createListEmbed } = require('../../components/embed.js');
const { searchForMovie } = require('../../helpers/search-for.js');
const { translationsCodeDict, countryDict, file } = require('../../load-data.js');
const axios = require('axios');
const { createSelectMenu } = require('../../components/selectMenu');
const { MyEvents } = require('../../events/DMB-Events');
const { createButton } = require('../../components/button');
const { getEmoji } = require('../../helpers/get-emoji');
const { createCurrencyFormatter, getProductionCompany, getCrewMember, getCast } = require('../../helpers/get-production-info');
const { getEditReply, getPrivateFollowUp } = require('../../helpers/get-reply');
const { getOptionsForSelectMenu } = require('../../helpers/get-options');
const movie_details = '/movie';


// https://api.themoviedb.org/3/movie/{movie_id}/recommendations?api_key=<<api_key>>&language=en-US&append_to_response=credits
// language en-US optional


const backId = 'back';
const forwardId = 'forward';

const backButton = createButton('Previous', ButtonStyle.Secondary, backId, '⬅️');
const forwardButton = createButton('Next', ButtonStyle.Secondary, forwardId, '➡️');

module.exports = {

	async execute(interaction) {


		const query = interaction.options.getString('title');
		const language = interaction.options.getString('language') ?? 'en-US';
		const region = interaction.options.getString('region') ?? 'US';
		const country = interaction.options.getString('region');
		const releaseYear = interaction.options.getInteger('release-year') ?? 0;
		// const dept = interaction.options.getString('department') ?? '';

		const response = await searchForMovie(query, language, region, releaseYear);
		const movieTitles = response.data.results;

		if (!movieTitles.length) {
			await interaction.reply({ embeds: [createNoResultEmbed(Colors.Red, 'No Movies Found for that query', 'Please make a new command with a different options')], files:[file] });
			return;
		}
		const options = getOptionsForSelectMenu(movieTitles, language);

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(Colors.Blue, 'Movie similar will appear here', 'Some description here', 'https://discord.js.org/');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query. :smiley:', ephemeral: false, embeds: [embed], components: [row] });
		const selectMenucollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', idle: 30000 });
		const buttonCollector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, idle: 30000 });


		const listSize = 5;
		let currentIndex = 0;
		let similar;


		selectMenucollector.on(MyEvents.Collect, async i => {
			if (!i.isStringSelectMenu()) return;
			const selected = i.values[0];
			currentIndex = 0;

			const movieResponse = await axios.get(`${api_url}${movie_details}/${selected}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=similar`);
			const movie = movieResponse.data;

			similar = movie.similar.results;

			const movieRecommendsEmbed = await createListEmbed(currentIndex, listSize, similar);
			const newSelectMenu = createSelectMenu('List of Movies', movie.title.slice(0, 81), 1, options);

			// console.log(recommendations);

			const current = similar.slice(currentIndex, currentIndex + listSize);
			// console.log(current);
			const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.title}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));
			await i.update({
				content: `Similar to ${movie.title.slice(0, 81)}`,
				embeds: [movieRecommendsEmbed],
				components: [
					new ActionRowBuilder().addComponents(newSelectMenu),
					new ActionRowBuilder({ components:  [
						// back button if it isn't the start
						...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
						// forward button if it isn't the end
						...(currentIndex + listSize < similar.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
					] }),
					new ActionRowBuilder({ components:  moreDetailBtns.length ? moreDetailBtns : [createButton('No Movies found', ButtonStyle.Danger, 'empty', '🪹').setDisabled(true)] }),
				],
				files:[file],
			});

			buttonCollector.resetTimer([{ idle: 30000 }]);

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
		buttonCollector.on(MyEvents.Collect, async i => {
			if (i.customId == 'empty') return;
			// console.log(i.customId);
			if (i.customId != backId && i.customId != forwardId) {
				// https://api.themoviedb.org/3/credit/{credit_id}?api_key=<<api_key>>
				const creditResponse = await axios.get(`${api_url}${movie_details}/${i.customId}?api_key=${MOVIE_API_KEY}&language=${language}&append_to_response=credits,release_dates`);
				const movieDetails = creditResponse.data;

				// TODO: chack if country is null, and default to country of production like tv-search.js
				// console.log(movieDetails.release_dates.results);
				let movieRating;
				// || tv.origin_country.includes(iso_3166_1)
				try {
					const production_countries = movieDetails.production_countries.map(c => c.iso_3166_1);
					// console.log(movieDetails.release_dates.results.find(({ iso_3166_1 }) => (country && iso_3166_1 == country) || production_countries.includes(iso_3166_1)));
					movieRating = (movieDetails.release_dates.results.find(({ iso_3166_1 }) => ((country && iso_3166_1 == country)) || production_countries.includes(iso_3166_1)) ?? { release_dates: [{ type: 3 }] })['release_dates'].find(({ type }) => type == 3).certification ?? 'N/A';
				}
				catch {
					movieRating = 'N/A';
				}
				movieDetails.rating = movieRating;

				const formatter = createCurrencyFormatter();
				const prod = getProductionCompany(movieDetails['production_companies']);
				const directors = getCrewMember(movieDetails.credits['crew'], 'director');
				const actors = getCast(movieDetails.credits['cast'], 3);

				const movieDetailssEmbed = createMovieDetailEmbed({ user: i.user, movie: movieDetails, prod, directors, actors, formatter, color: Colors.Aqua });

				await i.update({
					content: 'Movie\'s Detail',
					embeds: [movieDetailssEmbed],
					components: [],
				});
				buttonCollector.stop('Done!');
				selectMenucollector.stop('Done!');
			}
			else {


				i.customId === backId ? (currentIndex -= listSize) : (currentIndex += listSize);

				const movieSimilarEmbed = await createListEmbed(currentIndex, listSize, similar);
				const current = similar.slice(currentIndex, currentIndex + listSize);
				const moreDetailBtns = current.map((movieInfo, index) => createButton(`${movieInfo.title}`, ButtonStyle.Secondary, `${movieInfo.id}`, getEmoji(currentIndex + (index + 1))));


				await i.update({
					content: i.message.content,
					embeds: [movieSimilarEmbed],
					components: [
						i.message.components[0],
						new ActionRowBuilder({ components:  [
							// back button if it isn't the start
							...(currentIndex ? [backButton.setDisabled(false)] : [backButton.setDisabled(true)]),
							// forward button if it isn't the end
							...(currentIndex + listSize < similar.length ? [forwardButton.setDisabled(false)] : [forwardButton.setDisabled(true)]),
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