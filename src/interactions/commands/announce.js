const { EmbedBuilder } = require("discord.js");

module.exports = async function announce(interaction) {
  const channel = interaction.options.getChannel("channel");
  const title   = interaction.options.getString("title");
  const message = interaction.options.getString("message");
  const color   = interaction.options.getString("color") ?? "1e1e1e";
  const ping    = interaction.options.getRole("ping");

  const hexColor = parseInt(color.replace("#", ""), 16) || 0x1e1e1e;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(message)
    .setColor(hexColor)
    .setFooter({ text: `Posted by ${interaction.user.tag}` })
    .setTimestamp();

  await channel.send({ content: ping ? ping.toString() : undefined, embeds: [embed] });
  await interaction.reply({ content: `✅ Announcement posted in ${channel}.`, flags: 64 });
};
