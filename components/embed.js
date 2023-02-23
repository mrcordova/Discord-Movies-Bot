const { EmbedBuilder, Colors } = require('discord.js');
const { countryCodeDict, images } = require('../load-data.js');


function createEmbed(color = 0x0099FF, title = 'Some title', description = 'Some description here', url = 'https://discord.js.org/') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setURL(url)
		.setDescription(description);
}
const createAltListEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}

	const current = moviesList.slice(start, start + listSize);

	return new EmbedBuilder({
		color: color,
		title: `Showing Alternative Titles ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({ name: `${ start + (index + 1)}. ${movie.title}`, value: `ISO Code: ${movie.iso_3166_1}\nName: ${ countryCodeDict[movie.iso_3166_1] ?? 'N/A'}\nType: ${movie.type == '' ? 'N/A' : movie.type}` })),
		),
	});
};

const createListEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}

	const current = moviesList.slice(start, start + listSize);
	return new EmbedBuilder({
		color: color,
		title: `Showing Movies ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({ name: `${ start + (index + 1)}. ${movie.title} (${movie.release_date}) - ${movie.vote_average}`, value: movie.overview })),
		),
	});
};

function createNoResultEmbed(color = 'ff0000', title = 'No Movies Found', description = 'Please enter new options.') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(description);
}


function createMovieDetailEmbed({ user, movie, prod, directors, actors, formatter, color }) {
	return {
		color: color,
		title: movie.title,
		url: `https://www.imdb.com/title/${movie.imdb_id}/`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: movie.overview,
		thumbnail: {
			url: `${images.base_url}${images.logo_sizes[1]}${prod.logo_path}`,
		},
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
				name: 'Content Rating',
				value: `${movie.rating}`,
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
				name: 'User Rating',
				value: `${movie.vote_average}/10`,
				inline: true,
			},
		],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${movie.poster_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: `${prod.name}`,
			// icon_url: "https://i.imgur.com/AfFp7pu.png",
		},
	};
}

module.exports = { createEmbed, createAltListEmbed, createListEmbed, createNoResultEmbed, createMovieDetailEmbed };