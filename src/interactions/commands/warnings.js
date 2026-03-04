const { EmbedBuilder } = require("discord.js");
const { state } = require("../../config");

module.exports = async function warnings(interaction) {
  const member = interaction.options.getMember("member");
  const logs   = state.warnLog[member.id] ?? [];

  if (!logs.length) {
    return interaction.reply({ content: `✅ **${member.displayName}** has no warnings on record.`, flags: 64 });
  }

  const desc = logs.map((r, i) => `**${i + 1}.** ${r}`).join("\n");
  const embed = new EmbedBuilder()
    .setTitle(`Warnings – ${member.displayName}`)
    .setDescription(desc)
    .setColor(0xe67e22)
    .setFooter({ text: `Total: ${logs.length} warning(s)` });

  await interaction.reply({ embeds: [embed], flags: 64 });
};
