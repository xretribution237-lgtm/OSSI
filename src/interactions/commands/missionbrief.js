const { EmbedBuilder } = require("discord.js");

module.exports = async function missionbrief(interaction) {
  const title       = interaction.options.getString("title");
  const details     = interaction.options.getString("details");
  const classLevel  = interaction.options.getString("classification");
  const pingRole    = interaction.options.getRole("ping");
  const channel     = interaction.options.getChannel("channel") ?? interaction.channel;

  const classColors = {
    "TOP SECRET"    : 0xe74c3c,
    "SECRET"        : 0xe67e22,
    "CONFIDENTIAL"  : 0xf39c12,
    "UNCLASSIFIED"  : 0x00b894,
  };

  const embed = new EmbedBuilder()
    .setTitle(`🗂️ MISSION BRIEFING — ${title.toUpperCase()}`)
    .setDescription(
      `**CLASSIFICATION:** \`${classLevel}\`\n` +
      `**ISSUED:** <t:${Math.floor(Date.now()/1000)}:F>\n` +
      `**ISSUED BY:** <@${interaction.user.id}>\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      `${details}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setColor(classColors[classLevel] || 0x0d1b2a)
    .setFooter({ text: `OSSI Operations  •  ${classLevel}  •  Handle accordingly` })
    .setTimestamp();

  await channel.send({ content: pingRole ? pingRole.toString() : null, embeds: [embed] });
  await interaction.reply({ content: `✅ Mission briefing posted in ${channel}.`, flags: 64 });
};
