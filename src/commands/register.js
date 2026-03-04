const { REST, Routes } = require("discord.js");
const definitions = require("./definitions");

module.exports = async function registerCommands(client) {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("🔄  Registering slash commands...");
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: definitions }
    );
    console.log(`✅  ${definitions.length} slash commands registered globally.`);
  } catch (err) {
    console.error("❌  Failed to register commands:", err);
  }
};
