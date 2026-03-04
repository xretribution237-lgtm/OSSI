const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

function parseDuration(str) {
  const map = { Y: 31536000000, W: 604800000, D: 86400000, H: 3600000, M: 60000 };
  const match = str.toUpperCase().match(/^(\d+)([YWDHM])$/);
  if (!match) return null;
  return parseInt(match[1]) * (map[match[2]] || 0);
}

module.exports = async function remind(interaction) {
  const member    = interaction.options.getMember("who");
  const message   = interaction.options.getString("message");
  const timeStr   = interaction.options.getString("time");
  const delayMs   = parseDuration(timeStr);

  if (!delayMs) return interaction.reply({ content: "❌ Invalid time. Use e.g. `2H`, `1D`, `30M`.", flags: 64 });

  const fireAt = Date.now() + delayMs;
  const ts     = Math.floor(fireAt / 1000);

  setTimeout(async () => {
    try {
      const embed = new EmbedBuilder()
        .setTitle("⏰ OSSI REMINDER")
        .setDescription(`<@${member.id}> — This is your scheduled reminder.\n\n**Message:**\n> ${message}`)
        .setColor(0x3498db).setTimestamp();
      await member.send({ embeds: [embed] });
    } catch {
      // DMs closed — try to post in announcement channel
      const ch = interaction.client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
      if (ch) await ch.send({ content: `<@${member.id}>`, embeds: [new EmbedBuilder()
        .setTitle("⏰ REMINDER").setDescription(message).setColor(0x3498db)] });
    }
  }, delayMs);

  await interaction.reply({
    content: `✅ Reminder set for <@${member.id}> — fires <t:${ts}:R> (<t:${ts}:F>).`,
    flags: 64,
  });
};
