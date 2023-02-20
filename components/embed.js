const { EmbedBuilder } = require('discord.js');


function createEmbed(color = 0x0099FF, title = 'Some title', url = 'https://discord.js.org/', description = 'Some description here') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setURL(url)
		.setDescription(description);

}

function createMovieDetailEmbed({ user, movie, prod, directors, actors, formatter, color }) {
	return {
		color: color,
		title: movie.original_title,
		url: `https://www.imdb.com/title/${movie.imdb_id}/`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
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
}

module.exports = { createEmbed, createMovieDetailEmbed };