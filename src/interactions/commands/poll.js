const { EmbedBuilder } = require("discord.js");

const EMOJI = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯"];

module.exports = async function poll(interaction) {
  const question = interaction.options.getString("question");
  const rawOpts  = [
    interaction.options.getString("option1"),
    interaction.options.getString("option2"),
    interaction.options.getString("option3"),
    interaction.options.getString("option4"),
  ].filter(Boolean);

  const closeTs = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000);

  const embed = new EmbedBuilder()
    .setTitle("📊 OSSI INTERNAL POLL")
    .setDescription(
      `**${question}**\n\n` +
      rawOpts.map((o, i) => `${EMOJI[i]}  ${o}`).join("\n") +
      `\n\n*Poll closes: <t:${closeTs}:R>*`
    )
    .setColor(0x0d2a2a)
    .setFooter({ text: `Posted by ${interaction.user.tag}  •  React to vote` })
    .setTimestamp();

  const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

  // Add reaction options
  for (let i = 0; i < rawOpts.length; i++) {
    await msg.react(EMOJI[i]).catch(() => {});
  }

  // Close after 24h
  setTimeout(async () => {
    try {
      const fresh = await msg.fetch();
      const results = rawOpts.map((o, i) => {
        const count = (fresh.reactions.cache.get(EMOJI[i])?.count ?? 1) - 1;
        return `${EMOJI[i]}  **${o}** — ${count} vote${count !== 1 ? "s" : ""}`;
      });
      const resultEmbed = new EmbedBuilder()
        .setTitle("📊 POLL CLOSED — RESULTS")
        .setDescription(`**${question}**\n\n${results.join("\n")}`)
        .setColor(0x00b894).setTimestamp();
      await msg.edit({ embeds: [resultEmbed], components: [] });
    } catch {}
  }, 24 * 60 * 60 * 1000);
};
