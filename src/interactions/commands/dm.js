const { EmbedBuilder } = require("discord.js");

module.exports = async function dm(interaction) {
  const member  = interaction.options.getMember("member");
  const title   = interaction.options.getString("title");
  const message = interaction.options.getString("message");

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(message)
    .setColor(0x5865f2)
    .setFooter({ text: `Sent by ${interaction.guild.name} staff` })
    .setTimestamp();

  try {
    await member.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ DM sent to **${member.displayName}**.`, flags: 64 });
  } catch {
    await interaction.reply({ content: "❌ Could not DM that user – their DMs may be closed.", flags: 64 });
  }
};
