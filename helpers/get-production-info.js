function getCrewMember(crew, crewMember) {
	return crew
		.filter(
			(member) =>
				member.job && member.job.toLowerCase() === crewMember,
		)
		.map((member) => member.name);
}

function getCast(cast, amountOfCast) {
	return cast
		.slice(0, amountOfCast)
		.map((actor) => actor.name);
}

function getProductionCompany(production_companies) {
	return production_companies.reduce((prev, curr) =>
		prev.id < curr.id ? prev : curr, '');
}

// eslint-disable-next-line no-unused-vars
function createCurrencyFormatter(language = 'en-US', currency = 'USD', minimumFractionDigits = 0, maximumFractionDigits = 0) {
	const formatter = new Intl.NumberFormat(language, {
		style: 'currency',
		currency: currency,

		// These options are needed to round to whole numbers if that's what you want.
		// (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		minimumFractionDigits: minimumFractionDigits,
		// maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
	});
	return formatter;
}
module.exports = { getCrewMember, getCast, getProductionCompany, createCurrencyFormatter };