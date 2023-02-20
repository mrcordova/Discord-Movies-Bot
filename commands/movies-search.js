const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder, ColorResolvable, Colors } = require('discord.js');
const { api_url, MOVIE_API_KEY } = require('../config.json');
const { createEmbed } = require('../components/embed.js');
const { searchForMovie } = require('../helpers/search-movie.js');
const axios = require('axios');
const { createSelectMenu } = require('../components/select-menu');
const { getCrewMember, getCast, getProductionCompany, createCurrencyFormatter } = require('../helpers/get-production-info');
const movie_details = '/movie';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('movies-search')
		.setDescription('Search for movies based on a text query.')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Search for the desired language.')
				.setRequired(true)),
	async autocomplete(interaction) {
		// handle the autocompletion response (more on how to do that below)
	},
	async execute(interaction) {
		// language en-US optional
		// query String required
		// page 1 optional
		// include_adult false optional
		// region String optional
		// year Integer optional
		// primary_release_year Integer optional
		const query = interaction.options.getString('title');
		const response = await searchForMovie(query);
		const movieTitles = response.data.results;


		const options = [];

		for (const movieObject of movieTitles) {
			const description = movieObject.overview.slice(0, 50);
			options.push({ label: `${movieObject.title} (${movieObject.release_date})`, description: `${description}...`, value: `${movieObject.id}` });
		}

		const selectMenu = createSelectMenu('List of Movies', 'Choose an option', 1, options);
		const row = new ActionRowBuilder().addComponents(selectMenu);

		const embed = createEmbed(0x0099FF, 'Movie will apear here', 'https://discord.js.org/', 'Some description here');


		const filter = ({ user }) => interaction.user.id == user.id;

		const message = await interaction.reply({ content: 'List of Movies matching your query.', filter: filter, ephemeral: true, embeds: [embed], components: [row] });
		const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, customId:'menu', time: 15000 });

		collector.on('collect', async i => {
			const selected = i.values[0];
			// console.log(selected);
			// const movie = movieTitles.find(m => m.id == selected);
			const movieResponse = await axios.get(`${api_url}${movie_details}/${selected}?api_key=${MOVIE_API_KEY}&langauage=en&append_to_response=credits`);
			const movie = movieResponse.data;

			const formatter = createCurrencyFormatter();
			const prod = getProductionCompany(movie['production_companies']);
			const directors = getCrewMember(movie.credits['crew'], 'director');
			const actors = getCast(movie.credits['cast'], 3);

			const exampleEmbed = { 
				color: Colors.Red, title: movie.original_title, 
				url: `https://www.imdb.com/title/${movie.imdb_id}/`,
				author: {
					name: i['user'].username,
					icon_url: i['user'].displayAvatarURL(),
				  // url: "https://discord.js.org",
				},
				description: movie.overview,
				// thumbnail: {
				//   url: `${base_url}${logo_sizes[1]}${prod.logo_path}`,
				// },
				fields: [
				  {
						name: 'Directed by',
						value: directors.join(' & '),
						inline: true,
				  },
				  {
						name: 'Starring',
						value: actors.join(', '),
						inline: true,
				  },
				  {
						name: 'Release Date',
						value: movie.release_date,
						inline: true,
				  },
				  {
						name: 'Status',
						value: movie.status,
						inline: true,
				  },
				  {
						name: 'Runtime',
						value: `${movie.runtime}`,
						inline: true,
				  },
				  {
						name: 'Budget',
						value: `${formatter.format(movie.budget)}`,
						inline: true,
				  },
				  {
						name: 'Revenue',
						value: `${formatter.format(movie.revenue)}`,
						inline: true,
					},
				  {
						name: 'Rating',
						value: `${movie.vote_average}/10`,
						inline: true,
					},
				],
				// image: {
				//   url: `${base_url}${poster_sizes[5]}${movie.poster_path}`,
				// },
				timestamp: new Date(),
				footer: {
				  text: `${prod.name}`,
				  // icon_url: "https://i.imgur.com/AfFp7pu.png",
				},
			  };
			const movieEmbed = createEmbed(0x0099FF, `${movie.title}`, 'https://discord.js.org/', `${movie.overview}`);
			const newSelectMenu = createSelectMenu('List of Movies', movie.title, 1, options);


			i.update({ embeds:[embed], components: [new ActionRowBuilder().addComponents(newSelectMenu)] });


		});

	},
};