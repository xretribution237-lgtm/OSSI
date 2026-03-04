const { EmbedBuilder } = require("discord.js");

module.exports = async function embed(interaction) {
  const channel     = interaction.options.getChannel("channel");
  const title       = interaction.options.getString("title");
  const description = interaction.options.getString("description");
  const color       = interaction.options.getString("color") ?? "1e1e1e";
  const footer      = interaction.options.getString("footer");
  const imageUrl    = interaction.options.getString("image_url");

  const hexColor = parseInt(color.replace("#", ""), 16) || 0x1e1e1e;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(hexColor);

  if (footer)   embed.setFooter({ text: footer });
  if (imageUrl) embed.setImage(imageUrl);

  await channel.send({ embeds: [embed] });
  await interaction.reply({ content: `✅ Embed posted in ${channel}.`, flags: 64 });
};
