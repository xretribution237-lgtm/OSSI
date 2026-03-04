const { EmbedBuilder } = require("discord.js");
const { state } = require("../../config");

module.exports = async function warn(interaction) {
  const member = interaction.options.getMember("member");
  const reason = interaction.options.getString("reason");

  if (!state.warnLog[member.id]) state.warnLog[member.id] = [];
  state.warnLog[member.id].push(reason);
  const count = state.warnLog[member.id].length;

  const embed = new EmbedBuilder()
    .setTitle("⚠️ Warning Issued")
    .setDescription(
      `You have received a formal warning in **${interaction.guild.name}**.\n\n` +
      `**Reason:** ${reason}\n\n` +
      `This is warning **#${count}** on your record.`
    )
    .setColor(0xf39c12)
    .setFooter({ text: "OSSI – Office of Strategic Secret Intelligence" })
    .setTimestamp();

  try { await member.send({ embeds: [embed] }); } catch { /* DMs closed */ }

  await interaction.reply({ content: `⚠️ **${member.user.tag}** has been warned (Total: ${count}).`, flags: 64 });
};
