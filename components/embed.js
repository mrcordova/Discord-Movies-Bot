const { EmbedBuilder, Colors } = require('discord.js');
const { ReleaseTypes } = require('../events/DMB-Events.js');
const { countryCodeDict, images, ratings } = require('../load-data.js');


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

const createCreditListEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}

	const current = moviesList.slice(start, start + listSize);

	return new EmbedBuilder({
		color: color,
		title: `Showing Movie Credits ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (member, index) => ({ name: `${ start + (index + 1)}. ${member.name}`, value: `Credit: ${member.job ?? 'N/A'}` })),
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
const createListsEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}


	const current = moviesList.slice(start, start + listSize);
	return new EmbedBuilder({
		color: color,
		title: `Showing Movies ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({ name: `${ start + (index + 1)}. ${movie.name} (Movies Count: ${movie.item_count}) - ${movie.iso_639_1}`, value: movie.description })),
		),
	});
};


function createNoResultEmbed(color = 'ff0000', title = 'No Movies Found', description = 'Please enter new options.') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(description);
}

function createImageEmbed(title, movieImage, user) {
	if (!movieImage.length) {
		return createNoResultEmbed();
	}


	return {
		color: Colors.DarkGrey,
		title: `${title}`,
		// url: `https://www.imdb.com/title/${movie.imdb_id}/`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		// description: movie.overview,
		// thumbnail: {
		// 	url: `${images.base_url}${images.logo_sizes[1]}${prod.logo_path}`,
		// },
		fields: [],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${movieImage[0].file_path}`,
		},
		timestamp: new Date(),
		// footer: {
		// 	text: `${prod.name}`,
		// 	// icon_url: "https://i.imgur.com/AfFp7pu.png",
		// },
	};
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
function createPersonDetailEmbed(person, movieCredits, user) {

	const known_for = movieCredits.sort((a, b) => b.vote_average - a.vote_average).map(movie => movie.title).join(', ');
	return {
		color: Colors.Blurple,
		title: person.name,
		url: `https://www.imdb.com/name/${person.imdb_id}/`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: person.biography,
		thumbnail: {
			url: `${images.base_url}${images.logo_sizes[1]}${person.profile_path}`,
		},
		fields: [
			{
				name: 'Birthday',
				value: person.birthday ?? 'N/A',
				inline: true,
			},
			{
				name: 'Death',
				value: person.deathday ?? 'N/A',
				inline: true,
			},
			{
				name: 'Known For: ',
				value: known_for ?? 'N/A',
				inline: true,
			},
			{
				name: 'Place of birth',
				value: person.place_of_birth ?? 'N/A',
				inline: true,
			},
			{
				name: 'Gender',
				value: `${person.gender ?? 'N/A'}`,
				inline: true,
			},
			// {
			// 	name: 'Runtime',
			// 	value: `${movie.runtime}`,
			// 	inline: true,
			// },
			// {
			// 	name: 'Budget',
			// 	value: `${formatter.format(movie.budget)}`,
			// 	inline: true,
			// },
			// {
			// 	name: 'Revenue',
			// 	value: `${formatter.format(movie.revenue)}`,
			// 	inline: true,
			// },
			// {
			// 	name: 'User Rating',
			// 	value: `${movie.vote_average}/10`,
			// 	inline: true,
			// },
		],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${person.profile_path}`,
		},
		timestamp: new Date(),
		footer: {
			// text: `${prod.name}`,
			// icon_url: "https://i.imgur.com/AfFp7pu.png",
		},
	};

}
const createReleaseDatesEmbed = async (start, moviesList, title, releaseType, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed(Colors.Red, 'No Movie Found', 'No release date for speific movie with certain options');
	}

	const current = moviesList;

// console.log(current)
	return new EmbedBuilder({
		color: color,
		title: title,
		fields: await Promise.all(current.map(async (movie, index) => {
			const release = movie.release_dates.find(({ type }) => releaseType == type) ?? { release_date: 'N/A', certification: 'N/A' };
			let ratingMeaning;
			let releaseRating;
			try {
			// console.log(ratings.certifications[movie.iso_3166_1].map(rating => console.log(rating.certification)));
				ratingMeaning = ratings.certifications[movie.iso_3166_1].find(rating => rating.certification == release.certification).meaning;
			}
			catch {
				ratingMeaning = 'N/A';
			}
			try {
				releaseRating = release.certification.length ? release.certification : 'N/A';
			}
			catch {
				releaseRating = 'N/A';
			}
			// console.log(ratings.certifications[movie.iso_3166_1])
			return {
				name: `${start + (index + 1)}. ${countryCodeDict[movie.iso_3166_1] ?? 'N/A'}`,
				value: `Release Date: ${release.release_date}\nRating: ${releaseRating}\nRating meaning: ${ratingMeaning}`,
			};
		})),
	});
};

module.exports = {
	createEmbed,
	createAltListEmbed,
	createCreditListEmbed,
	createListEmbed,
	createListsEmbed,
	createImageEmbed,
	createNoResultEmbed,
	createMovieDetailEmbed,
	createPersonDetailEmbed,
	createReleaseDatesEmbed,
};