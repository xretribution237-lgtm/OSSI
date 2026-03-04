/**
 * meetings/scheduler.js
 *
 * - scheduleServerMeeting() : auto-posts @here @everyone every Friday 4PM EST
 * - postBoardMeeting()      : /board_meeting  — pings all board role IDs
 * - postPersonnelMeeting()  : /personnel_meeting — pings Founder, DO, DA only
 */

const { EmbedBuilder } = require("discord.js");
const config = require("../config");

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Returns ms until next Friday 4:00 PM EST (UTC-5) */
function msUntilNextFriday4pmEST() {
  const now    = new Date();
  // Work in UTC; EST = UTC-5
  const utcNow = now.getTime();
  // Current day: 0=Sun, 1=Mon ... 5=Fri, 6=Sat
  const utcDay  = now.getUTCDay();
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcSec  = now.getUTCSeconds();

  // Friday 4 PM EST = Friday 21:00 UTC
  const targetDayUTC  = 5; // Friday
  const targetHourUTC = 21;

  let daysUntil = (targetDayUTC - utcDay + 7) % 7;

  // If it's already Friday and past 21:00 UTC, schedule for next Friday
  if (daysUntil === 0 && (utcHour > targetHourUTC || (utcHour === targetHourUTC && utcMin >= 0))) {
    daysUntil = 7;
  }

  const msUntilMidnight = ((24 - utcHour) * 3_600_000) - (utcMin * 60_000) - (utcSec * 1_000);
  const msTillTarget    = (daysUntil === 0)
    ? (targetHourUTC - utcHour) * 3_600_000 - utcMin * 60_000 - utcSec * 1_000
    : msUntilMidnight + (daysUntil - 1) * 86_400_000 + targetHourUTC * 3_600_000;

  return msTillTarget;
}

// ─── Server meeting embed ─────────────────────────────────────────────────────

async function postServerMeetingEmbed(client) {
  const ch = client.channels.cache.get(config.MEETING_CHANNELS.SERVER);
  if (!ch) { console.error("❌ Server meeting channel not found."); return; }

  const now         = new Date();
  const timestamp   = Math.floor(now.getTime() / 1000);
  const nextWeek    = Math.floor((now.getTime() + 7 * 86_400_000) / 1000);

  const embed = new EmbedBuilder()
    .setTitle("🌐 WEEKLY SERVER MEETING — NOW IN SESSION")
    .setDescription(
      "@here @everyone\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "The weekly **OSSI Server Meeting** is now convening.\n\n" +
      "All operatives are expected to attend or submit an absence report " +
      "to their direct superior prior to the meeting.\n\n" +
      "This meeting covers server-wide updates, policy changes, " +
      "operational briefings, and open floor discussion.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x0d1b4a)
    .addFields(
      { name: "📅 Date",         value: `<t:${timestamp}:D>`,          inline: true },
      { name: "🕓 Time",         value: `<t:${timestamp}:t> (your local time)`, inline: true },
      { name: "📍 Frequency",    value: "Every Friday at 4:00 PM EST",  inline: true },
      { name: "📆 Next Meeting", value: `<t:${nextWeek}:R>`,            inline: true },
    )
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence  •  Attendance Required" })
    .setTimestamp();

  await ch.send({ content: "@here @everyone", embeds: [embed] });
  console.log("📢 Weekly server meeting posted.");
}

// ─── Schedule recurring Friday 4PM EST ───────────────────────────────────────

function scheduleServerMeeting(client) {
  const delay = msUntilNextFriday4pmEST();
  const h = Math.floor(delay / 3_600_000);
  const m = Math.floor((delay % 3_600_000) / 60_000);
  console.log(`📅 Next server meeting fires in ${h}h ${m}m.`);

  setTimeout(async () => {
    await postServerMeetingEmbed(client);
    // Then fire every 7 days
    setInterval(() => postServerMeetingEmbed(client), 7 * 86_400_000);
  }, delay);
}

// ─── Board meeting embed ──────────────────────────────────────────────────────

async function postBoardMeeting(interaction, client) {
  const ch = client.channels.cache.get(config.MEETING_CHANNELS.BOARD);
  if (!ch) return interaction.reply({ content: "❌ Board meeting channel not found.", flags: 64 });

  const agenda = interaction.options.getString("agenda") ?? "To be announced.";
  const pingStr = config.BOARD_ROLE_IDS.map(id => `<@&${id}>`).join(" ");

  const embed = new EmbedBuilder()
    .setTitle("💼 BOARD MEETING — CALLED TO ORDER")
    .setDescription(
      `${pingStr}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "A **Board Meeting** has been called by senior leadership.\n\n" +
      "All board-level operatives are required to attend or submit prior notice of absence.\n\n" +
      `**Agenda:**\n> ${agenda}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x1a2a1a)
    .addFields(
      { name: "📣 Called By", value: `<@${interaction.user.id}>`,          inline: true },
      { name: "📅 Scheduled", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setFooter({ text: "OSSI – Board Meeting  •  Attendance Required" })
    .setTimestamp();

  await ch.send({ content: pingStr, embeds: [embed] });
  await interaction.reply({ content: `✅ Board meeting posted in <#${config.MEETING_CHANNELS.BOARD}>.`, flags: 64 });
}

// ─── Personnel meeting embed ──────────────────────────────────────────────────

async function postPersonnelMeeting(interaction, client) {
  const ch = client.channels.cache.get(config.MEETING_CHANNELS.PERSONNEL);
  if (!ch) return interaction.reply({ content: "❌ Personnel meeting channel not found.", flags: 64 });

  const agenda  = interaction.options.getString("agenda") ?? "To be announced.";
  const pingStr = config.ALLOWED_ROLE_IDS.map(id => `<@&${id}>`).join(" ");

  const embed = new EmbedBuilder()
    .setTitle("📜 PERSONNEL MEETING — RESTRICTED SESSION")
    .setDescription(
      `${pingStr}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "A **Personnel Meeting** has been convened.\n\n" +
      "This session is restricted to **Founder, Directorate of Operations, and Directorate of Analysis** only. " +
      "Attendance is mandatory unless prior written notice has been submitted.\n\n" +
      `**Agenda:**\n> ${agenda}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(0x1a1a2a)
    .addFields(
      { name: "📣 Called By", value: `<@${interaction.user.id}>`,          inline: true },
      { name: "📅 Scheduled", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setFooter({ text: "OSSI – Personnel Meeting  •  CLASSIFIED  •  Senior Staff Only" })
    .setTimestamp();

  await ch.send({ content: pingStr, embeds: [embed] });
  await interaction.reply({ content: `✅ Personnel meeting posted in <#${config.MEETING_CHANNELS.PERSONNEL}>.`, flags: 64 });
}

module.exports = { scheduleServerMeeting, postBoardMeeting, postPersonnelMeeting };
