const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function commend(interaction) {
  const member = interaction.options.getMember("who");
  const reason = interaction.options.getString("reason");
  const userId = member.id;

  if (!config.state.commendLog[userId]) config.state.commendLog[userId] = [];
  config.state.commendLog[userId].push({ reason, by: interaction.user.id, at: Date.now() });
  const count = config.state.commendLog[userId].length;

  const embed = new EmbedBuilder()
    .setTitle("🏅 FORMAL COMMENDATION — OSSI COMMAND")
    .setDescription(
      `<@${userId}> has been formally commended by **${interaction.user.tag}**.\n\n` +
      `**Reason:**\n> ${reason}\n\n` +
      `*This commendation has been added to their permanent service record. Total commendations: **${count}**.*`
    )
    .setThumbnail(member.displayAvatarURL({ size: 128 }))
    .setColor(0xf1c40f)
    .addFields(
      { name: "Operative",    value: `<@${userId}>`,              inline: true },
      { name: "Commended By", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Total",        value: `${count} commendation(s)`,  inline: true },
    )
    .setFooter({ text: "OSSI – Command  •  Commendation Record" })
    .setTimestamp();

  const annCh = interaction.client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (annCh) await annCh.send({ embeds: [embed] });
  await interaction.reply({ embeds: [embed] });

  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("🏅 You Have Been Commended")
      .setDescription(`You have received a formal commendation from **${interaction.user.tag}**.\n\n**Reason:** ${reason}\n\n*Total commendations: ${count}*`)
      .setColor(0xf1c40f).setTimestamp();
    await member.send({ embeds: [dmEmbed] });
  } catch {}
};
