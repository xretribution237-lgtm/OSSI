const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function discharge(interaction) {
  const member = interaction.options.getMember("who");
  const type   = interaction.options.getString("type"); // honourable | dishonorable
  const reason = interaction.options.getString("reason") ?? "No reason provided.";

  const isHon  = type === "honourable";
  const color  = isHon ? 0x3498db : 0x4a0000;
  const title  = isHon ? "🎖️ HONOURABLE DISCHARGE" : "⛔ DISHONOURABLE DISCHARGE";

  // Remove all roles
  const rolesToRemove = member.roles.cache
    .filter(r => r.id !== member.guild.roles.everyone.id)
    .map(r => r.id);
  for (const id of rolesToRemove) await member.roles.remove(id).catch(() => {});

  const embed = new EmbedBuilder()
    .setTitle(`${title} — OSSI COMMAND`)
    .setDescription(
      `**${member.user.tag}** has been formally discharged from OSSI.\n\n` +
      `**Discharge Type:** ${isHon ? "Honourable" : "Dishonourable"}\n` +
      `**Reason:** ${reason}\n\n` +
      (isHon
        ? "*Their service to this organisation is acknowledged and appreciated. They depart with our respect.*"
        : "*Their conduct was found to be incompatible with the standards of this organisation. Their file has been sealed.*")
    )
    .setColor(color)
    .addFields(
      { name: "Operative",    value: `${member.user.tag}`,         inline: true },
      { name: "Discharged By",value: `<@${interaction.user.id}>`,  inline: true },
      { name: "Type",         value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
    )
    .setFooter({ text: "OSSI – Command  •  Discharge Record" })
    .setTimestamp();

  const annCh = interaction.client.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID);
  if (annCh) await annCh.send({ embeds: [embed] });
  await interaction.reply({ embeds: [embed] });

  try {
    await member.send({ embeds: [new EmbedBuilder()
      .setTitle(title)
      .setDescription(`You have been formally discharged from **OSSI**.\n\n**Type:** ${type}\n**Reason:** ${reason}`)
      .setColor(color).setTimestamp()] });
  } catch {}

  if (!isHon) {
    try { await member.kick(`Dishonourable discharge: ${reason}`); } catch {}
  }
};
