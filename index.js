const fs = require("node:fs");
const path = require("node:path");
// Require the necessary discord.js classes
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// https://discordjs.guide/slash-commands/response-methods.html#localized-responses
// add lcalized respnse in content

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
// get folders and concat together
const commandFiles = fs.readdirSync(commandsPath);

// for (const folder of commandFolders) {
// 	const commandFiles = fs.readdirSync(`./temp/${folder}`).filter(file => file.endsWith('.js'));

// 	for (const file of commandFiles) {
// 	  const command = require(`./temp/${folder}/${file}`);
// 	//   console.log(command);
// 	  client.commands.set(command.data.name, command);
// 	}
// }
// console.log(client.commands)

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  }
 else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  }
 else {
    client.on(event.name, (...args) => {
      const interaction = args[0];

      if (interaction.isChatInputCommand()) {
        event.execute(...args);
      }
 else if (interaction.isAutocomplete()) {
        event.autocomplete(...args);
      }
    });
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Log in to Discord with your client's token
async function loginWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.login(token);
      console.log('Logged in successfully!');
      break;
    }
 catch (error) {
			if (error.code === "EAI_AGAIN" && i < retries - 1) {
        console.log(`Attempt ${i + 1} failed. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      }
 else {
        throw error; // Re-throw the error if all retries fail
      }
    }
  }
}

loginWithRetry().catch(console.error);
// client.login(token);
