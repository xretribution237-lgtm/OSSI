const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = async function absentee(interaction) {
  const member     = interaction.options.getMember("who");
  const reason     = interaction.options.getString("reason");
  const returnDate = interaction.options.getString("return_date");

  config.state.absentLog[member.id] = {
    reason,
    returnDate,
    addedBy : interaction.user.id,
    addedAt : Date.now(),
  };

  const embed = new EmbedBuilder()
    .setTitle("📅 ABSENCE LOGGED — OSSI INTERNAL AFFAIRS")
    .setDescription(
      `<@${member.id}> has been logged as absent.\n\n` +
      `**Reason:** ${reason}\n` +
      `**Expected Return:** ${returnDate}\n` +
      `**Logged By:** <@${interaction.user.id}>`
    )
    .setColor(0x7f8c8d)
    .setFooter({ text: "OSSI – Internal Affairs  •  Absence Record" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  try {
    await member.send({ embeds: [new EmbedBuilder()
      .setTitle("📅 Absence Recorded")
      .setDescription(`Your absence has been logged by **${interaction.user.tag}**.\n\n**Reason:** ${reason}\n**Return Date:** ${returnDate}`)
      .setColor(0x7f8c8d).setTimestamp()] });
  } catch {}
};
