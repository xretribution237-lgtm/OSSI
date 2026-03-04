require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");

const registerCommands          = require("./commands/register");
const handleInteraction         = require("./interactions/handler");
const handleReaction            = require("./reactions/handler");
const handleMemberAdd           = require("./events/memberAdd");
const handleMemberRemove        = require("./events/memberRemove");
const soo                       = require("./soo/manager");
const meetings                  = require("./meetings/scheduler");
const { setupJailChannels }     = require("./jail/setup");
const { startJailScheduler }    = require("./jail/manager");
const { autoPostSOOChannel }    = require("./jurisdiction/handler");
const { postTicketPanel }       = require("./tickets/manager");
const { startAnnouncementSchedulers } = require("./announcements/auto");
const config                    = require("./config");

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

  await registerCommands(client);

  const guild = client.guilds.cache.first();
  if (!guild) { console.error("❌ Not in any guild."); return; }
  await guild.members.fetch();

  await setupJailChannels(guild);
  await autoPostSOOChannel(client);
  await soo.recoverSOOState(client);
  await postTicketPanel(client);

  soo.startScheduler(client);
  startJailScheduler(client);
  meetings.scheduleServerMeeting(client);
  startAnnouncementSchedulers(client);

  // Reminder ticker (checks every minute)
  setInterval(() => {
    const now = Date.now();
    config.state.reminders = config.state.reminders.filter(r => {
      if (now >= r.fireAt) {
        client.users.fetch(r.userId).then(u => {
          u.send(`⏰ **Reminder:** ${r.message}`).catch(() => {});
        }).catch(() => {});
        return false;
      }
      return true;
    });
  }, 60_000);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅  All systems operational — ${Object.keys(require("./commands/definitions")).length || 35}+ commands loaded\n`);
});

// ─── Events ───────────────────────────────────────────────────────────────────
client.on("interactionCreate",  (i)    => handleInteraction(i, client));
client.on("messageReactionAdd", (r, u) => handleReaction(r, u, client));
client.on("guildMemberAdd",     m      => handleMemberAdd(m, client));
client.on("guildMemberRemove",  m      => handleMemberRemove(m, client));

// ── SOO message handler ───────────────────────────────────────────────────────
client.on("messageCreate", (message) => soo.handleMessage(message, client));

// ── Watchlist passive alert ───────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const entry = config.state.watchlist[message.author.id];
  if (!entry) return;

  // Alert senior staff quietly
  for (const roleId of config.ALLOWED_ROLE_IDS) {
    const role = message.guild?.roles.cache.get(roleId);
    if (!role) continue;
    for (const [, member] of role.members) {
      if (member.user.bot) continue;
      try {
        const { EmbedBuilder } = require("discord.js");
        await member.send({ embeds: [new EmbedBuilder()
          .setTitle("👁️ WATCHLIST ALERT")
          .setDescription(
            `A watchlisted operative has sent a message.\n\n` +
            `**Operative:** <@${message.author.id}> (${message.author.tag})\n` +
            `**Channel:** <#${message.channelId}>\n` +
            `**Message:** ${message.content.slice(0, 500)}\n\n` +
            `**Watchlist Reason:** ${entry.reason}`
          )
          .setColor(0xe67e22)
          .setTimestamp()] });
      } catch {}
    }
    break; // Only alert one role tier to avoid spam — change if needed
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);

// ─── Express health-check ─────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;
app.get("/",       (_req, res) => res.json({ status: "OSSI Bot Online ✅", uptime: process.uptime() }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`🌐  Health server on port ${PORT}`));
