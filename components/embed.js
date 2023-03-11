const { EmbedBuilder, Colors, bold, underscore, italic, hyperlink, time } = require('discord.js');
const { EpisodeGroupTypes } = require('../events/DMB-Events.js');
const { countryCodeDict, images, movieRatings, langCodeDict, tvRatings } = require('../load-data.js');

const tmdbIconUrl = 'attachment://TMDb-logo.jpg';
const justWatchIconUrl = 'attachment://just-watch-logo.jpg';
// const tmdbIconUrl = 'attachment://just-watch-logo.jpg';
// const tmdbIconUrl = 'https://www.i.imgur.com/a/wDY1wua.png';
const tmdbName = 'The Movie Database (TMDb)';
const tmdbUrl = 'https://www.themoviedb.org';

function createEmbed(color = 0x0099FF, title = 'Some title', description = 'Some description here', url = 'https://discord.js.org/') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setURL(url)
		.setDescription(description);
}
const createAltListEmbed = async (start, listSize, list, color = Colors.Blue) => {

	if (!list.length) {
		return createNoResultEmbed();
	}

	const current = list.slice(start, start + listSize);

	return new EmbedBuilder({
		color: color,
		title: `Showing Alternative Titles ${start + 1}-${start + current.length} out of ${list.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({
			name: `${ start + (index + 1)}. ${movie.title}`,
			value: `ISO Code: ${movie.iso_3166_1}\nName: ${ countryCodeDict[movie.iso_3166_1] ?? 'N/A'}\nType: ${movie.type == '' ? 'N/A' : movie.type}` })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};

async function createCollectionDetailEmbed(collectionDetails, parts, user) {
	if (!collectionDetails) {
		return createNoResultEmbed(Colors.Red, 'No Collection found');
	}

	// console.log(collectionDetails);
	// {
	// 	adult: false,
	// 	backdrop_path: '/vV5knD9jlW8QaOhCgf4129hbIIh.jpg',
	// 	id: 980804,
	// 	title: 'LEGO Star Wars Summer Vacation',
	// 	original_language: 'en',
	// 	original_title: 'LEGO Star Wars Summer Vacation',
	// 	overview: "Looking for a much-needed break, Finn arranges a surprise vacation for his friends Rey, Poe, Rose, Chewie, BB-8, R2-D2, and C-3PO, aboard the luxurious Halcyon. However, Finn's plan to have one last hurrah together quickly goes awry.",
	// 	poster_path: '/2SatEFCs04oFRqkZuY1fODYXeFI.jpg',
	// 	media_type: 'movie',
	// 	genre_ids: [Array],
	// 	popularity: 16.635,
	// 	release_date: '2022-08-05',
	// 	video: false,
	// 	vote_average: 6.13,
	// 	vote_count: 50
	//   }
	return {
		color: Colors.DarkGrey,
		title: `${collectionDetails.name}`,
		// url: `${collectionDetails.homepage}`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: collectionDetails.overview,
		fields: await Promise.all(parts.map(async (media, index) => ({
			name: `${(index + 1)}. ${media.title} (${time(new Date(media.release_date), 'D')})`,
			value: `rating: ${media.vote_average}\nmedia type: ${media.media_type}`,
		}))),
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${collectionDetails.poster_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};
}

const createCompanyAltListEmbed = async (start, listSize, list, color = Colors.Blue) => {

	if (!list.length) {
		return createNoResultEmbed(Colors.Red, 'No Alternative titles');
	}

	const current = list.slice(start, start + listSize);

	return new EmbedBuilder({
		color: color,
		title: `Showing Alternative Names ${start + 1} - ${start + current.length} out of ${list.length}`,
		fields: await Promise.all(current.map(async (company, index) => ({
			name: `${ start + (index + 1)}. ${company.name}`,
			value: `Type: ${company.type == '' ? 'N/A' : company.type}` })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};

function createCompanyDetailEmbed(companyDetails, user) {
	if (!companyDetails) {
		return createNoResultEmbed();
	}

	// console.log(translationDetails);
	return {
		color: Colors.DarkGrey,
		title: `${companyDetails.name}`,
		url: `${companyDetails.homepage}`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: companyDetails.description,
		// thumbnail: {
		// 	url: `${images.base_url}${images.logo_sizes[1]}${prod.logo_path}`,
		// },
		fields: [
			{
				name: 'Headquarters',
				value: `${companyDetails.headquarters}`,
				inline: true,
			},
			{
				name: 'Country of Origin',
				value: `${companyDetails.origin_country} (${countryCodeDict[companyDetails.origin_country]})`,
				inline: true,
			},
			{
				name: 'Parent Company',
				value: `${companyDetails.parent_company ?? 'N/A'}`,
				inline: true,
			},

		],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${companyDetails.logo_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};
}


const createCreditListEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}

	const current = moviesList.slice(start, start + listSize);
	console.log(current);
	return new EmbedBuilder({
		color: color,
		title: `Showing Movie Credits ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (member, index) => ({
			name: `${ start + (index + 1)}. ${member.name}`,
			value: `Credit: ${member.job ?? member.character ?? 'N/A'}` })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};
const createPeopleCreditListEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}

	const current = moviesList.slice(start, start + listSize);
	// console.log(current);
	return new EmbedBuilder({
		color: color,
		title: `Showing Person's Credits ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (member, index) => ({
			name: `${ start + (index + 1)}. ${member.name ?? member.title} (${member.media_type})`,
			value: `Credit: ${member.job ?? member.character ?? 'N/A'}` })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};

function createEpisodeDetailEmbed({ writers, directors, editors, actors, dps, air_date, name: titleName, still_path, overview, guest_stars, runtime, season_number, episode_number, vote_average }, user) {
	const airDate = new Date(air_date);
	return {
		color: Colors.Aqua,
		title: titleName,
		// url: ``,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: overview,
		// thumbnail: {
		// 	url: `${images.base_url}${images.logo_sizes[1]}${prod.logo_path}`,
		// },
		fields: [
			{
				name: 'Directed by',
				value: directors.join(' & '),
				inline: true,
			},
			{
				name: 'Written by',
				value: writers.join(' & '),
				inline: true,
			},
			{
				name: 'Edited by',
				value: editors.join(' & '),
				inline: true,
			},
			{
				name: 'Director(s) of Photgraphy',
				value: dps.join(' & '),
				inline: true,
			},
			{
				name: 'Starring',
				value: actors.join(', '),
				inline: true,
			},
			{
				name: 'Guest Stars',
				value: guest_stars.map(({ name, character }) => `${underscore(name)} (Charactor: ${character})`).join(', '),
				inline: true,
			},
			{
				name: 'Air date',
				value: `${time(airDate, 'D')} (${time(airDate, 'R')})`,
				inline: true,
			},
			{
				name: 'Run time',
				value: runtime ?? 'N/A',
				inline: true,
			},
			{
				name: 'Episode ID',
				value: `S${season_number}E${episode_number}`,
				inline: true,
			},
			{
				name: 'Rating',
				value: `${vote_average}/10`,
				inline: true,
			},
		],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${still_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};
}

function createJustWatchNoResultEmbed(color = 'ff0000', title = 'No Results Found', description = 'Please enter new options.') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(description)
		.setThumbnail(justWatchIconUrl)
		.setFooter({
			text: tmdbName,
			iconURL: tmdbIconUrl,
		});
}


const createListEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}

	const current = moviesList.slice(start, start + listSize);
	return new EmbedBuilder({
		color: color,
		title: `Showing Movies ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({
			name: `${ start + (index + 1)}. ${movie.title} (${time(new Date(movie.release_date), 'D')}) - ${movie.vote_average}`,
			value: movie.overview })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};
const createPeopleListEmbed = async (start, listSize, peopleList, color = Colors.Blue) => {
	if (!peopleList.length) {
		return createNoResultEmbed();
	}

	const current = peopleList.slice(start, start + listSize);

	return new EmbedBuilder({
		color: color,
		title: `Showing Movies ${start + 1}-${start + current.length} out of ${peopleList.length}`,
		fields: await Promise.all(current.map(async (person, index) => ({
			name: `${ start + (index + 1)}. ${person.name} (popularity: ${person.popularity})`,
			value: person.known_for.map(({ title, name }) => title ?? name).join(', ') }
		))),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
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
		fields: await Promise.all(current.map(async (movie, index) => ({
			name: `${ start + (index + 1)}. ${movie.name} (Movies Count: ${movie.item_count})`,
			value: `${underscore(`${movie.iso_639_1} (${langCodeDict[movie.iso_639_1]}`)})\n${movie.description}` })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};


function createNoResultEmbed(color = 'ff0000', title = 'No Movies Found', description = 'Please enter new options.') {
	return new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(description)
		// .setThumbnail(justWatchIconUrl)
		.setFooter({
			text: tmdbName,
			iconURL: tmdbIconUrl,
		});
}

function createImageEmbed(title, mediaImages, user, noResultText) {
	if (!mediaImages.length) {
		return createNoResultEmbed(Colors.Red, noResultText);
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
		fields: [],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${mediaImages[0].file_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};
}


function createMovieDetailEmbed({ user, movie, prod, directors, actors, formatter, color }) {

	const releaseDate = new Date(movie.release_date);
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
				value: `${time(releaseDate, 'D')} (${time(releaseDate, 'R')})`,
				inline: true,
			},
			{
				name: 'Production Companies',
				value: movie.production_companies.sort((a, b) => a.id - b.id).map(({ name }) => name).join(', '),
				inline: true,
			},
			{
				name: 'Genre(s)',
				value: movie.genres.map(({ name }) => name).join(', '),
				inline: true,
			},
			{
				name: 'TagLine',
				value: movie.tagline ?? 'N/A',
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
			icon_url: tmdbIconUrl,
		},
	};
}

function createPersonDetailEmbed(person, credits, user) {

	const known_for = credits.sort((a, b) => b.vote_average - a.vote_average).map(credit => {
		if (credit.title) {
			return `${credit.title} (${credit.media_type})`;
		}
		return `${credit.name} (${credit.media_type})`;
	}).slice(0, 10).join(', ');
	// console.log(credits);
	const deathday = new Date(person.deathday ?? undefined);
	const birthday = new Date(person.birthday ?? undefined);
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
				value:  !isNaN(birthday) ? `${time(birthday, 'D')}` : 'N/A',
				inline: true,
			},
			{
				name: 'Death',
				value: !isNaN(deathday) ? `${time(deathday, 'D')} (${time(deathday, 'R')})` : 'N/A',
				inline: true,
			},
			{
				name: !isNaN(deathday) ? 'Age (at time of death)' : 'Age',
				value: !isNaN(birthday) ? `${parseInt(!isNaN(deathday) ? Math.floor((deathday - birthday)) / (1000 * 60 * 60 * 24 * 365.25) : Math.floor((new Date() - birthday)) / (1000 * 60 * 60 * 24 * 365.25)) } years old` : 'N/A',
				inline: true,
			},
			{
				name: 'Known For: ',
				value: `${known_for.slice(0, 1021)}..` ?? 'N/A',
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
		],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${person.profile_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};

}


function createPeopleTranslateDetailEmbed(translationDetails, user) {
	if (!translationDetails) {
		return createNoResultEmbed();
	}

	// console.log(translationDetails);
	return {
		color: Colors.DarkGrey,
		title: `${translationDetails.person_name}`,
		// url: `${translationDetails.data.homepage}`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: translationDetails.data.biography,
		// thumbnail: {
		// 	url: `${images.base_url}${images.logo_sizes[1]}${prod.logo_path}`,
		// },
		fields: [
			// {
			// 	name: 'Tagline',
			// 	value: `${translationDetails.data.tagline == '' ? 'N/A' : translationDetails.data.tagline}`,
			// 	inline: true,
			// },
			// {
			// 	name: 'Runtime',
			// 	value: `${translationDetails.data.runtime}`,
			// 	inline: true,
			// },
			{
				name: 'Language',
				value: `${translationDetails.name}`,
				inline: true,
			},
			{
				name: 'English Translation',
				value: `${translationDetails.english_name}`,
				inline: true,
			},
			{
				name: 'Region',
				value: `${translationDetails.iso_3166_1}`,
				inline: true,
			},
			{
				name: 'Language',
				value: `${translationDetails.iso_639_1} (${langCodeDict[translationDetails.iso_639_1]})`,
				inline: true,
			},

		],
		// image: {
		// 	url: `${images.base_url}${images.poster_sizes[5]}${movieImage[0].file_path}`,
		// },
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};
}

const createRatingsEmbed = async (start, tvList, title, color = Colors.Blue) => {
	if (!tvList.length) {
		return createNoResultEmbed(Colors.Red, 'No TV Show Found', 'No ratings for speific movie with these options');
	}

	const current = tvList;


	return new EmbedBuilder({
		color: color,
		title: title,
		fields: await Promise.all(current.map(async (tv, index) => {
			const rating = tv.rating;
			let ratingMeaning;
			const language = `${tv.iso_3166_1} (${countryCodeDict[tv.iso_3166_1]})`;
			try {
				ratingMeaning = tvRatings.certifications[tv.iso_3166_1].find(({ certification }) => certification == tv.rating).meaning;
			}
			catch {
				ratingMeaning = 'N/A';
			}

			return {
				name: `${start + (index + 1)}. ${language ?? 'N/A'}`,
				value: `${underscore('Rating:')} ${rating}\n${underscore('Rating meaning:')} ${ratingMeaning}`,
			};
		})),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};
const createReleaseDatesEmbed = async (start, moviesList, title, releaseType, language, color = Colors.Blue) => {
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
			const options = { year: 'numeric', month: 'long', day: 'numeric' };
			// const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
			const releaseDate = new Date(release.release_date).toLocaleDateString(language, options);
			let ratingMeaning;
			let releaseRating;
			try {
				// console.log(ratings.certifications[movie.iso_3166_1].map(rating => console.log(rating.certification)));
				ratingMeaning = movieRatings.certifications[movie.iso_3166_1].find(rating => rating.certification == release.certification).meaning;
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
				value: `${underscore('Release Date:')} ${releaseDate}\n${underscore('Rating:')} ${releaseRating}\n${underscore('Rating meaning:')} ${ratingMeaning}`,
			};
		})),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};

function createReviewDetailEmbed(review) {

	const createdAt = new Date(review.created_at);
	const updatedAt = new Date(review.updated_at);

	return {
		color: Colors.Blurple,
		title: review.author_details.username,
		url: `${review.url}`,
		// author: {
		// 	name: user.username,
		// 	icon_url: user.displayAvatarURL(),
		// 	// url: "https://discord.js.org",
		// },
		description: review.content,
		thumbnail: {
			url: `${images.base_url}${images.logo_sizes[1]}${review.author_details.avatar_path}`,
		},
		fields: [
			{
				name: 'Rating',
				value: `${review.author_details.rating ?? 0}`,
				inline: true,
			},
			{
				name: 'Created',
				value: `${time(createdAt, 'F')} (${time(createdAt, 'R')})`,
				inline: true,
			},
			{
				name: 'Updated',
				value: `${time(updatedAt, 'F')} (${time(updatedAt, 'R')})`,
				inline: true,
			},
		],
		// image: {
		// 	url: `${images.base_url}${images.poster_sizes[5]}${person.profile_path}`,
		// },
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};

}

const createReviewEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}


	const current = moviesList.slice(start, start + listSize);
	return new EmbedBuilder({
		color: color,
		title: `Showing Movies ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({
			name: `${ start + (index + 1)}. ${movie.author_details.username} rated: ${movie.author_details.rating ?? 'No Rating'}`,
			value: `${movie.content.slice(0, 1021)}...` })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};
const createTranslateListEmbed = async (start, listSize, moviesList, color = Colors.Blue) => {
	if (!moviesList.length) {
		return createNoResultEmbed();
	}

	const current = moviesList.slice(start, start + listSize);

	return new EmbedBuilder({
		color: color,
		title: `Showing Translations ${start + 1}-${start + current.length} out of ${moviesList.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({
			name: `${ start + (index + 1)}. ${movie.name} (${movie.english_name})`,
			value: `ISO Codes: ${movie.iso_3166_1}-${movie.iso_639_1}\nName: ${ countryCodeDict[movie.iso_3166_1] ?? 'N/A'}` })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};

function createTranslateDetailEmbed(translationDetails, user) {
	if (!translationDetails) {
		return createNoResultEmbed();
	}

	// console.log(translationDetails);
	return {
		color: Colors.DarkGrey,
		title: `${translationDetails.data.title}`,
		url: `${translationDetails.data.homepage}`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: translationDetails.data.overview,
		// thumbnail: {
		// 	url: `${images.base_url}${images.logo_sizes[1]}${prod.logo_path}`,
		// },
		fields: [
			{
				name: 'Tagline',
				value: `${translationDetails.data.tagline == '' ? 'N/A' : translationDetails.data.tagline}`,
				inline: true,
			},
			{
				name: 'Runtime',
				value: `${translationDetails.data.runtime}`,
				inline: true,
			},
			{
				name: 'Language',
				value: `${translationDetails.name}`,
				inline: true,
			},
			{
				name: 'English Translation',
				value: `${translationDetails.english_name}`,
				inline: true,
			},
			{
				name: 'Region',
				value: `${translationDetails.iso_3166_1}`,
				inline: true,
			},
			{
				name: 'Language',
				value: `${translationDetails.iso_639_1} (${langCodeDict[translationDetails.iso_639_1]})`,
				inline: true,
			},

		],
		// image: {
		// 	url: `${images.base_url}${images.poster_sizes[5]}${movieImage[0].file_path}`,
		// },
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};
}


const createTvCreditListEmbed = async (start, listSize, tvList, color = Colors.Blue) => {
	if (!tvList.length) {
		return createNoResultEmbed();
	}

	const current = tvList.slice(start, start + listSize);
	// console.log(current);
	return new EmbedBuilder({
		color: color,
		title: `Showing TV Credits ${start + 1}-${start + current.length} out of ${tvList.length}`,
		fields: await Promise.all(current.map(async (member, index) => {
			let credits;
			try {
				credits = member.jobs.map(({ job, episode_count }) => `${job} (ep count: ${episode_count})`).join(', ');
			}
			catch {
				credits = member.roles.map(({ character, episode_count }) => `${character} (# of eps: ${episode_count})`).join(', ');
			}
			return {
				name: `${ start + (index + 1)}. ${member.name}`,
				value: `${underscore('Credit:')} ${credits ?? 'N/A'}\n${underscore('Total # of Eps:')} ${member.total_episode_count}`,
			};
		}),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};
const createTvEpisodeCreditListEmbed = async (start, listSize, tvList, color = Colors.Blue) => {
	if (!tvList.length) {
		return createNoResultEmbed();
	}

	const current = tvList.slice(start, start + listSize);
	// console.log(current);
	return new EmbedBuilder({
		color: color,
		title: `Showing TV episode Credits ${start + 1}-${start + current.length} out of ${tvList.length}`,
		fields: await Promise.all(current.map(async (member, index) => {
			const credits = member.job ?? member.character;

			return {
				name: `${ start + (index + 1)}. ${member.name}`,
				value: `${underscore('Credit:')} ${credits ?? 'N/A'}\n`,
			};
		}),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};

function createTvDetailEmbed({ user, tv, network, actors, color }) {
	const firstAirDate = new Date(tv.first_air_date);
	const lastAirDate = new Date(tv.last_air_date);
	// console.log(tv.created_by);
	return {
		color: color,
		title: tv.name,
		url: tv.homepage,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: `${tv.overview}\n${hyperlink('Show more', `${tmdbUrl}/tv/${tv.id}-${tv.name.replace(/ /g, '-')}?language=${tv.language}`)}`,
		thumbnail: {
			url: `${images.base_url}${images.logo_sizes[1]}${network.logo_path}`,
		},
		fields: [
			{
				name: 'Created by',
				value: tv.created_by.map(creator => creator.name).join(' & '),
				inline: true,
			},
			{
				name: 'Starring',
				value: actors.join(', '),
				inline: true,
			},
			{
				name: 'First Air Date',
				value: `${time(firstAirDate, 'F')} (${time(firstAirDate, 'R')} )`,
				inline: true,
			},
			{
				name: 'Last Air Date',
				value: `${time(lastAirDate, 'F')} (${time(lastAirDate, 'R')} )`,
				inline: true,
			},
			{
				name: 'Status',
				value: tv.status,
				inline: true,
			},
			{
				name: 'Type',
				value: tv.type,
				inline: true,
			},
			{
				name: 'Content Rating',
				value: tv.rating,
				inline: true,
			},
			{
				name: 'Genre(s)',
				value: tv.genres.map(genre => genre.name).join(', '),
				inline: true,
			},
			{
				name: '# of Episodes',
				value: tv.number_of_episodes,
				inline: true,
			},
			{
				name: '# of Seasons',
				value: tv.number_of_seasons,
				inline: true,
			},
			{
				name: 'Country of Origin',
				value: tv.origin_country.map(country => countryCodeDict[country]).join(', '),
				inline: true,
			},
			{
				name: 'Production Companies',
				value: tv.production_companies.sort((a, b) => a.id < b.id).map(prod => prod.name).join(', '),
				inline: true,
			},
			{
				name: 'Runtime(s)',
				value: `${tv.episode_run_time.join(', ')}`,
				inline: true,
			},
			{
				name: 'User Rating',
				value: `${tv.vote_average}/10`,
				inline: true,
			},
		],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${tv.poster_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: `${network.name}`,
			icon_url: tmdbIconUrl,
		},
	};
}
const createTvListEmbed = async (start, listSize, tvList, color = Colors.Blue) => {
	if (!tvList.length) {
		return createNoResultEmbed();
	}

	const current = tvList.slice(start, start + listSize);
	return new EmbedBuilder({
		color: color,
		title: `Showing Movies ${start + 1}-${start + current.length} out of ${tvList.length}`,
		fields: await Promise.all(current.map(async (movie, index) => ({
			name: `${ start + (index + 1)}. ${movie.name} (${time(new Date(movie.first_air_date), 'D')}) - ${movie.vote_average}`,
			value: movie.overview })),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};
const createTvListsEmbed = async (start, listSize, tvList, color = Colors.Blue) => {
	if (!tvList.length) {
		return createNoResultEmbed(Colors.Red, 'No TV Show Found');
	}


	const current = tvList.slice(start, start + listSize);
	return new EmbedBuilder({
		color: color,
		title: `Showing Movies ${start + 1}-${start + current.length} out of ${tvList.length}`,
		fields: await Promise.all(current.map(async (tv, index) => {
			const network = tv.network ?? { origin_country: 'N/A' };
			return {
				name: `${ start + (index + 1)}. ${tv.name} (Eps Count: ${tv.episode_count}) (Group Count: ${tv.group_count})`,
				value: `${underscore('Country of Origin:')} ${network.origin_country} (${countryCodeDict[network.origin_country] ?? 'N/A'})\n${underscore('Description:')}${tv.description}\n${underscore('Type:')} ${new EpisodeGroupTypes(tv.type).toString}`,
			};
		}),
		),
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};

async function createTvSeasonDetailEmbed({ tv, episodes }, user, color = Colors.Aqua) {
	const airDate = new Date(tv.air_date);
	// const lastAirDate = new Date(tv.last_air_date);
	// console.log();
	return {
		color: color,
		title: `${underscore(tv.name)}\n${tv.count}`,
		url: tv.homepage,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: `${tv.overview}`,
		// thumbnail: {
		// 	url: `${images.base_url}${images.logo_sizes[1]}${tv.logo_path}`,
		// },
		fields: [
			{
				name: 'Air Date',
				value: `${time(airDate, 'D')} (${time(airDate, 'R')})`,
			},
			// {
			// 	name: 'Season',
			// 	value: `${tv.season_number}`,
			// },
			{
				name: '# of Eps',
				value: `${tv.episodes.length}`,
			},
			...await Promise.all(episodes.map(async ({ name, episode_number, air_date }) => {
				const epsAirDate = new Date(air_date);
				return {
					name: `${episode_number}. ${name}`,
					value: `${time(epsAirDate, 'D')} (${time(epsAirDate, 'R')})`,
				};
			})),
		],
		image: {
			url: `${images.base_url}${images.poster_sizes[5]}${tv.poster_path}`,
		},
		timestamp: new Date(),
		footer: {
			text: `${tmdbName}`,
			icon_url: tmdbIconUrl,
		},
	};
}

function createTvTranslateDetailEmbed(translationDetails, user) {
	if (!translationDetails) {
		return createNoResultEmbed();
	}


	return {
		color: Colors.DarkGrey,
		title: `${translationDetails.data.name}`,
		url: `${translationDetails.data.homepage ?? ''}`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
			// url: "https://discord.js.org",
		},
		description: translationDetails.data.overview,
		// thumbnail: {
		// 	url: `${images.base_url}${images.logo_sizes[1]}${prod.logo_path}`,
		// },
		fields: [
			{
				name: 'Tagline',
				value: `${translationDetails.data.tagline == '' || !translationDetails.data.tagline ? 'N/A' : translationDetails.data.tagline}`,
				inline: true,
			},
			{
				name: 'Language',
				value: `${translationDetails.name}`,
				inline: true,
			},
			{
				name: 'English Translation',
				value: `${translationDetails.english_name}`,
				inline: true,
			},
			{
				name: 'Region',
				value: `${translationDetails.iso_3166_1}`,
				inline: true,
			},
			{
				name: 'Language',
				value: `${translationDetails.iso_639_1} (${langCodeDict[translationDetails.iso_639_1]})`,
				inline: true,
			},

		],
		// image: {
		// 	url: `${images.base_url}${images.poster_sizes[5]}${movieImage[0].file_path}`,
		// },
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	};
}

function createVideoEmbed(title, movieVideo, user) {
	if (!movieVideo.length) {
		return createNoResultEmbed();
	}

	// {
	//     iso_639_1: 'en',
	//     iso_3166_1: 'US',
	//     name: 'Joker Transformation Scene',
	//     key: 'GIiyHPZ8H98',
	//     site: 'YouTube',
	//     size: 1080,
	//     type: 'Clip',
	//     official: true,
	//     published_at: '2020-04-23T17:59:57.000Z',
	//     id: '62299b179a3c490047cc6b52'
	//   }
	const dateTime = new Date(movieVideo[0].published_at);
	return {
		color: Colors.DarkGrey,
		title: `${title}`,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
		},
		fields: [
			{
				name: 'Name',
				value: `${movieVideo[0].name}`,
			},
			{
				name: 'Site',
				value: `${movieVideo[0].site}`,
			},
			{
				name: 'Video Type',
				value: `${movieVideo[0].type}`,
			},
			{
				name: 'Language',
				value: `${movieVideo[0].iso_639_1}-${movieVideo[0].iso_3166_1}`,
			},
			{
				name: 'Offical',
				value: `${movieVideo[0].official ? '✅' : '❌'}`,
			},
			{
				name: 'Published',
				value: `${time(dateTime, 'F')} (${time(dateTime, 'R')})`,
			},
			{
				name: 'Size',
				value: `${movieVideo[0].size}`,
			},
		],
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},

	};
}

const createWatchProviderListEmbed = async (title, watchProvidersList, user, color = Colors.Blue) => {
	// TODO: Determine media-type
	if (!watchProvidersList.length) {
		return createJustWatchNoResultEmbed();
	}

	const current = watchProvidersList;
	// current.map((watchProvider, index) => {
	// 	console.log(watchProvider);

	return new EmbedBuilder({
		color: color,
		title: title,
		author: {
			name: user.username,
			icon_url: user.displayAvatarURL(),
		},
		description: `${hyperlink('TMDB URL', current[0].link)}`,
		fields: await Promise.all(current.map(async (watchProvider) => {
			let rent;
			let buy;
			let flatrate;
			try {
				rent = watchProvider.rent.map(({ provider_name }) => provider_name).join(', ');
			}
			catch {
				rent = 'N/A';
			}
			try {
				buy = watchProvider.buy.map(({ provider_name }) => provider_name).join(', ');
			}
			catch {
				buy = 'N/A';
			}
			try {
				flatrate = watchProvider.flatrate.map(({ provider_name }) => provider_name).join(', ');
			}
			catch {
				flatrate = 'N/A';
			}

			return {
				name: `${watchProvider.country}  (${countryCodeDict[watchProvider.country]})`,
				value: `${underscore(bold('Rent:'))}  ${italic(rent)}\n\n${underscore(bold('Buy:'))}  ${italic(buy)}\n\n${underscore(bold('Streaming:'))}  ${italic(flatrate)}`,
				inline: true,
			};

		})),
		thumbnail: {
			url: justWatchIconUrl,
		},
		timestamp: new Date(),
		footer: {
			text: tmdbName,
			icon_url: tmdbIconUrl,
		},
	});
};


module.exports = {
	createEmbed,
	createAltListEmbed,
	createCollectionDetailEmbed,
	createCompanyAltListEmbed,
	createCompanyDetailEmbed,
	createCreditListEmbed,
	createEpisodeDetailEmbed,
	createJustWatchNoResultEmbed,
	createListEmbed,
	createListsEmbed,
	createImageEmbed,
	createNoResultEmbed,
	createMovieDetailEmbed,
	createPeopleCreditListEmbed,
	createPeopleListEmbed,
	createPeopleTranslateDetailEmbed,
	createPersonDetailEmbed,
	createRatingsEmbed,
	createReleaseDatesEmbed,
	createReviewDetailEmbed,
	createReviewEmbed,
	createTranslateListEmbed,
	createTranslateDetailEmbed,
	createTvCreditListEmbed,
	createTvDetailEmbed,
	createTvEpisodeCreditListEmbed,
	createTvListEmbed,
	createTvListsEmbed,
	createTvSeasonDetailEmbed,
	createTvTranslateDetailEmbed,
	createVideoEmbed,
	createWatchProviderListEmbed,
};