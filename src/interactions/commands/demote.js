const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function demote(interaction) {
  const member  = interaction.options.getMember("who");
  const oldRole = interaction.options.getRole("old_role");
  const newRole = interaction.options.getRole("new_role");
  const reason  = interaction.options.getString("reason") ?? "No reason provided.";

  await member.roles.remove(oldRole).catch(() => {});
  if (newRole) await member.roles.add(newRole).catch(() => {});

  const embed = new EmbedBuilder()
    .setTitle("⬇️ FORMAL DEMOTION — OSSI COMMAND")
    .setDescription(
      `**${member.displayName}** has been formally demoted.\n\n` +
      `**Previous Rank:** ${oldRole.name}\n` +
      (newRole ? `**New Rank:** ${newRole.name}\n` : "**New Rank:** None assigned\n") +
      `**Reason:** ${reason}\n\n` +
      "*This demotion is effective immediately and has been logged on record.*"
    )
    .setColor(0xe74c3c)
    .addFields(
      { name: "Operative",  value: `<@${member.id}>`,           inline: true },
      { name: "Demoted By", value: `<@${interaction.user.id}>`, inline: true },
    )
    .setFooter({ text: "OSSI – Command  •  Demotion Record" })
    .setTimestamp();

  const annCh = interaction.client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (annCh) await annCh.send({ embeds: [embed] });
  await interaction.reply({ embeds: [embed] });

  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("⬇️ Formal Demotion Notice")
      .setDescription(`You have been formally demoted from **${oldRole.name}**${newRole ? ` to **${newRole.name}**` : ""}.\n\n**Reason:** ${reason}`)
      .setColor(0xe74c3c).setTimestamp();
    await member.send({ embeds: [dmEmbed] });
  } catch {}
};
