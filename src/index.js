require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");

const registerCommands   = require("./commands/register");
const handleInteraction  = require("./interactions/handler");
const handleReaction     = require("./reactions/handler");
const handleMemberAdd    = require("./events/memberAdd");
const handleMemberRemove = require("./events/memberRemove");
const soo                = require("./soo/manager");
const meetings           = require("./meetings/scheduler");
const { setupJailChannels } = require("./jail/setup");
const { startJailScheduler } = require("./jail/manager");
const { autoPostSOOChannel } = require("./jurisdiction/handler");

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
  console.log(`\n✅  OSSI Bot Online — ${client.user.tag}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 1. Register slash commands
  await registerCommands(client);

  // 2. Get the first guild (single-server bot)
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.error("❌ Bot is not in any guild.");
    return;
  }
  await guild.members.fetch(); // cache all members

  // 3. Create detention facility channels (skips if already done this session)
  await setupJailChannels(guild);

  // 4. Post SOO channel intro embed on every startup
  await autoPostSOOChannel(client);

  // 5. Start hourly SOO reminder + 72h expiry scheduler
  soo.startScheduler(client);

  // 6. Start 60-second jail ticker (countdowns + auto-release + auto-transfer)
  startJailScheduler(client);

  // 7. Schedule weekly Friday 4PM EST server meeting
  meetings.scheduleServerMeeting(client);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅  All systems operational.\n");
});

// ─── Events ───────────────────────────────────────────────────────────────────
client.on("interactionCreate", (interaction) => handleInteraction(interaction, client));
client.on("messageReactionAdd", (reaction, user) => handleReaction(reaction, user, client));
client.on("messageCreate", (message) => soo.handleMessage(message, client));
client.on("guildMemberAdd",    (member) => handleMemberAdd(member, client));
client.on("guildMemberRemove", (member) => handleMemberRemove(member, client));

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);

// ─── Express health-check (Railway requires an open HTTP port) ────────────────
const app  = express();
const PORT = process.env.PORT || 3000;
app.get("/",       (_req, res) => res.json({ status: "OSSI Bot Online ✅" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`🌐  Health server on port ${PORT}`));
