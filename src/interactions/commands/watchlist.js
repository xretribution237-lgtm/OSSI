const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function watchlist(interaction) {
  const action = interaction.options.getString("action");
  const member = interaction.options.getMember("who");
  const reason = interaction.options.getString("reason");
  const userId = member.id;

  if (action === "add") {
    config.state.watchlist[userId] = { reason, addedBy: interaction.user.id, addedAt: Date.now() };
    const embed = new EmbedBuilder()
      .setTitle("👁️ WATCHLIST — OPERATIVE ADDED")
      .setDescription(`<@${userId}> has been added to the OSSI watchlist.\n\n**Reason:** ${reason}\n\n*Senior staff will receive a quiet alert when this operative sends a message.*`)
      .setColor(0xe67e22).setFooter({ text: "OSSI – Security  •  Watchlist" }).setTimestamp();
    await interaction.reply({ embeds: [embed], flags: 64 });
  } else {
    delete config.state.watchlist[userId];
    await interaction.reply({ content: `✅ <@${userId}> has been removed from the watchlist.`, flags: 64 });
  }
};
