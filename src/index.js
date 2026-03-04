require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");

const registerCommands   = require("./commands/register");
const handleInteraction  = require("./interactions/handler");
const handleReaction     = require("./reactions/handler");
const handleMemberAdd    = require("./events/memberAdd");
const handleMemberRemove = require("./events/memberRemove");
const soo                = require("./soo/manager");

// ─── Discord client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once("ready", async () => {
  console.log(`✅  Logged in as ${client.user.tag}`);
  await registerCommands(client);
  soo.startScheduler(client); // start hourly SOO reminder + expiry checks
});

// ─── Slash commands ───────────────────────────────────────────────────────────
client.on("interactionCreate", (interaction) => handleInteraction(interaction, client));

// ─── Reaction gate (verification) ────────────────────────────────────────────
client.on("messageReactionAdd", (reaction, user) => handleReaction(reaction, user, client));

// ─── SOO signature listener ───────────────────────────────────────────────────
client.on("messageCreate", (message) => soo.handleMessage(message, client));

// ─── Welcome / Leave embeds ───────────────────────────────────────────────────
client.on("guildMemberAdd",    (member) => handleMemberAdd(member, client));
client.on("guildMemberRemove", (member) => handleMemberRemove(member, client));

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);

// ─── Express health-check (Railway requires an open HTTP port) ────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.get("/",       (_req, res) => res.json({ status: "OSSI Bot Online ✅" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`🌐  Health server listening on port ${PORT}`));
