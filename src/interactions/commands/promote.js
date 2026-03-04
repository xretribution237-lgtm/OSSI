const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function promote(interaction) {
  const member  = interaction.options.getMember("who");
  const newRole = interaction.options.getRole("new_role");
  const oldRole = interaction.options.getRole("old_role");

  if (oldRole) await member.roles.remove(oldRole).catch(() => {});
  await member.roles.add(newRole);

  const embed = new EmbedBuilder()
    .setTitle("⬆️ FORMAL PROMOTION — OSSI COMMAND")
    .setDescription(
      `**${member.displayName}** has been formally promoted by order of **${interaction.user.tag}**.\n\n` +
      (oldRole ? `**Previous Rank:** ${oldRole.name}\n` : "") +
      `**New Rank:** ${newRole.name}\n\n` +
      "*This promotion is effective immediately. Congratulations and welcome to your new role.*"
    )
    .setThumbnail(member.displayAvatarURL({ size: 128 }))
    .setColor(0x00b894)
    .addFields(
      { name: "Operative",   value: `<@${member.id}>`,          inline: true },
      { name: "Promoted By", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Effective",   value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
    )
    .setFooter({ text: "OSSI – Command  •  Promotion Record" })
    .setTimestamp();

  const annCh = interaction.client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (annCh) await annCh.send({ embeds: [embed] });
  await interaction.reply({ embeds: [embed] });

  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("⬆️ You Have Been Promoted")
      .setDescription(`Congratulations — you have been promoted to **${newRole.name}** within OSSI.\n\n*Your new responsibilities take effect immediately.*`)
      .setColor(0x00b894).setTimestamp();
    await member.send({ embeds: [dmEmbed] });
  } catch {}
};
