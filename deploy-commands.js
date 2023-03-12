const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const path = require('node:path');
const fs = require('node:fs');

const commands = [];
// Grab all the command files from the commands directory you created earlier
// const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const commandsPath = path.join(__dirname, 'temp');
// get folders and concat together
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./temp/${folder}`).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
	  const command = require(`./temp/${folder}/${file}`);
	//   console.log(command);
	commands.push(command.data.toJSON());
	}
}
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
// for (const file of commandFiles) {
// 	const command = require(`./temp/${file}`);
// 	commands.push(command.data.toJSON());
// }

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		// Routes.applicationGuildCommands(clientId) // for gobal commands.
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();